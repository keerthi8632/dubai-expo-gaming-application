// Caps natural (non-forced) Trade Prediction wins to at most one per time
// slot, so the day can produce at most 5 winners total. Slot boundaries are
// evaluated in the server's local time (the kiosk device's own clock), which
// matches the venue's on-site time.
export const TRADE_WIN_SLOTS = [
  { startMinutes: 10 * 60 + 30, endMinutes: 11 * 60 + 30 }, // 10:30–11:30
  { startMinutes: 11 * 60 + 30, endMinutes: 13 * 60 }, // 11:30–1:00 PM
  { startMinutes: 13 * 60, endMinutes: 15 * 60 }, // 1:00–3:00 PM
  { startMinutes: 15 * 60, endMinutes: 16 * 60 + 30 }, // 3:00–4:30 PM
  { startMinutes: 16 * 60 + 30, endMinutes: 18 * 60 }, // 4:30–6:00 PM
];

export function slotForDate(date: Date): { startMinutes: number; endMinutes: number } | null {
  const minutesOfDay = date.getHours() * 60 + date.getMinutes();
  return TRADE_WIN_SLOTS.find((s) => minutesOfDay >= s.startMinutes && minutesOfDay < s.endMinutes) ?? null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function slotToDateRange(slot: { startMinutes: number; endMinutes: number }, day: Date) {
  const base = startOfDay(day);
  const from = new Date(base.getTime() + slot.startMinutes * 60000);
  const to = new Date(base.getTime() + slot.endMinutes * 60000);
  return { from, to };
}

// Whether a win is still allowed right now: the current time must fall
// inside one of the defined slots, and that slot must not already have a
// winner today. This gates BOTH the random win-rate roll and admin-forced
// WIN outcomes — the prize budget is fixed at 5 wins/day (10 total across
// both games), so a slot that's already full blocks even a forced win.
export async function canAwardWin(
  prisma: import("@prisma/client").PrismaClient,
  now: Date
): Promise<boolean> {
  const slot = slotForDate(now);
  if (!slot) return false;

  const { from, to } = slotToDateRange(slot, now);
  const existingWinner = await prisma.gameSession.findFirst({
    where: {
      gameType: "TRADE",
      status: "WON",
      completedAt: { gte: from, lt: to },
    },
  });
  return existingWinner === null;
}
