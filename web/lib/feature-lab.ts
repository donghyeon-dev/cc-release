export type ClaudeCodeFeatureCategory =
  | "env"
  | "settings"
  | "slash-command"
  | "permission"
  | "mcp"
  | "hooks"
  | "plugin"
  | "model"
  | "tui";

export type ActivationKind = "env" | "settings" | "command" | "config-file";

export type TuiFrameKind =
  | "type"
  | "line"
  | "spinner"
  | "permission-prompt"
  | "menu"
  | "diff"
  | "status-change"
  | "toast";

export interface TuiFrame {
  id: string;
  kind: TuiFrameKind;
  at: string;
  title?: string;
  content: string;
  tone?: "neutral" | "good" | "warn" | "info";
}

export interface TuiScene {
  title: string;
  statusBefore: string;
  statusAfter: string;
  frames: TuiFrame[];
}

export interface ClaudeCodeFeature {
  id: string;
  name: string;
  shortName: string;
  category: ClaudeCodeFeatureCategory;
  introducedIn?: string;
  description: string;
  activation: {
    type: ActivationKind;
    file?: string;
    label: string;
    snippet: string;
  };
  beforeExperience: TuiScene;
  afterExperience: TuiScene;
  impact: {
    summary: string;
    goodFor: string[];
    watchOut: string[];
  };
  source?: {
    releaseVersion?: string;
    quote?: string;
    url?: string;
  };
}

export const featureCategoryLabels: Record<ClaudeCodeFeatureCategory, string> = {
  env: "Env",
  settings: "Settings",
  "slash-command": "Slash command",
  permission: "Permission",
  mcp: "MCP",
  hooks: "Hooks",
  plugin: "Plugin",
  model: "Model",
  tui: "TUI",
};
