#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const featuresPath = path.join(root, "data", "feature-lab", "features.json");
const urlModule = pathToFileURL(path.join(root, "web", "lib", "feature-lab-url.ts")).href;
const requireExport = process.argv.includes("--require-export");

const {
  DEFAULT_FILTER_STATE,
  buildFeatureLabHref,
  buildFeatureLabSearch,
  parseFeatureLabParams,
} = await import(urlModule);

const features = JSON.parse(fs.readFileSync(featuresPath, "utf8"));
assert.ok(Array.isArray(features), "features.json must contain an array");
assert.ok(features.length > 0, "features.json must not be empty");

const seenIds = new Set();

for (const feature of features) {
  assert.equal(typeof feature.id, "string", "feature id must be a string");
  assert.ok(feature.id.trim().length > 0, "feature id must not be empty");
  assert.equal(feature.id, feature.id.trim(), `feature id must not have surrounding whitespace: ${feature.id}`);
  assert.ok(!seenIds.has(feature.id), `duplicate feature id: ${feature.id}`);
  seenIds.add(feature.id);

  const baseState = {
    ...DEFAULT_FILTER_STATE,
    featureId: feature.id,
  };
  const search = buildFeatureLabSearch("", baseState);
  const parsedSearch = new URLSearchParams(search);
  assert.equal(parsedSearch.get("feature"), feature.id, `feature search should include feature param for ${feature.id}: ${search}`);
  assert.equal(parseFeatureLabParams(search).featureId, feature.id, `feature id should round-trip for ${feature.id}`);

  const href = buildFeatureLabHref({ id: feature.id });
  const parsedHref = new URL(`https://example.com${href}`);
  assert.equal(parsedHref.pathname.endsWith("/feature-lab/"), true, `href should point at feature-lab path for ${feature.id}: ${href}`);
  assert.equal(parsedHref.searchParams.get("feature"), feature.id, `href should include feature param for ${feature.id}: ${href}`);
  assert.equal(parseFeatureLabParams(parsedHref.searchParams).featureId, feature.id);
}

const representativeStates = [
  {
    featureId: "permission-allowlist",
    query: "permissions & allow",
    category: "permission",
    difficulty: "medium",
    impact: "safety",
    audience: "team",
  },
  {
    featureId: "mcp-oauth-auth",
    query: "oauth mcp",
    category: "mcp",
    difficulty: "advanced",
    impact: "automation",
    audience: "mcp-user",
  },
  {
    featureId: "hooks-notifications",
    query: "hooks notifications",
    category: "hooks",
    difficulty: "advanced",
    impact: "automation",
    audience: "power-user",
  },
  {
    featureId: "shell-override",
    query: "shell path",
    category: "env",
    difficulty: "easy",
    impact: "ux",
    audience: "solo-dev",
  },
];

for (const state of representativeStates) {
  assert.ok(seenIds.has(state.featureId), `representative feature id is missing from catalog: ${state.featureId}`);
  const search = buildFeatureLabSearch("?utm=keep", state);
  const parsed = parseFeatureLabParams(search);
  assert.equal(parsed.featureId, state.featureId, `representative feature should round-trip: ${state.featureId}`);
  assert.equal(parsed.query, state.query, `query should round-trip for ${state.featureId}`);
  assert.equal(parsed.category, state.category, `category should round-trip for ${state.featureId}`);
  assert.equal(parsed.difficulty, state.difficulty, `difficulty should round-trip for ${state.featureId}`);
  assert.equal(parsed.impact, state.impact, `impact should round-trip for ${state.featureId}`);
  assert.equal(parsed.audience, state.audience, `audience should round-trip for ${state.featureId}`);
}

const outRoot = path.join(root, "web", "out");
const rootHtml = path.join(outRoot, "index.html");
const featureLabHtml = path.join(outRoot, "feature-lab", "index.html");

if (requireExport) {
  assert.ok(fs.existsSync(rootHtml), "expected web/out/index.html after static export build");
  assert.ok(fs.existsSync(featureLabHtml), "expected web/out/feature-lab/index.html after static export build");
  const featureLab = fs.readFileSync(featureLabHtml, "utf8");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const expectedAssetPrefix = `${basePath}/_next/static/`.replaceAll("//", "/");
  assert.ok(featureLab.includes("Feature Lab"), "feature-lab export should include Feature Lab shell text");
  assert.ok(
    featureLab.includes(expectedAssetPrefix),
    `feature-lab export should reference Next static assets with prefix ${expectedAssetPrefix}`,
  );
}

console.log(`✓ feature-lab deep links valid (${features.length} features${requireExport ? ", export checked" : ""})`);
