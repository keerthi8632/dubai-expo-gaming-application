import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validation";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const parsed = verifyOtpSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { participantId, code, channel } = parsed.data;

  const otp = await prisma.otpCode.findFirst({
    where: { participantId, channel, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "No pending code. Request a new one." }, { status: 404 });
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  if (otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 410 });
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.participant.update({
      where: { id: participantId },
      data: channel === "email" ? { emailVerified: true } : { phoneVerified: true },
    }),
  ]);

  return NextResponse.json({ verified: true });
}
