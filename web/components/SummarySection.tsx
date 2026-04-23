import type { DevImpactRef, ReleaseSummary } from "@/lib/types";
import { InlineCode } from "./InlineCode";
import {
  buildRefNumberMap,
  getBulletRefNumber,
  hasClickableBackticks,
  normalizeDevImpact,
} from "@/lib/dev-impact";

interface Props {
  summary: ReleaseSummary;
  highlightToken?: string | null;
  activeRef?: DevImpactRef | null;
  onDevImpactTokenClick?: (token: string) => void;
  onDevImpactRefClick?: (ref: DevImpactRef) => void;
}

interface BucketProps {
  label: string;
  bucket: DevImpactRef["bucket"];
  items: string[];
  accent: string;
  marker: string;
  highlightToken?: string | null;
  activeRef?: DevImpactRef | null;
  refMap: Map<string, number>;
}

function bulletMatches(item: string, token: string | null | undefined) {
  if (!token) return false;
  return item.includes("`" + token + "`");
}

function Bucket({
  label,
  bucket,
  items,
  accent,
  marker,
  highlightToken,
  activeRef,
  refMap,
}: BucketProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-900">
      <h3
        className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${accent}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${marker}`} />
        {label}
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {items.map((item, i) => {
          const matchedByToken = bulletMatches(item, highlightToken);
          const matchedByRef =
            !!activeRef && activeRef.bucket === bucket && activeRef.index === i;
          const matched = matchedByToken || matchedByRef;
          const refNumber = getBulletRefNumber(bucket, i, refMap);
          return (
            <li
              key={i}
              data-ref-anchor={`${bucket}:${i}`}
              className={`grid grid-cols-[1rem_1fr] gap-2 rounded-md transition-colors ${
                matched ? "bullet-highlight" : ""
              }`}
            >
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="min-w-0 break-words">
                <InlineCode
                  text={item}
                  highlightToken={highlightToken}
                  sourceTag="korean"
                />
                {refNumber !== undefined && (
                  <sup className="bullet-ref-anchor">{refNumber}</sup>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SummarySection({
  summary,
  highlightToken,
  activeRef,
  onDevImpactTokenClick,
  onDevImpactRefClick,
}: Props) {
  const devImpactItems = normalizeDevImpact(summary.devImpact);
  const refMap = buildRefNumberMap(devImpactItems);
  const hasClickableTokens =
    !!onDevImpactTokenClick && hasClickableBackticks(devImpactItems);
  const hasRefMarkers = refMap.size > 0;

  return (
    <div className="release-copy space-y-6">
      <p className="break-words border-l-4 border-zinc-900 pl-4 text-lg font-semibold leading-snug text-zinc-950 dark:border-zinc-100 dark:text-zinc-100">
        <InlineCode text={summary.headline} highlightToken={highlightToken} />
      </p>

      {devImpactItems.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-[#fafaf8] p-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            개발자 영향도
          </p>
          <ul className="space-y-2">
            {devImpactItems.map((item, i) => (
              <li key={i} className="grid grid-cols-[1rem_1fr] gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                <span className="min-w-0 break-words">
                  <InlineCode
                    text={item.text}
                    onCodeClick={onDevImpactTokenClick}
                    highlightToken={highlightToken}
                    sourceTag="devimpact"
                  />
                  {item.refs.map((ref, j) => {
                    const num = getBulletRefNumber(ref.bucket, ref.index, refMap);
                    if (num === undefined) return null;
                    if (!onDevImpactRefClick) {
                      return (
                        <sup key={j} className="impact-ref-marker" aria-hidden>
                          {num}
                        </sup>
                      );
                    }
                    return (
                      <button
                        key={j}
                        type="button"
                        className="impact-ref-marker"
                        onClick={() => onDevImpactRefClick(ref)}
                        aria-label={`근거 항목 ${num}번 보기`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
          {(hasClickableTokens || hasRefMarkers) && (
            <p className="mt-3 text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
              {hasRefMarkers
                ? "숫자 표시를 누르면 근거가 된 항목으로 이동합니다. "
                : ""}
              {hasClickableTokens
                ? "키워드를 클릭하면 관련 한글 항목과 원문을 함께 강조합니다."
                : ""}
            </p>
          )}
        </div>
      )}

      <div className="space-y-5">
        <Bucket
          label="새 기능"
          bucket="newFeatures"
          items={summary.newFeatures}
          accent="text-emerald-600 dark:text-emerald-400"
          marker="bg-emerald-500"
          highlightToken={highlightToken}
          activeRef={activeRef}
          refMap={refMap}
        />
        <Bucket
          label="변경"
          bucket="changes"
          items={summary.changes}
          accent="text-blue-600 dark:text-blue-400"
          marker="bg-blue-500"
          highlightToken={highlightToken}
          activeRef={activeRef}
          refMap={refMap}
        />
        <Bucket
          label="수정"
          bucket="fixes"
          items={summary.fixes}
          accent="text-amber-600 dark:text-amber-400"
          marker="bg-amber-500"
          highlightToken={highlightToken}
          activeRef={activeRef}
          refMap={refMap}
        />
      </div>
    </div>
  );
}
