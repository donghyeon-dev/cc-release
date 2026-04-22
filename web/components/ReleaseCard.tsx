import type { Release } from "@/lib/types";
import { formatDateKorean } from "@/lib/format";
import { SummarySection } from "./SummarySection";
import { OriginalMarkdown } from "./OriginalMarkdown";

interface Props {
  release: Release;
}

export function ReleaseCard({ release }: Props) {
  return (
    <article className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-900">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 font-mono">
          {release.version}
        </h2>
        <time
          dateTime={release.publishedAt}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          {formatDateKorean(release.publishedAt)}
        </time>
        {release.url && (
          <a
            href={release.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline underline-offset-2 transition-colors"
          >
            GitHub에서 보기 ↗
          </a>
        )}
      </header>

      <SummarySection summary={release.summary} />
      <OriginalMarkdown body={release.originalBody} />
    </article>
  );
}
