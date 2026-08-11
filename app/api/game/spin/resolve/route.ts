import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SPIN_SEGMENTS, pickSegmentIndex } from "@/lib/spinSegments";

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

  const segmentIndex = pickSegmentIndex(existing?.forcedOutcome ?? null);
  const segment = SPIN_SEGMENTS[segmentIndex];
  const won = segment.prize !== null;
  const claimCode = won ? crypto.randomUUID().slice(0, 8).toUpperCase() : null;
  const now = new Date();

  const session = await prisma.gameSession.upsert({
    where: { participantId_gameType: { participantId, gameType: "SPIN" } },
    create: {
      participantId,
      gameType: "SPIN",
      status: won ? "WON" : "LOST",
      resultDetail: { segmentIndex, segmentLabel: segment.label },
      startedAt: now,
      completedAt: now,
      prizeLabel: segment.prize,
      claimCode,
    },
    update: {
      status: won ? "WON" : "LOST",
      resultDetail: { segmentIndex, segmentLabel: segment.label },
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
