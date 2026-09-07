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
} from "@/lib/spinQueue";

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateKey = req.nextUrl.searchParams.get("date") ?? localDateKey(new Date());
  const segments = await getSpinSegments();
  const [queue, eventWindow] = await Promise.all([getSpinQueue(dateKey, segments), getSpinEventWindow()]);
  return NextResponse.json({ date: dateKey, queue, eventWindow });
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = spinQueueSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
