import { NextResponse } from "next/server";
import { getSubservices } from "@/app/lib/settingsActions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  try {
    const items = await getSubservices(service);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { error: "Could not load subservices" },
      { status: 500 }
    );
  }
}
