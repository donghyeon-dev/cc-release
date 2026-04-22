import type { ReleaseSummary } from "@/lib/types";

interface Props {
  summary: ReleaseSummary;
}

interface BucketProps {
  label: string;
  items: string[];
  accent: string;
}

function Bucket({ label, items, accent }: BucketProps) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3
        className={`text-xs font-semibold uppercase tracking-wider ${accent} mb-2`}
      >
        {label}
      </h3>
      <ul className="space-y-1.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-zinc-400 select-none mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SummarySection({ summary }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
        {summary.headline}
      </p>

      <div className="space-y-4">
        <Bucket
          label="새 기능"
          items={summary.newFeatures}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <Bucket
          label="변경"
          items={summary.changes}
          accent="text-blue-600 dark:text-blue-400"
        />
        <Bucket
          label="수정"
          items={summary.fixes}
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      {summary.devImpact && (
        <div className="rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            개발자 영향도
          </p>
          <p>{summary.devImpact}</p>
        </div>
      )}
    </div>
  );
}
