"use client";

import { useEffect, useRef, useState } from "react";
import { TOUR_STORAGE_KEY } from "@/lib/tour";

interface Props {
  onStart: () => void;
}

export function TourTrigger({ onStart }: Props) {
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (seen) return;

    // first visit: show floating hint after a short delay
    timerRef.current = setTimeout(() => {
      setShowHint(true);
    }, 800);

    // auto-dismiss after 6 seconds
    const dismiss = setTimeout(() => {
      setShowHint(false);
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    }, 6800);

    const handleAnyClick = () => {
      setShowHint(false);
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    };
    window.addEventListener("click", handleAnyClick, { once: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(dismiss);
      window.removeEventListener("click", handleAnyClick);
    };
  }, []);

  return (
    <div className="relative inline-flex shrink-0 items-center">
      {showHint && (
        <div
          className="tour-hint-bubble"
          role="status"
          aria-live="polite"
        >
          처음이신가요? 둘러보기
        </div>
      )}
      <button
        type="button"
        data-tour-trigger
        onClick={onStart}
        title="사이트 둘러보기"
        aria-label="사이트 둘러보기"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100${showHint ? " tour-pulse" : ""}`}
      >
        ?
      </button>
    </div>
  );
}
