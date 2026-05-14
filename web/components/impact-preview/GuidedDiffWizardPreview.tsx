import type { ReleaseScenario } from "@/lib/impact-preview";
import {
  EditorPane,
  ScenarioMetrics,
  ScenarioRiskNote,
  ScenarioSourceQuote,
  TuiPane,
} from "./ScenarioPrimitives";

const stepStyles = [
  "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-100",
  "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-100",
  "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
];

export function GuidedDiffWizardPreview({
  scenario,
}: {
  scenario: ReleaseScenario;
}) {
  const steps = [
    {
      label: "01",
      title: "릴리스 문장 확인",
      description: `${scenario.releaseVersion} · ${scenario.releaseDate} 변경사항에서 실제로 바뀐 행동을 먼저 고정합니다.`,
    },
    {
      label: "02",
      title: "현재 마찰 재현",
      description:
        "Before 패널로 기존 설정과 반복 permission prompt가 어디서 발생하는지 짚습니다.",
    },
    {
      label: "03",
      title: "제안 diff 검토",
      description:
        "After 패널에서 Claude Code가 제안하는 설정 패치와 터미널 흐름을 나란히 확인합니다.",
    },
    {
      label: "04",
      title: "복사 전 안전 확인",
      description:
        "자동 적용하지 않고 제외 목록과 risk note를 확인한 뒤 필요한 항목만 복사합니다.",
    },
  ];

  const ctaLabel =
    scenario.activation.type === "command"
      ? "Run command"
      : scenario.activation.type === "settings"
        ? "Open settings"
        : "Set environment";

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-indigo-50/70 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/20">
      <div className="border-b border-zinc-200/80 px-4 py-5 dark:border-zinc-800 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
              Variant C · Guided diff wizard
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              {scenario.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {scenario.summary}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Activation
            </p>
            <code className="mt-1 block font-mono text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {scenario.activation.snippet}
            </code>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.4fr] lg:p-8">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Wizard path
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  4-step guided review
                </h3>
              </div>
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
                Safe copy
              </span>
            </div>

            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li
                  key={step.label}
                  className={`rounded-2xl border p-3 ${stepStyles[index]}`}
                >
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 font-mono text-xs font-black shadow-sm dark:bg-zinc-950/70">
                      {step.label}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 opacity-80">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Explanation panel
            </p>
            <ScenarioSourceQuote scenario={scenario} />
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
              <p className="font-semibold text-zinc-950 dark:text-zinc-50">Impact</p>
              <p className="mt-2">{scenario.impact}</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                CTA · {scenario.activation.label}
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
                <code className="overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-sm font-semibold text-indigo-950 dark:bg-zinc-950 dark:text-indigo-100">
                  {scenario.activation.snippet}
                </code>
                <span className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm dark:bg-indigo-500">
                  {ctaLabel}
                </span>
              </div>
            </div>
          </div>

          <ScenarioMetrics scenario={scenario} />
        </aside>

        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Before
                </h3>
                <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  repeated prompts
                </span>
              </div>
              <EditorPane
                title={scenario.before.editorTitle}
                text={scenario.before.editorText}
              />
              <TuiPane
                title={scenario.before.terminalTitle}
                text={scenario.before.terminalText}
                compact
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                  After
                </h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
                  reviewable diff
                </span>
              </div>
              <EditorPane
                title={scenario.after.editorTitle}
                text={scenario.after.editorText}
                variant="dark"
              />
              <TuiPane
                title={scenario.after.terminalTitle}
                text={scenario.after.terminalText}
                compact
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Suggested allowlist candidates
                </h3>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  prioritize read-only calls
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {scenario.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.label}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <code className="font-mono text-xs font-semibold text-zinc-950 dark:text-zinc-100">
                        {suggestion.label}
                      </code>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
                        {suggestion.value}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {suggestion.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/70 dark:bg-rose-950/25">
                <p className="text-sm font-semibold text-rose-950 dark:text-rose-100">
                  Excluded from copy
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {scenario.excluded.map((item) => (
                    <code
                      key={item}
                      className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-800 dark:bg-zinc-950 dark:text-rose-200"
                    >
                      {item}
                    </code>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Safety note
                </p>
                <ScenarioRiskNote scenario={scenario} />
                <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  Treat this preview as a guided diff: copy the patch only after
                  verifying the source quote, generated allowlist, and excluded
                  side-effecting commands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
