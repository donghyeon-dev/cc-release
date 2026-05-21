"use client";

import { useMemo, useState } from "react";
import { withBasePath } from "@/lib/assets";
import { buildFeatureLabHref } from "@/lib/feature-lab-url";
import type { ConfigSimulatorScenario } from "@/lib/config-simulator";
import type { ClaudeCodeFeature } from "@/lib/feature-lab";
import type { Release } from "@/lib/types";

interface Props {
  scenarios: ConfigSimulatorScenario[];
  features: ClaudeCodeFeature[];
  releases: Release[];
}

const audienceLabels: Record<string, string> = {
  "solo-dev": "Solo dev",
  team: "Team",
  ci: "CI",
  "mcp-user": "MCP user",
  "power-user": "Power user",
};

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function ConfigSimulatorPlayground({ scenarios, features, releases }: Props) {
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "safe-automation-allowlist");
  const selected = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0],
    [scenarios, selectedId],
  );

  const relatedFeatures = useMemo(
    () =>
      selected
        ? selected.relatedFeatureIds
            .map((id) => features.find((feature) => feature.id === id))
            .filter((feature): feature is ClaudeCodeFeature => Boolean(feature))
        : [],
    [features, selected],
  );

  const relatedReleases = useMemo(
    () =>
      selected
        ? selected.relatedReleaseVersions
            .map((version) => releases.find((release) => release.version === version))
            .filter((release): release is Release => Boolean(release))
        : [],
    [releases, selected],
  );

  if (!selected) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <aside className="space-y-3 lg:sticky lg:top-6" aria-label="Configuration scenarios">
        <div className="rounded-3xl border border-zinc-200 bg-white/85 p-4 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
            Starter configurations
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            시나리오 선택
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Goal 1에서는 저장이나 URL 동기화 없이 브라우저 상태로만 선택을 바꿉니다.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {scenarios.map((scenario) => {
            const active = scenario.id === selected.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedId(scenario.id)}
                aria-pressed={active}
                className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  active
                    ? "border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100 dark:border-indigo-500 dark:bg-indigo-950/35 dark:shadow-none"
                    : "border-zinc-200 bg-white/80 hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-indigo-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                    {scenario.title}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${active ? "bg-indigo-700 text-white dark:bg-indigo-200 dark:text-indigo-950" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"}`}>
                    {scenario.settingsFile.includes("local") ? "local" : "shared"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {scenario.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {scenario.audience.slice(0, 3).map((audience) => (
                    <span
                      key={audience}
                      className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                    >
                      {audienceLabels[audience] ?? audience}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="space-y-5" aria-live="polite">
        <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/90 shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none">
          <div className="border-b border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/45 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              Selected scenario
            </p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                  {selected.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
                  {selected.summary}
                </p>
              </div>
              <code className="w-fit shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs font-black text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                {selected.settingsFile}
              </code>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
            <ExperiencePanel label="Before" title={selected.before.title} bullets={selected.before.bullets} tone="before" />
            <ExperiencePanel label="After" title={selected.after.title} bullets={selected.after.bullets} tone="after" />
          </div>
        </article>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-black dark:shadow-none">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Generated settings preview
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-400">{selected.settingsFile}</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-black text-emerald-200">
                preview only
              </span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-6 text-zinc-100 sm:p-6">
              <code>{selected.settingsSnippet}</code>
            </pre>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/70 dark:bg-amber-950/20 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
              Risk / mitigation
            </p>
            <div className="mt-4 space-y-3">
              {selected.risks.map((risk, index) => (
                <div
                  key={`${selected.id}-risk-${index}`}
                  className="rounded-2xl border border-amber-200 bg-white/80 p-4 dark:border-amber-900/70 dark:bg-zinc-950/55"
                >
                  <p className="text-sm font-bold leading-6 text-amber-950 dark:text-amber-100">
                    ⚠️ {risk.text}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    <span className="font-black text-emerald-700 dark:text-emerald-300">완화:</span> {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <RelatedFeatureLinks features={relatedFeatures} />
          <RelatedReleaseLinks releases={relatedReleases} />
        </section>
      </section>
    </div>
  );
}

function ExperiencePanel({
  label,
  title,
  bullets,
  tone,
}: {
  label: string;
  title: string;
  bullets: string[];
  tone: "before" | "after";
}) {
  const isAfter = tone === "after";
  return (
    <div className={`rounded-2xl border p-4 ${isAfter ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20" : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50"}`}>
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${isAfter ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isAfter ? "bg-emerald-500" : "bg-zinc-400"}`} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedFeatureLinks({ features }: { features: ClaudeCodeFeature[] }) {
  return (
    <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900/70 dark:bg-indigo-950/20 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
        Related Feature Lab
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        기능 실험으로 이어보기
      </h3>
      <div className="mt-4 space-y-2">
        {features.length === 0 ? (
          <a
            href={withBasePath("/feature-lab/")}
            className="block rounded-2xl border border-indigo-200 bg-white/85 p-4 text-sm font-bold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-white dark:border-indigo-900/70 dark:bg-zinc-950/60 dark:text-indigo-200"
          >
            Feature Lab 전체 보기 →
          </a>
        ) : (
          features.map((feature) => (
            <a
              key={feature.id}
              href={buildFeatureLabHref(feature)}
              className="group block rounded-2xl border border-indigo-200 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-indigo-900/70 dark:bg-zinc-950/60 dark:hover:bg-zinc-950"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-black text-zinc-950 dark:text-zinc-50">
                  {feature.shortName}
                </p>
                <span className="text-xs font-black text-indigo-600 transition group-hover:translate-x-0.5 dark:text-indigo-300">
                  열기 →
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

function RelatedReleaseLinks({ releases }: { releases: Release[] }) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/70 dark:bg-amber-950/20 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
        Release Intelligence
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        관련 릴리즈 카드로 돌아가기
      </h3>
      <div className="mt-4 space-y-2">
        {releases.map((release) => (
          <a
            key={release.version}
            href={withBasePath(`/#release-${release.version}`)}
            className="group block rounded-2xl border border-amber-200 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-amber-900/70 dark:bg-zinc-950/60 dark:hover:bg-zinc-950"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">{release.version}</span>
              <span className="text-zinc-400">·</span>
              <time className="font-semibold text-zinc-500 dark:text-zinc-400" dateTime={release.publishedAt}>
                {formatDate(release.publishedAt)}
              </time>
            </div>
            <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-zinc-950 dark:text-zinc-50">
              {release.summary.headline}
            </p>
            <span className="mt-2 inline-flex text-xs font-black text-amber-700 transition group-hover:translate-x-0.5 dark:text-amber-300">
              릴리즈 카드 보기 →
            </span>
          </a>
        ))}
        {releases.length === 0 && (
          <a
            href={withBasePath("/")}
            className="block rounded-2xl border border-amber-200 bg-white/85 p-4 text-sm font-bold text-amber-800 transition hover:-translate-y-0.5 hover:bg-white dark:border-amber-900/70 dark:bg-zinc-950/60 dark:text-amber-200"
          >
            Release Intelligence 전체 보기 →
          </a>
        )}
      </div>
    </div>
  );
}
