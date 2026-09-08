import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { spinQueueSchema } from "@/lib/validation";
import { getSpinSegments } from "@/lib/spinConfig";
import {
  getSpinQueue,
  saveSpinQueue,
  buildDefaultQueue,
  localDateKey,
  getSpinEventWindow,
  getQueueClaimCounts,
} from "@/lib/spinQueue";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateKey = req.nextUrl.searchParams.get("date") ?? localDateKey(new Date());
  const segments = await getSpinSegments();
  const [queue, eventWindow, claimedCounts] = await Promise.all([
    getSpinQueue(dateKey, segments),
    getSpinEventWindow(),
    getQueueClaimCounts(dateKey),
  ]);

  const totalCounts: Record<string, number> = {};
  for (const prize of queue) totalCounts[prize] = (totalCounts[prize] ?? 0) + 1;
  const remainingCounts: Record<string, number> = {};
  for (const prize of Object.keys(totalCounts)) {
    remainingCounts[prize] = totalCounts[prize] - (claimedCounts[prize] ?? 0);
  }

  return NextResponse.json({ date: dateKey, queue, eventWindow, totalCounts, claimedCounts, remainingCounts });
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = spinQueueSchema.safeParse(await req.json());
  if (!parsed.success) {
    // .flatten() puts field-level refinements (e.g. on `queue`) under
    // fieldErrors, not formErrors, so build a readable message list directly
    // from the issues instead of relying on it.
    const messages = parsed.error.issues.map((issue) => issue.message);
    return NextResponse.json({ error: { formErrors: messages } }, { status: 400 });
  }

  await saveSpinQueue(parsed.data.date, parsed.data.queue);
  return NextResponse.json({ date: parsed.data.date, queue: parsed.data.queue });
}

// Regenerates a fresh random shuffle for the given day (does not persist
// until the admin also hits Save, mirroring the segments editor's flow).
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await req.json();
  const dateKey = typeof date === "string" && date ? date : localDateKey(new Date());
  const segments = await getSpinSegments();
  return NextResponse.json({ date: dateKey, queue: buildDefaultQueue(dateKey, segments) });
}
