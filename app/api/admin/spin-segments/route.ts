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
    // .flatten() only surfaces root-level issues — these refinements are
    // nested per array index, so build readable per-row messages instead.
    const messages = parsed.error.issues.map((issue) => {
      const rowIndex = issue.path[0];
      const prefix = typeof rowIndex === "number" ? `Row ${rowIndex + 1}: ` : "";
      return `${prefix}${issue.message}`;
    });
    return NextResponse.json({ error: { formErrors: messages } }, { status: 400 });
  }

  await prisma.gameConfig.upsert({
    where: { key: SPIN_SEGMENTS_CONFIG_KEY },
    create: { key: SPIN_SEGMENTS_CONFIG_KEY, value: toJson(parsed.data) },
    update: { value: toJson(parsed.data) },
  });

  return NextResponse.json({ segments: parsed.data });
}
