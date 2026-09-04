import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJson, fromJson } from "@/lib/json";
import { z } from "zod";
import { pickSegmentIndex } from "@/lib/spinSegments";
import { getSpinSegments } from "@/lib/spinConfig";
import { getSpinPrizeLimits, getWonPrizeCounts } from "@/lib/spinPrizeLimits";

const schema = z.object({ participantId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { participantId } = parsed.data;

  const existing = await prisma.gameSession.findUnique({
    where: { participantId_gameType: { participantId, gameType: "SPIN" } },
  });
  if (existing && existing.status !== "NOT_PLAYED") {
    return NextResponse.json({ error: "Already played" }, { status: 409 });
  }

  const segments = await getSpinSegments();

  // AGAIN outcomes leave the session at NOT_PLAYED (see below), so this flag
  // persists in resultDetail instead — one re-spin per person, ever, not
  // once per resolve call.
  const spinAgainAlreadyUsed = !!fromJson<{ spinAgainUsed?: boolean }>(existing?.resultDetail, {}).spinAgainUsed;

  // Prizes have a fixed physical stock shared across the whole event (both
  // days) — once a prize's stock is gone, its segment(s) are excluded from
  // the winnable pool entirely, regardless of forced outcome or weight.
  const [limits, wonCounts] = await Promise.all([getSpinPrizeLimits(), getWonPrizeCounts()]);
  const excludedIndices = new Set(
    segments
      .map((s, i) => i)
      .filter((i) => {
        const seg = segments[i];
        if (seg.isSpinAgain) return spinAgainAlreadyUsed;
        if (!seg.prize) return false;
        const limit = limits[seg.prize];
        return limit !== undefined && (wonCounts[seg.prize] ?? 0) >= limit;
      })
  );

  const segmentIndex = pickSegmentIndex(
    segments,
    (existing?.forcedOutcome as "WIN" | "LOSE" | null) ?? null,
    excludedIndices
  );
  const segment = segments[segmentIndex];

  // Landing on Spin Again is neither a win nor a loss — the session stays at
  // NOT_PLAYED so the participant's next resolve call is treated as a fresh
  // attempt instead of being blocked as "already played". The spinAgainUsed
  // flag persists through resultDetail so a second Spin Again can never
  // happen for the same person (see excludedIndices above).
  if (segment.isSpinAgain) {
    await prisma.gameSession.upsert({
      where: { participantId_gameType: { participantId, gameType: "SPIN" } },
      create: { participantId, gameType: "SPIN", resultDetail: toJson({ spinAgainUsed: true }) },
      update: { resultDetail: toJson({ spinAgainUsed: true }) },
    });

    return NextResponse.json({
      status: "AGAIN",
      segmentIndex,
      segmentLabel: segment.label,
      prizeLabel: null,
      claimCode: null,
    });
  }

  const won = segment.prize !== null;
  const claimCode = won ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;
  const now = new Date();

  const session = await prisma.gameSession.upsert({
    where: { participantId_gameType: { participantId, gameType: "SPIN" } },
    create: {
      participantId,
      gameType: "SPIN",
      status: won ? "WON" : "LOST",
      resultDetail: toJson({ segmentIndex, segmentLabel: segment.label }),
      startedAt: now,
      completedAt: now,
      prizeLabel: segment.prize,
      claimCode,
    },
    update: {
      status: won ? "WON" : "LOST",
      resultDetail: toJson({ segmentIndex, segmentLabel: segment.label }),
      startedAt: now,
      completedAt: now,
      prizeLabel: segment.prize,
      claimCode,
    },
  });

  // One entry per game, and only two games exist — the FE uses this to hide
  // "Play Another Game" once there's genuinely nothing left to play.
  const otherGame = await prisma.gameSession.findUnique({
    where: { participantId_gameType: { participantId, gameType: "TRADE" } },
  });
  const otherGamePlayed = !!otherGame && otherGame.status !== "NOT_PLAYED";

  return NextResponse.json({
    status: session.status,
    segmentIndex,
    segmentLabel: segment.label,
    prizeLabel: session.prizeLabel,
    claimCode: session.claimCode,
    otherGamePlayed,
  });
}
