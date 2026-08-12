import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { toJson } from "@/lib/json";
import { spinSegmentsSchema } from "@/lib/validation";
import { getSpinSegments, SPIN_SEGMENTS_CONFIG_KEY } from "@/lib/spinConfig";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const segments = await getSpinSegments();
  return NextResponse.json({ segments });
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = spinSegmentsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.gameConfig.upsert({
    where: { key: SPIN_SEGMENTS_CONFIG_KEY },
    create: { key: SPIN_SEGMENTS_CONFIG_KEY, value: toJson(parsed.data) },
    update: { value: toJson(parsed.data) },
  });

  return NextResponse.json({ segments: parsed.data });
}
