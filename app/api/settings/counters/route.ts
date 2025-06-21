// app/api/settings/counters/route.ts
import { NextResponse } from "next/server";
import { getSettings } from "@/app/lib/settingsActions";

export async function GET() {
  try {
    const items = await getSettings("counters");
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Could not load counters" },
      { status: 500 }
    );
  }
}
