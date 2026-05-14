import { withBasePath } from "@/lib/assets";
import { getLatestUpdatedAt, getReleases } from "@/lib/data";
import { formatDateTimeKorean } from "@/lib/format";
import { ReleaseList } from "@/components/ReleaseList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TourController } from "@/components/TourController";

export default async function Home() {
  const releases = await getReleases();
  const updatedAt = await getLatestUpdatedAt();

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-zinc-950 dark:bg-[#090909] dark:text-zinc-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-7 rounded-lg border border-zinc-200/80 bg-white/75 p-5 shadow-sm shadow-zinc-200/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-4">
              <img
                src={withBasePath("/icon.svg")}
                alt=""
                aria-hidden
                className="h-11 w-11 shrink-0 rounded-lg shadow-sm sm:mt-1"
              />
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
                  Claude Code 릴리즈 노트 요약
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                  개발자 관점에서 핵심만 정리한 Claude Code 릴리즈 소식. 평일 오전 9시 자동 업데이트.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {updatedAt && (
                    <p className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      마지막 업데이트: {formatDateTimeKorean(updatedAt)}
                    </p>
                  )}
                  <a
                    href="/feature-lab"
                    className="inline-flex rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:border-indigo-700"
                  >
                    Claude Code Feature Lab 열기
                  </a>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <TourController />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {releases.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            아직 수집된 릴리즈가 없습니다.
          </div>
        ) : (
          <ReleaseList releases={releases} />
        )}

        <footer className="mt-16 border-t border-zinc-200 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
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
