import { NextResponse } from "next/server";
import { getServices } from "@/app/lib/settingsActions";

export async function GET() {
  try {
    const items = await getServices();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Could not load services" },
      { status: 500 }
    );
  }
}
