#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const featuresPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, "data", "feature-lab", "features.json");
const sourcesPath = path.join(root, "data", "feature-lab", "sources", "changelog-items.json");

const categories = new Set([
  "env",
  "settings",
  "slash-command",
  "permission",
  "mcp",
  "hooks",
  "plugin",
  "model",
  "tui",
]);
const activationKinds = new Set(["env", "settings", "command", "config-file"]);
const difficulties = new Set(["easy", "medium", "advanced"]);
const impactTags = new Set(["speed", "safety", "automation", "context", "ux", "quality", "cost"]);
const audiences = new Set(["solo-dev", "team", "ci", "mcp-user", "power-user"]);
const frameKinds = new Set([
  "type",
  "line",
  "spinner",
  "permission-prompt",
  "menu",
  "diff",
  "status-change",
  "toast",
]);
const tones = new Set(["neutral", "good", "warn", "info"]);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath}: ${error.message}`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must be a non-empty array`);
  }
  value.forEach((item, index) => assertNonEmptyString(item, `${label}[${index}]`));
}

function assertEnumArray(value, allowed, label) {
  assertStringArray(value, label);
  value.forEach((item, index) => {
    if (!allowed.has(item)) {
      fail(`${label}[${index}] must be one of: ${Array.from(allowed).join(", ")}`);
    }
  });
}

function assertOptionalStringArray(value, label) {
  if (value === undefined) return;
  if (!Array.isArray(value)) fail(`${label} must be an array when present`);
  value.forEach((item, index) => assertNonEmptyString(item, `${label}[${index}]`));
}

function validateFrame(frame, label) {
  if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
    fail(`${label} must be an object`);
  }
  assertNonEmptyString(frame.id, `${label}.id`);
  if (!frameKinds.has(frame.kind)) {
    fail(`${label}.kind must be one of: ${Array.from(frameKinds).join(", ")}`);
  }
  assertNonEmptyString(frame.at, `${label}.at`);
  assertNonEmptyString(frame.content, `${label}.content`);
  if (frame.title !== undefined) assertNonEmptyString(frame.title, `${label}.title`);
  if (frame.tone !== undefined && !tones.has(frame.tone)) {
    fail(`${label}.tone must be one of: ${Array.from(tones).join(", ")}`);
  }
}

function validateScene(scene, label) {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) {
    fail(`${label} must be an object`);
  }
  assertNonEmptyString(scene.title, `${label}.title`);
  assertNonEmptyString(scene.statusBefore, `${label}.statusBefore`);
  assertNonEmptyString(scene.statusAfter, `${label}.statusAfter`);
  if (!Array.isArray(scene.frames) || scene.frames.length === 0) {
    fail(`${label}.frames must be a non-empty array`);
  }
  const frameIds = new Set();
  scene.frames.forEach((frame, index) => {
    validateFrame(frame, `${label}.frames[${index}]`);
    if (frameIds.has(frame.id)) fail(`${label}.frames[${index}].id is duplicated: ${frame.id}`);
    frameIds.add(frame.id);
  });
}

function validateFeature(feature, index, ids) {
  const label = `features[${index}]`;
  if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
    fail(`${label} must be an object`);
  }
  assertNonEmptyString(feature.id, `${label}.id`);
  if (ids.has(feature.id)) fail(`${label}.id is duplicated: ${feature.id}`);
  ids.add(feature.id);
  assertNonEmptyString(feature.name, `${label}.name`);
  assertNonEmptyString(feature.shortName, `${label}.shortName`);
  if (!categories.has(feature.category)) {
    fail(`${label}.category must be one of: ${Array.from(categories).join(", ")}`);
  }
  assertNonEmptyString(feature.description, `${label}.description`);
  if (!difficulties.has(feature.difficulty)) {
    fail(`${label}.difficulty must be one of: ${Array.from(difficulties).join(", ")}`);
  }
  assertEnumArray(feature.impactTags, impactTags, `${label}.impactTags`);
  assertEnumArray(feature.audience, audiences, `${label}.audience`);
  assertOptionalStringArray(feature.relatedReleases, `${label}.relatedReleases`);

  if (!feature.activation || typeof feature.activation !== "object") {
    fail(`${label}.activation must be an object`);
  }
  if (!activationKinds.has(feature.activation.type)) {
    fail(`${label}.activation.type must be one of: ${Array.from(activationKinds).join(", ")}`);
  }
  assertNonEmptyString(feature.activation.label, `${label}.activation.label`);
  assertNonEmptyString(feature.activation.snippet, `${label}.activation.snippet`);
  if (feature.activation.file !== undefined) {
    assertNonEmptyString(feature.activation.file, `${label}.activation.file`);
  }

  validateScene(feature.beforeExperience, `${label}.beforeExperience`);
  validateScene(feature.afterExperience, `${label}.afterExperience`);

  if (!feature.impact || typeof feature.impact !== "object") {
    fail(`${label}.impact must be an object`);
  }
  assertNonEmptyString(feature.impact.summary, `${label}.impact.summary`);
  assertStringArray(feature.impact.goodFor, `${label}.impact.goodFor`);
  assertStringArray(feature.impact.watchOut, `${label}.impact.watchOut`);

  const source = feature.source;
  if (!source || typeof source !== "object" || (!source.quote && !source.url)) {
    fail(`${label}.source must include at least quote or url`);
  }
  if (source.quote !== undefined) assertNonEmptyString(source.quote, `${label}.source.quote`);
  if (source.url !== undefined) assertNonEmptyString(source.url, `${label}.source.url`);
}

const features = readJson(featuresPath);
if (!Array.isArray(features) || features.length === 0) {
  fail(`${featuresPath} must be a non-empty array`);
}

const ids = new Set();
features.forEach((feature, index) => validateFeature(feature, index, ids));

const sourceItems = readJson(sourcesPath);
if (!Array.isArray(sourceItems)) {
  fail(`${sourcesPath} must be an array`);
}
const sourceIds = new Set(sourceItems.map((item) => item?.id));
for (const id of ids) {
  if (!sourceIds.has(id)) fail(`sources/changelog-items.json is missing source item for feature id: ${id}`);
}

console.log(`✓ feature-lab catalog valid (${features.length} features)`);
