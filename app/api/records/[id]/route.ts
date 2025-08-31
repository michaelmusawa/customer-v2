// app/api/records/[id]/route.ts
import { safeQuery } from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
  }

  try {
    const { rows } = await safeQuery(
      `SELECT id, ticket, "recordType", name, service, "subService", "recordNumber", value
       FROM records
       WHERE id = $1`,
      [numericId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("GET /api/records/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
