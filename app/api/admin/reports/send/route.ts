import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { sendDailyReport } from "@/lib/adminReport";

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.gameConfig.findUnique({ where: { key: "report_recipients" } });
  const recipients = (config?.value as string[] | null) ?? [];
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients configured" }, { status: 400 });
  }

  await sendDailyReport(recipients);
  return NextResponse.json({ ok: true, recipients });
}
