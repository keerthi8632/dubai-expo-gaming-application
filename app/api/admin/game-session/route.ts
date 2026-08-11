import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { setOutcomeSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = setOutcomeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { participantId, gameType, forcedOutcome } = parsed.data;

  const session = await prisma.gameSession.upsert({
    where: { participantId_gameType: { participantId, gameType } },
    create: {
      participantId,
      gameType,
      forcedOutcome,
      forcedByAdminId: admin.adminId,
      forcedAt: new Date(),
    },
    update: {
      forcedOutcome,
      forcedByAdminId: admin.adminId,
      forcedAt: new Date(),
    },
  });

  return NextResponse.json({ session });
}
