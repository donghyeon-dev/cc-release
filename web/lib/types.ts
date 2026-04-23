export interface DevImpactRef {
  bucket: "newFeatures" | "changes" | "fixes";
  index: number;
}

export interface DevImpactItem {
  text: string;
  refs: DevImpactRef[];
}

export interface BulletWithRefs {
  text: string;
  originalRefs: number[];
}

export interface ReleaseSummary {
  headline: string;
  newFeatures: Array<string | BulletWithRefs>;
  changes: Array<string | BulletWithRefs>;
  fixes: Array<string | BulletWithRefs>;
  devImpact: string | DevImpactItem[];
}

export interface Release {
  version: string;
  tagName: string;
  publishedAt: string;
  url?: string;
  originalBody: string;
  summary: ReleaseSummary;
  summarizedAt: string;
  summaryModel: string;
}

export function isStructuredDevImpact(
  devImpact: string | DevImpactItem[] | undefined,
): devImpact is DevImpactItem[] {
  return Array.isArray(devImpact);
}

export function isInStructuredRange(version: string): boolean {
  const v = version.replace(/^v/, "").split(".").map(Number);
  const [M, m, p] = [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
  if (M > 2) return true;
  if (M < 2) return false;
  if (m > 0) return true;
  return p >= 73;
}

export function isBulletWithRefs(
  item: string | BulletWithRefs,
): item is BulletWithRefs {
  return typeof item === "object" && item !== null && "text" in item;
}
