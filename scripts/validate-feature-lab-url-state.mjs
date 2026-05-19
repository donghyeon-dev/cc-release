#!/usr/bin/env node
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moduleUrl = pathToFileURL(path.join(root, "web", "lib", "feature-lab-url.ts")).href;
const {
  applyFilterParams,
  buildFeatureLabHref,
  buildFeatureLabSearch,
  parseFeatureLabParams,
} = await import(moduleUrl);

assert.deepEqual(parseFeatureLabParams("?feature=permission-allowlist&q=prompt&category=permission&difficulty=medium&impact=safety&audience=team"), {
  featureId: "permission-allowlist",
  query: "prompt",
  category: "permission",
  difficulty: "medium",
  impact: "safety",
  audience: "team",
});

assert.deepEqual(parseFeatureLabParams("?feature=&q=%20&category=bad&difficulty=nope&impact=wrong&audience=visitor"), {
  featureId: null,
  query: "",
  category: "all",
  difficulty: "all",
  impact: "all",
  audience: "all",
});

const existing = new URLSearchParams("utm=keep&feature=old&q=old&category=mcp&difficulty=advanced&impact=cost&audience=ci");
const reset = applyFilterParams(existing, {
  featureId: "model-picker",
  query: "",
  category: "all",
  difficulty: "all",
  impact: "all",
  audience: "all",
});
assert.equal(reset.toString(), "utm=keep&feature=model-picker");

assert.equal(
  buildFeatureLabSearch("?utm=keep", {
    featureId: "allowed-tools-patterns",
    query: "allow tools",
    category: "permission",
    difficulty: "advanced",
    impact: "automation",
    audience: "power-user",
  }),
  "?utm=keep&feature=allowed-tools-patterns&q=allow+tools&category=permission&difficulty=advanced&impact=automation&audience=power-user",
);

assert.equal(
  buildFeatureLabSearch("", {
    featureId: "slash/command",
    query: "MCP & hooks",
    category: "all",
    difficulty: "all",
    impact: "all",
    audience: "all",
  }),
  "?feature=slash%2Fcommand&q=MCP+%26+hooks",
);

assert.equal(
  buildFeatureLabHref({ id: "mcp-oauth-auth" }),
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/feature-lab/?feature=mcp-oauth-auth`,
);

console.log("✓ feature-lab URL state helpers valid");
