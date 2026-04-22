import { getLatestUpdatedAt, getReleases } from "@/lib/data";
import { formatDateTimeKorean } from "@/lib/format";
import { ReleaseCard } from "@/components/ReleaseCard";

export default async function Home() {
  const releases = await getReleases();
  const updatedAt = await getLatestUpdatedAt();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Claude Code 릴리즈 노트 요약
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            개발자 관점에서 핵심만 정리한 Claude Code 릴리즈 소식. 매일 오전 9시 자동 업데이트.
          </p>
          {updatedAt && (
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
              마지막 업데이트: {formatDateTimeKorean(updatedAt)}
            </p>
          )}
        </header>

        {releases.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center text-zinc-500">
            아직 수집된 릴리즈가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {releases.map((r) => (
              <ReleaseCard key={r.tagName} release={r} />
            ))}
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          <p>
            원본 저장소:{" "}
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              anthropics/claude-code
            </a>
            {" · "}
            <a
              href="https://github.com/donghyeon-dev/cc-release"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              이 프로젝트
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
