#!/usr/bin/env node

import assert from "node:assert/strict";
import { formatFeatureSourceEvidence } from "../web/lib/feature-lab-source.ts";

const docsEvidence = formatFeatureSourceEvidence({
  source: {
    url: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    quote: "/status로 현재 Claude Code session 상태를 확인하는 흐름.",
  },
  introducedIn: "v1.2.3",
});

assert.equal(docsEvidence.hasEvidence, true);
assert.equal(docsEvidence.linkLabel, "Open Anthropic docs");
assert.equal(docsEvidence.hostLabel, "docs.anthropic.com");
assert.equal(docsEvidence.quote, "/status로 현재 Claude Code session 상태를 확인하는 흐름.");
assert.equal(docsEvidence.releaseLabel, "v1.2.3");

const releaseEvidence = formatFeatureSourceEvidence({
  source: {
    releaseVersion: "v1.0.88",
    quote: "릴리즈 노트에서 확인한 변경점.",
  },
});

assert.equal(releaseEvidence.hasEvidence, true);
assert.equal(releaseEvidence.linkLabel, "Release note v1.0.88");
assert.equal(releaseEvidence.hostLabel, "cc-release archive");
assert.equal(releaseEvidence.releaseLabel, "v1.0.88");

const quoteOnlyEvidence = formatFeatureSourceEvidence({
  source: {
    quote: "환경 변수 기반으로 Claude Code shell behavior를 제어하는 설정 예시.",
  },
});

assert.equal(quoteOnlyEvidence.hasEvidence, true);
assert.equal(quoteOnlyEvidence.linkLabel, null);
assert.equal(quoteOnlyEvidence.hostLabel, "curated note");
assert.equal(quoteOnlyEvidence.releaseLabel, null);

const unsafeEvidence = formatFeatureSourceEvidence({
  source: {
    url: "javascript:alert(1)",
    quote: "unsafe URL should not become a clickable href",
  },
});

assert.equal(unsafeEvidence.hasEvidence, true);
assert.equal(unsafeEvidence.href, null);
assert.equal(unsafeEvidence.linkLabel, null);
assert.equal(unsafeEvidence.hostLabel, "curated note");

const emptyEvidence = formatFeatureSourceEvidence({});
assert.equal(emptyEvidence.hasEvidence, false);
assert.equal(emptyEvidence.quote, null);
assert.equal(emptyEvidence.linkLabel, null);

console.log("✓ feature-lab source evidence helper valid");
