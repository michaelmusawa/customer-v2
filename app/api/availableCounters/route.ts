// app/api/availableCounters/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getAvailableCounters } from "@/app/lib/settingsActions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const station = searchParams.get("station")!;
  const shift = searchParams.get("shift")!;
  try {
    const counters = await getAvailableCounters(station, shift);
    return NextResponse.json({ counters });
  } catch {
    return NextResponse.json({ counters: [] }, { status: 500 });
  }
}
