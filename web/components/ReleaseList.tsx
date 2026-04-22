"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Release } from "@/lib/types";
import { filterReleases } from "@/lib/filter";
import { ReleaseCard } from "./ReleaseCard";
import { SearchBar } from "./SearchBar";

interface Props {
  releases: Release[];
}

const PAGE_SIZE = 20;

export function ReleaseList({ releases }: Props) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(
    () => filterReleases(releases, deferredQuery),
    [releases, deferredQuery],
  );

  const effectiveVisible = deferredQuery.trim() === "" ? visibleCount : filtered.length;
  const visible = filtered.slice(0, effectiveVisible);
  const hasMore = effectiveVisible < filtered.length;
  const remaining = filtered.length - effectiveVisible;

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      <SearchBar
        value={query}
        onChange={handleQueryChange}
        matchCount={filtered.length}
        totalCount={releases.length}
      />

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          일치하는 릴리즈가 없습니다.
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {visible.map((r) => (
              <ReleaseCard key={r.tagName} release={r} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                더 보기 ({remaining}건 남음)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
