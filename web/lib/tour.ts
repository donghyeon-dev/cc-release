export interface DemoResult {
  /**
   * After the demo runs, switch the highlight ring to this selector so the
   * user can see where the interaction actually moved focus (e.g. the
   * matching English <li> inside the expanded original body).
   */
  refocusSelector?: string;
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  selector: string;
  optional?: boolean;
  demo?: (el: HTMLElement) => Promise<DemoResult | void>;
}

export const TOUR_STORAGE_KEY = "cc-release-tour-seen";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "search",
    title: "검색으로 빠르게 찾기",
    body: "버전 번호나 키워드로 릴리즈를 필터링할 수 있어요. 예: `Opus`, `v2.1.117`, `MCP`",
    selector: ".sticky.top-3",
  },
  {
    id: "summary",
    title: "한국어 요약",
    body: "개발자 관점에서 새 기능 / 변경 / 수정으로 분류된 bullet으로 핵심만 보여줍니다.",
    selector: ".release-copy",
  },
  {
    id: "bullet-dot",
    title: "점을 누르면 영어 원문으로",
    body: "주황색으로 커지는 점을 클릭하면 원문 섹션이 펼쳐지고 해당 원문 줄로 스크롤됩니다.",
    selector: ".bullet-dot-clickable",
    demo: async (el: HTMLElement) => {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      // data-original-anchor lives on the <li>, not on the dot button itself
      const anchorHost = el.closest<HTMLElement>("[data-original-anchor]") ?? el;
      const refs = (anchorHost.getAttribute("data-original-anchor") ?? "").split(",");
      const firstRef = refs[0];
      el.click();
      if (firstRef && /^\d+$/.test(firstRef)) {
        const selector = `[data-original-line="${firstRef}"]`;
        // wait until the original <li> is rendered and annotated (ReactMarkdown + useEffect)
        const deadline = Date.now() + 3000;
        while (Date.now() < deadline) {
          if (document.querySelector(selector)) break;
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
        }
        return { refocusSelector: selector };
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      return {};
    },
  },
  {
    id: "impact-ref",
    title: "영향도 ↔ 근거 bullet",
    body: "개발자 영향도 문장 끝의 숫자를 누르면 근거가 된 bullet으로 이동합니다.",
    selector: ".impact-ref-marker",
    optional: true,
  },
  {
    id: "original-toggle",
    title: "원문 보기",
    body: "영어 원문 전체는 언제든 이 버튼으로 펼쳐볼 수 있어요.",
    selector: "button[data-original-toggle]",
  },
];
