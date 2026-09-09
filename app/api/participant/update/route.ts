import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateParticipantSchema } from "@/lib/validation";

// Updates the participant's real details after OTP has already been sent —
// deliberately does NOT touch OtpCode/send email, so it can't invalidate a
// code the user already received and is about to submit.
export async function PATCH(req: NextRequest) {
  const parsed = updateParticipantSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { participantId, ...data } = parsed.data;

  const participant = await prisma.participant.update({
    where: { id: participantId },
    data,
  });

  return NextResponse.json({ participantId: participant.id });
}
