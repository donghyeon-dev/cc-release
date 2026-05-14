import type { ReleaseScenario } from "@/lib/impact-preview";
import {
  EditorPane,
  ScenarioRiskNote,
  TuiPane,
} from "@/components/impact-preview/ScenarioPrimitives";

export function CompactReleaseCardPreview({
  scenario,
}: {
  scenario: ReleaseScenario;
}) {
  const summaryMetrics = scenario.metrics.slice(0, 3);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
      <header className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-indigo-50/60 px-5 py-4 dark:border-zinc-900 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-indigo-950/20 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="rounded-md bg-zinc-950 px-2.5 py-1 font-mono text-white dark:bg-zinc-100 dark:text-zinc-950">
            {scenario.releaseVersion}
          </span>
          <time dateTime={scenario.releaseDate}>{scenario.releaseDate}</time>
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 uppercase tracking-wide text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300">
            Impact preview
          </span>
        </div>

        <div className="mt-4 max-w-3xl">
          <h3 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
            {scenario.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {scenario.summary}
          </p>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <section
          aria-label="Release impact summary"
          className="grid gap-3 sm:grid-cols-3"
        >
          {summaryMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {metric.label}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {metric.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                Suggested result
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {scenario.impact}
              </p>
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              {scenario.activation.snippet}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <EditorPane
              title={scenario.after.editorTitle}
              text={scenario.after.editorText}
            />
            <TuiPane
              title={scenario.after.terminalTitle}
              text={scenario.after.terminalText}
              compact
            />
          </div>
        </section>

        <ScenarioRiskNote scenario={scenario} />
      </div>
    </article>
  );
}
