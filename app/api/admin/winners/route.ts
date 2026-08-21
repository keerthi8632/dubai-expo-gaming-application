import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gameType = req.nextUrl.searchParams.get("gameType")?.trim();

  const winners = await prisma.gameSession.findMany({
    where: { status: "WON", ...(gameType ? { gameType } : {}) },
    include: { participant: true },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json({ winners });
}
