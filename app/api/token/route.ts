// app/api/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import pool from "@/app/lib/db";
// import { pool } from "@/lib/db"; // if you want to save the hash to your DB

export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // 1. Generate a secure random token
  const plainToken = randomBytes(32).toString("hex");

  // 2. Hash it so you can safely store the hash server‑side
  const tokenHash = await bcrypt.hash(plainToken, 12);

  // 3. (Optional) persist tokenHash in your DB against this user
  await pool.query(`UPDATE "User" SET "token" = $1 WHERE email = $2`, [
    tokenHash,
    email,
  ]);

  // 4. Return the plain token for copying
  return NextResponse.json({ token: plainToken });
}
