// Scheduled prize queue for the spin wheel: instead of every spin having an
// independent chance to win, the day's prizes are pre-arranged into a queue
// (one prize per fixed-length time window across the event day), and the
// first spin that lands within a window claims that window's prize. Spins
// outside an active window (or after that window's prize is already
// claimed) can only land on Spin Again or a genuine loss — never a prize —
// so the total number of wins per day is capped exactly at the queue length.
import { prisma } from "./prisma";
import { fromJson, toJson } from "./json";
import { JACKPOT_PRIZE_LABEL, JACKPOT_LAST_AVAILABLE_DATE } from "./spinPrizeLimits";
import { SpinSegment } from "./spinSegments";

export const SPIN_EVENT_WINDOW_CONFIG_KEY = "spin_event_window";
export const SPIN_QUEUE_CONFIG_KEY_PREFIX = "spin_queue:";

export type SpinEventWindow = { startHour: number; startMinute: number; endHour: number; endMinute: number };

export const DEFAULT_SPIN_EVENT_WINDOW: SpinEventWindow = { startHour: 10, startMinute: 0, endHour: 18, endMinute: 0 };

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Builds a day's queue straight from the live segments config, so it always
// matches whatever prize labels an admin has actually configured — the
// jackpot segment is only included on its designated day, and capped at 1
// copy regardless of its configured dailyQueueCount, since only one jackpot
// unit exists for the whole event (see spinPrizeLimits.ts).
export function buildDefaultQueue(dateKey: string, segments: SpinSegment[]): string[] {
  const flat = segments
    .filter((s) => s.prize && !s.isSpinAgain && (s.prize !== JACKPOT_PRIZE_LABEL || dateKey === JACKPOT_LAST_AVAILABLE_DATE))
    .flatMap((s) => {
      const count = s.prize === JACKPOT_PRIZE_LABEL ? Math.min(s.dailyQueueCount ?? 0, 1) : s.dailyQueueCount ?? 0;
      return Array(count).fill(s.prize as string);
    });
  return shuffle(flat);
}

export async function getSpinEventWindow(): Promise<SpinEventWindow> {
  const config = await prisma.gameConfig.findUnique({ where: { key: SPIN_EVENT_WINDOW_CONFIG_KEY } });
  return fromJson<SpinEventWindow>(config?.value, DEFAULT_SPIN_EVENT_WINDOW);
}

export async function saveSpinEventWindow(window: SpinEventWindow): Promise<void> {
  await prisma.gameConfig.upsert({
    where: { key: SPIN_EVENT_WINDOW_CONFIG_KEY },
    create: { key: SPIN_EVENT_WINDOW_CONFIG_KEY, value: toJson(window) },
    update: { value: toJson(window) },
  });
}

export const SPIN_MIN_WIN_GAP_CONFIG_KEY = "spin_min_win_gap_minutes";
export const DEFAULT_SPIN_MIN_WIN_GAP_MINUTES = 10;

// Minimum time that must pass between two Spin wins, regardless of how many
// prizes are backlogged in the queue — without this, a lull before the event
// gets going (nobody playing between the scheduled start time and when
// people actually show up) lets several carried-over prizes queue up, then
// all get handed out back-to-back the moment testing/play resumes.
export async function getSpinMinWinGapMinutes(): Promise<number> {
  const config = await prisma.gameConfig.findUnique({ where: { key: SPIN_MIN_WIN_GAP_CONFIG_KEY } });
  return fromJson<{ minutes?: number }>(config?.value, {}).minutes ?? DEFAULT_SPIN_MIN_WIN_GAP_MINUTES;
}

export async function saveSpinMinWinGapMinutes(minutes: number): Promise<void> {
  await prisma.gameConfig.upsert({
    where: { key: SPIN_MIN_WIN_GAP_CONFIG_KEY },
    create: { key: SPIN_MIN_WIN_GAP_CONFIG_KEY, value: toJson({ minutes }) },
    update: { value: toJson({ minutes }) },
  });
}

// Fetches the queue for a given day, generating and persisting a randomly
// shuffled default the first time that day is looked up — every resolve
// call and the admin UI then agree on the same queue instead of each
// generating its own shuffle.
export async function getSpinQueue(dateKey: string, segments: SpinSegment[]): Promise<string[]> {
  const key = SPIN_QUEUE_CONFIG_KEY_PREFIX + dateKey;
  const config = await prisma.gameConfig.findUnique({ where: { key } });
  if (config) return fromJson<string[]>(config.value, []);

  const queue = buildDefaultQueue(dateKey, segments);
  await prisma.gameConfig.upsert({
    where: { key },
    create: { key, value: toJson(queue) },
    update: { value: toJson(queue) },
  });
  return queue;
}

// Admin override — manual reorder or a fresh shuffle.
export async function saveSpinQueue(dateKey: string, queue: string[]): Promise<void> {
  const key = SPIN_QUEUE_CONFIG_KEY_PREFIX + dateKey;
  await prisma.gameConfig.upsert({
    where: { key },
    create: { key, value: toJson(queue) },
    update: { value: toJson(queue) },
  });
}

// How many queue slots (0-based, inclusive) should have "opened" by now, or
// null if the event isn't running right now. The window spans the whole
// event day evenly across however many prizes are queued, so a day with an
// extra jackpot slot gets slightly shorter windows instead of the schedule
// running past closing time. This is an upper bound, not "the" due slot —
// see getNextDueQueueIndex for which slot is actually still unclaimed.
export function getOpenWindowIndex(now: Date, window: SpinEventWindow, queueLength: number): number | null {
  if (queueLength === 0) return null;
  const start = new Date(now);
  start.setHours(window.startHour, window.startMinute, 0, 0);
  const end = new Date(now);
  end.setHours(window.endHour, window.endMinute, 0, 0);
  if (now < start || now >= end) return null;

  const totalMinutes = (end.getTime() - start.getTime()) / 60000;
  const windowMinutes = totalMinutes / queueLength;
  const elapsedMinutes = (now.getTime() - start.getTime()) / 60000;
  const index = Math.floor(elapsedMinutes / windowMinutes);
  return Math.min(index, queueLength - 1);
}

// Which windows at or before openIndex have already been claimed today — one
// query per resolve call, reused across every step of the due-index walk in
// resolve/route.ts instead of re-querying per iteration.
export async function getClaimedWindowIndices(dateKey: string, openIndex: number): Promise<Set<number>> {
  const claims = await prisma.spinQueueClaim.findMany({
    where: { date: dateKey, windowIndex: { lte: openIndex } },
    select: { windowIndex: true },
  });
  return new Set(claims.map((c) => c.windowIndex));
}

// The earliest slot at or before openIndex that hasn't been claimed yet, or
// null if every slot due so far has already been won. This is what makes a
// missed window "carry over" — if nobody spun during window 5's 16 minutes,
// its prize stays the oldest pending one and gets handed to the very next
// spin (whichever kiosk it comes from), before window 6's prize is even
// considered.
export function nextDueQueueIndex(claimed: ReadonlySet<number>, openIndex: number): number | null {
  for (let i = 0; i <= openIndex; i++) {
    if (!claimed.has(i)) return i;
  }
  return null;
}

// Every window index claimed today, win or forfeit — used by the admin queue
// list to grey out/hide slots that are already spoken for, since the queue
// array itself has to stay index-stable (windowIndex math + existing claims
// depend on it) and can't just have won entries spliced out.
export async function getClaimedWindowIndicesForDate(dateKey: string): Promise<number[]> {
  const claims = await prisma.spinQueueClaim.findMany({
    where: { date: dateKey },
    select: { windowIndex: true },
  });
  return claims.map((c) => c.windowIndex);
}

// How many of each prize in a day's queue have already been claimed
// (including forfeited slots, which are gone for good too) — used to show
// admins how many of each prize are still left to give away today.
export async function getQueueClaimCounts(dateKey: string): Promise<Record<string, number>> {
  const rows = await prisma.spinQueueClaim.groupBy({
    by: ["prizeLabel"],
    where: { date: dateKey },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.prizeLabel] = row._count._all;
  return counts;
}

// Atomically claims a window's prize for a participant — the unique
// (date, windowIndex) constraint on SpinQueueClaim guarantees only the first
// caller for a given window succeeds, even if two spins land in the same
// window at nearly the same instant.
export async function claimQueueSlot(
  dateKey: string,
  windowIndex: number,
  prizeLabel: string,
  participantId: string
): Promise<boolean> {
  try {
    await prisma.spinQueueClaim.create({ data: { date: dateKey, windowIndex, prizeLabel, participantId } });
    return true;
  } catch (err: any) {
    if (err?.code === "P2002") return false; // another spin already claimed this window
    throw err;
  }
}
