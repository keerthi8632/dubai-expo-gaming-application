import { prisma } from "./prisma";
import { fromJson } from "./json";
import { DEFAULT_SPIN_SEGMENTS, SpinSegment } from "./spinSegments";

export const SPIN_SEGMENTS_CONFIG_KEY = "spin_segments";

export async function getSpinSegments(): Promise<SpinSegment[]> {
  const config = await prisma.gameConfig.findUnique({ where: { key: SPIN_SEGMENTS_CONFIG_KEY } });
  const segments = fromJson<SpinSegment[]>(config?.value, DEFAULT_SPIN_SEGMENTS);
  return segments.length > 0 ? segments : DEFAULT_SPIN_SEGMENTS;
}
