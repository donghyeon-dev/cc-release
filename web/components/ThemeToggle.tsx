"use client";

import { useEffect, useState } from "react";

type Theme = "white" | "black";

const STORAGE_KEY = "cc-release-theme";
const THEMES: Theme[] = ["white", "black"];

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "white";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "white" || saved === "black") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "black"
    : "white";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("white");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  const updateTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <div
      className="inline-flex shrink-0 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      role="group"
      aria-label="테마 선택"
    >
      {THEMES.map((option) => {
        const active = theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => updateTheme(option)}
            aria-pressed={active}
            className={`rounded px-3 py-1.5 transition-colors ${
              active
                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-100 dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {option === "white" ? "White" : "Black"}
          </button>
        );
      })}
    </div>
  );
}
