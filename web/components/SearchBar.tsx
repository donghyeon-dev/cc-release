"use client";

interface Props {
  value: string;
  onChange: (next: string) => void;
  matchCount: number;
  totalCount: number;
}

export function SearchBar({ value, onChange, matchCount, totalCount }: Props) {
  const active = value.trim().length > 0;
  return (
    <div className="sticky top-3 z-10 mb-7 w-full max-w-full rounded-lg border border-zinc-200/90 bg-white/90 shadow-sm shadow-zinc-200/60 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-none">
      <div className="flex min-w-0 items-center gap-3 p-2.5 sm:p-3">
        <div className="relative flex-1">
          <svg
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="버전 또는 키워드 검색 (예: 2.1.3, 2.1, CLAUDE_CODE_FORK_SUBAGENT)"
            aria-label="릴리즈 검색"
            className="h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-9 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:bg-zinc-950 dark:focus:ring-zinc-800"
          />
          {active && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          )}
        </div>
        <div className="rounded-md bg-zinc-100 px-2.5 py-2 text-xs font-medium tabular-nums whitespace-nowrap text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          {active ? `${matchCount} / ${totalCount}건` : `${totalCount}건`}
        </div>
      </div>
    </div>
  );
}
