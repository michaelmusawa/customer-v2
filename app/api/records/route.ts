// app/api/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { fetchFilteredRecords } from "@/app/lib/recordsActions";
import { extractExcelFields, extractFields, validate } from "@/app/lib/utils";
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

export async function POST(req: NextRequest) {
  // 0. Extract & verify Authorization header
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return withCors({ error: "Missing or invalid Authorization header" }, 401);
  }
  const raw = match[1];
  const [userEmail, incomingToken] = raw.split("::");

  // 1. Parse JSON payload
  let payload: RawPayload;
  try {
    payload = await req.json();
  } catch {
    return withCors({ error: "Invalid JSON" }, 400);
  }

  if (!("type" in payload) || !("content" in payload)) {
    return withCors({ error: "Invalid payload format" }, 400);
  }

  // 2. Extract structured fields from raw content
  const records: any[] = [];
  try {
    const services = await loadServices();

    if (payload.type === "pdf") {
      const fields = extractFields(payload.content, services);
      validate(fields);
      records.push(fields);
    } else if (payload.type === "excel") {
      if (!Array.isArray(payload.content)) {
        return withCors(
          { error: "Excel content must be an array of rows" },
          400
        );
      }
      for (const row of payload.content) {
        const fields = extractExcelFields(row as any);
        // optionally match subservice/service with DB here too
        validate(fields);
        records.push(fields);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction error";
    return withCors({ error: message }, 400);
  }

  try {
    // 3. Verify user/token
    const userRes = await safeQuery<{ id: number; token: string | null }>(
      `SELECT TOP 1 id, token FROM [User] WHERE email = $1`,
      [userEmail]
    );
    if (userRes.rows.length === 0) {
      return withCors({ error: "Unknown userEmail" }, 404);
    }
    const { id: userId, token: storedHash } = userRes.rows[0];
    if (!storedHash) {
      return withCors({ error: "No token set for this user" }, 401);
    }
    const valid = await bcrypt.compare(incomingToken, storedHash);
    if (!valid) {
      return withCors({ error: "Invalid token" }, 401);
    }

    // 4. Insert records with duplicate check
    const insertedIds: number[] = [];
    for (const rec of records) {
      // Check for duplicates

      const cleanValue = rec.value
        ? parseInt(rec.value.replace(/,/g, ""), 10)
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
    console.error("Error inserting record:", err);
    return withCors({ error: "Database error" }, 500);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("query") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const role = searchParams.get("role") || "";

  try {
    // Fetch records without pagination
    const records = await fetchFilteredRecords(
      query,
      startDate,
      endDate,
      role,
      1, // currentPage
      0
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
