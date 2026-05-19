"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  featureAudienceLabels,
  featureCategoryLabels,
  featureDifficultyLabels,
  featureImpactTagLabels,
  type ClaudeCodeFeature,
  type FeatureAudience,
  type FeatureDifficulty,
  type FeatureImpactTag,
  type TuiFrame,
} from "@/lib/feature-lab";
import {
  applyFilterParams,
  buildFeatureLabSearch,
  parseFeatureLabParams,
  type FeatureLabFilterState,
} from "@/lib/feature-lab-url";
import { formatFeatureSourceEvidence } from "@/lib/feature-lab-source";
import { withBasePath } from "@/lib/assets";
import type { Release } from "@/lib/types";

const categoryTone: Record<ClaudeCodeFeature["category"], string> = {
  env: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:ring-cyan-900",
  settings:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-200 dark:ring-violet-900",
  "slash-command":
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-900",
  permission:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
  mcp: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
  hooks:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-900",
  plugin:
    "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
  model:
    "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-200 dark:ring-fuchsia-900",
  tui: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
};

const frameTone: Record<NonNullable<TuiFrame["tone"]>, string> = {
  neutral: "text-zinc-200",
  info: "text-sky-200",
  good: "text-emerald-200",
  warn: "text-amber-200",
};

const configLanguageLabels = {
  json: "JSON",
  bash: "Shell",
  markdown: "Markdown",
  text: "Text",
} as const;

const riskTone = {
  low: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/20 dark:text-sky-100",
  medium:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-amber-100",
  high: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/20 dark:text-rose-100",
} as const;

const selectedStackLimit = 3;

const starterStacks = [
  {
    label: "Safe automation starter",
    description: "Permissions, allowed tool patterns, and hooks for safer team automation.",
    ids: ["permission-allowlist", "allowed-tools-patterns", "hooks-notifications"],
  },
  {
    label: "MCP local workflow",
    description: "Local MCP plus permission boundaries for connected workflows.",
    ids: ["local-mcp-server", "permission-allowlist", "allowed-tools-patterns"],
  },
  {
    label: "Model/context control",
    description: "Model choice with safety rails and notification hooks for power users.",
    ids: ["model-picker", "permission-allowlist", "hooks-notifications"],
  },
] as const;

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function CategoryPill({ category }: { category: ClaudeCodeFeature["category"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ${categoryTone[category]}`}
    >
      {featureCategoryLabels[category]}
    </span>
  );
}

function MetadataPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </span>
  );
}

function CopyActionButton({
  copied,
  idleLabel,
  copiedLabel = "Copied",
  onClick,
  tone = "zinc",
}: {
  copied: boolean;
  idleLabel: string;
  copiedLabel?: string;
  onClick: () => void;
  tone?: "zinc" | "cyan";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-800 bg-cyan-950/40 text-cyan-100 hover:border-cyan-500 hover:bg-cyan-900/60"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-indigo-500 dark:hover:text-indigo-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${toneClass}`}
      aria-live="polite"
    >
      {copied ? `✓ ${copiedLabel}` : idleLabel}
    </button>
  );
}

function FeatureCatalog({
  features,
  allFeatures,
  selectedFeature,
  selectedStackIds,
  stackLimitMessage,
  query,
  activeCategory,
  activeDifficulty,
  activeImpactTag,
  activeAudience,
  onQueryChange,
  onCategoryChange,
  onDifficultyChange,
  onImpactTagChange,
  onAudienceChange,
  onSelect,
  onToggleStack,
  onReset,
}: {
  features: ClaudeCodeFeature[];
  allFeatures: ClaudeCodeFeature[];
  selectedFeature: ClaudeCodeFeature;
  selectedStackIds: string[];
  stackLimitMessage: string;
  query: string;
  activeCategory: ClaudeCodeFeature["category"] | "all";
  activeDifficulty: FeatureDifficulty | "all";
  activeImpactTag: FeatureImpactTag | "all";
  activeAudience: FeatureAudience | "all";
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: ClaudeCodeFeature["category"] | "all") => void;
  onDifficultyChange: (difficulty: FeatureDifficulty | "all") => void;
  onImpactTagChange: (tag: FeatureImpactTag | "all") => void;
  onAudienceChange: (audience: FeatureAudience | "all") => void;
  onSelect: (feature: ClaudeCodeFeature) => void;
  onToggleStack: (feature: ClaudeCodeFeature) => void;
  onReset: () => void;
}) {
  const categories = useMemo(
    () => Array.from(new Set(allFeatures.map((feature) => feature.category))),
    [allFeatures],
  );
  const difficulties = useMemo(
    () => Array.from(new Set(allFeatures.map((feature) => feature.difficulty))),
    [allFeatures],
  );
  const impactTags = useMemo(
    () => Array.from(new Set(allFeatures.flatMap((feature) => feature.impactTags))),
    [allFeatures],
  );
  const audiences = useMemo(
    () => Array.from(new Set(allFeatures.flatMap((feature) => feature.audience))),
    [allFeatures],
  );

  return (
    <aside className="rounded-[1.75rem] border border-zinc-200 bg-white/85 p-4 shadow-xl shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-black/30 lg:sticky lg:top-6">
      <div className="rounded-3xl bg-zinc-950 p-4 text-white dark:bg-black">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
          Feature catalog
        </p>
        <h2 className="mt-3 text-xl font-black tracking-tight">
          설정을 켜면 무엇이 바뀌나요?
        </h2>
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          검색, category, impact, audience 기준으로 기능을 좁히고 feature별 URL로 바로 공유합니다.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="sr-only">Search features</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search feature, use case, snippet…"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500"
          />
        </label>

        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ${
                activeCategory === "all"
                  ? "bg-zinc-950 text-white ring-zinc-950 dark:bg-white dark:text-zinc-950 dark:ring-white"
                  : "bg-zinc-50 text-zinc-600 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => onCategoryChange(category)}>
                <CategoryPill category={category} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Difficulty
            </span>
            <select
              value={activeDifficulty}
              onChange={(event) => onDifficultyChange(event.target.value as FeatureDifficulty | "all")}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">All</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {featureDifficultyLabels[difficulty]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Impact
            </span>
            <select
              value={activeImpactTag}
              onChange={(event) => onImpactTagChange(event.target.value as FeatureImpactTag | "all")}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">All</option>
              {impactTags.map((tag) => (
                <option key={tag} value={tag}>
                  {featureImpactTagLabels[tag]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Audience
          </span>
          <select
            value={activeAudience}
            onChange={(event) => onAudienceChange(event.target.value as FeatureAudience | "all")}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">All</option>
            {audiences.map((audience) => (
              <option key={audience} value={audience}>
                {featureAudienceLabels[audience]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onReset}
          className="text-xs font-black text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span>{features.length} matching features</span>
        <span>{allFeatures.length} total</span>
      </div>
      {stackLimitMessage && (
        <p className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          Stack limit: {stackLimitMessage}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {features.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            조건에 맞는 기능이 없습니다. 검색어를 줄이거나 필터를 초기화하세요.
          </div>
        )}
        {features.map((feature) => {
          const selected = feature.id === selectedFeature.id;
          const inStack = selectedStackIds.includes(feature.id);
          return (
            <div
              key={feature.id}
              onClick={() => onSelect(feature)}
              className={`w-full cursor-pointer rounded-2xl border p-3 text-left transition ${
                selected
                  ? "border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-200/70 dark:border-indigo-500 dark:bg-indigo-950/35 dark:shadow-none"
                  : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-black text-zinc-950 dark:text-zinc-100">
                    {feature.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {feature.shortName}
                  </p>
                </div>
                <span className="text-lg" aria-hidden>
                  {selected ? "●" : "○"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <MetadataPill>{featureDifficultyLabels[feature.difficulty]}</MetadataPill>
                {feature.impactTags.slice(0, 2).map((tag) => (
                  <MetadataPill key={tag}>{featureImpactTagLabels[tag]}</MetadataPill>
                ))}
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                {feature.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(feature);
                  }}
                  className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-700 transition hover:border-indigo-400 dark:border-indigo-900 dark:bg-zinc-950 dark:text-indigo-200"
                >
                  Open details
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleStack(feature);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                    inStack
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:text-indigo-200"
                  }`}
                >
                  {inStack ? "In stack · remove" : "Add to stack"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}


function ConfigExampleCard({
  example,
}: {
  example: NonNullable<ClaudeCodeFeature["configExamples"]>[number];
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyTextToClipboard(example.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black tracking-tight text-zinc-950 dark:text-zinc-50">{example.label}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              {configLanguageLabels[example.language]}
            </span>
            {example.file && (
              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                {example.file}
              </span>
            )}
          </div>
        </div>
        <CopyActionButton
          copied={copied}
          idleLabel="Copy example"
          copiedLabel="Example copied"
          onClick={handleCopy}
        />
      </div>
      <pre className="max-h-80 overflow-auto bg-[#0b1020] p-4 font-mono text-[12px] leading-6 text-cyan-100">
        {example.code}
      </pre>
    </div>
  );
}

function FeatureGuidancePanel({ feature }: { feature: ClaudeCodeFeature }) {
  const hasUseCases = Boolean(feature.useCases?.length);
  const hasSetupSteps = Boolean(feature.setupSteps?.length);
  const hasExamples = Boolean(feature.configExamples?.length);
  const hasRisks = Boolean(feature.risks?.length);
  if (!hasUseCases && !hasSetupSteps && !hasExamples && !hasRisks) return null;

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-zinc-200 bg-white/90 p-5 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-black/20">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-600 dark:text-fuchsia-300">
          Feature playbook
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
          언제 쓰고, 어떻게 안전하게 켜나요?
        </h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {hasUseCases && (
          <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/70 p-4 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/20">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300">
              Use cases
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-fuchsia-950 dark:text-fuchsia-100">
              {feature.useCases?.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasSetupSteps && (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              Setup path
            </p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-cyan-950 dark:text-cyan-100">
              {feature.setupSteps?.map((item, index) => (
                <li key={item} className="flex gap-2">
                  <span className="font-mono text-xs font-black text-cyan-700 dark:text-cyan-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {hasExamples && (
        <div className="grid gap-4 xl:grid-cols-2">
          {feature.configExamples?.map((example) => <ConfigExampleCard key={`${example.label}-${example.file ?? "inline"}`} example={example} />)}
        </div>
      )}

      {hasRisks && (
        <div className="grid gap-3 md:grid-cols-2">
          {feature.risks?.map((risk) => (
            <div key={`${risk.level}-${risk.text}`} className={`rounded-2xl border p-4 ${riskTone[risk.level]}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">
                {risk.level} risk
              </p>
              <p className="mt-2 text-sm font-semibold leading-6">{risk.text}</p>
              {risk.mitigation && <p className="mt-2 text-xs leading-5 opacity-80">Mitigation: {risk.mitigation}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RelatedFeaturesPanel({
  relatedFeatures,
  selectedStackIds,
  onSelect,
  onAddToStack,
}: {
  relatedFeatures: ClaudeCodeFeature[];
  selectedStackIds: string[];
  onSelect: (feature: ClaudeCodeFeature) => void;
  onAddToStack: (feature: ClaudeCodeFeature) => void;
}) {
  if (relatedFeatures.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-violet-200 bg-violet-50/70 p-5 dark:border-violet-900/70 dark:bg-violet-950/25">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
        Related features
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-violet-950 dark:text-violet-50">
        같이 보면 좋은 설정과 명령
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {relatedFeatures.map((feature) => {
          const inStack = selectedStackIds.includes(feature.id);
          return (
          <div
            key={feature.id}
            className="rounded-2xl border border-violet-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md hover:shadow-violet-100 dark:border-violet-900/80 dark:bg-zinc-950 dark:hover:border-violet-600 dark:hover:shadow-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-black text-violet-700 dark:text-violet-200">
                {feature.name}
              </span>
              <button
                type="button"
                onClick={() => onSelect(feature)}
                className="text-xs font-black text-violet-500 underline-offset-4 hover:underline dark:text-violet-300"
              >
                열기 →
              </button>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {feature.description}
            </p>
            <button
              type="button"
              onClick={() => onAddToStack(feature)}
              className={`mt-3 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                inStack
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-rose-300 hover:text-rose-600 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200"
                  : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
              }`}
            >
              {inStack ? "In stack · remove" : "Add to stack"}
            </button>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function getPrimaryRisk(feature: ClaudeCodeFeature) {
  const risk = feature.risks?.[0];
  if (!risk) return "Not documented yet";
  return risk.mitigation ? `${risk.text} Mitigation: ${risk.mitigation}` : risk.text;
}

function sourceEvidenceLink(feature: ClaudeCodeFeature) {
  const evidence = formatFeatureSourceEvidence(feature);
  const href = evidence.href?.startsWith("/") ? withBasePath(evidence.href) : evidence.href;
  return { ...evidence, href };
}

function SelectedFeatureStack({
  selectedStackFeatures,
  allFeatures,
  stackLimitMessage,
  onUseStarterStack,
  onRemove,
  onClear,
  onSelect,
}: {
  selectedStackFeatures: ClaudeCodeFeature[];
  allFeatures: ClaudeCodeFeature[];
  stackLimitMessage: string;
  onUseStarterStack: (ids: readonly string[]) => void;
  onRemove: (featureId: string) => void;
  onClear: () => void;
  onSelect: (feature: ClaudeCodeFeature) => void;
}) {
  return (
    <section className="space-y-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50/60 p-5 shadow-xl shadow-emerald-100/60 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
            Selected stack
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-emerald-950 dark:text-emerald-50">
            내 워크플로우에 맞는 기능 조합 만들기
          </h3>
          <p className="mt-2 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/80">
            최대 {selectedStackLimit}개까지 담아 “왜 같이 쓰는지”, “켜면 무엇이 바뀌는지”, “무엇을 조심할지”를 비교합니다.
          </p>
        </div>
        {selectedStackFeatures.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-700 transition hover:border-emerald-500 dark:border-emerald-900 dark:bg-zinc-950 dark:text-emerald-200"
          >
            Clear stack
          </button>
        )}
      </div>

      {stackLimitMessage && (
        <p role="status" aria-live="polite" className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          Stack limit: {stackLimitMessage}
        </p>
      )}

      {selectedStackFeatures.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {starterStacks.map((stack) => {
            const available = stack.ids.every((id) => allFeatures.some((feature) => feature.id === id));
            return (
              <button
                key={stack.label}
                type="button"
                disabled={!available}
                onClick={() => onUseStarterStack(stack.ids)}
                className="rounded-2xl border border-emerald-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/80 dark:bg-zinc-950 dark:hover:border-emerald-600 dark:hover:shadow-none"
              >
                <p className="font-black text-emerald-950 dark:text-emerald-50">{stack.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{stack.description}</p>
                <p className="mt-3 font-mono text-[11px] leading-5 text-emerald-700 dark:text-emerald-200">
                  {stack.ids.join(" + ")}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {selectedStackFeatures.map((feature) => (
            <div key={feature.id} className="rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/80 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-black text-emerald-800 dark:text-emerald-200">{feature.name}</p>
                  <p className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{feature.shortName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(feature.id)}
                  className="rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-black text-zinc-500 hover:border-rose-300 hover:text-rose-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <CategoryPill category={feature.category} />
                <MetadataPill>{featureDifficultyLabels[feature.difficulty]}</MetadataPill>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                {feature.impact.goodFor[0] ?? "Not documented yet"}
              </p>
              <button
                type="button"
                onClick={() => onSelect(feature)}
                className="mt-3 text-xs font-black text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-200"
              >
                Open details →
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeatureComparisonMatrix({ features }: { features: ClaudeCodeFeature[] }) {
  if (features.length < 2) return null;

  const rows = [
    {
      label: "Audience",
      render: (feature: ClaudeCodeFeature) => feature.audience.map((audience) => featureAudienceLabels[audience]).join(", "),
    },
    {
      label: "Difficulty",
      render: (feature: ClaudeCodeFeature) => featureDifficultyLabels[feature.difficulty],
    },
    {
      label: "Activation",
      render: (feature: ClaudeCodeFeature) => `${feature.activation.label}${feature.activation.file ? ` · ${feature.activation.file}` : ""}`,
    },
    {
      label: "Good for",
      render: (feature: ClaudeCodeFeature) => feature.impact.goodFor[0] ?? "Not documented yet",
    },
    {
      label: "Watch out",
      render: (feature: ClaudeCodeFeature) => feature.impact.watchOut[0] ?? "Not documented yet",
    },
    {
      label: "Strongest use case",
      render: (feature: ClaudeCodeFeature) => feature.useCases?.[0] ?? "Not documented yet",
    },
    {
      label: "Risk / mitigation",
      render: getPrimaryRisk,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-cyan-200 bg-cyan-50/60 shadow-xl shadow-cyan-100/60 dark:border-cyan-900/70 dark:bg-cyan-950/20 dark:shadow-black/20">
      <div className="border-b border-cyan-200 bg-white/75 p-5 dark:border-cyan-900/70 dark:bg-zinc-950/70">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
          Compare selected features
        </p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-cyan-950 dark:text-cyan-50">
          선택한 기능들의 역할과 리스크 비교
        </h3>
        <p className="mt-2 text-sm leading-6 text-cyan-900/80 dark:text-cyan-100/80">
          설정 조합을 만들기 전에 activation, 좋은 사용처, watch-out, source evidence를 한 번에 확인합니다.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-cyan-200 dark:border-cyan-900/70">
              <th className="w-40 bg-cyan-100/70 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                Field
              </th>
              {features.map((feature) => (
                <th key={feature.id} className="min-w-56 px-4 py-3 align-top">
                  <div className="font-mono text-sm font-black text-cyan-950 dark:text-cyan-50">{feature.name}</div>
                  <div className="mt-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">{feature.shortName}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-cyan-100 dark:border-cyan-900/50">
              <th className="bg-cyan-100/50 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">
                Category
              </th>
              {features.map((feature) => (
                <td key={feature.id} className="px-4 py-3 align-top"><CategoryPill category={feature.category} /></td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-cyan-100 last:border-b-0 dark:border-cyan-900/50">
                <th className="bg-cyan-100/50 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">
                  {row.label}
                </th>
                {features.map((feature) => (
                  <td key={feature.id} className="px-4 py-3 align-top leading-6 text-zinc-700 dark:text-zinc-200">
                    {row.render(feature)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="bg-cyan-100/50 px-4 py-3 text-xs font-black uppercase tracking-wider text-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-200">
                Source
              </th>
              {features.map((feature) => {
                const evidence = sourceEvidenceLink(feature);
                const isExternal = Boolean(evidence.href?.startsWith("http"));
                return (
                  <td key={feature.id} className="px-4 py-3 align-top text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                    {evidence.href && evidence.linkLabel ? (
                      <a
                        href={evidence.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="font-black text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-200"
                      >
                        {evidence.linkLabel} →
                      </a>
                    ) : (
                      "Use source evidence for details"
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ActivationEditor({ feature }: { feature: ClaudeCodeFeature }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyTextToClipboard(feature.activation.snippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20">
      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Activation snippet
          </p>
          <h3 className="mt-1 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {feature.activation.label}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {feature.activation.file && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {feature.activation.file}
            </span>
          )}
          <CopyActionButton
            copied={copied}
            idleLabel="Copy snippet"
            copiedLabel="Snippet copied"
            onClick={handleCopy}
          />
        </div>
      </div>
      <pre className="max-h-[24rem] overflow-auto bg-[#0b1020] p-5 font-mono text-[12px] leading-6 text-cyan-100 sm:text-[13px]">
        {feature.activation.snippet}
      </pre>
    </section>
  );
}

interface TerminalStep {
  id: string;
  frame: TuiFrame;
  content: string;
  lineIndex: number;
}

function sceneToTerminalSteps(scene: ClaudeCodeFeature["afterExperience"]): TerminalStep[] {
  return scene.frames.flatMap((frame) =>
    frame.content.split("\n").map((content, lineIndex) => ({
      id: `${frame.id}-${lineIndex}`,
      frame,
      content,
      lineIndex,
    })),
  );
}

function TerminalStreamEntry({
  step,
  isActiveCommand,
  typedChars,
}: {
  step: TerminalStep;
  isActiveCommand: boolean;
  typedChars: number;
}) {
  const { frame, content, lineIndex } = step;
  const tone = frameTone[frame.tone ?? "neutral"];

  if (frame.kind === "type") {
    const command = content.replace(/^>\s?/, "");
    const visibleCommand = isActiveCommand ? command.slice(0, typedChars) : command;

    return (
      <div className="flex min-h-6 items-baseline gap-2 text-zinc-100">
        <span className="select-none text-zinc-500">&gt;</span>
        <span className="whitespace-pre-wrap break-words">{visibleCommand}</span>
        {isActiveCommand && <span className="feature-lab-cursor inline-block h-4 w-2 translate-y-0.5 bg-zinc-200" />}
      </div>
    );
  }

  if (frame.kind === "permission-prompt") {
    return (
      <div className="min-h-6 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-amber-100">
        {frame.title && lineIndex === 0 && <div className="mb-1 font-semibold text-amber-200">{frame.title}</div>}
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    );
  }

  if (frame.kind === "diff") {
    return (
      <div className="min-h-6 text-emerald-200">
        {frame.title && lineIndex === 0 && <div className="mb-1 text-zinc-500">{frame.title}</div>}
        <div className="whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-6 ${tone}`}>
      {frame.title && lineIndex === 0 && <div className="mb-1 text-zinc-500">{frame.title}</div>}
      <div className="whitespace-pre-wrap break-words">
        {frame.kind === "spinner" && lineIndex === 0 ? `⏺ ${content}` : content}
      </div>
    </div>
  );
}

function AnimatedTuiScene({
  label,
  scene,
  variant,
}: {
  label: string;
  scene: ClaudeCodeFeature["afterExperience"];
  variant: "before" | "after";
}) {
  const steps = useMemo(() => sceneToTerminalSteps(scene), [scene]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        timers.push(timer);
      });

    const typeCommand = async (stepIndex: number, command: string) => {
      setActiveCommandIndex(stepIndex);
      setTypedChars(0);

      for (let charIndex = 1; charIndex <= command.length; charIndex += 1) {
        if (cancelled) return;
        await wait(charIndex === 1 ? 120 : 26 + (charIndex % 5 === 0 ? 32 : 0));
        if (!cancelled) setTypedChars(charIndex);
      }

      if (!cancelled) {
        setActiveCommandIndex(null);
        setTypedChars(command.length);
      }
    };

    const runReplay = async () => {
      while (!cancelled) {
        setVisibleCount(0);
        setActiveCommandIndex(null);
        setTypedChars(0);
        await wait(320);

        for (let index = 0; index < steps.length; index += 1) {
          if (cancelled) return;
          const step = steps[index];
          setVisibleCount(index + 1);

          if (step.frame.kind === "type") {
            await typeCommand(index, step.content.replace(/^>\s?/, ""));
            await wait(240);
          } else {
            await wait(step.lineIndex === 0 ? 620 : 260);
          }
        }

        await wait(1800);
      }
    };

    runReplay();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [steps]);

  const visibleSteps = steps.slice(0, visibleCount);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#101010] text-zinc-100 shadow-2xl shadow-black/35">
      <div className="border-b border-zinc-800 bg-[#181818] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Claude Code · {label}
            </p>
            <h3 className="mt-1 font-mono text-sm font-semibold tracking-tight text-zinc-50">
              ✻ {scene.title}
            </h3>
          </div>
          <span className="hidden rounded-md border border-zinc-700 px-2 py-1 font-mono text-[11px] text-zinc-400 sm:inline-flex">
            esc to interrupt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500">
          <span className="rounded-md border border-zinc-800 bg-[#101010] px-2 py-1">
            {scene.statusBefore}
          </span>
          {variant === "after" && (
            <>
              <span>→</span>
              <span className="rounded-md border border-emerald-800/70 bg-emerald-950/30 px-2 py-1 text-emerald-200">
                {scene.statusAfter}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="min-h-[24rem] bg-[#0c0c0c] p-4">
        <div className="min-h-[21rem] rounded-xl border border-zinc-800 bg-[#060606] p-4 font-mono text-[12px] leading-6 shadow-inner shadow-black sm:text-[13px]">
          <div className="mb-4 space-y-1 border-b border-zinc-900 pb-3 text-zinc-500">
            <div>✻ Welcome to Claude Code</div>
            <div>/cwd ~/cc-release · model sonnet · ? for shortcuts</div>
          </div>
          <div className="space-y-2">
            {visibleSteps.map((step, index) => (
              <TerminalStreamEntry
                key={`${scene.title}-${step.id}`}
                step={step}
                isActiveCommand={activeCommandIndex === index}
                typedChars={activeCommandIndex === index ? typedChars : step.content.length}
              />
            ))}
            <div className="flex min-h-6 items-baseline gap-2 text-zinc-100">
              <span className="select-none text-zinc-500">&gt;</span>
              {activeCommandIndex === null && (
                <span className="feature-lab-cursor inline-block h-4 w-2 translate-y-0.5 bg-zinc-200" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedReleasesPanel({
  feature,
  releases,
}: {
  feature: ClaudeCodeFeature;
  releases: Release[];
}) {
  const related = releases.filter((release) => feature.relatedReleases?.includes(release.version));
  if (related.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/70 dark:bg-indigo-950/25">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
            Related releases
          </p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-indigo-950 dark:text-indigo-50">
            이 기능이 등장하거나 함께 바뀐 릴리즈
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-black text-indigo-700 dark:border-indigo-900 dark:bg-zinc-950 dark:text-indigo-200">
          {related.length} releases
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {related.map((release) => (
          <a
            key={release.version}
            href={withBasePath(`/#release-${release.version}`)}
            className="rounded-2xl border border-indigo-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-100 dark:border-indigo-900/80 dark:bg-zinc-950 dark:hover:border-indigo-600 dark:hover:shadow-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-black text-indigo-700 dark:text-indigo-200">
                {release.version}
              </span>
              <span className="text-xs font-black text-indigo-500 dark:text-indigo-300">메인에서 보기 →</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {release.summary.headline}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function SourceEvidencePanel({ feature }: { feature: ClaudeCodeFeature }) {
  const evidence = formatFeatureSourceEvidence(feature);
  if (!evidence.hasEvidence) return null;

  const href = evidence.href?.startsWith("/") ? withBasePath(evidence.href) : evidence.href;
  const isExternal = Boolean(href?.startsWith("http"));

  return (
    <section className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-900/70 dark:bg-sky-950/25">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
            Source evidence
          </p>
          <h3 className="mt-2 text-lg font-black tracking-tight text-sky-950 dark:text-sky-50">
            어디에서 나온 기능인지 바로 확인
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black text-sky-700 dark:border-sky-900 dark:bg-zinc-950 dark:text-sky-200">
              {evidence.hostLabel}
            </span>
            {evidence.releaseLabel && (
              <span className="rounded-full border border-sky-200 bg-white px-3 py-1 font-mono text-xs font-black text-sky-700 dark:border-sky-900 dark:bg-zinc-950 dark:text-sky-200">
                {evidence.releaseLabel}
              </span>
            )}
          </div>
        </div>
        {href && evidence.linkLabel && (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
            className="inline-flex shrink-0 rounded-full border border-sky-300 bg-white px-4 py-2 text-xs font-black text-sky-700 transition hover:border-sky-500 hover:text-sky-900 dark:border-sky-900 dark:bg-zinc-950 dark:text-sky-200 dark:hover:border-sky-500 dark:hover:text-sky-100"
          >
            {evidence.linkLabel} →
          </a>
        )}
      </div>
      {evidence.quote && (
        <blockquote className="mt-4 rounded-2xl border-l-4 border-sky-400 bg-white/80 px-4 py-3 text-sm leading-6 text-sky-950 dark:bg-zinc-950/70 dark:text-sky-100">
          “{evidence.quote}”
        </blockquote>
      )}
      <p className="mt-3 text-xs leading-5 text-sky-800/80 dark:text-sky-200/80">
        Feature Lab의 설명·스니펫·TUI 예시는 이 evidence를 기준으로 큐레이션됩니다.
      </p>
    </section>
  );
}

function ImpactPanel({ feature }: { feature: ClaudeCodeFeature }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
          Experience impact
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          {feature.impact.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {feature.impactTags.map((tag) => (
            <MetadataPill key={tag}>{featureImpactTagLabels[tag]}</MetadataPill>
          ))}
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900/70 dark:bg-emerald-950/20">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
          Good for
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-emerald-950 dark:text-emerald-100">
          {feature.impact.goodFor.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/70 dark:bg-amber-950/20">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
          Watch out
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950 dark:text-amber-100">
          {feature.impact.watchOut.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden>!</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function syncFilterParamsToUrl(state: FeatureLabFilterState) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const next = applyFilterParams(url.searchParams, state);
  const serialized = next.toString();
  const nextSearch = serialized.length === 0 ? "" : `?${serialized}`;
  if (nextSearch === url.search) return;
  url.search = nextSearch;
  window.history.replaceState(null, "", url);
}

export function FeatureLabPlayground({
  features,
  releases,
}: {
  features: ClaudeCodeFeature[];
  releases: Release[];
}) {
  const [selectedFeature, setSelectedFeature] = useState(features[0]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ClaudeCodeFeature["category"] | "all">("all");
  const [activeDifficulty, setActiveDifficulty] = useState<FeatureDifficulty | "all">("all");
  const [activeImpactTag, setActiveImpactTag] = useState<FeatureImpactTag | "all">("all");
  const [activeAudience, setActiveAudience] = useState<FeatureAudience | "all">("all");
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [selectedStackIds, setSelectedStackIds] = useState<string[]>([]);
  const [stackLimitMessage, setStackLimitMessage] = useState("");
  const hydratedRef = useRef(false);
  const [urlSyncReady, setUrlSyncReady] = useState(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const initial = parseFeatureLabParams(window.location.search);
    const linkedFeature = initial.featureId
      ? features.find((feature) => feature.id === initial.featureId)
      : undefined;
    if (linkedFeature) setSelectedFeature(linkedFeature);
    if (initial.query) setQuery(initial.query);
    if (initial.category !== "all") setActiveCategory(initial.category);
    if (initial.difficulty !== "all") setActiveDifficulty(initial.difficulty);
    if (initial.impact !== "all") setActiveImpactTag(initial.impact);
    if (initial.audience !== "all") setActiveAudience(initial.audience);
    setUrlSyncReady(true);
  }, [features]);

  useEffect(() => {
    if (!urlSyncReady) return;
    syncFilterParamsToUrl({
      featureId: selectedFeature.id,
      query,
      category: activeCategory,
      difficulty: activeDifficulty,
      impact: activeImpactTag,
      audience: activeAudience,
    });
  }, [urlSyncReady, selectedFeature.id, query, activeCategory, activeDifficulty, activeImpactTag, activeAudience]);

  useEffect(() => {
    if (!features.some((feature) => feature.id === selectedFeature.id)) {
      setSelectedFeature(features[0]);
    }
  }, [features, selectedFeature.id]);

  const filteredFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return features.filter((feature) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          feature.id,
          feature.name,
          feature.shortName,
          feature.description,
          feature.activation.snippet,
          feature.impact.summary,
          ...feature.impact.goodFor,
          ...feature.impact.watchOut,
          ...feature.impactTags,
          ...feature.audience,
          ...(feature.useCases ?? []),
          ...(feature.setupSteps ?? []),
          ...(feature.configExamples?.flatMap((example) => [example.label, example.file ?? "", example.code]) ?? []),
          ...(feature.risks?.flatMap((risk) => [risk.level, risk.text, risk.mitigation ?? ""]) ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = activeCategory === "all" || feature.category === activeCategory;
      const matchesDifficulty = activeDifficulty === "all" || feature.difficulty === activeDifficulty;
      const matchesImpactTag = activeImpactTag === "all" || feature.impactTags.includes(activeImpactTag);
      const matchesAudience = activeAudience === "all" || feature.audience.includes(activeAudience);
      return matchesQuery && matchesCategory && matchesDifficulty && matchesImpactTag && matchesAudience;
    });
  }, [activeAudience, activeCategory, activeDifficulty, activeImpactTag, features, query]);

  const selectedStackFeatures = useMemo(
    () => selectedStackIds
      .map((id) => features.find((feature) => feature.id === id))
      .filter((feature): feature is ClaudeCodeFeature => Boolean(feature)),
    [features, selectedStackIds],
  );

  const isInSelectedStack = (featureId: string) => selectedStackIds.includes(featureId);

  const addToSelectedStack = (featureId: string) => {
    if (selectedStackIds.includes(featureId)) {
      setStackLimitMessage("");
      return;
    }
    if (selectedStackIds.length >= selectedStackLimit) {
      setStackLimitMessage(`최대 ${selectedStackLimit}개까지만 비교할 수 있습니다. 먼저 하나를 제거하세요.`);
      return;
    }
    setSelectedStackIds([...selectedStackIds, featureId]);
    setStackLimitMessage("");
  };

  const removeFromSelectedStack = (featureId: string) => {
    setSelectedStackIds((current) => current.filter((id) => id !== featureId));
    setStackLimitMessage("");
  };

  const clearSelectedStack = () => {
    setSelectedStackIds([]);
    setStackLimitMessage("");
  };

  const handleToggleStack = (feature: ClaudeCodeFeature) => {
    if (isInSelectedStack(feature.id)) {
      removeFromSelectedStack(feature.id);
      return;
    }
    addToSelectedStack(feature.id);
  };

  const useStarterStack = (ids: readonly string[]) => {
    const availableIds = ids.filter((id) => features.some((feature) => feature.id === id));
    setSelectedStackIds(availableIds.slice(0, selectedStackLimit));
    setStackLimitMessage("");
  };

  const handleSelect = (feature: ClaudeCodeFeature) => {
    setSelectedFeature(feature);
    setCopiedShareUrl(false);
  };

  const handleSelectRelated = (feature: ClaudeCodeFeature) => {
    const visible = filteredFeatures.some((item) => item.id === feature.id);
    if (!visible) resetFilters();
    handleSelect(feature);
  };

  const relatedFeatures = useMemo(() => {
    const relatedIds = selectedFeature.relatedFeatureIds ?? [];
    return relatedIds
      .map((id) => features.find((feature) => feature.id === id))
      .filter((feature): feature is ClaudeCodeFeature => Boolean(feature));
  }, [features, selectedFeature.relatedFeatureIds]);

  const shareableSearch = buildFeatureLabSearch("", {
    featureId: selectedFeature.id,
    query,
    category: activeCategory,
    difficulty: activeDifficulty,
    impact: activeImpactTag,
    audience: activeAudience,
  });

  const handleCopyShareUrl = async () => {
    const url = new URL(window.location.href);
    const next = applyFilterParams(url.searchParams, {
      featureId: selectedFeature.id,
      query,
      category: activeCategory,
      difficulty: activeDifficulty,
      impact: activeImpactTag,
      audience: activeAudience,
    });
    const serialized = next.toString();
    url.search = serialized.length === 0 ? "" : `?${serialized}`;
    await copyTextToClipboard(url.toString());
    setCopiedShareUrl(true);
    window.setTimeout(() => setCopiedShareUrl(false), 1600);
  };

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setActiveDifficulty("all");
    setActiveImpactTag("all");
    setActiveAudience("all");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
      <FeatureCatalog
        features={filteredFeatures}
        allFeatures={features}
        selectedFeature={selectedFeature}
        selectedStackIds={selectedStackIds}
        stackLimitMessage={stackLimitMessage}
        query={query}
        activeCategory={activeCategory}
        activeDifficulty={activeDifficulty}
        activeImpactTag={activeImpactTag}
        activeAudience={activeAudience}
        onQueryChange={setQuery}
        onCategoryChange={setActiveCategory}
        onDifficultyChange={setActiveDifficulty}
        onImpactTagChange={setActiveImpactTag}
        onAudienceChange={setActiveAudience}
        onSelect={handleSelect}
        onToggleStack={handleToggleStack}
        onReset={resetFilters}
      />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-xl shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-black/25 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryPill category={selectedFeature.category} />
                <MetadataPill>{featureDifficultyLabels[selectedFeature.difficulty]}</MetadataPill>
                {selectedFeature.introducedIn && <MetadataPill>{selectedFeature.introducedIn}</MetadataPill>}
                {selectedFeature.audience.map((audience) => (
                  <MetadataPill key={audience}>{featureAudienceLabels[audience]}</MetadataPill>
                ))}
              </div>
              <h1 className="mt-4 font-mono text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {selectedFeature.name}
              </h1>
              <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-300">
                {selectedFeature.description}
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70 lg:w-80">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Shareable feature URL
                </p>
                <CopyActionButton
                  copied={copiedShareUrl}
                  idleLabel="Copy link"
                  copiedLabel="Link copied"
                  onClick={handleCopyShareUrl}
                />
              </div>
              <code className="mt-3 block break-words rounded-2xl bg-zinc-950 px-4 py-3 font-mono text-xs font-bold text-cyan-200 dark:bg-black">
                {shareableSearch}
              </code>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                버튼은 현재 preview/production base path를 포함한 전체 URL을 복사합니다. 리뷰/문서에서 바로 붙여넣을 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <SelectedFeatureStack
          selectedStackFeatures={selectedStackFeatures}
          allFeatures={features}
          stackLimitMessage={stackLimitMessage}
          onUseStarterStack={useStarterStack}
          onRemove={removeFromSelectedStack}
          onClear={clearSelectedStack}
          onSelect={handleSelect}
        />
        <FeatureComparisonMatrix features={selectedStackFeatures} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ActivationEditor feature={selectedFeature} />
          <AnimatedTuiScene label="After" scene={selectedFeature.afterExperience} variant="after" />
        </div>

        <details className="rounded-[1.75rem] border border-zinc-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-300">
            Before state도 보기
          </summary>
          <div className="mt-4">
            <AnimatedTuiScene label="Before" scene={selectedFeature.beforeExperience} variant="before" />
          </div>
        </details>

        <FeatureGuidancePanel feature={selectedFeature} />
        <ImpactPanel feature={selectedFeature} />
        <RelatedFeaturesPanel
          relatedFeatures={relatedFeatures}
          selectedStackIds={selectedStackIds}
          onSelect={handleSelectRelated}
          onAddToStack={handleToggleStack}
        />
        <SourceEvidencePanel feature={selectedFeature} />
        <RelatedReleasesPanel feature={selectedFeature} releases={releases} />
      </div>
    </div>
  );
}
