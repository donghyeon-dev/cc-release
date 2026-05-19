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

export type FeatureDifficulty = "easy" | "medium" | "advanced";

export type FeatureImpactTag =
  | "speed"
  | "safety"
  | "automation"
  | "context"
  | "ux"
  | "quality"
  | "cost";

export type FeatureAudience =
  | "solo-dev"
  | "team"
  | "ci"
  | "mcp-user"
  | "power-user";

export type FeatureConfigExampleLanguage = "json" | "bash" | "markdown" | "text";

export type FeatureRiskLevel = "low" | "medium" | "high";

export interface FeatureConfigExample {
  label: string;
  file?: string;
  language: FeatureConfigExampleLanguage;
  code: string;
}

export interface FeatureRisk {
  level: FeatureRiskLevel;
  text: string;
  mitigation?: string;
}

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
  difficulty: FeatureDifficulty;
  impactTags: FeatureImpactTag[];
  audience: FeatureAudience[];
  useCases?: string[];
  setupSteps?: string[];
  configExamples?: FeatureConfigExample[];
  risks?: FeatureRisk[];
  relatedFeatureIds?: string[];
  relatedReleases?: string[];
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

export const featureDifficultyLabels: Record<FeatureDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  advanced: "Advanced",
};

export const featureImpactTagLabels: Record<FeatureImpactTag, string> = {
  speed: "Speed",
  safety: "Safety",
  automation: "Automation",
  context: "Context",
  ux: "UX",
  quality: "Quality",
  cost: "Cost",
};

export const featureAudienceLabels: Record<FeatureAudience, string> = {
  "solo-dev": "Solo dev",
  team: "Team",
  ci: "CI",
  "mcp-user": "MCP user",
  "power-user": "Power user",
};
