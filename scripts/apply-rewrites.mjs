#!/usr/bin/env node
// .omc/rewritten-summaries.json 의 수작업 요약을 data/releases.json 에 병합
// 사용법: node scripts/apply-rewrites.mjs

import fs from "node:fs";
import path from "node:path";

const DATA = path.resolve("data/releases.json");
const REWRITES = path.resolve(".omc/rewritten-summaries.json");

const releases = JSON.parse(fs.readFileSync(DATA, "utf-8"));
const rewrites = JSON.parse(fs.readFileSync(REWRITES, "utf-8"));

const now = new Date().toISOString();
let applied = 0;
for (const r of releases) {
  const patch = rewrites[r.version];
  if (!patch) continue;
  r.summary = {
    headline: patch.headline,
    newFeatures: patch.newFeatures,
    changes: patch.changes,
    fixes: patch.fixes,
    devImpact: patch.devImpact,
  };
  r.summarizedAt = now;
  r.summaryModel = "claude-opus-4-7-manual";
  applied++;
}

fs.writeFileSync(DATA, JSON.stringify(releases, null, 2) + "\n", "utf-8");
console.log(`${applied} entries rewritten in ${DATA}`);
