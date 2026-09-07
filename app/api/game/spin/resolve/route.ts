import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJson, fromJson } from "@/lib/json";
import { z } from "zod";
import { pickSegmentIndex, pickWeightedIndex } from "@/lib/spinSegments";
import { getSpinSegments } from "@/lib/spinConfig";
import { getSpinPrizeLimits, getWonPrizeCounts, JACKPOT_PRIZE_LABEL, isJackpotExpired } from "@/lib/spinPrizeLimits";
import {
  localDateKey,
  getSpinEventWindow,
  getSpinQueue,
  getOpenWindowIndex,
  getNextDueQueueIndex,
  claimQueueSlot,
} from "@/lib/spinQueue";

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
  const jackpotExpired = isJackpotExpired();
  const excludedIndices = new Set(
    segments
      .map((s, i) => i)
      .filter((i) => {
        const seg = segments[i];
        if (seg.isSpinAgain) return spinAgainAlreadyUsed;
        if (!seg.prize) return false;
        if (seg.prize === JACKPOT_PRIZE_LABEL && jackpotExpired) return true;
        const limit = limits[seg.prize];
        return limit !== undefined && (wonCounts[seg.prize] ?? 0) >= limit;
      })
  );

  const forcedOutcome = (existing?.forcedOutcome as "WIN" | "LOSE" | null) ?? null;
  const now = new Date();

  // The scheduled prize queue is the source of truth for *which* prize is
  // due right now — it's skipped only for a forced LOSE (an admin override
  // always wins). "Due" means the earliest window at or before the current
  // one that hasn't been claimed yet, so a missed window's prize carries
  // over into the next spin instead of vanishing. If nothing is due, or this
  // window's prize has already been claimed by someone else (e.g. another
  // kiosk's spin landed a moment earlier), fall through to the normal pool
  // below instead of forcing a prize.
  let segmentIndex: number | null = null;
  if (forcedOutcome !== "LOSE") {
    const dateKey = localDateKey(now);
    const [queue, eventWindow] = await Promise.all([getSpinQueue(dateKey, segments), getSpinEventWindow()]);
    const openIndex = getOpenWindowIndex(now, eventWindow, queue.length);
    if (openIndex !== null) {
      // Walk forward past any due windows whose prize can never be won right
      // now (stock exhausted, jackpot expired) — forfeiting them so a single
      // dead slot can't permanently block every window scheduled after it.
      for (let guard = 0; guard <= openIndex; guard++) {
        const dueIndex = await getNextDueQueueIndex(dateKey, openIndex);
        if (dueIndex === null) break;
        const queuedPrize = queue[dueIndex];
        const candidateIndex = segments.findIndex((s, i) => s.prize === queuedPrize && !excludedIndices.has(i));
        if (candidateIndex === -1) {
          await claimQueueSlot(dateKey, dueIndex, queuedPrize, "FORFEITED");
          continue;
        }
        if (await claimQueueSlot(dateKey, dueIndex, queuedPrize, participantId)) {
          segmentIndex = candidateIndex;
        }
        break;
      }
    }
  }

  if (segmentIndex === null) {
    if (forcedOutcome === "WIN") {
      // Admin override still wins even outside the scheduled queue.
      segmentIndex = pickSegmentIndex(segments, "WIN", excludedIndices);
    } else {
      // No prize due this spin — the day's prize budget is governed entirely
      // by the queue above, so anything outside it can only land on Spin
      // Again or a genuine loss, never a prize.
      const allIndices = segments.map((_, i) => i).filter((i) => !excludedIndices.has(i));
      const nonPrizeIndices = allIndices.filter((i) => segments[i].prize === null);
      segmentIndex =
        nonPrizeIndices.length > 0
          ? pickWeightedIndex(segments, nonPrizeIndices)
          : pickSegmentIndex(segments, "LOSE", excludedIndices);
    }
  }
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
      segments,
      segmentIndex,
      segmentLabel: segment.label,
      prizeLabel: null,
      claimCode: null,
    });
  }

  const won = segment.prize !== null;
  const claimCode = won ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;

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
    segments,
    segmentIndex,
    segmentLabel: segment.label,
    prizeLabel: session.prizeLabel,
    claimCode: session.claimCode,
    otherGamePlayed,
  });
}
