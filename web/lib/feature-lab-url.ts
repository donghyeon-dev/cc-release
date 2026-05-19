import type {
  ClaudeCodeFeature,
  ClaudeCodeFeatureCategory,
  FeatureAudience,
  FeatureDifficulty,
  FeatureImpactTag,
} from "./feature-lab";

export const FEATURE_LAB_PATH = "/feature-lab/";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const FEATURE_LAB_PARAMS = ["feature", "q", "category", "difficulty", "impact", "audience"] as const;
export type FeatureLabParam = (typeof FEATURE_LAB_PARAMS)[number];

const CATEGORY_VALUES = new Set<ClaudeCodeFeatureCategory>([
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

const DIFFICULTY_VALUES = new Set<FeatureDifficulty>(["easy", "medium", "advanced"]);

const IMPACT_VALUES = new Set<FeatureImpactTag>([
  "speed",
  "safety",
  "automation",
  "context",
  "ux",
  "quality",
  "cost",
]);

const AUDIENCE_VALUES = new Set<FeatureAudience>(["solo-dev", "team", "ci", "mcp-user", "power-user"]);

export interface FeatureLabFilterState {
  featureId: string | null;
  query: string;
  category: ClaudeCodeFeatureCategory | "all";
  difficulty: FeatureDifficulty | "all";
  impact: FeatureImpactTag | "all";
  audience: FeatureAudience | "all";
}

export const DEFAULT_FILTER_STATE: FeatureLabFilterState = {
  featureId: null,
  query: "",
  category: "all",
  difficulty: "all",
  impact: "all",
  audience: "all",
};

function pickString(params: URLSearchParams, key: FeatureLabParam): string | null {
  const raw = params.get(key);
  if (raw === null) return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function parseFeatureLabParams(search: string | URLSearchParams): FeatureLabFilterState {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const featureId = pickString(params, "feature");
  const query = pickString(params, "q") ?? "";
  const rawCategory = pickString(params, "category");
  const rawDifficulty = pickString(params, "difficulty");
  const rawImpact = pickString(params, "impact");
  const rawAudience = pickString(params, "audience");

  return {
    featureId,
    query,
    category:
      rawCategory && CATEGORY_VALUES.has(rawCategory as ClaudeCodeFeatureCategory)
        ? (rawCategory as ClaudeCodeFeatureCategory)
        : "all",
    difficulty:
      rawDifficulty && DIFFICULTY_VALUES.has(rawDifficulty as FeatureDifficulty)
        ? (rawDifficulty as FeatureDifficulty)
        : "all",
    impact:
      rawImpact && IMPACT_VALUES.has(rawImpact as FeatureImpactTag)
        ? (rawImpact as FeatureImpactTag)
        : "all",
    audience:
      rawAudience && AUDIENCE_VALUES.has(rawAudience as FeatureAudience)
        ? (rawAudience as FeatureAudience)
        : "all",
  };
}

/**
 * Apply state into an existing URLSearchParams, removing keys whose value is
 * default/empty so they don't pollute the visible query string. Unrelated
 * params on the URL are left untouched.
 */
export function applyFilterParams(
  params: URLSearchParams,
  state: FeatureLabFilterState,
): URLSearchParams {
  const next = new URLSearchParams(params);

  const setOrDelete = (key: FeatureLabParam, value: string | null) => {
    if (value === null || value === "" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  };

  setOrDelete("feature", state.featureId);
  setOrDelete("q", state.query.trim());
  setOrDelete("category", state.category);
  setOrDelete("difficulty", state.difficulty);
  setOrDelete("impact", state.impact);
  setOrDelete("audience", state.audience);

  return next;
}

/**
 * Build the search string ("?..." or "") that represents the given state when
 * merged on top of existing params.
 */
export function buildFeatureLabSearch(
  existing: string | URLSearchParams,
  state: FeatureLabFilterState,
): string {
  const base = typeof existing === "string" ? new URLSearchParams(existing) : existing;
  const next = applyFilterParams(base, state);
  const serialized = next.toString();
  return serialized.length === 0 ? "" : `?${serialized}`;
}

/**
 * Build an internal href for the feature-lab page targeting a specific
 * feature. Wraps with the configured basePath so the link is safe across
 * preview/production deploys.
 */
export function buildFeatureLabHref(
  feature: Pick<ClaudeCodeFeature, "id">,
  extra: Partial<Omit<FeatureLabFilterState, "featureId">> = {},
): string {
  const search = buildFeatureLabSearch("", {
    ...DEFAULT_FILTER_STATE,
    ...extra,
    featureId: feature.id,
  });
  return `${BASE_PATH}${FEATURE_LAB_PATH}${search}`;
}
