import type { Metadata } from "next";
import { CompactReleaseCardPreview } from "@/components/impact-preview/CompactReleaseCardPreview";
import { FullPlaygroundPreview } from "@/components/impact-preview/FullPlaygroundPreview";
import { GuidedDiffWizardPreview } from "@/components/impact-preview/GuidedDiffWizardPreview";
import { lessPermissionPromptsScenario } from "@/lib/impact-preview";

export const metadata: Metadata = {
  title: "Release Impact Preview · cc-release",
  description:
    "Claude Code 릴리즈의 설정/명령 변화가 실제 editor와 TUI에서 어떻게 체감되는지 보여주는 실험 화면.",
};

const variants = [
  {
    id: "a",
    title: "A. Compact release card",
    description:
      "기존 릴리즈 목록 안에 바로 붙일 수 있는 가장 가벼운 진입점입니다.",
  },
  {
    id: "b",
    title: "B. Full impact playground",
    description:
      "상세 페이지에서 릴리즈 영향도, 설정 diff, TUI preview를 깊게 체험하는 메인 화면입니다.",
  },
  {
    id: "c",
    title: "C. Guided diff wizard",
    description:
      "설정/권한 변경을 단계별로 설명하고 안전하게 복사하도록 돕는 교육형 흐름입니다.",
  },
];

export default function ImpactPreviewPage() {
  const scenario = lessPermissionPromptsScenario;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950 dark:bg-[#090909] dark:text-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/85 p-6 shadow-sm shadow-zinc-200/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75 dark:shadow-none sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
                cc-release experiment
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                Release Impact Preview
              </h1>
              <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                릴리즈를 읽고 끝내지 않고, 새 명령/설정이 editor와 Claude Code TUI에서
                어떻게 체감되는지 미리 보는 세 가지 화면 방향입니다.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 lg:w-80">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Selected feature
              </p>
              <code className="mt-2 block rounded-xl bg-zinc-950 px-3 py-2 font-mono text-sm font-semibold text-cyan-200 dark:bg-black">
                {scenario.activation.snippet}
              </code>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {scenario.summary}
              </p>
            </div>
          </div>

          <nav className="mt-8 grid gap-3 md:grid-cols-3" aria-label="Preview variants">
            {variants.map((variant) => (
              <a
                key={variant.id}
                href={`#variant-${variant.id}`}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
              >
                <p className="font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {variant.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {variant.description}
                </p>
              </a>
            ))}
          </nav>
        </header>

        <div className="mt-10 space-y-16">
          <section id="variant-a" className="scroll-mt-8">
            <SectionHeader
              eyebrow="Variant A"
              title="Compact release card"
              description="기존 릴리즈 목록의 카드 안에서 즉시 체감 preview를 보여주는 형태. MVP로 가장 현실적입니다."
            />
            <div className="mt-5">
              <CompactReleaseCardPreview scenario={scenario} />
            </div>
          </section>

          <section id="variant-b" className="scroll-mt-8">
            <SectionHeader
              eyebrow="Variant B"
              title="Full impact playground"
              description="별도 상세 페이지에서 릴리즈 영향도를 깊게 탐색하는 메인 제품 화면입니다."
            />
            <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200 shadow-sm dark:border-zinc-800">
              <FullPlaygroundPreview scenario={scenario} />
            </div>
          </section>

          <section id="variant-c" className="scroll-mt-8">
            <SectionHeader
              eyebrow="Variant C"
              title="Guided diff wizard"
              description="설정 변경을 단계별로 설명하고, 자동 적용 대신 복사/검토 흐름으로 안전하게 안내합니다."
            />
            <div className="mt-5">
              <GuidedDiffWizardPreview scenario={scenario} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-l-4 border-indigo-500 pl-4">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
