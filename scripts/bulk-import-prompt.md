# GPT용 일괄 수집 프롬프트 - Claude Code 릴리즈 히스토리

> 이 프롬프트를 ChatGPT (GPT-5 / GPT-4.5 / Claude 등)에 붙여넣어,
> 과거 전체 릴리즈를 `data/releases.json` 에 맞는 형식으로 한 번에 생성시킵니다.
> Cowork 의 월간 한도를 쓰지 않고 로컬에서 1회성으로 대량 수집하기 위함.
>
> **전제 자료 두 가지**를 프롬프트와 함께 업로드/붙여넣기 합니다:
> 1. `docs/changelog.md` — Claude Code 공식 changelog (270여 버전 전체)
> 2. `.omc/all-releases.json` — GitHub Releases API 응답 (v2.0.73 ~ v2.1.117, 93건)

---

## 프롬프트 본문 (여기부터 복사)

```
당신은 Claude Code 공식 changelog 와 GitHub Releases 데이터를 바탕으로
`data/releases.json` 에 넣을 구조화된 릴리즈 히스토리를 생성하는 작업을 수행한다.

최종 결과물은 **하나의 JSON 배열** 이다. 다른 설명이나 markdown code fence
없이 순수 JSON 만 출력하라. 전체 응답이 JSON 이어야 한다.

## 입력 자료

### A. changelog.md (첨부됨)
Claude Code 공식 changelog. 형식:
<Update label="2.1.117" description="April 22, 2026">
  * 항목 1
  * 항목 2
</Update>

버전 범위: 최신 2.1.117 ~ 최하 0.2.21.
총 270개 버전 엔트리.

### B. all-releases.json (첨부됨)
GitHub Releases API 응답 배열. v2.0.73 ~ v2.1.117 (93건).
각 원소는 tag_name, published_at, html_url, body 등을 포함.

## 출력 스키마

각 원소는 다음 형태. 필드 순서 고정.

{
  "version": "v2.1.117",              // 앞에 'v' 붙임
  "tagName": "v2.1.117",              // 앞에 'v' 붙임
  "publishedAt": "2026-04-22T00:00:00Z", // ISO8601 UTC
  "url": "https://github.com/...",    // 2.0.73 이상만. 2.0.72 이하는 필드 생략
  "originalBody": "...",              // 영어 원문
  "summary": {
    "headline": "한 줄 요약 (40자 이내 권장, 한국어)",
    "newFeatures": ["..."],
    "changes": ["..."],
    "fixes": ["..."],
    "devImpact": "개발자 관점 영향도 1-3문장 (한국어)"
  },
  "summarizedAt": "2026-04-22T00:00:00Z", // 생성 시각 (현재 시각 UTC)
  "summaryModel": "gpt-<사용모델>"       // 실제 사용 모델명
}

## 데이터 소스 규칙 (★ 반드시 준수)

### Case 1: 버전 >= 2.0.73
- GitHub Releases (입력 B) 의 해당 항목을 우선 사용.
- `url` = `html_url` 그대로.
- `originalBody` = `body` 그대로 (영어 markdown).
- `publishedAt` = `published_at` 그대로.
- 요약은 `body` 내용 기반.

### Case 2: 버전 <= 2.0.72
- changelog.md (입력 A) 의 `<Update>` 블록만 사용.
- `url` 필드는 **아예 생략** (undefined, null 아님).
- `originalBody` = changelog 의 해당 블록 내부 `* 항목` 들을 줄바꿈으로
  이어붙인 일반 markdown 으로 재포맷. 예:
    * New /release-notes command lets you view release notes at any time
    * `claude config add/remove` commands now accept multiple values
  원문이 `*` 들여쓰기인데 이걸 markdown `- ` 로 정규화해도 무방.
- `publishedAt` = `description` 의 날짜 ("April 2, 2025") 를
  `YYYY-MM-DDT00:00:00Z` 형태로 변환.
- 요약은 해당 changelog 항목 내용 기반.

## 요약 생성 원칙 (★★★ 가장 중요한 섹션, 반드시 준수)

### 절대 금지

1. **영어 원문 문장을 통째로 복사·붙여넣기 금지.**
   - 각 bullet 은 반드시 한국어로 **다시 쓴 문장** 이어야 한다.
   - 원문 영어 토큰 5단어 이상을 연속으로 포함하면 위반.
2. **고정 라벨 접두사 금지.**
   - `기능 추가:`, `문제 수정:`, `MCP 동작 개선:`, `성능 개선:` 같은
     접두사를 항목 앞에 붙이지 말 것.
   - 카테고리 구분은 이미 `newFeatures` / `changes` / `fixes` 배열 분류로 끝.
     항목 텍스트 자체에 카테고리 라벨을 중복 표기하면 노이즈.
3. **단순 번역 금지.**
   - 영어 원문을 기계적으로 한국어로 옮기기만 하면 안 된다.
   - 개발자가 "이게 나에게 왜 중요한지" 한 문장 안에서 느낄 수 있어야 한다.
4. **공허한 템플릿 문구 절대 금지 (★★★ 가장 흔한 실패 패턴).**
   - 이런 표현은 모두 **즉시 거부**되어야 한다:
     - "관련 작업을 CLI 흐름 안에서 처리 가능"
     - "기존 사용 흐름의 마찰 감소"
     - "기존 작업 흐름의 중단 요인 제거"
     - "예측 가능성 향상"
     - "성능 개선 — 대형 작업이나 장시간 세션에서 지연과 자원 사용 감소"
     - "탐색, 입력, 표시 상태를 더 예측 가능하게 조정"
     - "관련 오류 수정 — 기존 명령이나 설정 사용 시 실패 가능성 감소"
   - 이런 문장은 **어떤 릴리즈에도 적용 가능한 빈 껍데기**라 정보량 0.
   - **대신 원문에 나온 구체 사실 (명령 이름, 플래그, 숫자, 플랫폼, 상황)
     을 반드시 포함**해야 한다.
5. **원문의 고유명사 · 수치 누락 금지.**
   - 원문에 있는 다음 항목은 요약에도 반드시 포함:
     - 명령어 (`/resume`, `/model`, `/doctor`)
     - 플래그/옵션 (`--agent`, `--resume`)
     - 환경변수 (`CLAUDE_CODE_FORK_SUBAGENT`, `NO_PROXY`)
     - 설정키 (`cleanupPeriodDays`, `blockedMarketplaces`)
     - 도구 이름 (`Glob`, `Grep`, `WebFetch`, `Bash`)
     - 플랫폼 (Windows, macOS, Linux, Bedrock, VSCode)
     - 구체 숫자 (`67%`, `40MB`, `200K`, `1M`, `204`)
   - **원문에 `/resume` 이 있는데 요약에 빠지면 위반**. 원문에 Windows
     언급이 있는데 요약이 그냥 "Windows 기능 추가"라고만 쓰면 위반.
6. **"Claude Code 기능 추가" 같은 자기언급 금지.**
   - 이 사이트 전체가 Claude Code 릴리즈임. 모든 항목 앞에 "Claude Code"
     를 붙이는 건 공간 낭비.
7. **동일 bullet 을 여러 릴리즈에 재사용 금지.**
   - 각 릴리즈의 요약은 **그 릴리즈의 원문을 읽은 흔적**이 있어야 한다.
   - 여러 릴리즈에서 같은 문장이 반복되면 템플릿으로 때운 증거 → 위반.

### 반드시 준수

1. **한국어 서술 + 영어 식별자 보존 혼합**
   - 한국어 본문 + CLI/플래그/환경변수/설정키는 영어 그대로 백틱으로 감싼다.
   - 영어 그대로 유지해야 하는 것: 명령어 (`/resume`, `/model`), 플래그
     (`--agent`), 환경변수 (`CLAUDE_CODE_FORK_SUBAGENT`), 설정키
     (`cleanupPeriodDays`), 도구 이름 (`Glob`, `Grep`, `WebFetch`), 파일
     경로 (`~/.claude/tasks/`), HTTP 상태코드 (`400`, `401`), 정확한
     숫자/수치 (`67%`, `40MB`, `200K`, `1M`).
2. **개발자 영향 관점 서술**
   - 각 항목 문장이 "이 변경이 내 작업 흐름에 어떻게 닿는지" 를 시사.
   - 좋은 패턴: `<무엇이 어떻게 바뀜> — <개발자 체감·영향>` (하이픈 서술).
   - 예: `/resume 로 40MB+ 세션을 열 때 최대 67% 빨라짐 — 대형 프로젝트 재개 대기 시간 단축`.
3. **한 항목 = 한 줄, 간결체**
   - 한국어 종결어미 생략 ("~된다", "~되었다" 대신 "~됨", "~추가", "~수정").
   - 쉼표로 연결된 장문은 가능하면 두 항목으로 분리.
4. **분류 기준**
   - `newFeatures`: 기존에 없던 새 명령·옵션·API·훅·환경변수·통합.
   - `changes`: 기존 동작의 성능/UX/기본값/범위 변경 (개선 포함).
   - `fixes`: 잘못 동작하던 것을 바로잡음 (버그·크래시·표시 오류).
   - 해당 없으면 빈 배열 `[]`.
5. **`devImpact` 작성 기준**
   - **다음 중 하나가 실제로 있을 때만** 한국어 2-3문장으로 서술:
     - breaking change / 마이그레이션 필요
     - 기본값 변경 (사용자가 인지해야 할 만한 것)
     - 환경변수·설정키 신설·삭제
     - 보안·권한 동작 변경
     - 특정 플랫폼 (Windows/Linux/macOS/Bedrock/VSCode 등) 한정 영향
   - 위 중 어느 것에도 해당 안 되면 **빈 문자열 `""`**. 억지로 채우지 말 것.
   - **devImpact 금지 문구** (이런 식으로 쓸 거면 차라리 빈 문자열):
     - "환경 변수나 설정 경로가 동작에 영향을 줄 수 있으므로 팀 공용 설정과 배포 환경을 확인해야 한다"
     - "권한 판정이나 샌드박스 정책이 달라질 수 있어 기존 allow/deny 규칙과 자동 승인 흐름을 재검토해야 한다"
   - 이런 **모든 릴리즈에 복붙 가능한 일반론**은 가치 없음. 빈 문자열이 낫다.
   - **좋은 devImpact 예**: `"Pro/Max 사용자의 Opus 4.6·Sonnet 4.6 기본 effort 가 high 로 상향됨. 토큰 사용량이 기존 대비 증가할 수 있어 비용 모니터링 권장."` — 구체적인 영향 + 구체적인 대응.
6. **잡음 제거**
   - `chore`, `internal`, `ci`, 단순 리팩토링 같은 개발자 무관 항목은 생략.
   - 단 Node/런타임 버전 변경, 번들 기본값 변경처럼 환경 재설정 필요성이
     있으면 포함.
7. **구버전 (v0.x, v1.x 초기) 엔트리 처리**
   - changelog 가 매우 짧은 (1~2 bullet) 경우가 많음.
   - 그 경우 `summary` 는 원문을 바탕으로 한국어 한두 문장으로 재구성.
   - 정말 내용이 부실하면 `newFeatures` 만 채우고 나머지 빈 배열 허용.

### 좋은 예 / 나쁜 예

**예시 1 — 신기능 (v2.1.117 의 "Forked subagents ... CLAUDE_CODE_FORK_SUBAGENT=1")**

- 나쁜 예 (❌):
  ```
  "기능 추가: Forked subagents can now be enabled on external builds by setting `CLAUDE_CODE_FORK_SUBAGENT=1`"
  ```
  이유: 라벨 접두사 사용 + 원문 영어 문장 그대로.

- 좋은 예 (✅):
  ```
  "외부 빌드에서도 `CLAUDE_CODE_FORK_SUBAGENT=1` 환경변수로 서브에이전트 fork 활성화 가능"
  ```

**예시 2 — 성능 개선 (v2.1.116 의 "/resume 67% faster on 40MB+ sessions")**

- 나쁜 예 (❌):
  ```
  "세션 재개 동작 개선: `/resume` on large sessions is significantly faster (up to 67% on 40MB+ sessions)"
  ```

- 좋은 예 (✅):
  ```
  "`/resume` 로 40MB 이상 대형 세션 로드가 최대 67% 빨라짐 — 긴 히스토리 재개 대기 단축"
  ```

**예시 3 — 버그 수정 (v2.1.117 의 "Fixed crash when proxy returns HTTP 204")**

- 나쁜 예 (❌):
  ```
  "문제 수정: Fixed a crash when a proxy returns HTTP 204 No Content — now surfaces a clear error instead of a `TypeError`"
  ```

- 좋은 예 (✅):
  ```
  "프록시가 `204 No Content` 응답 시 `TypeError` 크래시 대신 명확한 에러 메시지 노출"
  ```

**예시 4 — 기본값 변경 (v2.1.117 의 "Default effort for Pro/Max ... now high")**

- 나쁜 예 (❌):
  ```
  "모델/effort 동작 개선: Default effort for Pro/Max subscribers on Opus 4.6 and Sonnet 4.6 is now `high` (was `medium`)"
  ```

- 좋은 예 (✅, changes 항목):
  ```
  "Pro/Max 구독자의 Opus 4.6 · Sonnet 4.6 기본 effort 가 `medium` → `high` 로 상향"
  ```
  그리고 이 경우 `devImpact` 에 `"Pro/Max 사용자는 별도 설정 없이 이제 기본 effort 가 high 로 동작. 토큰 사용량이 기존 대비 늘어날 수 있으므로 비용 모니터링 권장."` 를 한국어로 추가.

**예시 5 — 플랫폼 한정 (v2.1.117 의 "Windows: cached where.exe lookups")**

- 좋은 예 (✅, changes 항목):
  ```
  "Windows 에서 `where.exe` 조회 결과를 프로세스별 캐싱해 서브프로세스 실행 지연 감소"
  ```

**예시 6 — 공허한 템플릿 (가장 흔한 실패 케이스)**

원문: `* New /resume command lets you reopen past sessions`

- 최악의 예 (❌❌, 최근 재생성에서 실제로 나온 패턴):
  ```
  "Claude Code 기능 추가 — 관련 작업을 CLI 흐름 안에서 처리 가능"
  "명령 UI 흐름 개선 — 탐색, 입력, 표시 상태를 더 예측 가능하게 조정"
  "Claude Code 오류 수정 — 기존 작업 흐름의 중단 요인 제거"
  ```
  이유: 어떤 릴리즈에도 적용 가능한 빈 문장. 원문의 `/resume` 이라는
  구체 정보가 완전히 소실. 정보량 0.

- 좋은 예 (✅):
  ```
  "`/resume` 명령 추가 — 과거 세션을 다시 열어 작업 이어가기 가능"
  ```
  원문에 있던 구체 명령명(`/resume`)과 기능(과거 세션 재개)이 살아있음.

**예시 7 — 구체 정보 보존 (v2.1.80 의 실제 changelog 확인 필요)**

원문에 Windows 관련 항목이 있다면:

- 나쁜 예 (❌):
  ```
  "Windows 기능 추가 — 관련 작업을 CLI 흐름 안에서 처리 가능"
  ```
  이유: "Windows" 만 베끼고 "무슨 기능"인지 전혀 안 나옴.

- 좋은 예 (✅):
  ```
  (원문을 읽고 구체적으로, 예: "Windows 에서 PowerShell 도구 추가")
  ```

### 작업 프로세스 (반드시 이 순서 준수)

각 버전 요약을 생성할 때:

1. 먼저 해당 버전의 원문 (GitHub body 또는 changelog 블록) 을 읽는다.
2. 원문의 각 bullet 에서 **고유 토큰** (명령어, 플래그, 환경변수, 도구 이름,
   플랫폼, 숫자) 을 추출한다.
3. 요약의 각 bullet 에 위 고유 토큰 중 최소 1개는 반드시 포함한다.
4. 그 고유 토큰이 **무엇을 하는지** 한국어로 설명한다.
5. 원문에 고유 토큰이 전혀 없는 경우만 (극히 드묾) 서술형 요약 허용.

**자체 검사**: 요약의 bullet 을 다른 릴리즈에 복사 붙여넣기 해도 말이 되면 실패.
그 릴리즈에만 해당하는 문장인지 확인하라.

## 중복 처리 / 누락 처리

- changelog 에 있는데 GitHub Release 에 없는 버전 (예: 2.1.115, 2.1.106 등
  skip 번호): changelog 기준으로 Case 2 처리 (url 생략).
- GitHub Release 에만 있고 changelog 에 없는 버전: 있을 가능성 낮지만,
  있다면 Case 1 그대로 처리.
- 한 날짜에 여러 버전이 있으면 **버전 번호 내림차순**으로 같은 날짜 내 정렬.

## 정렬 및 최종 출력

- 전체 배열을 `publishedAt` **내림차순** (최신이 맨 앞) 으로 정렬.
- 동일 날짜는 버전 번호 내림차순.
- JSON 들여쓰기 2칸, 배열 끝에 개행 1개.
- **순수 JSON 만 출력**. ```json 같은 code fence 금지. 설명 금지.

## 검증 체크리스트 (출력 전 자체 확인)

### 구조 (필수)
1. 2.0.72 이하 항목에 `url` 필드가 없는가?
2. 2.0.73 이상 항목에 `url` 필드가 있는가? (단, GitHub Releases 에 없는
   skip 버전은 changelog 기준 처리라 url 생략 맞음)
3. 모든 `version` 과 `tagName` 이 `v` 로 시작하는가?
4. 모든 `publishedAt` 이 ISO8601 UTC 형식인가?
5. `summary.newFeatures` / `changes` / `fixes` 가 배열인가 (string 아님)?
6. headline 이 모두 한국어인가?
7. 배열이 publishedAt 내림차순인가?
8. 출력 전체가 유효한 JSON 인가?

### 품질 (필수, 각 항목마다 자체 검사)
9. 어떤 bullet 도 영어 원문 5단어 이상을 연속으로 포함하지 않는가?
   (식별자 `CLAUDE_CODE_FORK_SUBAGENT` 같은 단일 토큰은 단어 1개로 본다)
10. 어떤 bullet 도 `기능 추가:`, `문제 수정:`, `MCP 동작 개선:` 등 라벨
    접두사로 시작하지 않는가?
11. 각 bullet 본문이 한국어 문장인가? (식별자·숫자·경로만 영어)
12. `devImpact` 가 없으면 빈 문자열 `""` 인가? (마지못해 채우지 말 것)
13. `headline` 이 40자 이내 한국어 한 줄인가?
14. ★ **공허한 템플릿 문구 사용 여부** 검사. 다음 문구가 어떤 bullet 에도
    등장하면 안 됨:
    - "관련 작업을 CLI 흐름 안에서 처리 가능"
    - "기존 사용 흐름의 마찰 감소"
    - "기존 작업 흐름의 중단 요인 제거"
    - "예측 가능성 향상"
    - "탐색, 입력, 표시 상태를 더 예측 가능하게 조정"
    - "관련 오류 수정"
    - "Claude Code 기능 추가" (그냥 "Claude Code"로 시작하는 bullet)
15. ★ **고유 토큰 포함 검사**. 각 bullet 에 원문의 구체 고유명사 (명령어,
    플래그, 환경변수, 설정키, 도구 이름, 플랫폼, 숫자) 중 최소 1개가
    포함되어 있는가? 없으면 그 bullet 은 삭제하거나 다시 쓸 것.
16. ★ **중복 문구 검사**. 같은 문장이 여러 릴리즈에서 반복되면 안 됨.
    동일 bullet 이 2회 이상 등장하면 위반.
17. ★ **devImpact 상투 문구 금지**. 다음이 들어가면 즉시 빈 문자열로 대체:
    - "환경 변수나 설정 경로가 동작에 영향을 줄 수 있으므로..."
    - "권한 판정이나 샌드박스 정책이 달라질 수 있어..."

## 개수 기대치

- changelog 에 270 개 버전 있음 → 출력 배열 길이는 약 270.
  (GitHub 에 없는 버전 + changelog 에만 있는 버전 모두 포함)
- 둘 다에 있는 버전은 중복 생성하지 말 것. 합쳐서 1개 엔트리.

자, 시작하라.
```

## 사용 방법

1. ChatGPT 또는 다른 LLM 채팅에 위 `프롬프트 본문` 전체를 복사해 붙여넣기
2. 파일 업로드 기능으로 다음 두 파일 첨부:
   - `docs/changelog.md`
   - `.omc/all-releases.json` (없으면 아래 명령으로 재생성)
3. 전송 후 출력된 JSON 을 `data/releases.json` 으로 저장
4. 로컬에서 빌드 테스트 → 커밋 → 푸시

## 보조 명령

`.omc/all-releases.json` 재생성:

```bash
gh api repos/anthropics/claude-code/releases --paginate > .omc/all-releases.json
```

결과 JSON 에 필드가 너무 많아 모델이 헷갈릴 수 있으면 사전에 필드만
추려둔 경량 버전 사용:

```bash
gh api repos/anthropics/claude-code/releases --paginate \
  --jq '[.[] | {tag_name, published_at, html_url, body}]' \
  > .omc/all-releases-lite.json
```

(프롬프트 본문에서 "all-releases.json" 대신 "all-releases-lite.json" 으로 지칭)

## 결과 검증 스크립트 (선택)

생성된 JSON 이 스키마를 지키는지 확인:

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('data/releases.json','utf8'));
let errors = 0;
for (const [i, r] of data.entries()) {
  const hasUrl = 'url' in r;
  const ver = r.version?.replace(/^v/,'');
  const [major, minor, patch] = ver?.split('.').map(Number) ?? [];
  const isOld = (major === 2 && minor === 0 && patch <= 72) || major < 2;
  if (isOld && hasUrl) { console.log(\`[\${i}] \${ver} should NOT have url\`); errors++; }
  if (!isOld && !hasUrl) { console.log(\`[\${i}] \${ver} should have url\`); errors++; }
  if (!r.summary?.headline) { console.log(\`[\${i}] \${ver} missing headline\`); errors++; }
}
console.log(\`\\n\${data.length} items, \${errors} errors\`);
"
```

## 주의사항

- 270 개 생성은 응답이 매우 길어 모델 출력 토큰 한도에 걸릴 수 있음.
  - GPT-5 / Claude Opus 같은 대용량 모델 권장
  - 필요 시 "먼저 최근 100개만 반환하고 다음 턴에 나머지 반환" 으로 분할
- JSON 파싱 실패 시 첫 응답 받은 직후 같은 채팅에서
  "방금 응답을 JSON.parse 할 수 있게 이스케이프 다시 확인해서 재출력" 요청.
- summaryModel 필드는 실제 사용 모델명 (예: `gpt-5`, `claude-opus-4-7`) 으로.
