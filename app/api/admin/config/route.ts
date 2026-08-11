import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const configs = await prisma.gameConfig.findMany();
  return NextResponse.json({ configs });
}

const putSchema = z.object({ key: z.string().min(1), value: z.any() });

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const config = await prisma.gameConfig.upsert({
    where: { key: parsed.data.key },
    create: { key: parsed.data.key, value: parsed.data.value },
    update: { value: parsed.data.value },
  });
  return NextResponse.json({ config });
}
