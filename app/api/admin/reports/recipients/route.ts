import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { toJson, fromJson } from "@/lib/json";
import { z } from "zod";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = await prisma.gameConfig.findUnique({ where: { key: "report_recipients" } });
  return NextResponse.json({ recipients: fromJson<string[]>(config?.value, []) });
}

const schema = z.object({ recipients: z.array(z.string().email()) });

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.gameConfig.upsert({
    where: { key: "report_recipients" },
    create: { key: "report_recipients", value: toJson(parsed.data.recipients) },
    update: { value: toJson(parsed.data.recipients) },
  });
  return NextResponse.json({ recipients: parsed.data.recipients });
}
