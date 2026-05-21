#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const scenariosPath = path.join(root, "data", "config-simulator", "scenarios.json");
const featuresPath = path.join(root, "data", "feature-lab", "features.json");
const releasesPath = path.join(root, "data", "releases.json");
const capturesPath = path.join(root, "data", "feature-lab", "claude-code-captures.json");

const errors = [];

function addError(message) {
  errors.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(`${path.relative(root, filePath)}: ${error.message}`);
    return undefined;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertStringArray(value, label) {
  if (!Array.isArray(value)) {
    addError(`${label} must be an array`);
    return [];
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      addError(`${label}[${index}] must be a non-empty string`);
    }
  });
  return value;
}

function collectIds(records, fileLabel) {
  const ids = new Set();
  if (!Array.isArray(records)) {
    addError(`${fileLabel} must be an array`);
    return ids;
  }

  records.forEach((record, index) => {
    if (!isPlainObject(record)) {
      addError(`${fileLabel}[${index}] must be an object`);
      return;
    }
    if (typeof record.id !== "string" || record.id.trim() === "") {
      addError(`${fileLabel}[${index}].id must be a non-empty string`);
      return;
    }
    ids.add(record.id);
  });
  return ids;
}

function collectReleaseVersions(records) {
  const versions = new Set();
  if (!Array.isArray(records)) {
    addError("data/releases.json must be an array");
    return versions;
  }

  records.forEach((record, index) => {
    if (!isPlainObject(record)) {
      addError(`data/releases.json[${index}] must be an object`);
      return;
    }
    if (typeof record.version === "string" && record.version.trim() !== "") {
      versions.add(record.version);
    } else {
      addError(`data/releases.json[${index}].version must be a non-empty string`);
    }
  });
  return versions;
}

const scenarios = readJson(scenariosPath);
const features = readJson(featuresPath);
const releases = readJson(releasesPath);
const captures = readJson(capturesPath);

const featureIds = collectIds(features, "data/feature-lab/features.json");
const releaseVersions = collectReleaseVersions(releases);
const captureIds = collectIds(captures, "data/feature-lab/claude-code-captures.json");

if (!Array.isArray(scenarios)) {
  addError("data/config-simulator/scenarios.json must be an array");
} else {
  if (scenarios.length < 3) {
    addError("data/config-simulator/scenarios.json must contain at least three records");
  }

  const scenarioIds = new Set();
  scenarios.forEach((scenario, index) => {
    const label = `scenario[${index}]`;
    if (!isPlainObject(scenario)) {
      addError(`${label} must be an object`);
      return;
    }

    if (typeof scenario.id !== "string" || scenario.id.trim() === "") {
      addError(`${label}.id must be a non-empty string`);
    } else {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scenario.id)) {
        addError(`${label}.id must be kebab-case: ${scenario.id}`);
      }
      if (scenarioIds.has(scenario.id)) {
        addError(`${label}.id must be unique: ${scenario.id}`);
      }
      scenarioIds.add(scenario.id);
    }

    if (typeof scenario.settingsSnippet !== "string" || scenario.settingsSnippet.trim() === "") {
      addError(`${label}.settingsSnippet must be a non-empty JSON string`);
    } else {
      try {
        JSON.parse(scenario.settingsSnippet);
      } catch (error) {
        addError(`${label}.settingsSnippet must parse as JSON: ${error.message}`);
      }
    }

    assertStringArray(scenario.relatedFeatureIds, `${label}.relatedFeatureIds`).forEach((id) => {
      if (typeof id === "string" && id.trim() !== "" && !featureIds.has(id)) {
        addError(`${label}.relatedFeatureIds references missing feature: ${id}`);
      }
    });

    assertStringArray(scenario.relatedReleaseVersions, `${label}.relatedReleaseVersions`).forEach((version) => {
      if (typeof version === "string" && version.trim() !== "" && !releaseVersions.has(version)) {
        addError(`${label}.relatedReleaseVersions references missing release: ${version}`);
      }
    });

    if (!Array.isArray(scenario.risks) || scenario.risks.length === 0) {
      addError(`${label}.risks must contain at least one risk with a mitigation`);
    } else {
      scenario.risks.forEach((risk, riskIndex) => {
        const riskLabel = `${label}.risks[${riskIndex}]`;
        if (!isPlainObject(risk)) {
          addError(`${riskLabel} must be an object`);
          return;
        }
        if (typeof risk.text !== "string" || risk.text.trim() === "") {
          addError(`${riskLabel}.text must be a non-empty string`);
        }
        if (typeof risk.mitigation !== "string" || risk.mitigation.trim() === "") {
          addError(`${riskLabel}.mitigation must be a non-empty string`);
        }
      });
    }

    if (scenario.evidence !== undefined) {
      if (!isPlainObject(scenario.evidence)) {
        addError(`${label}.evidence must be an object when present`);
      } else if (scenario.evidence.captureId !== undefined) {
        if (typeof scenario.evidence.captureId !== "string" || scenario.evidence.captureId.trim() === "") {
          addError(`${label}.evidence.captureId must be a non-empty string when present`);
        } else if (!captureIds.has(scenario.evidence.captureId)) {
          addError(`${label}.evidence.captureId references missing capture: ${scenario.evidence.captureId}`);
        }
      }
    }
  });
}

if (errors.length > 0) {
  console.error(`Config simulator validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Config simulator validation passed: ${scenarios.length} scenarios checked.`);
