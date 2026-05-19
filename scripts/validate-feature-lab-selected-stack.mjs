#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const componentPath = path.join(root, "web", "components", "feature-lab", "FeatureLabPlayground.tsx");
const component = fs.readFileSync(componentPath, "utf8");

const requiredSnippets = [
  "Selected stack",
  "FeatureComparisonMatrix",
  "SelectedFeatureStack",
  "selectedStackIds",
  "addToSelectedStack",
  "removeFromSelectedStack",
  "clearSelectedStack",
  "Safe automation starter",
  "MCP local workflow",
  "Model/context control",
  "Add to stack",
  "Stack limit",
  "Not documented yet",
  "Use source evidence for details",
  "const featurePageSize = 6",
  "paginatedFeatures",
  "Page {currentPage} / {totalPages}",
  "Previous page",
  "Next page",
  "h-[25rem] overflow-hidden",
  "min-h-0 flex-1 overflow-y-auto",
  "role=\"log\"",
  "tabIndex={0}",
  "terminalScrollRef.current.scrollTop",
  "aria-label=\"Claude Code terminal output\"",
];

const missing = requiredSnippets.filter((snippet) => !component.includes(snippet));

if (missing.length > 0) {
  console.error("Feature Lab selected-stack validator failed.");
  console.error("Missing required snippets:");
  for (const snippet of missing) console.error(`- ${snippet}`);
  process.exit(1);
}

const serializedStackPatterns = ["stack=", "selectedStack=", "stackIds", "selectedStackIds:"];
const urlHelperPath = path.join(root, "web", "lib", "feature-lab-url.ts");
const urlHelper = fs.existsSync(urlHelperPath) ? fs.readFileSync(urlHelperPath, "utf8") : "";
const serialized = serializedStackPatterns.filter((pattern) => urlHelper.includes(pattern));
if (serialized.length > 0) {
  console.error("Selected stack must remain local-only for Goal 2 MVP.");
  console.error(`Unexpected URL serialization markers: ${serialized.join(", ")}`);
  process.exit(1);
}

console.log("Feature Lab selected-stack checks passed.");
