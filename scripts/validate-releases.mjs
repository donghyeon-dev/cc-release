#!/usr/bin/env node
// data/releases.json 검증 스크립트
// 사용법: node scripts/validate-releases.mjs [path]
//   path 미지정 시 data/releases.json 기본값

import fs from "node:fs";
import path from "node:path";

const target = process.argv[2] ?? "data/releases.json";
const abs = path.resolve(target);

// GitHub Releases 에 실제 등록된 태그 목록 (url 보유 기대치)
// .omc/all-releases-lite.json 이 있으면 그걸 기준으로, 없으면 "2.0.73 이상"으로 폴백
const LITE_PATH = path.resolve(".omc/all-releases-lite.json");
let githubTagSet = null;
if (fs.existsSync(LITE_PATH)) {
  try {
    const lite = JSON.parse(fs.readFileSync(LITE_PATH, "utf-8"));
    githubTagSet = new Set(lite.map((r) => r.tag_name));
    console.log(`[info] GitHub 태그 기준 ${githubTagSet.size} 개로 url 규칙 엄격 검증`);
  } catch (_) {
    console.log(`[info] ${LITE_PATH} 파싱 실패, 폴백 규칙 사용`);
  }
} else {
  console.log(`[info] ${LITE_PATH} 없음, 폴백 규칙 (v2.0.73 이상이면 url 필요) 사용`);
}

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// 1. 파일 존재 & 파싱
if (!fs.existsSync(abs)) {
  console.error(`[FATAL] 파일 없음: ${abs}`);
  process.exit(2);
}
let raw;
try {
  raw = fs.readFileSync(abs, "utf-8");
} catch (e) {
  console.error(`[FATAL] 파일 읽기 실패: ${e.message}`);
  process.exit(2);
}
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`[FATAL] JSON 파싱 실패: ${e.message}`);
  process.exit(2);
}

if (!Array.isArray(data)) {
  console.error("[FATAL] 루트가 배열이 아님");
  process.exit(2);
}

// 2. 각 항목 검증
const seenVersions = new Set();
const requiredFields = [
  "version",
  "tagName",
  "publishedAt",
  "originalBody",
  "summary",
  "summarizedAt",
  "summaryModel",
];
const summaryFields = [
  "headline",
  "newFeatures",
  "changes",
  "fixes",
  "devImpact",
];
const forbiddenSummaryPhrases = [
  "관련 작업을 CLI 흐름 안에서 처리 가능",
  "기존 사용 흐름의 마찰 감소",
  "기존 작업 흐름의 중단 요인 제거",
  "예측 가능성 향상",
  "탐색, 입력, 표시 상태를 더 예측 가능하게 조정",
  "관련 오류 수정",
  "Claude Code 기능 추가",
  "해당 사용 경로의 수동 확인 부담 감소",
  "해당 조건에서 실패 원인 확인",
  "해당 기능을 별도 우회 절차 없이 사용",
];
const forbiddenDevImpactPhrases = [
  "환경 변수나 설정 경로가 동작에 영향을 줄 수 있으므로",
  "권한 판정이나 샌드박스 정책이 달라질 수 있어",
];
const VALID_DEV_IMPACT_BUCKETS = new Set(["newFeatures", "changes", "fixes"]);

function isInStructuredRange(version) {
  const v = (version ?? "").replace(/^v/, "").split(".").map(Number);
  const [M, m, p] = [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
  if (M > 2) return true;
  if (M < 2) return false;
  if (m > 0) return true;
  return p >= 73;
}
const labelPrefixRe = /^(기능 추가|문제 수정|동작 개선|성능 개선|MCP 동작 개선|MCP 기능 추가|MCP 문제 수정|SDK 동작 개선|플러그인 동작 개선|보안 검증 강화):/;
const fiveEnglishWordsRe = /\b[A-Za-z]+(?:[\s/_.-]+[A-Za-z]+){4,}\b/;
const seenSummaryBullets = new Map();

function stripInlineCode(text) {
  return text.replace(/`[^`]*`/g, "");
}

for (let i = 0; i < data.length; i++) {
  const r = data[i];
  const tag = `[${i}] ${r?.version ?? "??"}`;

  // 필수 필드
  for (const f of requiredFields) {
    if (!(f in r)) err(`${tag}: 필수 필드 누락 "${f}"`);
  }

  // version / tagName
  if (typeof r.version !== "string" || !r.version.startsWith("v")) {
    err(`${tag}: version 은 'v' 로 시작해야 함 (got ${JSON.stringify(r.version)})`);
  }
  if (r.tagName !== r.version) {
    warn(`${tag}: tagName(${r.tagName}) != version(${r.version})`);
  }

  // 중복 체크
  if (seenVersions.has(r.version)) {
    err(`${tag}: 중복 version`);
  }
  seenVersions.add(r.version);

  // publishedAt ISO8601
  if (typeof r.publishedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(r.publishedAt)) {
    err(`${tag}: publishedAt ISO8601 아님 (got ${JSON.stringify(r.publishedAt)})`);
  }
  if (isNaN(new Date(r.publishedAt).getTime())) {
    err(`${tag}: publishedAt 파싱 불가`);
  }

  // url 규칙:
  //  - GitHub Releases 에 존재하는 태그 → url 필수
  //  - GitHub Releases 에 없는 태그 (changelog 전용) → url 금지
  // githubTagSet 이 있으면 그걸 기준, 없으면 버전 번호로 폴백
  const hasUrl = "url" in r && r.url != null && r.url !== "";
  let expectUrl;
  if (githubTagSet) {
    expectUrl = githubTagSet.has(r.version);
  } else {
    const ver = r.version?.replace(/^v/, "") ?? "";
    const parts = ver.split(".").map(Number);
    const [major, minor, patch] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
    const isOld = major < 2 || (major === 2 && minor === 0 && patch <= 72);
    expectUrl = !isOld;
  }
  if (expectUrl && !hasUrl) err(`${tag}: GitHub Release 존재하는 버전인데 url 없음`);
  if (!expectUrl && hasUrl) err(`${tag}: GitHub Release 없는 버전인데 url 있음`);
  if (hasUrl && !/^https?:\/\//.test(r.url)) err(`${tag}: url 이 http(s) 로 시작 안 함`);

  // originalBody 비어있으면 경고
  if (typeof r.originalBody !== "string") err(`${tag}: originalBody 가 문자열 아님`);
  else if (r.originalBody.trim().length === 0) warn(`${tag}: originalBody 비어있음`);

  // summary
  if (!r.summary || typeof r.summary !== "object") {
    err(`${tag}: summary 가 객체 아님`);
  } else {
    for (const f of summaryFields) {
      if (!(f in r.summary)) err(`${tag}: summary.${f} 누락`);
    }
    if (typeof r.summary.headline !== "string" || r.summary.headline.trim() === "") {
      err(`${tag}: summary.headline 빈 문자열`);
    }
    for (const arrField of ["newFeatures", "changes", "fixes"]) {
      if (!Array.isArray(r.summary?.[arrField])) {
        err(`${tag}: summary.${arrField} 배열 아님`);
      } else {
        for (let j = 0; j < r.summary[arrField].length; j++) {
          const raw = r.summary[arrField][j];
          let bullet;
          if (typeof raw === "string") {
            bullet = raw;
          } else if (raw && typeof raw === "object") {
            if (typeof raw.text !== "string") {
              err(`${tag}: summary.${arrField}[${j}].text 문자열 아님`);
              continue;
            }
            if (!Array.isArray(raw.originalRefs)) {
              err(`${tag}: summary.${arrField}[${j}].originalRefs 배열 아님`);
              continue;
            }
            for (let k = 0; k < raw.originalRefs.length; k++) {
              const ref = raw.originalRefs[k];
              if (!Number.isInteger(ref) || ref < 0) {
                err(`${tag}: summary.${arrField}[${j}].originalRefs[${k}] 음이 아닌 정수 아님`);
              }
            }
            bullet = raw.text;
          } else {
            err(`${tag}: summary.${arrField}[${j}] 문자열 또는 객체 아님`);
            continue;
          }
          if (labelPrefixRe.test(bullet)) {
            err(`${tag}: summary.${arrField}[${j}] 라벨 접두사 사용`);
          }
          if (/^Claude Code/.test(bullet)) {
            err(`${tag}: summary.${arrField}[${j}] "Claude Code" 자기언급으로 시작`);
          }
          if (fiveEnglishWordsRe.test(stripInlineCode(bullet))) {
            err(`${tag}: summary.${arrField}[${j}] 영어 원문 5단어 이상 연속 포함`);
          }
          for (const phrase of forbiddenSummaryPhrases) {
            if (bullet.includes(phrase)) {
              err(`${tag}: summary.${arrField}[${j}] 공허한 템플릿 문구 포함: ${phrase}`);
            }
          }
          const previous = seenSummaryBullets.get(bullet);
          if (previous) {
            err(`${tag}: summary.${arrField}[${j}] 중복 bullet (이전 ${previous})`);
          } else {
            seenSummaryBullets.set(bullet, `${tag} summary.${arrField}[${j}]`);
          }
        }
      }
    }
    const di = r.summary.devImpact;
    const inRange = isInStructuredRange(r.version);
    if (Array.isArray(di)) {
      for (let k = 0; k < di.length; k++) {
        const item = di[k];
        if (!item || typeof item !== "object") {
          err(`${tag}: summary.devImpact[${k}] 객체 아님`);
          continue;
        }
        if (typeof item.text !== "string") {
          err(`${tag}: summary.devImpact[${k}].text 문자열 아님`);
        } else {
          for (const phrase of forbiddenDevImpactPhrases) {
            if (item.text.includes(phrase)) {
              err(`${tag}: summary.devImpact[${k}].text 상투 문구 포함: ${phrase}`);
            }
          }
        }
        if (!Array.isArray(item.refs)) {
          err(`${tag}: summary.devImpact[${k}].refs 배열 아님`);
        } else {
          const seenRef = new Set();
          for (let j = 0; j < item.refs.length; j++) {
            const ref = item.refs[j];
            if (!ref || typeof ref !== "object") {
              err(`${tag}: summary.devImpact[${k}].refs[${j}] 객체 아님`);
              continue;
            }
            if (!VALID_DEV_IMPACT_BUCKETS.has(ref.bucket)) {
              err(`${tag}: summary.devImpact[${k}].refs[${j}].bucket 잘못됨 (${ref.bucket})`);
              continue;
            }
            if (!Number.isInteger(ref.index) || ref.index < 0) {
              err(`${tag}: summary.devImpact[${k}].refs[${j}].index 정수 아님 (${ref.index})`);
              continue;
            }
            const bucketArr = r.summary[ref.bucket];
            if (Array.isArray(bucketArr) && ref.index >= bucketArr.length) {
              err(`${tag}: summary.devImpact[${k}].refs[${j}].index 범위 초과 (${ref.bucket}.length=${bucketArr.length}, got ${ref.index})`);
            }
            const key = `${ref.bucket}:${ref.index}`;
            if (seenRef.has(key)) {
              err(`${tag}: summary.devImpact[${k}].refs 중복 ref (${key})`);
            }
            seenRef.add(key);
          }
        }
      }
    } else if (typeof di === "string") {
      if (inRange && di.trim() !== "") {
        err(`${tag}: summary.devImpact 가 범위(v2.0.73+) 안에서 string 으로 남아있음 — DevImpactItem[] 필요`);
      }
      for (const phrase of forbiddenDevImpactPhrases) {
        if (di.includes(phrase)) {
          err(`${tag}: summary.devImpact 상투 문구 포함: ${phrase}`);
        }
      }
    } else {
      err(`${tag}: summary.devImpact 가 string 또는 배열 아님`);
    }
  }

  // summarizedAt
  if (typeof r.summarizedAt !== "string" || isNaN(new Date(r.summarizedAt).getTime())) {
    err(`${tag}: summarizedAt 유효 날짜 아님`);
  }
  if (typeof r.summaryModel !== "string" || r.summaryModel.trim() === "") {
    err(`${tag}: summaryModel 빈 문자열`);
  }
}

// 3. 정렬 검증 (publishedAt 내림차순)
for (let i = 1; i < data.length; i++) {
  const prev = new Date(data[i - 1].publishedAt).getTime();
  const curr = new Date(data[i].publishedAt).getTime();
  if (curr > prev) {
    err(`[${i}] 정렬 위반: ${data[i - 1].version}(${data[i - 1].publishedAt}) < ${data[i].version}(${data[i].publishedAt})`);
    break;
  }
}

// 4. 결과 출력
console.log(`\n검증 대상: ${abs}`);
console.log(`총 항목 수: ${data.length}`);
console.log(`에러: ${errors.length}`);
console.log(`경고: ${warnings.length}`);

if (errors.length > 0) {
  console.log("\n--- 에러 ---");
  for (const e of errors.slice(0, 50)) console.log("  " + e);
  if (errors.length > 50) console.log(`  ... (외 ${errors.length - 50}건)`);
}
if (warnings.length > 0) {
  console.log("\n--- 경고 ---");
  for (const w of warnings.slice(0, 30)) console.log("  " + w);
  if (warnings.length > 30) console.log(`  ... (외 ${warnings.length - 30}건)`);
}

if (errors.length > 0) {
  console.log("\n❌ FAIL");
  process.exit(1);
} else {
  console.log("\n✅ PASS");
  process.exit(0);
}
