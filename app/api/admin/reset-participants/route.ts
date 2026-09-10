import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Clears all participant/game-play data for a fresh event day. Deliberately
// leaves Admin (login credentials) and GameConfig (spin segments/prizes,
// trade win rate) untouched — same scope as prisma/reset-participants.ts,
// just reachable from the admin panel instead of server shell access.
// Restricted to superadmin since there's no undo.
export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "superadmin") {
    return NextResponse.json({ error: "Only a superadmin can clear participant data" }, { status: 403 });
  }

  // GameSession/OtpCode cascade-delete with their Participant (see
  // prisma/schema.prisma onDelete: Cascade). SpinQueueClaim has no FK
  // relation to Participant, so it needs its own explicit delete.
  const claims = await prisma.spinQueueClaim.deleteMany({});
  const participants = await prisma.participant.deleteMany({});

  return NextResponse.json({
    clearedParticipants: participants.count,
    clearedSpinQueueClaims: claims.count,
  });
}
