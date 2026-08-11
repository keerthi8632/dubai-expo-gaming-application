import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  let won: boolean;
  if (existing?.forcedOutcome === "WIN") won = true;
  else if (existing?.forcedOutcome === "LOSE") won = false;
  else {
    const config = await prisma.gameConfig.findUnique({ where: { key: "trade_default_win_rate" } });
    const rate = (config?.value as { rate?: number } | null)?.rate ?? DEFAULT_WIN_RATE;
    won = Math.random() < rate;
  }

  // The chart's actual movement direction always matches the prediction when the
  // participant wins, and the opposite when they lose — so it "feels" like their
  // Buy/Sell call decided the outcome, while WON/LOST itself stays fully governed
  // by the forced-outcome/win-rate logic above (admin control is unaffected).
  const priceGoesUp = won ? prediction === "BUY" : prediction === "SELL";
  const delta = entryPrice * (0.005 + Math.random() * 0.015);
  const exitPrice = Number((priceGoesUp ? entryPrice + delta : entryPrice - delta).toFixed(2));

  const claimCode = won ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;
  const now = new Date();

  const session = await prisma.gameSession.upsert({
    where: { participantId_gameType: { participantId, gameType: "TRADE" } },
    create: {
      participantId,
      gameType: "TRADE",
      status: won ? "WON" : "LOST",
      resultDetail: { entryPrice, exitPrice, prediction },
      startedAt: now,
      completedAt: now,
      prizeLabel: won ? "USD 100 Funded Account" : null,
      claimCode,
    },
    update: {
      status: won ? "WON" : "LOST",
      resultDetail: { entryPrice, exitPrice, prediction },
      startedAt: now,
      completedAt: now,
      prizeLabel: won ? "USD 100 Funded Account" : null,
      claimCode,
    },
  });

  return NextResponse.json({
    status: session.status,
    entryPrice,
    exitPrice,
    claimCode: session.claimCode,
  });
}
