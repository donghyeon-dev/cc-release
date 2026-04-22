import type { Release } from "./types";

const VERSION_PATTERN = /^v?\d+(?:\.\d+){0,2}$/;

function normalizeVersionQuery(q: string): string {
  const trimmed = q.trim().toLowerCase();
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

function matchesVersionPrefix(release: Release, query: string): boolean {
  const normalized = normalizeVersionQuery(query);
  const version = release.version.toLowerCase();
  if (version === normalized) return true;
  return version.startsWith(`${normalized}.`);
}

function buildSearchCorpus(release: Release): string {
  const parts: string[] = [
    release.version,
    release.tagName,
    release.summary.headline,
    ...release.summary.newFeatures,
    ...release.summary.changes,
    ...release.summary.fixes,
    release.summary.devImpact,
    release.originalBody,
  ];
  return parts.join("  ").toLowerCase();
}

export function matchRelease(release: Release, rawQuery: string): boolean {
  const query = rawQuery.trim();
  if (query === "") return true;

  if (VERSION_PATTERN.test(query)) {
    return matchesVersionPrefix(release, query);
  }

  const corpus = buildSearchCorpus(release);
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  return tokens.every((t) => corpus.includes(t));
}

export function filterReleases(
  releases: Release[],
  rawQuery: string,
): Release[] {
  const query = rawQuery.trim();
  if (query === "") return releases;
  return releases.filter((r) => matchRelease(r, query));
}
