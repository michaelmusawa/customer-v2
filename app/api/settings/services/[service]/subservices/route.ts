import { NextRequest, NextResponse } from "next/server";
import { getSubservices } from "@/app/lib/settingsActions";

export async function GET(
  request: NextRequest,
  props: {
    params?: Promise<{
      service?: string;
    }>;
  }
) {
  const params = await props.params;
  const service = params?.service || "";
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
