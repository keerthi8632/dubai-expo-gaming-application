import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Lightweight participant creation for the home-screen flow — skips OTP
// generation and the Resend email call entirely (unlike /api/register).
// When the Alphorix form's postMessage gave us real field values, those are
// used instead of the Guest Player placeholder; upserted by email so a
// player who registers once and then plays both games doesn't collide with
// Participant's unique email constraint.
const schema = z.object({
  participantId: z.string().cuid().optional(),
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const info = parsed.success ? parsed.data : {};

  // Already know who this is (e.g. returning from a "Play Another Game"
  // round trip) — just look them up instead of re-deriving identity from
  // possibly-lost form data, which would otherwise create a second,
  // disconnected participant row for the same person.
  if (info.participantId) {
    const existing = await prisma.participant.findUnique({ where: { id: info.participantId } });
    if (existing) return NextResponse.json({ participantId: existing.id, fullName: existing.fullName });
  }

  const fullName = info.fullName?.trim() || "Guest Player";
  const email = info.email ?? `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const phone = info.phone?.trim() || "0000000000";

  const participant = await prisma.participant.upsert({
    where: { email },
    create: {
      fullName,
      email,
      phone,
      countryCode: "+971",
      countryOfResidence: "United Arab Emirates",
      emailVerified: true,
    },
    update: {
      // Keep the latest name/phone if they registered again with updated info.
      fullName,
      phone,
    },
  });

  return NextResponse.json({ participantId: participant.id, fullName: participant.fullName });
}
