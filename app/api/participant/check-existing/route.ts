import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Called right when a freshly-registered player clicks a game button (before
// the Terms modal / /api/guest upsert), to tell a genuine first-time
// registration apart from someone re-submitting the Alphorix form with an
// email/phone that already has a Participant row from an earlier visit.
// Deliberately read-only — /api/guest remains the only route that creates or
// updates a Participant.
const schema = z.object({
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ exists: false });

  const { email, phone } = parsed.data;
  if (!email && !phone) return NextResponse.json({ exists: false });

  const or: ({ email: string } | { phone: string })[] = [];
  if (email) or.push({ email });
  if (phone) or.push({ phone });

  const existing = await prisma.participant.findFirst({ where: { OR: or } });

  return NextResponse.json({ exists: !!existing });
}
