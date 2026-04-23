#!/usr/bin/env node
// data/releases.json 의 v2.0.73~v2.1.117 범위 항목에서
// summary.newFeatures/changes/fixes 의 각 bullet (문자열) 을
// { text, originalRefs: number[] } 객체로 결정적 변환.
//
// originalRefs 는 originalBody 의 markdown 리스트 아이템(<li>) 을
// DFS 순서로 0-based 인덱싱한 값 배열.
//
// 사용법:
//   node scripts/enrich-bullet-original-refs.mjs [options]
//
// 옵션:
//   --dry-run            파일 미수정, 첫 3건 샘플 stderr 출력
//   --limit N            대상 범위 안에서 상위 N 건만 처리
//   --only vX.Y.Z        특정 버전만 재계산 (범위 밖이면 에러)
//   --from vX.Y.Z        시작 버전 (기본 v2.0.73)
//   --to vX.Y.Z          끝 버전 (기본 v2.1.117)
//   --force              이미 객체인 bullet 도 재계산
//   --jaccard N          Tier 2 유사도 임계값 (기본 0.2)

import fs from "node:fs";
import path from "node:path";

const DATA = path.resolve("data/releases.json");
const argv = process.argv.slice(2);

function getFlag(name) {
  return argv.includes(name);
}
function getOpt(name, fallback) {
  const idx = argv.indexOf(name);
  if (idx === -1) return fallback;
  return argv[idx + 1];
}

const DRY_RUN = getFlag("--dry-run");
const FORCE = getFlag("--force");
const LIMIT = getOpt("--limit") ? Number(getOpt("--limit")) : Infinity;
const ONLY = getOpt("--only");
const FROM = getOpt("--from", "v2.0.73");
const TO = getOpt("--to", "v2.1.117");
const JACCARD_THRESHOLD = Number(getOpt("--jaccard", "0.2"));

function parseVersion(v) {
  const parts = (v ?? "").replace(/^v/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function versionCmp(a, b) {
  const [aM, am, ap] = parseVersion(a);
  const [bM, bm, bp] = parseVersion(b);
  if (aM !== bM) return aM - bM;
  if (am !== bm) return am - bm;
  return ap - bp;
}

function inRange(version) {
  return versionCmp(version, FROM) >= 0 && versionCmp(version, TO) <= 0;
}

const STOPWORDS = new Set([
  "가", "이", "은", "는", "을", "를", "에", "의", "와", "과", "로", "으로",
  "수", "것", "등", "및", "대해", "대한", "되는", "되어", "된다", "한다",
  "있다", "있음", "있어", "없다", "없음", "통해", "따라", "같은", "같이",
  "또는", "또한", "하지만", "때문에", "경우", "가능", "필요", "확인", "변경",
  "추가", "수정", "개선", "제거", "지원",
  "the", "and", "for", "with", "now", "when", "that", "this", "from",
  "into", "have", "has", "been", "will", "not", "but", "you", "your",
  "can", "are", "was", "were", "their", "them", "its", "some", "all",
  "add", "fix", "new", "use", "used",
]);

const BACKTICK_RE = /`([^`\n]+)`/g;
const ASCII_TOKEN_RE = /[A-Za-z][A-Za-z0-9._/\-]{2,}/g;
const HANGUL_TOKEN_RE = /[가-힣]{2,}/g;

function extractBacktickTokens(text) {
  const tokens = [];
  let m;
  BACKTICK_RE.lastIndex = 0;
  while ((m = BACKTICK_RE.exec(text)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

function tokenize(text) {
  const tokens = new Set();
  for (const m of text.matchAll(ASCII_TOKEN_RE)) {
    const t = m[0].toLowerCase();
    if (!STOPWORDS.has(t)) tokens.add(t);
  }
  for (const m of text.matchAll(HANGUL_TOKEN_RE)) {
    const t = m[0];
    if (!STOPWORDS.has(t)) tokens.add(t);
  }
  return tokens;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// originalBody 의 markdown 리스트 아이템을 DFS 순서로 추출.
// ReactMarkdown 이 돌려주는 <li> 순서와 일치해야 한다.
// 규칙:
//   - `^\s*[-*+]\s` 로 시작하는 줄을 리스트 아이템으로 인식
//   - 같은 아이템이 이어지는 줄(들여쓰기) 은 해당 아이템 텍스트에 이어붙임
//   - 번호 리스트 `^\s*\d+\.\s` 도 동일하게 처리
//   - 코드 블록(```) 안은 무시
//   - 중첩 깊이와 무관하게 발견 순서대로 0, 1, 2, ... 부여
function extractOriginalItems(body) {
  if (!body || typeof body !== "string") return [];
  const lines = body.split(/\r?\n/);
  const items = [];
  let current = null;
  let inCodeFence = false;
  const listMarker = /^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/;

  const flush = () => {
    if (current !== null) {
      items.push(current.trim());
      current = null;
    }
  };

  for (const rawLine of lines) {
    if (/^\s*```/.test(rawLine)) {
      // code fence toggles; inside code fence we still continue a current item
      // only if it was already capturing — but code blocks are separate so flush
      if (!inCodeFence) {
        flush();
      }
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const m = rawLine.match(listMarker);
    if (m) {
      flush();
      current = m[2];
      continue;
    }

    if (/^\s*$/.test(rawLine)) {
      flush();
      continue;
    }

    if (current !== null && /^\s+\S/.test(rawLine)) {
      // continuation line belongs to the current item
      current += " " + rawLine.trim();
      continue;
    }

    // non-list, non-continuation content → closes any pending item
    flush();
  }
  flush();
  return items;
}

function findOriginalRefs(bulletText, originalItems, threshold) {
  const refs = [];

  // Tier 1: backtick token 매칭
  const tokens = extractBacktickTokens(bulletText);
  if (tokens.length > 0) {
    for (const token of tokens) {
      const needle = "`" + token + "`";
      for (let i = 0; i < originalItems.length; i++) {
        if (originalItems[i].includes(needle)) {
          if (!refs.includes(i)) refs.push(i);
        }
      }
    }
    if (refs.length > 0) {
      return { refs: refs.sort((a, b) => a - b), tier: 1 };
    }
  }

  // Tier 2: Jaccard 유사도
  const bTokens = tokenize(bulletText);
  if (bTokens.size === 0) return { refs: [], tier: 0 };

  const scored = [];
  for (let i = 0; i < originalItems.length; i++) {
    const oTokens = tokenize(originalItems[i]);
    const score = jaccard(bTokens, oTokens);
    if (score >= threshold) {
      scored.push({ index: i, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 2).map((s) => s.index).sort((a, b) => a - b);
  return { refs: top, tier: top.length > 0 ? 2 : 0 };
}

const stats = {
  scope: `${FROM}..${TO}`,
  eligibleReleases: 0,
  processedReleases: 0,
  skippedOutOfScope: 0,
  skippedNoOriginalBody: 0,
  skippedNoListItems: 0,
  tier1Bullets: 0,
  tier2Bullets: 0,
  orphanBullets: 0,
  totalBullets: 0,
};

const drySamples = [];

function enrichRelease(release) {
  const summary = release.summary;
  const body = release.originalBody ?? "";
  if (!body.trim()) {
    stats.skippedNoOriginalBody++;
    return null;
  }

  const items = extractOriginalItems(body);
  if (items.length === 0) {
    stats.skippedNoListItems++;
    return null;
  }

  const updated = { newFeatures: [], changes: [], fixes: [] };
  let changed = false;

  for (const bucket of ["newFeatures", "changes", "fixes"]) {
    const arr = summary[bucket] ?? [];
    const out = [];
    for (const raw of arr) {
      stats.totalBullets++;
      const isObj = typeof raw === "object" && raw !== null && "text" in raw;
      if (isObj && !FORCE) {
        out.push(raw);
        continue;
      }
      const text = isObj ? raw.text : raw;
      const { refs, tier } = findOriginalRefs(text, items, JACCARD_THRESHOLD);
      if (tier === 1) stats.tier1Bullets++;
      else if (tier === 2) stats.tier2Bullets++;
      else stats.orphanBullets++;
      out.push({ text, originalRefs: refs });
      changed = true;
    }
    updated[bucket] = out;
  }

  return changed ? updated : null;
}

function main() {
  const raw = fs.readFileSync(DATA, "utf-8");
  const releases = JSON.parse(raw);
  let processed = 0;

  if (ONLY && !inRange(ONLY)) {
    console.error(`[error] --only ${ONLY} 이 범위 ${FROM}..${TO} 밖`);
    process.exit(2);
  }

  for (const r of releases) {
    const versionInRange = inRange(r.version);
    const versionSelected = ONLY ? r.version === ONLY : versionInRange;

    if (!versionInRange) stats.skippedOutOfScope++;
    if (!versionSelected) continue;
    if (processed >= LIMIT) continue;

    stats.eligibleReleases++;
    const next = enrichRelease(r);
    if (next === null) continue;

    const before = {
      newFeatures: r.summary.newFeatures,
      changes: r.summary.changes,
      fixes: r.summary.fixes,
    };

    if (DRY_RUN) {
      if (drySamples.length < 3) {
        drySamples.push({ version: r.version, before, after: next });
      }
    } else {
      r.summary.newFeatures = next.newFeatures;
      r.summary.changes = next.changes;
      r.summary.fixes = next.fixes;
      const model = r.summaryModel ?? "";
      if (!model.includes("+origrefs-v1")) {
        r.summaryModel = model ? `${model} +origrefs-v1` : "+origrefs-v1";
      }
    }

    stats.processedReleases++;
    processed++;
  }

  if (!DRY_RUN) {
    fs.writeFileSync(DATA, JSON.stringify(releases, null, 2) + "\n", "utf-8");
  }

  console.error(`scope: ${stats.scope}`);
  console.error(`eligible releases: ${stats.eligibleReleases}`);
  console.error(`processed releases: ${stats.processedReleases}`);
  console.error(`skipped out of scope: ${stats.skippedOutOfScope}`);
  console.error(`skipped (no originalBody): ${stats.skippedNoOriginalBody}`);
  console.error(`skipped (no list items): ${stats.skippedNoListItems}`);
  console.error(`total bullets: ${stats.totalBullets}`);
  console.error(`tier-1 matched (backtick): ${stats.tier1Bullets}`);
  console.error(`tier-2 matched (jaccard): ${stats.tier2Bullets}`);
  console.error(`orphan (no refs): ${stats.orphanBullets}`);

  if (DRY_RUN) {
    console.error("\n=== dry-run samples ===");
    for (const s of drySamples) {
      console.error(`\n[${s.version}]`);
      console.error(`after: ${JSON.stringify(s.after, null, 2)}`);
    }
  }
}

main();
