import type { Metadata } from "next";
import { FeatureLabPlayground } from "@/components/feature-lab/FeatureLabPlayground";

export const metadata: Metadata = {
  title: "Claude Code Feature Lab · cc-release",
  description:
    "Claude Code의 env, settings, slash command를 켜면 TUI 경험이 어떻게 달라지는지 체험하는 playground.",
};

export default function FeatureLabPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950 dark:bg-[#090909] dark:text-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/85 p-6 shadow-sm shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
                cc-release experiment
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Claude Code Feature Lab
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                릴리즈 하나가 아니라 Claude Code의 env, settings, slash command를 기능 단위로
                고르고, 활성화하면 editor와 TUI 경험이 어떻게 달라지는지 애니메이션으로 미리 봅니다.
              </p>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/30 lg:w-80">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                Product direction
              </p>
              <p className="mt-3 text-sm leading-6 text-indigo-950 dark:text-indigo-100">
                “이 설정을 켜면 Claude Code가 어떻게 달라지나요?”에 답하는 기능 중심 playground입니다.
              </p>
            </div>
          </div>
        </header>

        <FeatureLabPlayground />
      </div>
    </main>
  );
}
