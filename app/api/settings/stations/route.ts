// app/api/settings/stations/route.ts
import { NextResponse } from "next/server";
import { getSettings } from "@/app/lib/settingsActions";

export async function GET() {
  try {
    const items = await getSettings("stations");
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to fetch stations:", err);
    return NextResponse.json(
      { error: "Could not load stations" },
      { status: 500 }
    );
  }
}
