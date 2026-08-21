import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { buildAllTimeReportCsv } from "@/lib/adminReport";

// Streams every game session (all-time, not just today) as a CSV file the
// browser downloads directly — the daily report in adminReport.ts only
// emails today's activity, this covers the "download all reports" case.
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gameTypeParam = req.nextUrl.searchParams.get("gameType")?.trim();
  const gameType = gameTypeParam === "TRADE" || gameTypeParam === "SPIN" ? gameTypeParam : undefined;

  const csv = await buildAllTimeReportCsv(gameType);
  const date = new Date().toISOString().slice(0, 10);
  const suffix = gameType ? `-${gameType.toLowerCase()}` : "";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="mh-markets-report${suffix}-${date}.csv"`,
    },
  });
}
