import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJson, fromJson } from "@/lib/json";
import { canAwardWin } from "@/lib/tradeWinSlots";
import { getOtherGameSession } from "@/lib/gameSessions";
import { z } from "zod";

const schema = z.object({
  participantId: z.string().cuid(),
  entryPrice: z.number().positive(),
  prediction: z.enum(["BUY", "SELL"]),
});

const DEFAULT_WIN_RATE = 0.4;

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { participantId, entryPrice, prediction } = parsed.data;

  const existing = await prisma.gameSession.findUnique({
    where: { participantId_gameType: { participantId, gameType: "TRADE" } },
  });
  if (existing && existing.status !== "NOT_PLAYED") {
    return NextResponse.json({ error: "Already played" }, { status: 409 });
  }

  const now = new Date();
  const otherGame = await getOtherGameSession(participantId, "TRADE");

  let won: boolean;
  if (otherGame?.status === "WON") {
    // A participant can only ever win one of the two booth games — this is a
    // hard limit like the prize stock/slot checks below, so it overrides
    // even an admin's forced win.
    won = false;
  } else if (existing?.forcedOutcome === "LOSE") won = false;
  else if (existing?.forcedOutcome === "WIN") {
    // Prize budget is fixed at 5 wins/day (one per slot) — even an admin's
    // forced win is blocked if the current slot is already full.
    won = await canAwardWin(prisma, now);
  } else {
    const config = await prisma.gameConfig.findUnique({ where: { key: "trade_default_win_rate" } });
    const rate = fromJson<{ rate?: number }>(config?.value, {}).rate ?? DEFAULT_WIN_RATE;
    won = (await canAwardWin(prisma, now)) && Math.random() < rate;
  }

  // The chart's actual movement direction always matches the prediction when the
  // participant wins, and the opposite when they lose — so it "feels" like their
  // Buy/Sell call decided the outcome, while WON/LOST itself stays fully governed
  // by the forced-outcome/win-rate logic above (admin control is unaffected).
  const priceGoesUp = won ? prediction === "BUY" : prediction === "SELL";
  // A fixed points range instead of a percentage of entryPrice — the move
  // should look the same small size regardless of where the price happens
  // to be sitting, and stay sub-1-point so only the decimals change, not
  // the whole-number part of the price.
  const MIN_POINTS_DELTA = 0.05;
  const MAX_POINTS_DELTA = 0.95;
  const delta = MIN_POINTS_DELTA + Math.random() * (MAX_POINTS_DELTA - MIN_POINTS_DELTA);
  const exitPrice = Number((priceGoesUp ? entryPrice + delta : entryPrice - delta).toFixed(2));

  const claimCode = won ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;

  const session = await prisma.gameSession.upsert({
    where: { participantId_gameType: { participantId, gameType: "TRADE" } },
    create: {
      participantId,
      gameType: "TRADE",
      status: won ? "WON" : "LOST",
      resultDetail: toJson({ entryPrice, exitPrice, prediction }),
      startedAt: now,
      completedAt: now,
      prizeLabel: won ? "USD 100 Funded Account" : null,
      claimCode,
    },
    update: {
      status: won ? "WON" : "LOST",
      resultDetail: toJson({ entryPrice, exitPrice, prediction }),
      startedAt: now,
      completedAt: now,
      prizeLabel: won ? "USD 100 Funded Account" : null,
      claimCode,
    },
  });

  // One entry per game, and only two games exist — the FE uses this to hide
  // "Play Another Game" once there's genuinely nothing left to play.
  const otherGamePlayed = !!otherGame && otherGame.status !== "NOT_PLAYED";

  return NextResponse.json({
    status: session.status,
    entryPrice,
    exitPrice,
    claimCode: session.claimCode,
    otherGamePlayed,
  });
}
