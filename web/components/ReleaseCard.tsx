"use client";

import { useEffect, useRef, useState } from "react";
import type { Release } from "@/lib/types";
import { formatDateKorean } from "@/lib/format";
import { SummarySection } from "./SummarySection";
import { OriginalMarkdown } from "./OriginalMarkdown";

interface Props {
  release: Release;
}

export function ReleaseCard({ release }: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const [originalOpen, setOriginalOpen] = useState(false);
  const [highlightToken, setHighlightToken] = useState<string | null>(null);

  const handleTokenClick = (token: string) => {
    if (highlightToken === token) {
      setHighlightToken(null);
      return;
    }
    setHighlightToken(token);
    setOriginalOpen(true);
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

  return (
    <article
      ref={cardRef}
      className="w-full max-w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm shadow-zinc-200/70 transition-shadow hover:shadow-md hover:shadow-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none dark:hover:border-zinc-700"
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
        <SummarySection
          summary={release.summary}
          highlightToken={highlightToken}
          onDevImpactTokenClick={handleTokenClick}
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
