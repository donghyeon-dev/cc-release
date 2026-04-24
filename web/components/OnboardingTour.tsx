"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TOUR_STEPS, type TourStep } from "@/lib/tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

function getSteps(): TourStep[] {
  return TOUR_STEPS.filter((step) => {
    if (!step.optional) return true;
    return !!document.querySelector(step.selector);
  });
}

function resolveEl(selector: string): HTMLElement | null {
  const el = document.querySelector(selector);
  return el instanceof HTMLElement ? el : null;
}

export function OnboardingTour({ open, onClose }: Props) {
  const [mobile, setMobile] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [canAdvance, setCanAdvance] = useState(true);
  const [overrideSelector, setOverrideSelector] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // initialise on open
  useEffect(() => {
    if (!open) return;
    setMobile(isMobile());
    const resolved = getSteps();
    setSteps(resolved);
    setStepIndex(0);
    setDemoRunning(false);
    setCanAdvance(true);
  }, [open]);

  // Tour UI is rendered via createPortal into document.body, which means
  // position: fixed descendants use the viewport as their containing block
  // regardless of ancestor CSS (backdrop-filter, transform, etc.). No
  // additional overflow munging on <html>/<body> is needed.

  const currentStep = steps[stepIndex] ?? null;

  const updateRect = useCallback(() => {
    if (!currentStep) return;
    const selector = overrideSelector ?? currentStep.selector;
    const el = resolveEl(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect((prev) => {
      if (
        prev &&
        prev.top === r.top &&
        prev.left === r.left &&
        prev.width === r.width &&
        prev.height === r.height
      ) {
        return prev;
      }
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    });
  }, [currentStep, overrideSelector]);

  // scroll + rect on step change (or when refocus override kicks in)
  useEffect(() => {
    if (!open || !currentStep) return;
    const selector = overrideSelector ?? currentStep.selector;
    const el = resolveEl(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // poll rect until it stabilises (smooth scroll usually finishes within ~500ms)
    let frames = 0;
    let handle = 0;
    const poll = () => {
      updateRect();
      frames += 1;
      if (frames < 40) handle = window.requestAnimationFrame(poll);
    };
    handle = window.requestAnimationFrame(poll);
    const focusTimer = window.setTimeout(() => tooltipRef.current?.focus(), 100);
    return () => {
      window.cancelAnimationFrame(handle);
      window.clearTimeout(focusTimer);
    };
  }, [open, currentStep, overrideSelector, updateRect]);

  // continuous rAF loop while tour is open — robust to layout shifts, image loads, late fonts
  useEffect(() => {
    if (!open) return;
    let handle = 0;
    const tick = () => {
      updateRect();
      handle = window.requestAnimationFrame(tick);
    };
    handle = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(handle);
  }, [open, updateRect]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if ((e.key === "ArrowRight" || e.key === "Enter") && canAdvance) {
        e.preventDefault();
        advance();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex, steps, canAdvance]);

  // demo action
  useEffect(() => {
    if (!open || !currentStep?.demo) return;
    setCanAdvance(false);
    setDemoRunning(true);
    setOverrideSelector(null);
    const el = resolveEl(currentStep.selector);
    if (!el) { setCanAdvance(true); setDemoRunning(false); return; }
    let cancelled = false;
    currentStep.demo(el).then((result) => {
      if (cancelled) return;
      if (result?.refocusSelector) {
        setOverrideSelector(result.refocusSelector);
      }
      window.setTimeout(() => {
        if (!cancelled) { setCanAdvance(true); setDemoRunning(false); }
      }, 1500);
    });
    return () => { cancelled = true; };
  }, [open, currentStep]);

  const advance = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      setDemoRunning(false);
      setCanAdvance(true);
      setOverrideSelector(null);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      setDemoRunning(false);
      setCanAdvance(true);
      setOverrideSelector(null);
    }
  };

  if (!open) return null;

  // mobile variant
  if (mobile) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="사이트 안내"
        className="tour-backdrop flex items-center justify-center px-6"
      >
        <div className="tour-tooltip max-w-sm w-full">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            데스크탑 권장
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            데스크탑에서 보시는 것을 권장합니다. 주요 기능: 필터, bullet 클릭으로 원문 이동, 원문 보기 토글.
          </p>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  const PAD = 8;
  const tooltipWidth = 320;

  // position tooltip beside the highlight (fixed coords — backdrop is fixed)
  function getTooltipStyle(): React.CSSProperties {
    if (!rect) return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: tooltipWidth };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    const estimatedHeight = 200;

    // Anchor tooltip to the visible centre of the highlighted element so it
    // never drifts far below when the element is very tall.
    const anchorY = Math.max(0, rect.top) + Math.min(rect.height, vh) / 2;
    let top = anchorY - estimatedHeight / 2;
    let left: number;

    if (spaceRight >= tooltipWidth + PAD * 2) {
      left = rect.left + rect.width + PAD;
    } else if (spaceLeft >= tooltipWidth + PAD * 2) {
      left = rect.left - tooltipWidth - PAD;
    } else {
      // wide element: stack tooltip above or below so it never overlaps
      left = Math.max(PAD, Math.min(rect.left, vw - tooltipWidth - PAD));
      const spaceAbove = rect.top;
      const spaceBelow = vh - (rect.top + rect.height);
      if (spaceAbove >= estimatedHeight + PAD) {
        top = rect.top - estimatedHeight - PAD;
      } else if (spaceBelow >= estimatedHeight + PAD) {
        top = rect.top + rect.height + PAD;
      } else {
        // neither above nor below fits — pin to top and let the user scroll
        top = PAD;
      }
    }

    // clamp vertically inside viewport
    if (top + estimatedHeight > vh - PAD) {
      top = vh - estimatedHeight - PAD;
    }
    if (top < PAD) {
      top = PAD;
    }

    return { position: "fixed", top, left, width: tooltipWidth };
  }

  const portalTarget =
    typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사이트 둘러보기"
      className="tour-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* highlight ring over element */}
      {rect && (
        <div
          className="tour-highlight"
          style={{
            position: "fixed",
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 8,
            pointerEvents: "none",
          }}
        />
      )}

      {/* tooltip */}
      <div
        ref={tooltipRef}
        tabIndex={-1}
        className="tour-tooltip"
        style={getTooltipStyle()}
        role="document"
        aria-live="polite"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {stepIndex + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="둘러보기 건너뛰기"
            className="rounded p-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            건너뛰기
          </button>
        </div>

        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
          {currentStep.title}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {currentStep.body.split(/(`[^`]+`)/).map((part, i) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={i} className="inline-code">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </p>

        {demoRunning && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            시연 중...
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            이전
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {stepIndex === steps.length - 1 ? "완료" : "다음"}
          </button>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
