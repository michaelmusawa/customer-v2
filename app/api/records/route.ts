// app/api/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { fetchFilteredRecords } from "@/app/lib/recordsActions";
import {
  aggregateExcelRows,
  ExcelRow,
  ExtractedFields,
  extractFields,
  validate,
} from "@/app/lib/utils";
import { loadServices } from "@/app/lib/serviceLoader";

type RawPayload =
  | { type: "pdf"; fileName: string; content: string }
  | { type: "excel"; fileName: string; content: Record<string, unknown>[] };

// --- CORS helper ---
function withCors(body: unknown, status = 200) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (status === 204) return new NextResponse(null, { status, headers });
  return NextResponse.json(body, { status, headers });
}

export async function OPTIONS() {
  return withCors(null, 204);
}

function errorResponse(message: string, code: string, status = 400) {
  return withCors({ ok: false, error: message, code }, status);
}

export async function POST(req: NextRequest) {
  // 0. Extract & verify Authorization header
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return errorResponse(
      "Missing or invalid Authorization header. Please check your API key.",
      "AUTH_HEADER_INVALID",
      401
    );
  }
  const raw = match[1];
  const [userEmail, incomingToken] = raw.split("::");

  // 1. Parse JSON payload
  let payload: RawPayload;
  try {
    payload = await req.json();
  } catch {
    return errorResponse("Data must be valid JSON", "INVALID_JSON", 401);
  }

  if (!("type" in payload) || !("content" in payload)) {
    return errorResponse(
      "Missing or invalid payload format",
      "INVALID_PAYLOAD",
      400
    );
  }

  // 2. Extract structured fields from raw content
  const records: ExtractedFields[] = [];
  try {
    const services = await loadServices();

    if (payload.type === "pdf") {
      console.log("Processing PDF content:", payload.content);
      const fields = extractFields(payload.content, services);
      validate(fields);
      records.push(fields);
    } else if (payload.type === "excel") {
      if (!Array.isArray(payload.content)) {
        console.log("Excel content is not an array:", payload.content);
        return errorResponse(
          "Excel content must be an array of rows",
          "INVALID_PAYLOAD",
          400
        );
      }

      // Normalize Excel rows into the proper shape
      const normalizedRows: ExcelRow[] = payload.content.map((row) => ({
        "Customer Name":
          typeof row["Customer Name"] === "string"
            ? row["Customer Name"]
            : undefined,
        "Invoice No":
          typeof row["Invoice No"] === "string" ? row["Invoice No"] : undefined,
        "Total Amount":
          typeof row["Total Amount"] === "number"
            ? row["Total Amount"].toString()
            : typeof row["Total Amount"] === "string"
            ? row["Total Amount"]
            : "",
        "House/Stall No.":
          typeof row["House/Stall No."] === "string"
            ? row["House/Stall No."]
            : undefined,
      }));

      // Aggregate all rows into a single record
      const aggregated = aggregateExcelRows(normalizedRows);

      if (!aggregated) {
        return errorResponse(
          "The uploaded Excel file contains no valid data to process.",
          "EMPTY_EXCEL",
          400
        );
      }

      validate(aggregated);
      records.push(aggregated);
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown extraction error";
    return errorResponse(
      `Error extracting fields: ${message}`,
      "EXTRACTION_ERROR",
      400
    );
  }

  try {
    // 3. Verify user/token
    const userRes = await safeQuery<{ id: number; token: string | null }>(
      `SELECT TOP 1 id, token FROM [User] WHERE email = $1`,
      [userEmail]
    );
    if (userRes.rows.length === 0) {
      return errorResponse(
        `The provided email address: ${userEmail} is not registered.`,
        "USER_NOT_FOUND",
        404
      );
    }
    const { id: userId, token: storedHash } = userRes.rows[0];
    if (!storedHash) {
      if (!storedHash) {
        return errorResponse(
          `No token found for this user: ${userEmail}. Please re-generate your API key.`,
          "NO_TOKEN",
          401
        );
      }
    }
    const valid = await bcrypt.compare(incomingToken, storedHash);
    if (!valid) {
      return errorResponse(
        "Invalid API key. Please check your credentials.",
        "INVALID_TOKEN",
        401
      );
    }

    // 4. Insert records with duplicate check
    const insertedIds: number[] = [];
    for (const rec of records) {
      // Check for duplicates

      const cleanValue = rec.value
        ? parseInt(String(rec.value).replace(/,/g, ""), 10)
        : null;

      const dupRes = await safeQuery(
        `SELECT id FROM records WHERE recordNumber = $1 AND value = $2 AND name = $3`,
        [rec.recordNumber, cleanValue, rec.name]
      );
      if (dupRes.rows.length > 0) {
        console.log("Skipping duplicate:", rec);
        continue;
      }

      const insertRes = await safeQuery<{ id: number }>(
        `INSERT INTO records
          (ticket, recordType, name, service, subService, recordNumber, value, createdAt, userId)
         OUTPUT INSERTED.id
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          rec.ticket,
          rec.recordType,
          rec.name ?? null,
          rec.service ?? null,
          rec.subservice ?? null,
          rec.recordNumber ?? null,
          cleanValue,
          rec.date ? new Date(rec.date) : new Date(),
          userId,
        ]
      );
      insertedIds.push(insertRes.rows[0].id);
    }

    if (insertedIds.length === 0) {
      return withCors(
        {
          ok: false,
          skipped: true,
          message: "No new records inserted (all duplicates)",
        },
        200
      );
    }

    return withCors({ ok: true, ids: insertedIds }, 200);
  } catch (err) {
    console.error("DB insertion error:", err);
    return errorResponse(
      "Database error while inserting record. Please try again later.",
      "DB_ERROR",
      500
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  console.log("Received GET with params:", Object.fromEntries(searchParams));

  const query = searchParams.get("query") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const role = searchParams.get("role") || "";
  const analysis =
    (searchParams.get("analysis") as "invoice" | "receipt") || "invoice";

  try {
    // Fetch records without pagination
    const records = await fetchFilteredRecords(
      query,
      startDate,
      endDate,
      role,
      1, // currentPage
      analysis
    );

    return new Response(JSON.stringify(records), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch records" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
