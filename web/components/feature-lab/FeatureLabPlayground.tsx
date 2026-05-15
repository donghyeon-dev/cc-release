"use client";

import { useEffect, useMemo, useState } from "react";
import {
  claudeCodeFeatures,
  featureCategoryLabels,
  type ClaudeCodeFeature,
  type TuiFrame,
  type TuiFrameKind,
} from "@/lib/feature-lab";

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

const frameIcon: Record<TuiFrameKind, string> = {
  type: "›",
  line: "│",
  spinner: "◐",
  "permission-prompt": "◆",
  menu: "▣",
  diff: "±",
  "status-change": "↻",
  toast: "✓",
};

const frameTone: Record<NonNullable<TuiFrame["tone"]>, string> = {
  neutral: "text-zinc-200",
  info: "text-cyan-200",
  good: "text-emerald-200",
  warn: "text-amber-200",
};

function CategoryPill({ category }: { category: ClaudeCodeFeature["category"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ${categoryTone[category]}`}
    >
      {featureCategoryLabels[category]}
    </span>
  );
}

function FeatureCatalog({
  selectedFeature,
  onSelect,
}: {
  selectedFeature: ClaudeCodeFeature;
  onSelect: (feature: ClaudeCodeFeature) => void;
}) {
  const categories = useMemo(
    () => Array.from(new Set(claudeCodeFeatures.map((feature) => feature.category))),
    [],
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
          env, settings, slash command를 기능 단위로 고르고 오른쪽에서 실제 TUI 변화를 봅니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <CategoryPill key={category} category={category} />
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {claudeCodeFeatures.map((feature) => {
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
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Activation snippet
          </p>
          <h3 className="mt-1 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {feature.activation.label}
          </h3>
        </div>
        {feature.activation.file && (
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            {feature.activation.file}
          </span>
        )}
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
  const iconClass = frame.kind === "spinner" ? "feature-lab-spinner inline-block" : "inline-block";
  const icon = lineIndex === 0 ? frameIcon[frame.kind] : " ";

  if (frame.kind === "type") {
    const command = content.replace(/^>\s?/, "");
    const visibleCommand = isActiveCommand ? command.slice(0, typedChars) : command;

    return (
      <div className="flex min-h-6 items-baseline gap-2 text-cyan-100">
        <span className="select-none text-cyan-400">claude</span>
        <span className="select-none text-zinc-600">$</span>
        <span className="whitespace-pre-wrap break-words">{visibleCommand}</span>
        {isActiveCommand && <span className="feature-lab-cursor inline-block h-4 w-2 translate-y-0.5 bg-cyan-300" />}
      </div>
    );
  }

  return (
    <div className={`flex min-h-6 items-start gap-2 ${tone}`}>
      <span className="w-[6.5ch] shrink-0 select-none text-zinc-700">
        {lineIndex === 0 ? frame.at : ""}
      </span>
      <span className={`${iconClass} w-4 shrink-0 select-none text-zinc-500`}>{icon}</span>
      <div className="min-w-0 flex-1">
        {frame.title && lineIndex === 0 && (
          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
            [{frame.title}]
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
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
    <section className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-[#05070d] text-zinc-100 shadow-2xl shadow-cyan-950/20">
      <div className="border-b border-zinc-800 bg-[#080b12] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Claude Code TUI · {label}
            </p>
            <h3 className="mt-1 font-semibold tracking-tight text-zinc-50">{scene.title}</h3>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-zinc-400">
          <span className="rounded-full border border-zinc-800 bg-black px-2.5 py-1">
            {scene.statusBefore}
          </span>
          {variant === "after" && (
            <>
              <span>→</span>
              <span className="rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-emerald-200">
                {scene.statusAfter}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="relative min-h-[24rem] p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.08),transparent_20rem)]" />
        <div className="relative min-h-[21rem] rounded-2xl border border-zinc-800/80 bg-[#020409] p-4 font-mono text-[12px] leading-6 shadow-inner shadow-black sm:text-[13px]">
          <div className="relative mb-3 flex items-center gap-2 border-b border-zinc-900 pb-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live terminal session
          </div>
          <div className="relative space-y-1">
            {visibleSteps.map((step, index) => (
              <TerminalStreamEntry
                key={`${scene.title}-${step.id}`}
                step={step}
                isActiveCommand={activeCommandIndex === index}
                typedChars={activeCommandIndex === index ? typedChars : step.content.length}
              />
            ))}
            <div className="flex min-h-6 items-baseline gap-2 text-cyan-100">
              <span className="select-none text-cyan-400">claude</span>
              <span className="select-none text-zinc-600">$</span>
              {activeCommandIndex === null && (
                <span className="feature-lab-cursor inline-block h-4 w-2 translate-y-0.5 bg-cyan-300" />
              )}
            </div>
          </div>
        </div>
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

export function FeatureLabPlayground() {
  const [selectedFeature, setSelectedFeature] = useState(claudeCodeFeatures[0]);

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <FeatureCatalog selectedFeature={selectedFeature} onSelect={setSelectedFeature} />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-xl shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-black/25 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryPill category={selectedFeature.category} />
                {selectedFeature.introducedIn && (
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {selectedFeature.introducedIn}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-mono text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                {selectedFeature.name}
              </h1>
              <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-300">
                {selectedFeature.description}
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70 lg:w-72">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Activation
              </p>
              <code className="mt-3 block break-words rounded-2xl bg-zinc-950 px-4 py-3 font-mono text-sm font-bold text-cyan-200 dark:bg-black">
                {selectedFeature.activation.type}
              </code>
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
      </div>
    </div>
  );
}
