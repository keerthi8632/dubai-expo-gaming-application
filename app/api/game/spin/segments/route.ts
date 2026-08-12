import { NextResponse } from "next/server";
import { getSpinSegments } from "@/lib/spinConfig";

// Public — the wheel needs to render the current admin-configured segments
// before a participant ever plays.
export async function GET() {
  const segments = await getSpinSegments();
  return NextResponse.json({ segments });
}
