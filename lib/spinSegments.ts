// Default segments — used only as a fallback the very first time the app runs,
// before an admin has saved anything to GameConfig("spin_segments"). Once
// saved, the admin-configured list is the source of truth everywhere.
export type SpinSegment = {
  label: string;
  weight: number;
  prize: string | null; // null = a losing segment; non-null = the prize awarded
};

export const DEFAULT_SPIN_SEGMENTS: SpinSegment[] = [
  { label: "Better Luck Next Time", weight: 35, prize: null },
  { label: "Branded Merchandise", weight: 25, prize: "Branded Merchandise" },
  { label: "USD 100 Funded Account*", weight: 9, prize: "USD 100 Funded Account" },
  { label: "Grand Prize - USD 1,000 Funded Account*", weight: 1, prize: "USD 1,000 Funded Account" },
  { label: "Exclusive Access to Our Trading Academy", weight: 15, prize: "Trading Academy Access" },
  { label: "Spin Again", weight: 15, prize: null },
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

export function pickSegmentIndex(segments: SpinSegment[], forcedOutcome: "WIN" | "LOSE" | null): number {
  const allIndices = segments.map((_, i) => i);
  const loseIndices = allIndices.filter((i) => segments[i].prize === null);
  const winIndices = allIndices.filter((i) => segments[i].prize !== null);

  if (forcedOutcome === "LOSE" && loseIndices.length > 0) {
    return pickWeightedIndex(segments, loseIndices);
  }
  if (forcedOutcome === "WIN" && winIndices.length > 0) {
    return pickWeightedIndex(segments, winIndices);
  }
  return pickWeightedIndex(segments, allIndices);
}
