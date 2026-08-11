import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await prisma.gameSession.update({
    where: { id: params.sessionId },
    data: { claimedAt: new Date() },
  });

  return NextResponse.json({ session });
}
