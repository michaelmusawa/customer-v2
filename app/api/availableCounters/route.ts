import { getAvailableCounters } from "@/app/lib/settingsActions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station") || "";
  const shift = searchParams.get("shift") || "";
  if (!station || !shift) {
    return NextResponse.json(
      { error: "station and shift required" },
      { status: 400 }
    );
  }
  try {
    console.log(
      "Fetching available counters for station:",
      station,
      "shift:",
      shift
    );
    const counters = await getAvailableCounters(station, shift);
    return NextResponse.json({ counters });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
