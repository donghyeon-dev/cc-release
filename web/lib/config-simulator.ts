import scenarios from "../../data/config-simulator/scenarios.json";

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

export const configSimulatorScenarios = scenarios as ConfigSimulatorScenario[];

export function getConfigSimulatorScenario(
  id: ConfigSimulatorScenarioId,
): ConfigSimulatorScenario | undefined {
  return configSimulatorScenarios.find((scenario) => scenario.id === id);
}
