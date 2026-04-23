#!/usr/bin/env node
// data/releases.json 의 v2.0.73~v2.1.117 범위 항목에서
// summary.devImpact (문자열) 을 DevImpactItem[] 로 결정적 변환.
//
// 사용법:
//   node scripts/enrich-dev-impact-refs.mjs [options]
//
// 옵션:
//   --dry-run            파일 미수정, 첫 5건 샘플 stderr 출력
//   --limit N            대상 범위 안에서 상위 N 건만 처리
//   --only vX.Y.Z        특정 버전만 재계산 (범위 밖이면 에러)
//   --from vX.Y.Z        시작 버전 (기본 v2.0.73)
//   --to vX.Y.Z          끝 버전 (기본 v2.1.117)
//   --force              이미 배열인 항목도 재계산
//   --jaccard N          Tier 2 유사도 임계값 (기본 0.15)

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
const JACCARD_THRESHOLD = Number(getOpt("--jaccard", "0.15"));

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
    tokens.add(m[0].toLowerCase());
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

function splitSentences(devImpact) {
  return devImpact
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function refKey(ref) {
  return `${ref.bucket}:${ref.index}`;
}

function dedupeRefs(refs) {
  const seen = new Set();
  const out = [];
  const order = { newFeatures: 0, changes: 1, fixes: 2 };
  for (const r of refs) {
    const k = refKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  out.sort((a, b) => {
    const oa = order[a.bucket] ?? 99;
    const ob = order[b.bucket] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.index - b.index;
  });
  return out;
}

function findTier1Refs(sentence, summary) {
  const tokens = extractBacktickTokens(sentence);
  if (tokens.length === 0) return [];
  const refs = [];
  for (const token of tokens) {
    const needle = "`" + token + "`";
    for (const bucket of ["newFeatures", "changes", "fixes"]) {
      const arr = summary[bucket] ?? [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].includes(needle)) {
          refs.push({ bucket, index: i });
        }
      }
    }
  }
  return dedupeRefs(refs);
}

function findTier2Refs(sentence, summary, threshold) {
  const sTokens = tokenize(sentence);
  if (sTokens.size === 0) return [];
  const candidates = [];
  for (const bucket of ["newFeatures", "changes", "fixes"]) {
    const arr = summary[bucket] ?? [];
    for (let i = 0; i < arr.length; i++) {
      const bTokens = tokenize(arr[i]);
      const score = jaccard(sTokens, bTokens);
      if (score >= threshold) {
        candidates.push({ bucket, index: i, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return dedupeRefs(
    candidates.slice(0, 2).map(({ bucket, index }) => ({ bucket, index })),
  );
}

const stats = {
  scope: `${FROM}..${TO}`,
  eligibleReleases: 0,
  processedReleases: 0,
  skippedOutOfScope: 0,
  skippedAlreadyStructured: 0,
  tier1Sentences: 0,
  tier2Sentences: 0,
  tier3Inherited: 0,
  orphanSentences: 0,
};

const drySamples = [];

function enrich(release) {
  const summary = release.summary;
  const di = summary.devImpact;

  if (Array.isArray(di) && !FORCE) {
    stats.skippedAlreadyStructured++;
    return null;
  }

  const text = typeof di === "string" ? di : "";
  if (text.trim() === "") {
    return [];
  }

  const sentences = splitSentences(text);
  const items = [];
  const perSentenceRefs = [];

  for (const sentence of sentences) {
    let refs = findTier1Refs(sentence, summary);
    let tier = 1;
    if (refs.length === 0) {
      refs = findTier2Refs(sentence, summary, JACCARD_THRESHOLD);
      tier = refs.length > 0 ? 2 : 0;
    }
    perSentenceRefs.push({ sentence, refs, tier });
  }

  for (let i = 0; i < perSentenceRefs.length; i++) {
    const cur = perSentenceRefs[i];
    if (cur.refs.length > 0) continue;
    const prev = i > 0 ? perSentenceRefs[i - 1] : null;
    if (prev && prev.refs.length > 0) {
      cur.refs = [...prev.refs];
      cur.tier = 3;
      continue;
    }
    const next = i + 1 < perSentenceRefs.length ? perSentenceRefs[i + 1] : null;
    if (next && next.refs.length > 0) {
      cur.refs = [...next.refs];
      cur.tier = 3;
      continue;
    }
  }

  for (const entry of perSentenceRefs) {
    if (entry.tier === 1) stats.tier1Sentences++;
    else if (entry.tier === 2) stats.tier2Sentences++;
    else if (entry.tier === 3) stats.tier3Inherited++;
    else stats.orphanSentences++;
    items.push({ text: entry.sentence, refs: dedupeRefs(entry.refs) });
  }

  return items;
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
    const before = r.summary.devImpact;
    const next = enrich(r);

    if (next === null) continue;

    if (DRY_RUN) {
      if (drySamples.length < 5) {
        drySamples.push({
          version: r.version,
          before,
          after: next,
        });
      }
    } else {
      r.summary.devImpact = next;
      const model = r.summaryModel ?? "";
      if (!model.includes("+refs-v1")) {
        r.summaryModel = model ? `${model} +refs-v1` : "+refs-v1";
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
  console.error(`skipped already structured: ${stats.skippedAlreadyStructured}`);
  console.error(`tier-1 matched sentences: ${stats.tier1Sentences}`);
  console.error(`tier-2 matched sentences: ${stats.tier2Sentences}`);
  console.error(`tier-3 inherited: ${stats.tier3Inherited}`);
  console.error(`orphan (no refs): ${stats.orphanSentences}`);

  if (DRY_RUN) {
    console.error("\n=== dry-run samples ===");
    for (const s of drySamples) {
      console.error(`\n[${s.version}]`);
      console.error(`before: ${JSON.stringify(s.before)}`);
      console.error(`after: ${JSON.stringify(s.after, null, 2)}`);
    }
  }
}

main();
