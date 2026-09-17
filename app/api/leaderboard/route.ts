import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/tradeWinSlots";
import { venueStartOfDay } from "@/lib/venueTime";

// Public — meant to be projected on a venue screen, so this intentionally
// returns only what's safe to show to onlookers (first name + prize), never
// email/phone/claim codes. See lib/tradeWinSlots.ts for startOfDay.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Optional ?date=YYYY-MM-DD, interpreted as a venue-local (Asia/Dubai)
  // calendar day — same convention as the spin queue's dateKey. Defaults to
  // "today" (the original live-leaderboard behavior) when omitted.
  const dateParam = req.nextUrl.searchParams.get("date")?.trim();
  let from: Date;
  let to: Date | undefined;
  if (dateParam) {
    const [year, month, day] = dateParam.split("-").map(Number);
    from = venueStartOfDay(new Date(Date.UTC(year, month - 1, day, 12)));
    to = venueStartOfDay(new Date(Date.UTC(year, month - 1, day + 1, 12)));
  } else {
    from = startOfDay(new Date());
  }

  const winners = await prisma.gameSession.findMany({
    where: { status: "WON", completedAt: { gte: from, ...(to ? { lt: to } : {}) } },
    include: { participant: { select: { fullName: true } } },
    orderBy: { completedAt: "asc" },
  });

  return NextResponse.json(
    {
      winners: winners.map((w) => ({
        id: w.id,
        gameType: w.gameType,
        prizeLabel: w.prizeLabel,
        completedAt: w.completedAt,
        firstName: w.participant.fullName.trim().split(/\s+/)[0] ?? "Winner",
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
