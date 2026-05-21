import { normalizeDevImpact } from "./dev-impact.ts";
import type { BulletWithRefs, DevImpactItem, Release } from "./types.ts";
import { isBulletWithRefs } from "./types.ts";

export type ReleaseIntelligenceBucketId =
  | "must-know"
  | "automation-permissions"
  | "stability-performance"
  | "feature-lab-linked";

export interface ReleaseIntelligenceItem {
  version: string;
  publishedAt: string;
  headline: string;
  reason: string;
  href: string;
}

export interface ReleaseIntelligenceHighlight {
  bucketId: ReleaseIntelligenceBucketId;
  bucketTitle: string;
  reason: string;
  href: string;
}

export interface ReleaseIntelligenceBucket {
  id: ReleaseIntelligenceBucketId;
  title: string;
  description: string;
  items: ReleaseIntelligenceItem[];
}

const BUCKETS: Array<Omit<ReleaseIntelligenceBucket, "items">> = [
  {
    id: "must-know",
    title: "놓치면 안 되는 변화",
    description: "자동화나 팀 설정에 바로 영향을 줄 수 있는 devImpact 중심 항목입니다.",
  },
  {
    id: "automation-permissions",
    title: "자동화·권한 영향",
    description: "permissions, hooks, MCP, OAuth, plugin, agent 흐름과 맞닿은 릴리즈입니다.",
  },
  {
    id: "stability-performance",
    title: "성능·안정성 개선",
    description: "crash, hang, Windows/WSL, proxy, resume, rendering 등 운영 체감 개선입니다.",
  },
  {
    id: "feature-lab-linked",
    title: "Feature Lab로 이어지는 릴리즈",
    description: "Feature Lab에서 기능 단위로 다시 체험할 수 있는 릴리즈입니다.",
  },
];

const AUTOMATION_PERMISSION_RE =
  /\b(permission|permissions|sandbox|hook|hooks|mcp|oauth|plugin|plugins|background|subagent|agent|workflow|workflows)\b/i;
const STABILITY_PERFORMANCE_RE =
  /\b(fix|fixed|bugfix|bugfixes|crash|hang|hanging|faster|speed|performance|latency|windows|wsl|proxy|resume|rendering|stale|idle|timeout|reliability)\b/i;

const GENERIC_REASON_RE = /^(changes?|fixes?|bugfixes?|improvements?|updates?|misc|n\/a|none)$/i;

function textFromBullet(item: string | BulletWithRefs): string {
  return isBulletWithRefs(item) ? item.text : item;
}

function trimReason(reason: string, maxLength = 132): string {
  const normalized = reason.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const cut = normalized.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 72 ? lastSpace : cut.length).trim()}…`;
}

function isSpecificReason(reason: string): boolean {
  const normalized = reason.trim();
  return normalized.length >= 12 && !GENERIC_REASON_RE.test(normalized);
}

function releaseSearchText(release: Release): string {
  const summary = release.summary;
  const devImpactText = normalizeDevImpact(summary.devImpact)
    .map((item) => item.text)
    .join(" ");
  return [
    release.version,
    summary.headline,
    ...summary.newFeatures.map(textFromBullet),
    ...summary.changes.map(textFromBullet),
    ...summary.fixes.map(textFromBullet),
    devImpactText,
  ]
    .filter(Boolean)
    .join("\n");
}

function firstSpecificDevImpact(items: DevImpactItem[]): string | null {
  return items.map((item) => item.text).find(isSpecificReason) ?? null;
}

function firstMatchingReleaseSignal(release: Release, pattern: RegExp): string | null {
  const candidates = [
    release.summary.headline,
    ...release.summary.newFeatures.map(textFromBullet),
    ...release.summary.changes.map(textFromBullet),
    ...release.summary.fixes.map(textFromBullet),
    ...normalizeDevImpact(release.summary.devImpact).map((item) => item.text),
  ];
  return candidates.find((text) => pattern.test(text) && isSpecificReason(text)) ?? null;
}

function makeItem(release: Release, reason: string): ReleaseIntelligenceItem {
  return {
    version: release.version,
    publishedAt: release.publishedAt,
    headline: release.summary.headline,
    reason: trimReason(reason),
    href: `#release-${release.version}`,
  };
}

function uniqueByVersion(items: ReleaseIntelligenceItem[], max: number): ReleaseIntelligenceItem[] {
  const seen = new Set<string>();
  const result: ReleaseIntelligenceItem[] = [];
  for (const item of items) {
    if (seen.has(item.version)) continue;
    if (!isSpecificReason(item.reason)) continue;
    seen.add(item.version);
    result.push(item);
    if (result.length >= max) break;
  }
  return result;
}

export function buildRelatedReleaseVersions(
  features: Array<{ relatedReleases?: string[]; introducedIn?: string; source?: { releaseVersion?: string } }>,
): Set<string> {
  const versions = new Set<string>();
  for (const feature of features) {
    for (const version of feature.relatedReleases ?? []) versions.add(version);
    if (feature.introducedIn) versions.add(feature.introducedIn);
    if (feature.source?.releaseVersion) versions.add(feature.source.releaseVersion);
  }
  return versions;
}

export function buildReleaseIntelligenceHighlights(
  buckets: ReleaseIntelligenceBucket[],
): Map<string, ReleaseIntelligenceHighlight[]> {
  const highlights = new Map<string, ReleaseIntelligenceHighlight[]>();
  for (const bucket of buckets) {
    for (const item of bucket.items) {
      const releaseHighlights = highlights.get(item.version) ?? [];
      releaseHighlights.push({
        bucketId: bucket.id,
        bucketTitle: bucket.title,
        reason: item.reason,
        href: item.href,
      });
      highlights.set(item.version, releaseHighlights);
    }
  }
  return highlights;
}

export function buildReleaseIntelligence(
  releases: Release[],
  options: { maxPerBucket?: number; relatedReleaseVersions?: Set<string> } = {},
): ReleaseIntelligenceBucket[] {
  const maxPerBucket = options.maxPerBucket ?? 4;
  const relatedReleaseVersions = options.relatedReleaseVersions ?? new Set<string>();

  const mustKnow = releases
    .map((release) => {
      const reason = firstSpecificDevImpact(normalizeDevImpact(release.summary.devImpact));
      return reason ? makeItem(release, reason) : null;
    })
    .filter((item): item is ReleaseIntelligenceItem => item !== null);

  const automationPermissions = releases
    .filter((release) => AUTOMATION_PERMISSION_RE.test(releaseSearchText(release)))
    .map((release) =>
      makeItem(
        release,
        firstMatchingReleaseSignal(release, AUTOMATION_PERMISSION_RE) ?? release.summary.headline,
      ),
    );

  const stabilityPerformance = releases
    .filter((release) => STABILITY_PERFORMANCE_RE.test(releaseSearchText(release)))
    .map((release) =>
      makeItem(
        release,
        firstMatchingReleaseSignal(release, STABILITY_PERFORMANCE_RE) ?? release.summary.headline,
      ),
    );

  const featureLabLinked = releases
    .filter((release) => relatedReleaseVersions.has(release.version))
    .map((release) =>
      makeItem(release, `Feature Lab 기능 설명과 연결된 ${release.version} 릴리즈입니다.`),
    );

  const itemsByBucket: Record<ReleaseIntelligenceBucketId, ReleaseIntelligenceItem[]> = {
    "must-know": uniqueByVersion(mustKnow, maxPerBucket),
    "automation-permissions": uniqueByVersion(automationPermissions, maxPerBucket),
    "stability-performance": uniqueByVersion(stabilityPerformance, maxPerBucket),
    "feature-lab-linked": uniqueByVersion(featureLabLinked, maxPerBucket),
  };

  return BUCKETS.map((bucket) => ({ ...bucket, items: itemsByBucket[bucket.id] })).filter(
    (bucket) => bucket.items.length > 0,
  );
}
