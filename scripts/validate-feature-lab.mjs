#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const requireV2Fields = args.includes("--require-v2-fields");
const minV2FeaturesArg = args.find((arg) => arg.startsWith("--min-v2-features="));
const minV2Features = minV2FeaturesArg ? Number(minV2FeaturesArg.split("=")[1]) : 0;
if (!Number.isInteger(minV2Features) || minV2Features < 0) {
  throw new Error("--min-v2-features must be a non-negative integer");
}
const knownFlagPrefixes = ["--require-v2-fields", "--min-v2-features="];
args
  .filter((arg) => arg.startsWith("--"))
  .forEach((arg) => {
    if (!knownFlagPrefixes.some((flag) => arg === flag || (flag.endsWith("=") && arg.startsWith(flag)))) {
      throw new Error(`Unknown option: ${arg}`);
    }
  });
const featuresPathArg = args.find((arg) => !arg.startsWith("--"));
const featuresPath = featuresPathArg
  ? path.resolve(featuresPathArg)
  : path.join(root, "data", "feature-lab", "features.json");
const sourcesPath = path.join(root, "data", "feature-lab", "sources", "changelog-items.json");
const releasesPath = path.join(root, "data", "releases.json");

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
const configExampleLanguages = new Set(["json", "bash", "markdown", "text"]);
const riskLevels = new Set(["low", "medium", "high"]);

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

function assertOptionalReleaseArray(value, label) {
  assertOptionalStringArray(value, label);
  if (value === undefined) return;
  value.forEach((item, index) => {
    if (!/^v?\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(item)) {
      fail(`${label}[${index}] must look like a release version, for example v2.1.143`);
    }
  });
}


function assertOptionalConfigExamples(value, label) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must be a non-empty array when present`);
  }
  value.forEach((example, index) => {
    const itemLabel = `${label}[${index}]`;
    if (!example || typeof example !== "object" || Array.isArray(example)) {
      fail(`${itemLabel} must be an object`);
    }
    assertNonEmptyString(example.label, `${itemLabel}.label`);
    if (example.file !== undefined) assertNonEmptyString(example.file, `${itemLabel}.file`);
    if (!configExampleLanguages.has(example.language)) {
      fail(`${itemLabel}.language must be one of: ${Array.from(configExampleLanguages).join(", ")}`);
    }
    assertNonEmptyString(example.code, `${itemLabel}.code`);
  });
}

function assertOptionalRisks(value, label) {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must be a non-empty array when present`);
  }
  value.forEach((risk, index) => {
    const itemLabel = `${label}[${index}]`;
    if (!risk || typeof risk !== "object" || Array.isArray(risk)) {
      fail(`${itemLabel} must be an object`);
    }
    if (!riskLevels.has(risk.level)) {
      fail(`${itemLabel}.level must be one of: ${Array.from(riskLevels).join(", ")}`);
    }
    assertNonEmptyString(risk.text, `${itemLabel}.text`);
    if (risk.mitigation !== undefined) assertNonEmptyString(risk.mitigation, `${itemLabel}.mitigation`);
  });
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
  assertOptionalReleaseArray(feature.relatedReleases, `${label}.relatedReleases`);
  assertOptionalStringArray(feature.useCases, `${label}.useCases`);
  assertOptionalStringArray(feature.setupSteps, `${label}.setupSteps`);
  assertOptionalConfigExamples(feature.configExamples, `${label}.configExamples`);
  assertOptionalRisks(feature.risks, `${label}.risks`);
  if (feature.relatedFeatureIds !== undefined) {
    assertStringArray(feature.relatedFeatureIds, `${label}.relatedFeatureIds`);
    const relatedIds = new Set();
    feature.relatedFeatureIds.forEach((featureId, relatedIndex) => {
      if (relatedIds.has(featureId)) {
        fail(`${label}.relatedFeatureIds[${relatedIndex}] is duplicated: ${featureId}`);
      }
      relatedIds.add(featureId);
    });
  }
  if (requireV2Fields) {
    assertStringArray(feature.useCases, `${label}.useCases`);
    assertStringArray(feature.setupSteps, `${label}.setupSteps`);
    assertOptionalConfigExamples(feature.configExamples, `${label}.configExamples`);
    if (feature.configExamples === undefined) fail(`${label}.configExamples must be present in --require-v2-fields mode`);
    assertOptionalRisks(feature.risks, `${label}.risks`);
    if (feature.risks === undefined) fail(`${label}.risks must be present in --require-v2-fields mode`);
  }

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

const releases = readJson(releasesPath);
if (!Array.isArray(releases)) {
  fail(`${releasesPath} must be an array`);
}
const releaseVersions = new Set();
releases.forEach((release, index) => {
  assertNonEmptyString(release?.version, `releases[${index}].version`);
  releaseVersions.add(release.version);
});

const ids = new Set();
features.forEach((feature, index) => validateFeature(feature, index, ids));
if (minV2Features > 0) {
  const v2Features = features.filter(
    (feature) =>
      Array.isArray(feature.useCases) &&
      feature.useCases.length > 0 &&
      Array.isArray(feature.setupSteps) &&
      feature.setupSteps.length > 0 &&
      Array.isArray(feature.configExamples) &&
      feature.configExamples.length > 0 &&
      Array.isArray(feature.risks) &&
      feature.risks.length > 0 &&
      Array.isArray(feature.relatedFeatureIds) &&
      feature.relatedFeatureIds.length > 0,
  );
  if (v2Features.length < minV2Features) {
    fail(`feature-lab catalog must include at least ${minV2Features} v2-enriched features, found ${v2Features.length}`);
  }
}
features.forEach((feature, index) => {
  feature.relatedFeatureIds?.forEach((featureId, relIndex) => {
    if (!ids.has(featureId)) {
      fail(`features[${index}].relatedFeatureIds[${relIndex}] references missing feature: ${featureId}`);
    }
    if (featureId === feature.id) {
      fail(`features[${index}].relatedFeatureIds[${relIndex}] must not reference itself: ${featureId}`);
    }
  });
  feature.relatedReleases?.forEach((version, relIndex) => {
    if (!releaseVersions.has(version)) {
      fail(`features[${index}].relatedReleases[${relIndex}] references missing release: ${version}`);
    }
  });
});

const sourceItems = readJson(sourcesPath);
if (!Array.isArray(sourceItems)) {
  fail(`${sourcesPath} must be an array`);
}
const sourceIds = new Set();
sourceItems.forEach((item, index) => {
  const label = `sources[${index}]`;
  if (!item || typeof item !== "object" || Array.isArray(item)) fail(`${label} must be an object`);
  assertNonEmptyString(item.id, `${label}.id`);
  if (sourceIds.has(item.id)) fail(`${label}.id is duplicated: ${item.id}`);
  sourceIds.add(item.id);
  assertNonEmptyString(item.name, `${label}.name`);
  if (!categories.has(item.category)) {
    fail(`${label}.category must be one of: ${Array.from(categories).join(", ")}`);
  }
  if (item.sourceUrl !== null && item.sourceUrl !== undefined) assertNonEmptyString(item.sourceUrl, `${label}.sourceUrl`);
  if (item.quote !== null && item.quote !== undefined) assertNonEmptyString(item.quote, `${label}.quote`);
  if (!item.sourceUrl && !item.quote) fail(`${label} must include sourceUrl or quote`);
  if (item.releaseVersion !== null && item.releaseVersion !== undefined) {
    assertOptionalReleaseArray([item.releaseVersion], `${label}.releaseVersion`);
  }
});
for (const id of ids) {
  if (!sourceIds.has(id)) fail(`sources/changelog-items.json is missing source item for feature id: ${id}`);
}

console.log(`✓ feature-lab catalog valid (${features.length} features)`);
