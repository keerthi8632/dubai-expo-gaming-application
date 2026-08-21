import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJson } from "@/lib/json";
import { z } from "zod";
import { pickSegmentIndex } from "@/lib/spinSegments";
import { getSpinSegments } from "@/lib/spinConfig";

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
  const segmentIndex = pickSegmentIndex(segments, (existing?.forcedOutcome as "WIN" | "LOSE" | null) ?? null);
  const segment = segments[segmentIndex];

  // Landing on Spin Again is neither a win nor a loss — leave the session
  // untouched (still NOT_PLAYED) so the participant's next resolve call is
  // treated as a fresh attempt instead of being blocked as "already played".
  if (segment.isSpinAgain) {
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

  return NextResponse.json({
    status: session.status,
    segmentIndex,
    segmentLabel: segment.label,
    prizeLabel: session.prizeLabel,
    claimCode: session.claimCode,
  });
}
