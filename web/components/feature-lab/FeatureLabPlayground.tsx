"use client";

import { useEffect, useMemo, useState } from "react";
import {
  featureAudienceLabels,
  featureCategoryLabels,
  featureDifficultyLabels,
  featureImpactTagLabels,
  type ClaudeCodeFeature,
  type FeatureDifficulty,
  type FeatureImpactTag,
  type TuiFrame,
} from "@/lib/feature-lab";
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
  query,
  activeCategory,
  activeDifficulty,
  activeImpactTag,
  onQueryChange,
  onCategoryChange,
  onDifficultyChange,
  onImpactTagChange,
  onSelect,
  onReset,
}: {
  features: ClaudeCodeFeature[];
  allFeatures: ClaudeCodeFeature[];
  selectedFeature: ClaudeCodeFeature;
  query: string;
  activeCategory: ClaudeCodeFeature["category"] | "all";
  activeDifficulty: FeatureDifficulty | "all";
  activeImpactTag: FeatureImpactTag | "all";
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: ClaudeCodeFeature["category"] | "all") => void;
  onDifficultyChange: (difficulty: FeatureDifficulty | "all") => void;
  onImpactTagChange: (tag: FeatureImpactTag | "all") => void;
  onSelect: (feature: ClaudeCodeFeature) => void;
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
          검색, category, impact 기준으로 기능을 좁히고 feature별 URL로 바로 공유합니다.
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

      <div className="mt-3 space-y-2">
        {features.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            조건에 맞는 기능이 없습니다. 검색어를 줄이거나 필터를 초기화하세요.
          </div>
        )}
        {features.map((feature) => {
          const selected = feature.id === selectedFeature.id;
          return (
            <button
              key={feature.id}
              type="button"
              onClick={() => onSelect(feature)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
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
            </button>
          );
        })}
      </div>
    </aside>
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

function updateFeatureQueryParam(featureId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("feature", featureId);
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
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const featureId = params.get("feature");
    const linkedFeature = features.find((feature) => feature.id === featureId);
    if (linkedFeature) {
      setSelectedFeature(linkedFeature);
    }
  }, [features]);

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
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = activeCategory === "all" || feature.category === activeCategory;
      const matchesDifficulty = activeDifficulty === "all" || feature.difficulty === activeDifficulty;
      const matchesImpactTag = activeImpactTag === "all" || feature.impactTags.includes(activeImpactTag);
      return matchesQuery && matchesCategory && matchesDifficulty && matchesImpactTag;
    });
  }, [activeCategory, activeDifficulty, activeImpactTag, features, query]);

  const handleSelect = (feature: ClaudeCodeFeature) => {
    setSelectedFeature(feature);
    updateFeatureQueryParam(feature.id);
    setCopiedShareUrl(false);
  };

  const handleCopyShareUrl = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("feature", selectedFeature.id);
    await copyTextToClipboard(url.toString());
    setCopiedShareUrl(true);
    window.setTimeout(() => setCopiedShareUrl(false), 1600);
  };

  const resetFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setActiveDifficulty("all");
    setActiveImpactTag("all");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
      <FeatureCatalog
        features={filteredFeatures}
        allFeatures={features}
        selectedFeature={selectedFeature}
        query={query}
        activeCategory={activeCategory}
        activeDifficulty={activeDifficulty}
        activeImpactTag={activeImpactTag}
        onQueryChange={setQuery}
        onCategoryChange={setActiveCategory}
        onDifficultyChange={setActiveDifficulty}
        onImpactTagChange={setActiveImpactTag}
        onSelect={handleSelect}
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
                ?feature={selectedFeature.id}
              </code>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                버튼은 현재 preview/production base path를 포함한 전체 URL을 복사합니다. 리뷰/문서에서 바로 붙여넣을 수 있습니다.
              </p>
            </div>
          </div>
        </section>

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

        <ImpactPanel feature={selectedFeature} />
        <RelatedReleasesPanel feature={selectedFeature} releases={releases} />
      </div>
    </div>
  );
}
