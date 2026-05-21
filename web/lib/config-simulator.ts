import * as fs from "node:fs/promises";
import * as path from "node:path";

export type ConfigSimulatorScenarioId =
  | "safe-automation-allowlist"
  | "team-permission-guardrails"
  | "mcp-local-boundary";

export interface ConfigSimulatorScenario {
  id: ConfigSimulatorScenarioId;
  title: string;
  summary: string;
  audience: string[];
  settingsFile: ".claude/settings.json" | ".claude/settings.local.json";
  settingsSnippet: string;
  before: {
    title: string;
    bullets: string[];
  };
  after: {
    title: string;
    bullets: string[];
  };
  risks: Array<{ text: string; mitigation: string }>;
  relatedFeatureIds: string[];
  relatedReleaseVersions: string[];
  evidence?: {
    kind: "captured" | "scenario" | "documented";
    captureId?: string;
    notes: string;
  };
}

const SCENARIOS_PATH = path.join(
  process.cwd(),
  "..",
  "data",
  "config-simulator",
  "scenarios.json",
);

export async function getConfigSimulatorScenarios(): Promise<ConfigSimulatorScenario[]> {
  const raw = await fs.readFile(SCENARIOS_PATH, "utf-8");
  return JSON.parse(raw) as ConfigSimulatorScenario[];
}

export async function getConfigSimulatorScenario(
  id: ConfigSimulatorScenarioId,
): Promise<ConfigSimulatorScenario | undefined> {
  const scenarios = await getConfigSimulatorScenarios();
  return scenarios.find((scenario) => scenario.id === id);
}
