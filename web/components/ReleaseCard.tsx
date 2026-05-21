"use client";

import { useEffect, useRef, useState } from "react";
import type { DevImpactRef, Release } from "@/lib/types";
import type { ReleaseIntelligenceHighlight } from "@/lib/release-intelligence";
import {
  featureCategoryLabels,
  featureDifficultyLabels,
  type ClaudeCodeFeature,
} from "@/lib/feature-lab";
import { withBasePath } from "@/lib/assets";
import { buildFeatureLabHref } from "@/lib/feature-lab-url";
import { formatDateKorean } from "@/lib/format";
import { SummarySection } from "./SummarySection";
import { OriginalMarkdown } from "./OriginalMarkdown";

const categoryAccent: Record<ClaudeCodeFeature["category"], string> = {
  env: "border-cyan-200 text-cyan-700 dark:border-cyan-900/70 dark:text-cyan-200",
  settings:
    "border-violet-200 text-violet-700 dark:border-violet-900/70 dark:text-violet-200",
  "slash-command":
    "border-indigo-200 text-indigo-700 dark:border-indigo-900/70 dark:text-indigo-200",
  permission:
    "border-emerald-200 text-emerald-700 dark:border-emerald-900/70 dark:text-emerald-200",
  mcp: "border-amber-200 text-amber-700 dark:border-amber-900/70 dark:text-amber-200",
  hooks: "border-rose-200 text-rose-700 dark:border-rose-900/70 dark:text-rose-200",
  plugin: "border-sky-200 text-sky-700 dark:border-sky-900/70 dark:text-sky-200",
  model:
    "border-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-900/70 dark:text-fuchsia-200",
  tui: "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
};

interface Props {
  release: Release;
  relatedFeatures: ClaudeCodeFeature[];
  releaseIntelligenceHighlights: ReleaseIntelligenceHighlight[];
}

function RelatedFeatureLinks({ features }: { features: ClaudeCodeFeature[] }) {
  if (features.length === 0) return null;

  return (
    <section className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/25">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
            Related Feature Lab
          </p>
          <p className="mt-1 text-sm leading-5 text-indigo-950 dark:text-indigo-100">
            이 릴리즈와 연결된 기능 체험으로 바로 이동합니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-xs font-black text-indigo-700 dark:border-indigo-900 dark:bg-zinc-950 dark:text-indigo-200">
          {features.length} features
        </span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {features.map((feature) => {
          const href = buildFeatureLabHref(feature);
          const accent = categoryAccent[feature.category];
          return (
            <li key={feature.id}>
              <a
                href={href}
                aria-label={`Feature Lab에서 ${feature.shortName} 열기 (${featureCategoryLabels[feature.category]} · ${featureDifficultyLabels[feature.difficulty]})`}
                className={`group flex h-full flex-col gap-2 rounded-xl border bg-white px-3 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm dark:bg-zinc-950 ${accent}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider">
                    {featureCategoryLabels[feature.category]}
                  </span>
                  <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-black uppercase tracking-wider opacity-80">
                    {featureDifficultyLabels[feature.difficulty]}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm font-black text-zinc-950 dark:text-zinc-50">
                    {feature.shortName}
                  </span>
                  <span className="text-xs font-black opacity-70 transition group-hover:opacity-100">
                    Lab 열기 →
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {feature.name}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FeatureLabFallbackLink({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <section className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/20">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
        Feature Lab affordance
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-indigo-950 dark:text-indigo-100">
          이 릴리즈에 직접 매핑된 실험 항목은 아직 없지만, 관련 Claude Code 설정·권한·자동화 기능은 Feature Lab에서 계속 확장 중입니다.
        </p>
        <a
          href={withBasePath("/feature-lab/")}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-700 px-3 py-2 text-xs font-black text-white transition hover:bg-indigo-800 dark:bg-indigo-200 dark:text-indigo-950 dark:hover:bg-white"
        >
          Feature Lab 열기 →
        </a>
      </div>
    </section>
  );
}

function ReleaseIntelligenceHighlights({
  highlights,
}: {
  highlights: ReleaseIntelligenceHighlight[];
}) {
  if (highlights.length === 0) return null;

  return (
    <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
            Release Intelligence
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-950 dark:text-amber-100">
            위 요약 rail에서 이 릴리즈가 중요하게 분류된 이유입니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-black text-amber-800 dark:border-amber-900 dark:bg-zinc-950 dark:text-amber-200">
          {highlights.length} signals
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {highlights.map((highlight) => (
          <li
            key={`${highlight.bucketId}-${highlight.reason}`}
            className="rounded-lg border border-amber-200/80 bg-white/80 p-3 dark:border-amber-900/70 dark:bg-zinc-950/70"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {highlight.bucketTitle}
              </span>
              <a
                href={highlight.href}
                className="text-[11px] font-black uppercase tracking-wider text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
              >
                현재 릴리즈 위치
              </a>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
              {highlight.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ReleaseCard({ release, relatedFeatures, releaseIntelligenceHighlights }: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [highlightToken, setHighlightToken] = useState<string | null>(null);
  const [activeRef, setActiveRef] = useState<DevImpactRef | null>(null);
  const [activeOriginal, setActiveOriginal] = useState<{ index: number; nonce: number } | null>(null);
  const activeOriginalIndex = activeOriginal?.index ?? null;

  const handleTokenClick = (token: string) => {
    if (highlightToken === token) {
      setHighlightToken(null);
      return;
    }
    setHighlightToken(token);
    setActiveRef(null);
    setOriginalOpen(true);
  };

  const handleRefClick = (ref: DevImpactRef) => {
    if (
      activeRef &&
      activeRef.bucket === ref.bucket &&
      activeRef.index === ref.index
    ) {
      setActiveRef(null);
      return;
    }
    setActiveRef(ref);
    setHighlightToken(null);
  };

  const handleBulletOriginalClick = (refs: number[]) => {
    if (refs.length === 0) return;
    const target = refs[0];
    setActiveOriginal({ index: target, nonce: Date.now() });
    setOriginalOpen(true);
    setHighlightToken(null);
    setActiveRef(null);
  };

  useEffect(() => {
    if (!highlightToken || !cardRef.current) return;
    const root = cardRef.current;
    const selector = `[data-code-token="${CSS.escape(highlightToken)}"]`;
    const timer = window.setTimeout(() => {
      const koreanMatch = root.querySelector(
        `${selector}[data-source="korean"]`,
      );
      const target =
        koreanMatch ??
        root.querySelector(`${selector}[data-source="original"]`);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [highlightToken, originalOpen]);

  useEffect(() => {
    if (!activeRef || !cardRef.current) return;
    const root = cardRef.current;
    const selector = `[data-ref-anchor="${CSS.escape(
      `${activeRef.bucket}:${activeRef.index}`,
    )}"]`;
    const timer = window.setTimeout(() => {
      const target = root.querySelector(selector);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeRef]);

  useEffect(() => {
    if (!activeOriginal || !cardRef.current || !originalOpen) return;
    const root = cardRef.current;
    const selector = `[data-original-line="${activeOriginal.index}"]`;
    let attempts = 0;
    let raf = 0;
    const tryScroll = () => {
      const target = root.querySelector(selector);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("original-line-highlight");
        window.setTimeout(
          () => target.classList.remove("original-line-highlight"),
          1800,
        );
        return;
      }
      if (attempts++ < 10) {
        raf = window.requestAnimationFrame(tryScroll);
      }
    };
    raf = window.requestAnimationFrame(tryScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [activeOriginal, originalOpen]);

  return (
    <article
      ref={cardRef}
      id={`release-${release.version}`}
      className="w-full max-w-full scroll-mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/70 transition-shadow hover:shadow-md hover:shadow-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none dark:hover:border-zinc-700"
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-50/70 px-5 py-4 dark:border-zinc-900 dark:bg-zinc-900/40 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h2 className="rounded-md bg-zinc-950 px-2.5 py-1 font-mono text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
            {release.version}
          </h2>
          <time
            dateTime={release.publishedAt}
            className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
          >
            {formatDateKorean(release.publishedAt)}
          </time>
        </div>
        {release.url && (
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-center text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100 sm:w-auto"
          >
            GitHub에서 보기 ↗
          </a>
        )}
      </header>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <ReleaseIntelligenceHighlights highlights={releaseIntelligenceHighlights} />
        <FeatureLabFallbackLink
          show={releaseIntelligenceHighlights.length > 0 && relatedFeatures.length === 0}
        />
        <RelatedFeatureLinks features={relatedFeatures} />
        <SummarySection
          summary={release.summary}
          highlightToken={highlightToken}
          activeRef={activeRef}
          activeOriginalIndex={activeOriginalIndex}
          onDevImpactTokenClick={handleTokenClick}
          onDevImpactRefClick={handleRefClick}
          onBulletOriginalClick={handleBulletOriginalClick}
        />
        <OriginalMarkdown
          body={release.originalBody}
          open={originalOpen}
          onToggle={() => setOriginalOpen((v) => !v)}
          highlightToken={highlightToken}
        />
      </div>
    </article>
  );
}
