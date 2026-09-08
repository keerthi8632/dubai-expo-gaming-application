import { prisma } from "./prisma";
import { fromJson } from "./json";

export const SPIN_PRIZE_LIMITS_CONFIG_KEY = "spin_prize_limits";

// Total physical stock for the whole event (both days combined) per prize
// label. A prize with no entry here is treated as unlimited. Keys must match
// a segment's `prize` string exactly (see lib/spinSegments.ts).
export const DEFAULT_SPIN_PRIZE_LIMITS: Record<string, number> = {
  "Amazon Vouchers": 20,
  "Premium Merchandise": 30,
  "USD 100 Funded Account": 10,
  "USD 1,000 Funded Account": 1,
};

export async function getSpinPrizeLimits(): Promise<Record<string, number>> {
  const config = await prisma.gameConfig.findUnique({ where: { key: SPIN_PRIZE_LIMITS_CONFIG_KEY } });
  return fromJson<Record<string, number>>(config?.value, DEFAULT_SPIN_PRIZE_LIMITS);
}

// How many of each prize have already been won, across the entire event
// (no daily reset — the stock is shared across both days).
// The jackpot is only available through the last day of the event — after
// this date its segment is excluded from the winnable pool entirely, the
// same way a sold-out prize is (see excludedIndices in resolve/route.ts).
export const JACKPOT_PRIZE_LABEL = "USD 1,000 Funded Account";
export const JACKPOT_LAST_AVAILABLE_DATE = "2026-09-22";

export function isJackpotExpired(now: Date = new Date()): boolean {
  const cutoff = new Date(`${JACKPOT_LAST_AVAILABLE_DATE}T23:59:59.999Z`);
  return now > cutoff;
}

export async function getWonPrizeCounts(): Promise<Record<string, number>> {
  const rows = await prisma.gameSession.groupBy({
    by: ["prizeLabel"],
    where: { gameType: "SPIN", status: "WON", prizeLabel: { not: null } },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.prizeLabel) counts[row.prizeLabel] = row._count._all;
  }
  return counts;
}
