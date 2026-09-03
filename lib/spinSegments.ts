// Default segments — used only as a fallback the very first time the app runs,
// before an admin has saved anything to GameConfig("spin_segments"). Once
// saved, the admin-configured list is the source of truth everywhere.
export type SpinSegment = {
  label: string;
  weight: number;
  prize: string | null; // null = a losing segment; non-null = the prize awarded
  // true = landing here is neither a win nor a loss — the participant gets
  // another spin instead. Always paired with prize: null.
  isSpinAgain?: boolean;
};

export const DEFAULT_SPIN_SEGMENTS: SpinSegment[] = [
  { label: "Premium Merchandise", weight: 90, prize: "Premium Merchandise" },
  { label: "Amazon Vouchers", weight: 15, prize: "Amazon Vouchers" },
  { label: "$100 Funded Account", weight: 9, prize: "USD 100 Funded Account" },
  { label: "$1,000 Funded Account – Jackpot", weight: 3, prize: "USD 1,000 Funded Account" },
  { label: "Spin Again", weight: 80, prize: null, isSpinAgain: true },
  { label: "Not This Time, Thank You.", weight: 40, prize: null },
];

export function segmentAngle(segments: SpinSegment[]): number {
  return 360 / segments.length;
}

// Segment i is centered exactly at i * segmentAngle (0 = top, clockwise),
// with its wedge boundaries at ±segmentAngle/2 from that center.
export function segmentCenterAngle(segments: SpinSegment[], index: number): number {
  return index * segmentAngle(segments);
}

function pickWeightedIndex(segments: SpinSegment[], indices: number[]): number {
  const totalWeight = indices.reduce((sum, i) => sum + segments[i].weight, 0);
  let roll = Math.random() * totalWeight;
  for (const i of indices) {
    roll -= segments[i].weight;
    if (roll <= 0) return i;
  }
  return indices[indices.length - 1];
}

export function pickSegmentIndex(
  segments: SpinSegment[],
  forcedOutcome: "WIN" | "LOSE" | null,
  soldOutIndices: ReadonlySet<number> = new Set()
): number {
  const allIndices = segments.map((_, i) => i).filter((i) => !soldOutIndices.has(i));
  // Forced outcomes must be definitive, so Spin Again segments are excluded
  // from both pools — a forced WIN/LOSE should never resolve to "try again".
  const loseIndices = allIndices.filter((i) => segments[i].prize === null && !segments[i].isSpinAgain);
  const winIndices = allIndices.filter((i) => segments[i].prize !== null);

  if (forcedOutcome === "LOSE" && loseIndices.length > 0) {
    return pickWeightedIndex(segments, loseIndices);
  }
  if (forcedOutcome === "WIN") {
    // If every remaining prize is sold out, fall back to a loss instead of
    // honoring the forced win — the physical stock is the hard limit.
    if (winIndices.length > 0) return pickWeightedIndex(segments, winIndices);
    if (loseIndices.length > 0) return pickWeightedIndex(segments, loseIndices);
  }
  return pickWeightedIndex(segments, allIndices);
}
