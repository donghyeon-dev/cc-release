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
    <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 mb-6 bg-zinc-50/90 dark:bg-black/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
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
            className="w-full pl-9 pr-9 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
          {active && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="검색어 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg
                className="w-4 h-4"
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
        <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap tabular-nums">
          {active ? `${matchCount} / ${totalCount}건` : `${totalCount}건`}
        </div>
      </div>
    </div>
  );
}
