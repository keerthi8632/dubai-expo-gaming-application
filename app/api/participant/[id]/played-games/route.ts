import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — the game picker screen uses this to know which of the two games
// this participant has already completed, so it can disable both buttons
// once neither game has anything left to play (not just whichever one the
// "Play Another Game" link happened to mention).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sessions = await prisma.gameSession.findMany({
    where: { participantId: params.id },
    select: { gameType: true, status: true },
  });

  const played = (gameType: "TRADE" | "SPIN") =>
    sessions.some((s) => s.gameType === gameType && s.status !== "NOT_PLAYED");

  return NextResponse.json(
    { TRADE: played("TRADE"), SPIN: played("SPIN") },
    { headers: { "Cache-Control": "no-store" } }
  );
}
