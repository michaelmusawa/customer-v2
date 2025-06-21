// app/api/settings/shifts/route.ts
import { NextResponse } from "next/server";
import { getSettings } from "@/app/lib/settingsActions";

export async function GET() {
  try {
    const items = await getSettings("shifts");
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Failed to fetch shifts:", err);
    return NextResponse.json(
      { error: "Could not load shifts" },
      { status: 500 }
    );
  }
}
