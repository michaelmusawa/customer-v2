// app/api/logout/route.ts
import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  // your session‑deletion logic here, e.g.:
  //   - delete auth cookies
  //   - clear sessions in DB
  //   - etc.
  // For example, if you used `cookies().delete("session")`:
  // import { cookies } from "next/headers";
  // cookies().delete("session");
  await signOut();

  return NextResponse.json({ success: true }, { status: 200 });
}
