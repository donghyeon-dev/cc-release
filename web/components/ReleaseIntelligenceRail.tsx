import type { ReleaseIntelligenceBucket } from "@/lib/release-intelligence";

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function ReleaseIntelligenceRail({
  buckets,
}: {
  buckets: ReleaseIntelligenceBucket[];
}) {
  if (buckets.length === 0) return null;

  return (
    <section className="mb-7 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-5 shadow-sm shadow-amber-100/70 dark:border-amber-900/60 dark:from-amber-950/25 dark:via-zinc-950 dark:to-indigo-950/25 dark:shadow-none sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
            What matters now
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
            Release Intelligence
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300 sm:text-base">
            최근 Claude Code 변경 중 설정·권한·자동화·안정성에 바로 영향을 줄 수 있는 항목만 먼저 모았습니다.
          </p>
        </div>
        <p className="inline-flex w-fit rounded-full border border-amber-200 bg-white/75 px-3 py-1 text-xs font-bold text-amber-800 dark:border-amber-900 dark:bg-zinc-950/70 dark:text-amber-200">
          {buckets.reduce((sum, bucket) => sum + bucket.items.length, 0)}개 신호
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {buckets.map((bucket) => (
          <article
            key={bucket.id}
            className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                  {bucket.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {bucket.description}
                </p>
              </div>
              <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-black text-white dark:bg-white dark:text-zinc-950">
                {bucket.items.length}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {bucket.items.map((item) => (
                <a
                  key={`${bucket.id}-${item.version}`}
                  href={item.href}
                  className="group block rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700 dark:hover:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                      {item.version}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <time className="font-semibold text-zinc-500 dark:text-zinc-400" dateTime={item.publishedAt}>
                      {formatDate(item.publishedAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm font-bold leading-5 text-zinc-900 dark:text-zinc-100">
                    {item.headline}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                    {item.reason}
                  </p>
                  <span className="mt-2 inline-flex text-[11px] font-black uppercase tracking-wider text-indigo-600 transition group-hover:translate-x-0.5 dark:text-indigo-300">
                    릴리즈 보기 →
                  </span>
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
