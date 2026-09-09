import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, otpExpiryDate, sendEmailOtp } from "@/lib/otp";
import { z } from "zod";

const schema = z.object({ participantId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({
    where: { id: parsed.data.participantId },
  });
  if (!participant) {
    return NextResponse.json({ error: "Participant not found" }, { status: 404 });
  }

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      participantId: participant.id,
      channel: "email",
      code,
      expiresAt: otpExpiryDate(),
    },
  });

  try {
    await sendEmailOtp(participant.email, code);
  } catch (err) {
    console.error("Failed to resend OTP email", err);
    return NextResponse.json({ error: "Could not send verification email" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
