// Caps natural (non-forced) Trade Prediction wins to at most one per time
// slot, so the day can produce at most 5 winners total. Slot boundaries are
// evaluated in the venue's timezone (Asia/Dubai) explicitly, not the host
// server's own local clock — the app may run on a remote host whose system
// time isn't Dubai time. See lib/venueTime.ts.
import { venueMinutesOfDay, venueStartOfDay } from "./venueTime";

export const TRADE_WIN_SLOTS = [
  { startMinutes: 10 * 60 + 30, endMinutes: 11 * 60 + 30 }, // 10:30–11:30
  { startMinutes: 11 * 60 + 30, endMinutes: 13 * 60 }, // 11:30–1:00 PM
  { startMinutes: 13 * 60, endMinutes: 15 * 60 }, // 1:00–3:00 PM
  { startMinutes: 15 * 60, endMinutes: 16 * 60 + 30 }, // 3:00–4:30 PM
  { startMinutes: 16 * 60 + 30, endMinutes: 18 * 60 }, // 4:30–6:00 PM
];

export function slotForDate(date: Date): { startMinutes: number; endMinutes: number } | null {
  const minutesOfDay = venueMinutesOfDay(date);
  return TRADE_WIN_SLOTS.find((s) => minutesOfDay >= s.startMinutes && minutesOfDay < s.endMinutes) ?? null;
}

// Re-exported for existing call sites (e.g. app/api/leaderboard/route.ts).
export const startOfDay = venueStartOfDay;

// How many of today's slots have started by `now` — this, not "is the
// current slot free", is the win budget: a slot nobody played during its own
// window doesn't lose its win, it just stays pending and rolls into whichever
// later slot the next play actually falls in (mirrors the Spin & Win queue's
// carry-forward behavior in lib/spinQueue.ts).
export function slotsOpenedSoFar(now: Date): number {
  const minutesOfDay = venueMinutesOfDay(now);
  return TRADE_WIN_SLOTS.filter((s) => minutesOfDay >= s.startMinutes).length;
}

// Whether a win is still allowed right now: the current time must fall
// inside one of the defined slots, and fewer wins must have happened today
// than slots have opened so far. This gates BOTH the random win-rate roll
// and admin-forced WIN outcomes — the prize budget is fixed at 5 wins/day
// (10 total across both games), so once every opened slot's budget is spent,
// even a forced win is blocked until the next slot opens.
export async function canAwardWin(
  prisma: import("@prisma/client").PrismaClient,
  now: Date
): Promise<boolean> {
  const slot = slotForDate(now);
  if (!slot) return false;

  const opened = slotsOpenedSoFar(now);
  const dayStart = startOfDay(now);
  const winsToday = await prisma.gameSession.count({
    where: {
      gameType: "TRADE",
      status: "WON",
      completedAt: { gte: dayStart, lt: now },
    },
  });
  return winsToday < opened;
}
