import type {
  DevImpactItem,
  DevImpactRef,
  ReleaseSummary,
} from "@/lib/types";
import { isStructuredDevImpact } from "@/lib/types";

export function normalizeDevImpact(
  devImpact: string | DevImpactItem[] | undefined,
): DevImpactItem[] {
  if (isStructuredDevImpact(devImpact)) return devImpact;
  if (!devImpact || devImpact.trim() === "") return [];
  return devImpact
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text, refs: [] }));
}

export function refKey(ref: DevImpactRef): string {
  return `${ref.bucket}:${ref.index}`;
}

export function buildRefNumberMap(
  items: DevImpactItem[],
): Map<string, number> {
  const map = new Map<string, number>();
  let next = 1;
  for (const item of items) {
    for (const ref of item.refs) {
      const key = refKey(ref);
      if (!map.has(key)) {
        map.set(key, next++);
      }
    }
  }
  return map;
}

export function getBulletRefNumber(
  bucket: DevImpactRef["bucket"],
  index: number,
  refMap: Map<string, number>,
): number | undefined {
  return refMap.get(`${bucket}:${index}`);
}

export function hasClickableBackticks(items: DevImpactItem[]): boolean {
  return items.some((item) => item.text.includes("`"));
}

export function summaryHasAnyBullet(summary: ReleaseSummary): boolean {
  return (
    summary.newFeatures.length > 0 ||
    summary.changes.length > 0 ||
    summary.fixes.length > 0
  );
}
