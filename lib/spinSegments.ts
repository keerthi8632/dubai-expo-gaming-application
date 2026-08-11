// Fixed for the entire expo — do not make this admin-editable (see plan doc).
// Order matches the Figma wheel layout clockwise from the top (12 o'clock).
export type SpinSegment = {
  label: string;
  weight: number;
  prize: string | null;
};

export const SPIN_SEGMENTS: SpinSegment[] = [
  { label: "Better Luck Next Time", weight: 35, prize: null },
  { label: "Branded Merchandise", weight: 25, prize: "Branded Merchandise" },
  { label: "USD 100 Funded Account*", weight: 9, prize: "USD 100 Funded Account" },
  { label: "Grand Prize - USD 1,000 Funded Account*", weight: 1, prize: "USD 1,000 Funded Account" },
  { label: "Exclusive Access to Our Trading Academy", weight: 15, prize: "Trading Academy Access" },
  { label: "Spin Again", weight: 15, prize: null },
];

export const SEGMENT_ANGLE = 360 / SPIN_SEGMENTS.length;

// Segment i is centered exactly at i * SEGMENT_ANGLE (0 = top, clockwise),
// with its wedge boundaries at ±SEGMENT_ANGLE/2 from that center.
export function segmentCenterAngle(index: number): number {
  return index * SEGMENT_ANGLE;
}

function pickWeightedIndex(indices: number[]): number {
  const totalWeight = indices.reduce((sum, i) => sum + SPIN_SEGMENTS[i].weight, 0);
  let roll = Math.random() * totalWeight;
  for (const i of indices) {
    roll -= SPIN_SEGMENTS[i].weight;
    if (roll <= 0) return i;
  }
  return indices[indices.length - 1];
}

export function pickSegmentIndex(forcedOutcome: "WIN" | "LOSE" | null): number {
  const allIndices = SPIN_SEGMENTS.map((_, i) => i);
  if (forcedOutcome === "LOSE") {
    return SPIN_SEGMENTS.findIndex((s) => s.prize === null && s.label === "Better Luck Next Time");
  }
  if (forcedOutcome === "WIN") {
    const winIndices = allIndices.filter((i) => SPIN_SEGMENTS[i].prize !== null);
    return pickWeightedIndex(winIndices);
  }
  return pickWeightedIndex(allIndices);
}
