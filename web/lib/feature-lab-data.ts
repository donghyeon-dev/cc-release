import fs from "node:fs/promises";
import path from "node:path";
import type { ClaudeCodeFeature } from "./feature-lab";

const DATA_DIR = path.join(process.cwd(), "..", "data", "feature-lab");
const FEATURES_PATH = path.join(DATA_DIR, "features.json");

export async function getFeatureLabFeatures(): Promise<ClaudeCodeFeature[]> {
  const raw = await fs.readFile(FEATURES_PATH, "utf-8");
  return JSON.parse(raw) as ClaudeCodeFeature[];
}
