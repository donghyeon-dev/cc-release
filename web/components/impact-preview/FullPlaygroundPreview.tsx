import type { ReleaseScenario } from "@/lib/impact-preview";
import {
  EditorPane,
  ScenarioMetrics,
  ScenarioRiskNote,
  ScenarioSourceQuote,
  TuiPane,
} from "./ScenarioPrimitives";

const categoryLabels: Record<ReleaseScenario["category"], string> = {
  env: "Environment",
  config: "Config",
  command: "Command",
  permission: "Permission",
  mcp: "MCP",
  model: "Model",
  tui: "TUI",
  ide: "IDE",
};

const activationLabels: Record<ReleaseScenario["activation"]["type"], string> = {
  command: "Run command",
  settings: "Update settings",
  env: "Set environment",
};

function ConfidenceCard({ scenario }: { scenario: ReleaseScenario }) {
  const riskTone =
    scenario.riskLevel === "high"
      ? "bg-rose-500"
      : scenario.riskLevel === "medium"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            Impact confidence
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
            Safe to preview, review before apply
          </h2>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-right dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Risk
          </p>
          <div className="mt-1 flex items-center justify-end gap-2 text-sm font-black uppercase text-zinc-900 dark:text-zinc-100">
            <span className={`h-2.5 w-2.5 rounded-full ${riskTone}`} />
            {scenario.riskLevel}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {scenario.impact}
      </p>

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          Activation
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              {activationLabels[scenario.activation.type]} · {scenario.activation.label}
            </p>
            <code className="mt-2 block rounded-xl bg-zinc-950 px-3 py-2 font-mono text-sm font-semibold text-cyan-200 dark:bg-black">
              {scenario.activation.snippet}
            </code>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-zinc-600 shadow-sm dark:bg-zinc-900 dark:text-zinc-300">
            Release {scenario.releaseVersion}
            <br />
            {scenario.releaseDate}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScenarioSidebar({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <aside className="rounded-3xl border border-zinc-200 bg-white/90 p-4 shadow-xl shadow-zinc-200/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20 lg:sticky lg:top-6">
      <div className="rounded-2xl bg-zinc-950 p-4 text-white dark:bg-zinc-900">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
          Scenario nav
        </p>
        <h2 className="mt-3 text-lg font-black leading-tight tracking-tight">
          {scenario.title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          {categoryLabels[scenario.category]} · {scenario.releaseVersion}
        </p>
      </div>

      <nav className="mt-4 space-y-2 text-sm font-semibold">
        {[
          ["01", "Overview"],
          ["02", "Confidence"],
          ["03", "Workbench"],
          ["04", "Suggestions"],
        ].map(([number, label]) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white font-mono text-xs text-indigo-600 shadow-sm dark:bg-zinc-950 dark:text-indigo-300">
              {number}
            </span>
            {label}
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Excluded from allowlist
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scenario.excluded.map((item) => (
            <span
              key={item}
              className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SuggestionList({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            Prioritized suggestions
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
            Candidate rules surfaced by recent usage
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          read-only first
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {scenario.suggestions.map((suggestion) => (
          <article
            key={suggestion.label}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <div className="flex items-start justify-between gap-3">
              <code className="break-all font-mono text-sm font-bold text-zinc-950 dark:text-zinc-100">
                {suggestion.label}
              </code>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300">
                {suggestion.value}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {suggestion.note}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Workbench({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-zinc-100/70 p-3 shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/70 dark:shadow-black/20 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            Editor / TUI workbench
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
            Before and after behavior preview
          </h2>
        </div>
        <div className="flex rounded-full border border-zinc-200 bg-white p-1 text-xs font-black text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-950">
            Variant B
          </span>
          <span className="px-3 py-1.5">Full playground</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-zinc-400" /> Before
          </div>
          <EditorPane title={scenario.before.editorTitle} text={scenario.before.editorText} />
          <TuiPane title={scenario.before.terminalTitle} text={scenario.before.terminalText} compact />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> After
          </div>
          <EditorPane
            title={scenario.after.editorTitle}
            text={scenario.after.editorText}
            variant="dark"
          />
          <TuiPane title={scenario.after.terminalTitle} text={scenario.after.terminalText} />
        </div>
      </div>
    </section>
  );
}

export function FullPlaygroundPreview({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_32rem),linear-gradient(180deg,#fafafa,rgba(244,244,245,0.9))] px-4 py-6 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_32rem),linear-gradient(180deg,#09090b,#18181b)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <ScenarioSidebar scenario={scenario} />

        <main className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/90 p-6 shadow-2xl shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-black/30 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                    {categoryLabels[scenario.category]}
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {scenario.releaseVersion} · {scenario.releaseDate}
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                  {scenario.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                  {scenario.summary}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70 lg:w-72">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                  Primary action
                </p>
                <code className="mt-3 block rounded-2xl bg-zinc-950 px-4 py-3 font-mono text-sm font-bold text-cyan-200 dark:bg-black">
                  {scenario.activation.snippet}
                </code>
              </div>
            </div>
          </section>

          <ScenarioMetrics scenario={scenario} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <ConfidenceCard scenario={scenario} />
            <div className="space-y-4">
              <ScenarioRiskNote scenario={scenario} />
              <ScenarioSourceQuote scenario={scenario} />
            </div>
          </div>

          <Workbench scenario={scenario} />
          <SuggestionList scenario={scenario} />
        </main>
      </div>
    </div>
  );
}
