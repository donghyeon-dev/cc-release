import type { ReleaseSummary } from "@/lib/types";
import { InlineCode } from "./InlineCode";

interface Props {
  summary: ReleaseSummary;
}

interface BucketProps {
  label: string;
  items: string[];
  accent: string;
  marker: string;
}

function Bucket({ label, items, accent, marker }: BucketProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-900">
      <h3
        className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accent}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${marker}`} />
        {label}
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[1rem_1fr] gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="min-w-0 break-words">
              <InlineCode text={item} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getDevImpactItems(devImpact: string) {
  return devImpact
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SummarySection({ summary }: Props) {
  const devImpactItems = summary.devImpact
    ? getDevImpactItems(summary.devImpact)
    : [];

  return (
    <div className="release-copy space-y-6">
      <p className="break-words border-l-4 border-zinc-900 pl-4 text-lg font-semibold leading-snug text-zinc-950 dark:border-zinc-100 dark:text-zinc-100">
        <InlineCode text={summary.headline} />
      </p>

      {devImpactItems.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-[#fafaf8] p-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            개발자 영향도
          </p>
          <ul className="space-y-2">
            {devImpactItems.map((item, i) => (
              <li key={i} className="grid grid-cols-[1rem_1fr] gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                <span className="min-w-0 break-words">
                  <InlineCode text={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        <Bucket
          label="새 기능"
          items={summary.newFeatures}
          accent="text-emerald-600 dark:text-emerald-400"
          marker="bg-emerald-500"
        />
        <Bucket
          label="변경"
          items={summary.changes}
          accent="text-blue-600 dark:text-blue-400"
          marker="bg-blue-500"
        />
        <Bucket
          label="수정"
          items={summary.fixes}
          accent="text-amber-600 dark:text-amber-400"
          marker="bg-amber-500"
        />
      </div>
    </div>
  );
}
