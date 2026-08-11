import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight participant creation for the temporary home-screen bypass — skips
// OTP generation and the Resend email call entirely (unlike /api/register),
// which is what was making the Trade Prediction / Spin Now buttons feel slow.
export async function POST() {
  const participant = await prisma.participant.create({
    data: {
      fullName: "Guest Player",
      email: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
      phone: "0000000000",
      countryCode: "+971",
      countryOfResidence: "United Arab Emirates",
      emailVerified: true,
    },
  });

  return NextResponse.json({ participantId: participant.id });
}
