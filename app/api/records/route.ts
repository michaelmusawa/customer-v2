// app/api/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// 1. Schema for external POST payload (no `token` here)
export const ExternalRecordSchema = z.preprocess(
  (raw) => {
    // Only objects can have subservice keys
    if (raw !== null && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;

      // If legacy `subservice` exists but no `subService` yet, copy it over
      if ("subservice" in obj && !("subService" in obj)) {
        obj.subService = obj.subservice;
      }

      return obj;
    }

    return raw;
  },
  z.object({
    ticket: z.string().nonempty(),
    recordType: z.string().optional(),
    name: z.string().nonempty(),
    service: z.string().nonempty(),
    subService: z.string().optional(),
    recordNumber: z.string().optional(),
    value: z.preprocess(
      (val) =>
        typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val,
      z.number().int().nonnegative()
    ),
  })
);

type ExternalRecord = z.infer<typeof ExternalRecordSchema>;

// CORS helper
function withCors(body: unknown, status = 200) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (status === 204) {
    return new NextResponse(null, { status, headers });
  }
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

  // 1. Safe JSON parse
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return withCors({ error: "Invalid JSON" }, 400);
  }

  // 2. Validate payload
  const parsed = ExternalRecordSchema.safeParse(payload);
  if (!parsed.success) {
    return withCors(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }
  const { ticket, recordType, name, service, subService, recordNumber, value } =
    parsed.data as ExternalRecord;

  try {
    // 3. Fetch user id and stored token hash
    const userRes = await pool.query<{ id: number; token: string | null }>(
      `SELECT id, token
       FROM "User"
       WHERE email = $1
       LIMIT 1`,
      [userEmail]
    );
    if (userRes.rows.length === 0) {
      return withCors({ error: "Unknown userEmail" }, 404);
    }

    const { id: userId, token: storedHash } = userRes.rows[0];
    if (!storedHash) {
      return withCors({ error: "No token set for this user" }, 401);
    }

    // 4. Verify the incoming header token against the stored bcrypt hash
    const valid = await bcrypt.compare(incomingToken, storedHash);
    if (!valid) {
      return withCors({ error: "Invalid token" }, 401);
    }

    // 5. Insert the new record
    const insertRes = await pool.query<{ id: number }>(
      `INSERT INTO records
         ( ticket,
           "recordType",
           name,
           service,
           "subService",
           "recordNumber",
           value,
           "userId"
         )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        ticket,
        recordType ?? null,
        name,
        service,
        subService ?? null,
        recordNumber ?? null,
        value,
        userId,
      ]
    );

    return withCors({ ok: true, id: insertRes.rows[0].id }, 200);
  } catch (err) {
    console.error("Error inserting record:", err);
    return withCors({ error: "Database error" }, 500);
  }
}
