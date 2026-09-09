import { NextResponse } from "next/server";
import { getSpinSegments } from "@/lib/spinConfig";

// Public — the wheel needs to render the current admin-configured segments
// before a participant ever plays.
// No request-dynamic APIs are used here, so without this Next.js treats the
// route as static and caches it at build time — admin edits would only show
// up after a redeploy. Force it to run fresh on every request instead.
export const dynamic = "force-dynamic";

export async function GET() {
  const segments = await getSpinSegments();
  return NextResponse.json({ segments }, { headers: { "Cache-Control": "no-store" } });
}
