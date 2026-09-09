import { prisma } from "./prisma";

// A participant should never be able to win both booth games — the prize
// budget assumes at most one win per person. Fetched once up front so each
// resolve route can both (a) block itself from awarding a win if the other
// game was already won, and (b) know whether to hide "Play Another Game".
export async function getOtherGameSession(participantId: string, gameType: "TRADE" | "SPIN") {
  const other = gameType === "TRADE" ? "SPIN" : "TRADE";
  return prisma.gameSession.findUnique({
    where: { participantId_gameType: { participantId, gameType: other } },
  });
}

// When the most recent Spin win completed today, or null if nobody's won yet
// today — used to enforce a minimum gap between wins (see
// getSpinMinWinGapMinutes in lib/spinQueue.ts) so a backlog of carried-over
// prizes (e.g. after a slow start to the event) doesn't all get handed out
// back-to-back the moment people start playing.
export async function getLastSpinWinAt(since: Date): Promise<Date | null> {
  const last = await prisma.gameSession.findFirst({
    where: { gameType: "SPIN", status: "WON", completedAt: { gte: since } },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
  });
  return last?.completedAt ?? null;
}
