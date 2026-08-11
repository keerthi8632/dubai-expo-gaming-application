import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participant = await prisma.participant.findUnique({
    where: { id: params.id },
    include: { gameSessions: true },
  });
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ participant });
}
