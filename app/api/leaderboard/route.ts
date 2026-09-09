import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/tradeWinSlots";

// Public — meant to be projected on a venue screen, so this intentionally
// returns only what's safe to show to onlookers (first name + prize), never
// email/phone/claim codes. See lib/tradeWinSlots.ts for startOfDay.
export const dynamic = "force-dynamic";

export async function GET() {
  const from = startOfDay(new Date());

  const winners = await prisma.gameSession.findMany({
    where: { status: "WON", completedAt: { gte: from } },
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
