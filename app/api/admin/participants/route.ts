import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const gameType = req.nextUrl.searchParams.get("gameType")?.trim();

  const participants = await prisma.participant.findMany({
    // SQLite's `contains` is already case-insensitive for ASCII by default,
    // unlike Postgres — no `mode: "insensitive"` option needed/available here.
    where: {
      AND: [
        q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] } : {},
        // A participant matches a game filter either by the game they registered
        // for, or by having actually played a session of that type.
        gameType ? { OR: [{ registeredGame: gameType }, { gameSessions: { some: { gameType } } }] } : {},
      ],
    },
    include: { gameSessions: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ participants });
}
