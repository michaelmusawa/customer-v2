// app/api/records/[id]/route.ts
import pool from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: {
    params?: Promise<{
      id?: string;
    }>;
  }
) {
  const params = await props.params;
  const id = params?.id || "";

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `SELECT id, ticket, "recordType", name, service, "subService", "recordNumber", value
       FROM records
       WHERE id = $1`,
      [id]
    );
    if (!res.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error("GET /api/records/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
