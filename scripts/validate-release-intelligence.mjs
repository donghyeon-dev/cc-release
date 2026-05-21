#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releasesPath = path.join(root, "data", "releases.json");
const featuresPath = path.join(root, "data", "feature-lab", "features.json");
const moduleUrl = pathToFileURL(path.join(root, "web", "lib", "release-intelligence.ts")).href;

const { buildRelatedReleaseVersions, buildReleaseIntelligence, buildReleaseIntelligenceHighlights } = await import(moduleUrl);

const GENERIC_REASON_RE = /^(changes?|fixes?|bugfixes?|improvements?|updates?|misc|n\/a|none)$/i;

function isSpecificReason(reason) {
  const normalized = String(reason ?? "").trim();
  return normalized.length >= 12 && !GENERIC_REASON_RE.test(normalized);
}

const releases = JSON.parse(fs.readFileSync(releasesPath, "utf8"));
const features = JSON.parse(fs.readFileSync(featuresPath, "utf8"));

assert.ok(Array.isArray(releases), "data/releases.json must be an array");
assert.ok(Array.isArray(features), "data/feature-lab/features.json must be an array");

const releaseVersions = new Set(releases.map((release) => release.version));
const buckets = buildReleaseIntelligence(releases, {
  maxPerBucket: 4,
  relatedReleaseVersions: buildRelatedReleaseVersions(features),
});

const highlightsByRelease = buildReleaseIntelligenceHighlights(buckets);
assert.ok(highlightsByRelease instanceof Map, "buildReleaseIntelligenceHighlights must return a Map");
assert.ok(highlightsByRelease.size > 0, "release intelligence highlights must not be empty");

assert.ok(buckets.length >= 3, `expected at least 3 release intelligence buckets, got ${buckets.length}`);

const seenBucketIds = new Set();
for (const bucket of buckets) {
  assert.equal(typeof bucket.id, "string", "bucket.id must be a string");
  assert.ok(!seenBucketIds.has(bucket.id), `duplicate bucket id: ${bucket.id}`);
  seenBucketIds.add(bucket.id);
  assert.equal(typeof bucket.title, "string", `${bucket.id}.title must be a string`);
  assert.ok(bucket.title.trim().length > 0, `${bucket.id}.title must not be empty`);
  assert.equal(typeof bucket.description, "string", `${bucket.id}.description must be a string`);
  assert.ok(Array.isArray(bucket.items), `${bucket.id}.items must be an array`);
  assert.ok(bucket.items.length > 0, `${bucket.id}.items must not be empty for the current dataset`);

  const seenItemVersions = new Set();
  for (const item of bucket.items) {
    const highlights = highlightsByRelease.get(item.version) ?? [];
    const matchingHighlight = highlights.find(
      (highlight) => highlight.bucketId === bucket.id && highlight.reason === item.reason,
    );
    assert.ok(matchingHighlight, `${bucket.id}.${item.version} missing release-card highlight`);
    assert.equal(matchingHighlight.bucketTitle, bucket.title, `${bucket.id}.${item.version} highlight title mismatch`);
    assert.ok(releaseVersions.has(item.version), `${bucket.id} item references unknown release ${item.version}`);
    assert.equal(item.href, `#release-${item.version}`, `${bucket.id}.${item.version} href must target release anchor`);
    assert.equal(typeof item.headline, "string", `${bucket.id}.${item.version} headline must be a string`);
    assert.ok(item.headline.trim().length > 0, `${bucket.id}.${item.version} headline must not be empty`);
    assert.equal(typeof item.publishedAt, "string", `${bucket.id}.${item.version} publishedAt must be a string`);
    assert.ok(!Number.isNaN(Date.parse(item.publishedAt)), `${bucket.id}.${item.version} publishedAt must parse as a date`);
    assert.equal(typeof item.reason, "string", `${bucket.id}.${item.version} reason must be a string`);
    assert.ok(isSpecificReason(item.reason), `${bucket.id}.${item.version} reason is empty/generic: ${item.reason}`);
    assert.ok(!seenItemVersions.has(item.version), `${bucket.id} repeats ${item.version}`);
    seenItemVersions.add(item.version);
  }
}

for (const requiredId of ["must-know", "automation-permissions", "stability-performance", "feature-lab-linked"]) {
  assert.ok(seenBucketIds.has(requiredId), `missing release intelligence bucket: ${requiredId}`);
}

console.log(`✓ release intelligence valid (${buckets.length} buckets)`);
