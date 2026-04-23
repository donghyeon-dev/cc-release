# 개발자 영향도 - 안1 (주석 번호 스타일) 범위 제한 마이그레이션 플랜

> 로컬에서 다음 날 이어서 진행할 수 있게 작성한 작업 지시서.
> 선행 브랜치: `claude/add-impact-section-links-NAbzq` (2안 토큰 하이퍼링크 배포됨).
> 대상 범위: GitHub Release tag 가 있는 `v2.0.73` 부터 `v2.1.117` 까지.

## 0. 배경

현재 `data/releases.json`의 `summary.devImpact`는 평문 문자열이다.
브랜치 `claude/add-impact-section-links-NAbzq` 에서 "백틱 토큰 하이퍼링크"(2안)을 배포했지만,
**백틱이 없는 영향도 문장은 링크할 근거가 없어서** 한글/원문 매칭이 안 된다.

근본 해법은 각 영향도 문장이 어떤 한글 bullet을 근거로 하는지 **스키마로 명시**하는 것 (안1).
단, 이번 작업에서는 전체 273건을 한 번에 바꾸지 않고, GitHub Release tag 기준의 현재 대상 범위인
`v2.0.73`~`v2.1.117` 만 `DevImpactItem[]` 로 마이그레이션한다.
범위 밖 과거 changelog 전용 항목은 기존 문자열을 유지한다.
로컬 `data/releases.json` 기준 대상 범위는 99건이다.

이 플랜은 다음을 달성한다:

- `devImpact` 스키마 구조화 + `v2.0.73`~`v2.1.117` 99건 결정적 마이그레이션
- 주석 번호(¹²³) UI 렌더링 (2안 토큰 하이라이트와 공존)
- Cowork 프롬프트를 신규 스키마로 전환 → 내일 이후 자동 생성물도 구조화된 형태로

## 1. 과도기 스키마

```ts
// web/lib/types.ts
export interface DevImpactRef {
  bucket: "newFeatures" | "changes" | "fixes";
  index: number;              // 해당 bucket 내 0-based 인덱스
}

export interface DevImpactItem {
  text: string;               // 기존 문장 그대로
  refs: DevImpactRef[];       // 0개 이상. 비어 있어도 OK (주석 번호 생략)
}

export interface ReleaseSummary {
  headline: string;
  newFeatures: string[];
  changes: string[];
  fixes: string[];
  devImpact: string | DevImpactItem[]; // 범위 밖 과거 항목은 string 유지
}
```

### 호환성 전략

- 이번 작업은 범위 제한 변경이므로 `string | DevImpactItem[]` union 을 유지한다.
- `v2.0.73`~`v2.1.117` 범위 안에서는 `DevImpactItem[]` 를 필수로 검증한다.
- 범위 밖 과거 항목은 기존 `string` 을 허용한다.
- UI는 항상 `normalizeDevImpact(summary.devImpact)` 로 `DevImpactItem[]` 형태로 정규화해 렌더링한다.
- 추후 전체 데이터까지 구조화할 때 `string` 호환 분기를 제거한다.

## 2. 분업 실행 순서

이번 작업은 데이터 마이그레이션과 UI/프롬프트 변경을 분리한다.

| 순번 | 담당 | 작업 | 산출물 |
| --- | --- | --- | --- |
| 1 | Claude | Phase 1: `web/lib/types.ts` + `scripts/validate-releases.mjs` 수정 | 커밋 A-1 |
| 2 | Claude | Phase 2: `scripts/enrich-dev-impact-refs.mjs` 작성, `--dry-run` 검증, `v2.0.73`~`v2.1.117` 99건 실제 적용 | 커밋 A-2 |
| 3 | Claude | `node scripts/validate-releases.mjs` PASS 확인 + `git diff data/releases.json` 으로 범위 밖 무변경 확인 | 검증 로그 |
| 4 | Codex | Phase 3: UI 렌더링 (`SummarySection.tsx`, `ReleaseCard.tsx`, `globals.css`) | 커밋 B |
| 5 | Codex | Phase 4: Cowork 프롬프트 스키마 업데이트 (`cowork-prompt.md`, `cowork-daily-prompt.md`, `bulk-import-prompt.md`) | 커밋 C |

주의:
- Phase 3 은 Phase 1 타입 변경이 선행되어야 한다.
- Phase 2 의 데이터 변경은 Claude 가 담당하며, Codex 는 범위 밖 데이터가 바뀌지 않았는지 검증 결과를 이어받는다.
- Phase 4 는 Cowork 가 새 스키마를 반환하기 시작하는 시점을 제어하기 위해 UI 변경 이후 별도 커밋으로 유지한다.

### Phase 1. 타입 정의 변경 + 검증기 확장 (Claude)

파일:
- `web/lib/types.ts` — 위 스키마로 변경.
- `scripts/validate-releases.mjs` — `devImpact` 검증 로직 수정:
  - `v2.0.73`~`v2.1.117` 범위 안이면 배열인지 확인
  - 범위 밖이면 기존 문자열 또는 배열을 허용하되, 배열이면 동일하게 구조 검증
  - 배열 원소가 `{ text: string, refs: Array<{ bucket, index }> }` 인지
  - `bucket` 값이 `newFeatures|changes|fixes` 중 하나인지
  - `index`가 해당 bucket 배열의 범위 내인지
  - 기존 `forbiddenDevImpactPhrases` 는 `text` 기준으로 유지

확인:
```bash
node scripts/validate-releases.mjs
```

### Phase 2. 마이그레이션 스크립트 작성 (`scripts/enrich-dev-impact-refs.mjs`) (Claude)

입력: `data/releases.json` (현재 상태)
출력: 같은 파일 in-place.
LLM 미사용 — 결정적 규칙 기반.
기본 처리 범위는 `v2.0.73`~`v2.1.117` 이며, 범위 밖 항목은 수정하지 않는다.

**알고리즘 (릴리즈별)**:

1. 버전이 `v2.0.73`~`v2.1.117` 범위 밖이면 skip.
2. `summary.devImpact` 가 이미 배열이면 기본적으로 skip (idempotent). 단 `--force` 또는 `--only` 지정 시 재계산 허용.
3. `summary.devImpact` 가 빈 문자열이면 `[]` 로 변환.
4. 문장 단위 split: 현행 `/(?<=[.!?])\s+/` 규칙 그대로.
5. 각 문장에 대해 refs 수집:
   - **Tier 1 (백틱 토큰 매칭)**: 문장에서 `` `...` `` 토큰을 모두 추출. 각 토큰에 대해 `newFeatures`/`changes`/`fixes` 3개 bucket을 순회하며 같은 토큰을 포함한 bullet의 인덱스를 refs에 추가.
   - **Tier 2 (키워드 매칭)**: Tier 1 에서 아무것도 못 찾은 경우만 수행. 문장에서 불용어를 제외한 한글 명사구(2자 이상)와 ASCII 식별자(3자 이상)를 토큰화한 뒤, 각 bullet을 동일 토큰화하여 **Jaccard 유사도 상위 2개** bullet 을 후보로. 유사도 `>= 0.15` 이상인 경우만 채택.
   - **Tier 3 (인접 상속)**: Tier 1/2 모두 실패 시, 직전 문장의 refs를 복사. 첫 문장이 실패했으면 다음 문장의 refs 를 빌려옴. 그래도 없으면 `refs: []` 로 남김.
6. 결과를 `DevImpactItem[]` 로 구성해 `summary.devImpact` 에 덮어쓰기.
7. `summarizedAt` 은 유지, `summaryModel` 뒤에 ` +refs-v1` 접미 추가 (추적용). 이미 접미가 있으면 중복 추가하지 않음.

**키워드 추출 휴리스틱** (Tier 2):

```js
const STOPWORDS = new Set([
  "가", "이", "은", "는", "을", "를", "에", "의", "와", "과", "로", "으로",
  "수", "것", "등", "및", "대해", "대한", "되는", "되어", "된다", "한다",
  "있다", "있음", "있어", "없다", "없음", "통해", "따라", "같은", "같이",
  "또는", "또한", "하지만", "때문에", "경우", "가능", "필요", "확인", "변경",
  "추가", "수정", "개선",
]);
// ASCII 토큰: [A-Za-z][A-Za-z0-9._/-]{2,} 를 소문자화
// 한글 토큰: [가-힣]{2,} 에서 STOPWORDS 제외
```

Jaccard: `|A ∩ B| / |A ∪ B|`. 문장/ bullet 각각 토큰 Set 만들어 계산.

**CLI 옵션**:

```
node scripts/enrich-dev-impact-refs.mjs [--dry-run] [--limit N] [--only vX.Y.Z] [--from v2.0.73] [--to v2.1.117] [--force]
```

- `--dry-run`: 수정하지 않고 첫 5건 before/after 를 stderr 에 출력.
- `--limit N`: 대상 범위 안에서 상위 N 건만 처리 (초기 검증용).
- `--only vX.Y.Z`: 특정 버전만 재계산. 기본 범위 밖 버전이면 에러로 중단.
- `--from`, `--to`: 기본 범위는 `v2.0.73`~`v2.1.117`. 후속 backfill 때만 명시 변경.
- `--force`: 이미 배열인 항목도 재계산.

**출력 로그** (stderr):

```
scope: v2.0.73..v2.1.117
eligible releases: 99
processed releases: XX
skipped out of scope: YY
skipped already structured: ZZ
tier-1 matched sentences: XXX
tier-2 matched sentences: YY
tier-3 inherited: ZZ
orphan (no refs): WW
```

`--dry-run` 에서는 Tier 2 후보의 `version`, 영향도 문장, 선택된 bullet, Jaccard score 샘플을 함께 출력해 임계값을 조정한다.

### Phase 3. UI 업데이트 (Codex)

**영향 받는 파일**:
- `web/lib/types.ts` — Phase 1 에서 이미 수정됨.
- `web/components/SummarySection.tsx` — `normalizeDevImpact` 로 string/array 를 정규화한 뒤 렌더링.
- `web/components/ReleaseCard.tsx` — `highlightToken` 상태를 `Highlight` union 상태로 일반화.
- `web/components/InlineCode.tsx` — 변경 없음 (2안 하이라이트는 그대로 공존).

**새 하이라이트 모델**:

```ts
type Highlight =
  | { kind: "token"; token: string }          // 2안 (기존)
  | { kind: "ref"; ref: DevImpactRef };       // 안1 (신규)
```

클릭 소스별 처리:

- **devImpact 문장 끝의 주석 번호 ¹²³ 클릭** → `{ kind: "ref", ref }` 세팅 → 해당 한글 bullet에 `bullet-highlight` 적용하고 스크롤.
- 원문 영어 포커스는 이번 스코프에서 정확 보장하지 않는다. 해당 bullet 또는 devImpact 문장에 백틱 토큰이 있으면 기존 token 하이라이트 로직으로 원문 occurrence 를 best-effort 강조한다.
- **devImpact 문장 안 백틱 토큰 클릭** → 기존 `{ kind: "token", token }` 로직 그대로.
- **주석 번호 위에 hover** → refs 가 가리키는 bullet 미리보기 툴팁 (선택, 시간 여유 시).

**주석 번호 렌더링**:

```tsx
// SummarySection.tsx 내부
{devImpactItems.map((item, i) => (
  <li key={i}>
    <span>
      <InlineCode text={item.text} ... />
      {item.refs.map((ref, j) => (
        <button
          key={j}
          className="impact-ref-marker"
          onClick={() => onRefClick(ref)}
          aria-label={`근거: ${bucketLabel(ref.bucket)} ${ref.index + 1}번째 항목`}
        >
          {refNumber(ref)}
        </button>
      ))}
    </span>
  </li>
))}
```

- `refNumber(ref)` = 전역 순번 아니고, **카드 내 모든 devImpact refs 를 순회하며 부여한 1-based 번호**. 즉 같은 카드 안에서 ¹ ² ³ ... 순서. 같은 bullet 을 여러 문장이 참조하면 같은 번호 재사용.
- 번호 계산은 렌더 중 즉석 계산하지 말고 `buildRefIndex(summary)` 같은 헬퍼에서 `bucket:index -> number` map 으로 한 번 생성해 devImpact marker 와 bullet anchor 가 같은 번호를 공유하게 한다.
- 대상 bullet 렌더 시 `<sup>` 로 `¹` 표시를 좌측에 붙여 시각적 앵커.

**CSS 추가** (`web/app/globals.css`):

```css
.impact-ref-marker {
  font-size: 0.72em;
  font-weight: 600;
  color: #b45309;
  margin-left: 0.15em;
  padding: 0 0.2em;
  border-radius: 3px;
  cursor: pointer;
  vertical-align: super;
  line-height: 1;
}
.impact-ref-marker:hover,
.impact-ref-marker:focus-visible {
  background: #fef3c7;
  outline: none;
}
.bullet-ref-anchor {
  font-size: 0.7em;
  font-weight: 600;
  color: #b45309;
  margin-right: 0.35em;
  vertical-align: super;
}
[data-theme="black"] .impact-ref-marker,
[data-theme="black"] .bullet-ref-anchor {
  color: #fbbf24;
}
```

### Phase 4. Cowork 프롬프트 수정 (Codex)

**영향 받는 파일**:
- `scripts/cowork-prompt.md` — 출력 JSON 스키마 수정.
- `scripts/cowork-daily-prompt.md` — 동일.
- `scripts/bulk-import-prompt.md` — 과거 일괄 재가공 프롬프트라면 동일 적용.

수정 포인트 (양쪽 공통):

- 출력 JSON 의 `devImpact` 를 배열 객체로 변경.
- 지시 문구 예시:

  ```
  devImpact 는 다음 구조의 배열이다:
  [
    {
      "text": "개발자가 알아야 할 영향도 문장 (기존 톤 유지)",
      "refs": [ { "bucket": "newFeatures"|"changes"|"fixes", "index": 0 } ]
    }
  ]

  각 문장은 해당 영향의 근거가 되는 bullet 을 refs 로 명시한다.
  - 직접적 근거가 되는 bullet 이 있으면 반드시 refs 에 포함
  - 근거 bullet 이 여러 개면 모두 나열
  - 근거가 없는 일반 주의사항은 refs: []
  ```

- 예시 JSON 도 새 스키마로 교체.
- 기존 devImpact 가 비거나 모든 문장이 `refs: []` 면 UI가 주석 번호를 생략하므로 안전.

### Phase 5. 검증 & 배포 (공동)

```bash
# 1) 마이그레이션 dry-run
node scripts/enrich-dev-impact-refs.mjs --dry-run --limit 10

# 2) 대상 범위 실제 적용 (data/releases.json 의 v2.0.73~v2.1.117 만 수정됨)
node scripts/enrich-dev-impact-refs.mjs

# 3) 스키마 검증
node scripts/validate-releases.mjs

# 4) 웹 빌드
cd web && pnpm build

# 5) 로컬 확인
pnpm dev
# 브라우저에서:
#   - 주석 번호 클릭 → 해당 bullet 스크롤/하이라이트
#   - 원문 영어 하이라이트는 백틱 토큰이 있는 경우 best-effort 로 동작
#   - 기존 백틱 토큰 클릭 → 여전히 동작 (2안)
#   - refs 없는 문장은 주석 번호 미표시

# 6) 커밋 (A-1/A-2/B/C 분리, Lore protocol 메시지 사용)
git add data/releases.json web/ scripts/
git commit
```

## 3. 롤백 전략

커밋을 분리해두면 부분 롤백 가능:

- **커밋 A-1 (Claude)**: 타입 변경 + validator 범위 검증 추가 (`data/releases.json` 미변경)
- **커밋 A-2 (Claude)**: 마이그레이션 스크립트 추가 + `data/releases.json` 의 `v2.0.73`~`v2.1.117` 범위만 구조화
- **커밋 B (Codex)**: UI 렌더링/하이라이트 변경
- **커밋 C (Codex)**: Cowork 프롬프트 수정

커밋 A-1/A-2/B 조합 롤백 시:

```bash
git revert <커밋-B-SHA> <커밋-A-2-SHA> <커밋-A-1-SHA>
```

Cowork 프롬프트(C)만 롤백하면 다음 실행부터 다시 평문 문자열이 들어오는데, 
UI 가 string/array 둘 다 수용하도록 **Phase 3에서 가드**를 남겨두는 게 안전:

```ts
const devImpactItems: DevImpactItem[] = Array.isArray(summary.devImpact)
  ? summary.devImpact
  : getDevImpactItems(summary.devImpact).map((text) => ({ text, refs: [] }));
```

## 4. 열린 설계 결정

로컬 진행 중 판단 필요:

- **원문(영어) 하이라이트 매핑**: bullet index → 원문 라인 매핑은 이번 스코프에 없음. 이번 작업의 필수 보장은 "refs 클릭 시 한글 bullet 포커스" 까지로 둔다. 원문은 백틱 토큰이 있을 때만 기존 token 하이라이트로 best-effort 강조한다. 정확한 원문 포커스가 필요하면 별도 `originalBodyLineMap` 또는 summary bullet ↔ original bullet 매핑 필드 도입을 후속으로 검토.
- **범위 밖 데이터**: `v2.0.73` 이전 changelog 전용 항목은 이번 작업에서 `summary.devImpact` 문자열을 유지한다. UI/validator 는 string 과 배열을 모두 처리해야 한다.
- **refs 순서**: bullet 등장 순서로 정렬 (bucket 순 newFeatures → changes → fixes, 각 bucket 내 index 오름차순).
- **동일 문장에 refs 중복**: `${bucket}:${index}` 키로 dedupe.
- **같은 bullet 을 여러 문장이 참조**: 주석 번호는 재사용(같은 번호). bullet 쪽에는 번호를 하나만 표시.
- **Tier 2 Jaccard 임계값 0.15**: 실제 데이터에서 false positive 가 많으면 0.2 로 상향. `--dry-run` 로그로 튜닝.
- **Cowork 전환 전 과도기**: Phase 4 를 별도 커밋/PR로 분리해 Cowork가 새 포맷 반환하는 시점을 제어. UI 쪽 string/array 양쪽 가드가 이 기간을 커버.

## 5. 작업 체크리스트

Phase 1 - 스키마 (Claude)
- [ ] `web/lib/types.ts` 수정
- [ ] `scripts/validate-releases.mjs` 에 범위 기반 배열 검증 추가
- [ ] 마이그레이션 전 validator 실행 → `v2.0.73`~`v2.1.117` 범위의 string `devImpact` 때문에 실패 확인

Phase 2 - 마이그레이션 (Claude)
- [ ] `scripts/enrich-dev-impact-refs.mjs` 작성
- [ ] `--dry-run` 으로 10건 샘플 확인
- [ ] 대상 범위 99건 적용 → `git diff data/releases.json` 으로 범위 밖 변경이 없는지 검토
- [ ] `scripts/validate-releases.mjs` 통과
- [ ] Codex 핸드오프용 검증 로그 남김: dry-run 샘플, 실제 적용 로그, validator 결과, 범위 밖 diff 확인 결과

Phase 3 - UI (Codex)
- [ ] `SummarySection.tsx`: devImpact 배열 렌더링 + 주석 번호 버튼
- [ ] `ReleaseCard.tsx`: `Highlight` union 상태 추가, 기존 token 하이라이트와 ref 하이라이트 공존
- [ ] bullet 앞 주석 번호 앵커(`bullet-ref-anchor`) 표시
- [ ] `globals.css` 스타일 추가
- [ ] string 폴백 가드 유지
- [ ] `pnpm build` 성공

Phase 4 - Cowork (Codex)
- [ ] `scripts/cowork-prompt.md` 스키마/예시 수정
- [ ] `scripts/cowork-daily-prompt.md` 수정
- [ ] `scripts/bulk-import-prompt.md` 확인

Phase 5 - 배포 (공동)
- [ ] 커밋 분리 (A-1/A-2/B/C)
- [ ] 브랜치 push → PR → 리뷰
- [ ] main merge 후 GitHub Actions 배포 확인
- [ ] 다음 Cowork 실행 결과가 새 스키마로 들어오는지 확인

## 6. 참고: 영향 받지 않는 것

- `scripts/generate-releases-history.mjs` — 더 이상 live 파이프라인이 아니므로 이번 작업에서는 건드리지 않음. 과거 호환 backfill 용으로만 남김.
- `scripts/apply-rewrites.mjs` — 수작업 rewrite 가 새 스키마로 들어온다면 그대로 병합 가능 (구조는 같은 `summary` 객체를 덮어쓰므로).

## 7. Definition of Done

- [ ] `data/releases.json` 의 `v2.0.73`~`v2.1.117` 항목이 `devImpact: DevImpactItem[]` 구조
- [ ] `v2.0.73` 이전 범위 밖 항목은 의도치 않게 변경되지 않음
- [ ] `validate-releases.mjs` 통과
- [ ] 웹 UI 에서 주석 번호 클릭 시 해당 bullet 하이라이트/스크롤 작동
- [ ] 원문 영어 하이라이트는 백틱 토큰이 있는 경우 best-effort 로 작동하며, 정확한 원문 라인 포커스는 후속 범위로 남김
- [ ] 기존 2안 토큰 하이라이트 계속 작동
- [ ] Cowork 프롬프트가 새 스키마로 생성
- [ ] Live 배포에서 시각적 확인
