"use client";

import { forwardRef, useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  body: string;
  open: boolean;
  onToggle: () => void;
  highlightToken?: string | null;
}

function nodeText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(nodeText).join("");
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "number") return String(children);
  return "";
}

export const OriginalMarkdown = forwardRef<HTMLDivElement, Props>(
  function OriginalMarkdown({ body, open, onToggle, highlightToken }, ref) {
    const contentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!open) return;
      const root = contentRef.current;
      if (!root) return;
      const items = root.querySelectorAll("li");
      items.forEach((li, i) => {
        li.setAttribute("data-original-line", String(i));
      });
    });

    const components: Components = {
      code({ className, children, ...props }) {
        const isBlock = typeof className === "string" && className.startsWith("language-");
        if (isBlock) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
        const text = nodeText(children);
        const isHighlight = !!highlightToken && highlightToken === text;
        const cls = [className, isHighlight ? "inline-code-highlight" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <code
            className={cls || undefined}
            data-code-token={text}
            data-source="original"
            {...props}
          >
            {children}
          </code>
        );
      },
    };

    return (
      <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-900">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 rounded-md px-1 py-1 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span
            className={`inline-block text-xs transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden
          >
            ▶
          </span>
          <span>원문 보기 (English)</span>
        </button>
        {open && (
          <div ref={ref} className="mt-4">
            <div
              ref={contentRef}
              className="markdown-body rounded-lg border border-zinc-200 bg-[#fafaf8] p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {body}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  },
);
