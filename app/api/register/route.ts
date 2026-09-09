import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { generateOtp, otpExpiryDate, sendEmailOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Reuse existing record if this email already registered (e.g. retrying after a dropped connection)
  const participant = await prisma.participant.upsert({
    where: { email: data.email },
    update: {
      fullName: data.fullName,
      phone: data.phone,
      countryCode: data.countryCode,
      countryOfResidence: data.countryOfResidence,
      doesTrade: data.doesTrade,
      language: data.language,
      ...(data.game ? { registeredGame: data.game } : {}),
    },
    create: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      countryCode: data.countryCode,
      countryOfResidence: data.countryOfResidence,
      doesTrade: data.doesTrade,
      language: data.language,
      registeredGame: data.game,
    },
  });

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
    console.error("Failed to send OTP email", err);
    return NextResponse.json({ error: "Could not send verification email" }, { status: 502 });
  }

  return NextResponse.json({ participantId: participant.id });
}
