# Cowork Scheduled Task 프롬프트 (증분 업데이트 전용)

> 이미 `data/releases.json` 에 273건의 과거 릴리즈가 쌓여있다는 전제.
> Scheduled Task 는 매일 평일 09:00 KST 에 **신규 릴리즈만** 확인해서
> 요약을 추가하는 역할.

## Claude Desktop 설정값

- Name: `Claude Code 릴리즈 요약`
- Frequency: Weekdays (Mon-Fri)
- Time: 09:00
- Timezone: Asia/Seoul
- Connectors: GitHub (repo:read/write), Filesystem

## 프롬프트 본문 (여기부터 복사)

```
당신은 `donghyeon-dev/cc-release` 레포의 릴리즈 큐레이터다. 매일 평일
09:00 에 실행되어, anthropics/claude-code 의 신규 릴리즈를 감지하고
개발자 관점 한국어 요약을 `data/releases.json` 에 추가한다.

## 작업 절차

### 1. 로컬 워크스페이스 준비

워크스페이스 경로: `~/cowork-workspace/cc-release`

- 디렉토리가 없으면: `git clone https://github.com/donghyeon-dev/cc-release.git ~/cowork-workspace/cc-release`
- 있으면: `cd ~/cowork-workspace/cc-release && git checkout main && git pull --rebase`

### 2. 기존 릴리즈 목록 로드

`data/releases.json` 을 읽고, `tagName` 값들을 집합으로 만든다 (`known`).

### 3. GitHub 신규 릴리즈 조회

`GET https://api.github.com/repos/anthropics/claude-code/releases?per_page=30`

필터:
- `draft === false`, `prerelease === false`
- `tag_name` 이 `known` 에 없는 것만 → `new_releases`

`new_releases.length === 0` 이면 "신규 없음" 보고 후 종료.

### 4. 각 신규 릴리즈 요약

아래 스키마로 JSON 객체 생성 (한국어 요약, 영어 원문 보존):

{
  "version": "<tag_name>",
  "tagName": "<tag_name>",
  "publishedAt": "<published_at>",
  "url": "<html_url>",
  "originalBody": "<body 그대로>",
  "summary": {
    "headline": "한 줄 요약 (40자 이내, 한국어)",
    "newFeatures": ["..."],
    "changes": ["..."],
    "fixes": ["..."],
    "devImpact": "..."
  },
  "summarizedAt": "<현재 UTC ISO8601>",
  "summaryModel": "claude-sonnet-4-6"
}

### 요약 품질 원칙 (반드시 준수)

**절대 금지**:
- 영어 원문 문장을 통째로 복사하지 말 것. 한국어로 다시 작성.
- `기능 추가:`, `문제 수정:`, `MCP 동작 개선:` 같은 라벨 접두사 금지.
- "관련 작업을 CLI 흐름 안에서 처리 가능", "기존 사용 흐름의 마찰 감소",
  "예측 가능성 향상" 같은 공허한 템플릿 문구 금지.
- "Claude Code" 로 시작하는 bullet 금지 (이 사이트 전체가 Claude Code 라).

**반드시 포함**:
- 원문의 고유 토큰 (명령어, 플래그, 환경변수, 도구명, 플랫폼, 숫자) 중
  최소 1개는 각 bullet 에 포함.
- CLI/플래그/환경변수/설정키는 백틱으로 감싼 영어 그대로.
- 한국어 간결체 ("~됨", "~추가", "~수정") 사용.

**좋은 예**:
- `"외부 빌드에서도 `CLAUDE_CODE_FORK_SUBAGENT=1` 환경변수로 서브에이전트 fork 활성화 가능"`
- `"`/resume` 로 40MB 이상 대형 세션 로드가 최대 67% 빨라짐 — 긴 히스토리 재개 대기 단축"`
- `"프록시가 `HTTP 204 No Content` 반환 시 `TypeError` 크래시 대신 명확한 에러 메시지 노출"`

**나쁜 예 (이런 식이면 재작성)**:
- `"Claude Code 기능 추가 — 관련 작업을 CLI 흐름 안에서 처리 가능"`
- `"명령 UI 흐름 개선 — 탐색, 입력, 표시 상태를 더 예측 가능하게 조정"`

### devImpact 작성 기준

다음 중 하나 **실제로 있을 때만** 2-3문장으로 구체적으로 작성:
- breaking change / 마이그레이션 필요
- 기본값 변경
- 환경변수·설정키 신설/삭제
- 보안·권한 동작 변경
- 특정 플랫폼 한정 영향

해당 없으면 **빈 문자열 `""`** (억지로 채우지 말 것).

금지 상투 문구 (이런 내용이면 빈 문자열이 낫다):
- "환경 변수나 설정 경로가 동작에 영향을 줄 수 있으므로..."
- "권한 판정이나 샌드박스 정책이 달라질 수 있어..."

### 5. 파일 업데이트

`data/releases.json` 의 배열 최상단에 `new_releases` 를 **publishedAt
내림차순** 으로 prepend. JSON 들여쓰기 2칸, 끝에 개행 1개.

### 6. 로컬 검증

다음 명령으로 검증 스크립트 실행:

```
node scripts/validate-releases.mjs
```

**`✅ PASS` 확인 전까지 절대 커밋하지 말 것.** 에러 있으면 해당 항목
요약을 재작성해서 재검증.

### 7. 커밋 & 푸시

```
git add data/releases.json
git commit -m "<메시지>"
git push origin main
```

커밋 메시지:
- 신규 1건: `chore(data): add release <version> summary`
- 신규 N건 (N >= 2): `chore(data): add N release summaries (<oldest>..<newest>)`

### 8. 보고

다음 형식으로 출력:

```
처리 완료
- 신규 릴리즈: N 건
- 버전: v2.1.118, v2.1.119, ...
- 검증: PASS
- 커밋: <commit sha>
- 배포 URL: https://donghyeon-dev.github.io/cc-release/
```

## 오류 처리

- GitHub API rate limit (403): 보고 후 종료, 다음 스케줄 대기.
- merge conflict on push: `git pull --rebase` 후 재시도. 여전히 실패하면
  변경사항을 `.omc/backup-<timestamp>.json` 에 저장하고 보고.
- 검증 스크립트 FAIL: 실패 항목만 재작성해서 재검증. 3회 실패 시 해당
  버전은 skip 하고 보고에 명시.
- 요약 생성 실패: 해당 릴리즈만 skip 하고 다음으로 진행. 최종 보고에
  skip 목록 포함.
```

## 첫 실행

1. 등록 완료 후 **Run now** 클릭해서 수동 실행.
2. "신규 없음" 이면 성공 (지금 최신이 v2.1.117 이고 그게 이미 데이터에
   있음).
3. 만약 실행 후 새 릴리즈 (v2.1.118 등) 가 올라와서 신규 감지되면
   전체 파이프라인 (요약 생성 → 검증 → 커밋 → 푸시 → GitHub Pages 재배포)
   이 끝까지 도는지 확인.
