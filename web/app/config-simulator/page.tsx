import type { Metadata } from "next";
import { ConfigSimulatorPlayground } from "@/components/config-simulator/ConfigSimulatorPlayground";
import { withBasePath } from "@/lib/assets";
import { getConfigSimulatorScenarios } from "@/lib/config-simulator";
import { getReleases } from "@/lib/data";
import { getFeatureLabFeatures } from "@/lib/feature-lab-data";

export const metadata: Metadata = {
  title: "Claude Code Config Simulator · cc-release",
  description:
    "Claude Code settings를 수정하기 전에 권한·MCP 설정 선택이 어떤 영향을 주는지 미리 보는 config simulator.",
};

export default async function ConfigSimulatorPage() {
  const [features, releases, scenarios] = await Promise.all([
    getFeatureLabFeatures(),
    getReleases(),
    getConfigSimulatorScenarios(),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950 dark:bg-[#090909] dark:text-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white/85 p-6 shadow-sm shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none sm:p-8">
          <a
            href={withBasePath("/")}
            className="mb-5 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-700 dark:hover:text-indigo-200"
          >
            ← 릴리즈 요약 메인으로 돌아가기
          </a>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
                cc-release config simulator
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Claude Code 설정을 바꾸기 전에 먼저 미리보기
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                이 페이지는 <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-900">.claude/settings.json</code> 또는 로컬 설정을 직접 편집하기 전에,
                권한 allow/deny와 MCP 경계 선택이 승인 프롬프트·팀 guardrail·자동화 흐름에 어떤 차이를 만드는지 비교해 보는 사전 preview입니다.
              </p>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/70 dark:bg-indigo-950/30 lg:w-80">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                Preview scope
              </p>
              <p className="mt-3 text-sm leading-6 text-indigo-950 dark:text-indigo-100">
                Goal 1은 실제 파일을 쓰지 않습니다. 세 가지 starter configuration을 고르고 before/after, 생성 settings, 위험 완화 포인트를 확인합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={withBasePath("/feature-lab/")}
              className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-black text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/70 dark:bg-zinc-950 dark:text-indigo-200 dark:hover:border-indigo-700"
            >
              Related Feature Lab 보기 →
            </a>
            <a
              href={withBasePath("/")}
              className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-black text-amber-800 transition hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/70 dark:bg-zinc-950 dark:text-amber-200 dark:hover:border-amber-700"
            >
              Release Intelligence 카드로 돌아가기 →
            </a>
          </div>
        </header>

        <ConfigSimulatorPlayground
          scenarios={scenarios}
          features={features}
          releases={releases}
        />
      </div>
    </main>
  );
}
