import type { ReleaseScenario } from "@/lib/impact-preview";

interface EditorPaneProps {
  title: string;
  text: string;
  variant?: "light" | "dark";
}

interface TuiPaneProps {
  title: string;
  text: string;
  compact?: boolean;
}

export function EditorPane({ title, text, variant = "light" }: EditorPaneProps) {
  return (
    <div
      className={
        variant === "dark"
          ? "overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100"
          : "overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-950"
      }
    >
      <div
        className={
          variant === "dark"
            ? "flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-[11px] font-semibold text-zinc-400"
            : "flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[11px] font-semibold text-zinc-500"
        }
      >
        <span>{title}</span>
        <span>editor</span>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 sm:text-[13px]">
        {text}
      </pre>
    </div>
  );
}

export function TuiPane({ title, text, compact = false }: TuiPaneProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#070910] text-zinc-200 shadow-inner shadow-cyan-950/20">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] font-semibold text-cyan-300">
        <span>{title}</span>
        <span>expected</span>
      </div>
      <pre
        className={`overflow-x-auto whitespace-pre-wrap p-4 font-mono text-[12px] leading-6 ${
          compact ? "max-h-72" : "min-h-72"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}

export function ScenarioMetrics({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {scenario.metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-zinc-200 bg-white/85 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {metric.label}
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ScenarioRiskNote({ scenario }: { scenario: ReleaseScenario }) {
  const tone =
    scenario.riskLevel === "high"
      ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100"
      : scenario.riskLevel === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"
        : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tone}`}>
      <span className="mr-2 rounded-full bg-current px-2 py-0.5 text-[10px] font-black uppercase text-white opacity-80">
        {scenario.riskLevel}
      </span>
      {scenario.riskNote}
    </div>
  );
}

export function ScenarioSourceQuote({ scenario }: { scenario: ReleaseScenario }) {
  return (
    <blockquote className="rounded-xl border-l-4 border-indigo-500 bg-white/80 p-4 text-sm leading-6 text-zinc-700 shadow-sm dark:bg-zinc-950/70 dark:text-zinc-300">
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        원문 근거 · {scenario.releaseVersion}
      </p>
      <p className="mt-2">{scenario.sourceQuote}</p>
    </blockquote>
  );
}
