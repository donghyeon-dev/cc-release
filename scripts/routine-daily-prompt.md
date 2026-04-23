# Claude Code Routine 프롬프트 (증분 업데이트 전용)

> 이미 `data/releases.json` 에 273건+ 의 과거 릴리즈가 쌓여있다는 전제.
> Routine 은 매일 평일 09:00 KST 에 **신규 릴리즈만** 확인해서
> 요약을 추가하는 역할.

## Claude Code Routine 설정값

- Name: `cc-release-digest`
- Description: `anthropics/claude-code 신규 릴리즈를 한국어로 요약해 data/releases.json 에 추가`
- Frequency: Weekdays (Mon-Fri)
- Time: 09:00
- Timezone: Asia/Seoul
- 작업 디렉토리: `C:\Users\user\Documents\Personal\cc-release`

## 프롬프트 본문 (여기부터 복사)

```
당신은 `donghyeon-dev/cc-release` 레포의 릴리즈 큐레이터다. 매일 평일
09:00 에 실행되어, anthropics/claude-code 의 신규 릴리즈를 감지하고
개발자 관점 한국어 요약을 `data/releases.json` 에 추가한다.

## 작업 절차

### 1. 로컬 워크스페이스 확인

현재 작업 디렉토리가 `donghyeon-dev/cc-release` 의 로컬 체크아웃인지
확인한다. `git remote -v` 로 origin 이 `donghyeon-dev/cc-release` 인지,
`git status` 로 clean 상태인지 체크.

작업 전 최신화:
- `git checkout main`
- `git pull --rebase origin main`

dirty 상태면 중단하고 보고. 사용자가 미리 커밋해야 함.

### 2. 기존 릴리즈 목록 로드

`data/releases.json` 을 읽고, `tagName` 값들을 집합으로 만든다 (`known`).

### 3. GitHub 신규 릴리즈 조회

다음 API 엔드포인트 호출:

curl -s https://api.github.com/repos/anthropics/claude-code/releases?per_page=30

필터:
- `draft === false`, `prerelease === false`
- `tag_name` 이 `known` 에 없는 것만 → `new_releases`

`new_releases.length === 0` 이면 "신규 없음" 보고 후 종료 (커밋 생략).

**금지**: releasebot.io 같은 제3자 미러 소스 사용 금지. 출처는 반드시
`api.github.com` 또는 `https://github.com/anthropics/claude-code/releases`
공식 페이지로 한정. `originalBody` 오염 방지를 위해 body 복사는
GitHub 공식 응답에서만 수행.

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
- "외부 빌드에서도 `CLAUDE_CODE_FORK_SUBAGENT=1` 환경변수로 서브에이전트 fork 활성화 가능"
- "`/resume` 로 40MB 이상 대형 세션 로드가 최대 67% 빨라짐 — 긴 히스토리 재개 대기 단축"
- "프록시가 `HTTP 204 No Content` 반환 시 `TypeError` 크래시 대신 명확한 에러 메시지 노출"

**나쁜 예 (이런 식이면 재작성)**:
- "Claude Code 기능 추가 — 관련 작업을 CLI 흐름 안에서 처리 가능"
- "명령 UI 흐름 개선 — 탐색, 입력, 표시 상태를 더 예측 가능하게 조정"

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

node scripts/validate-releases.mjs

**`PASS` 확인 전까지 절대 커밋하지 말 것.** 에러 있으면 해당 항목
요약을 재작성해서 재검증. 3회 실패 시 해당 버전은 skip 하고 보고에 명시.

### 7. 커밋 & 푸시

git add data/releases.json
git commit -m "<메시지>"
git push origin main

커밋 메시지:
- 신규 1건: `chore(data): add release <version> summary`
- 신규 N건 (N >= 2): `chore(data): add N release summaries (<oldest>..<newest>)`

### 8. 보고

다음 형식으로 출력:

처리 완료
- 신규 릴리즈: N 건
- 버전: v2.1.118, v2.1.119, ...
- 검증: PASS
- 커밋: <commit sha>
- 배포 URL: https://donghyeon-dev.github.io/cc-release/

## 오류 처리

- `git pull --rebase` 실패 (충돌): 변경사항을 `.omc/backup-<timestamp>.json`
  에 저장하고 보고 후 중단.
- dirty working tree: 작업 중단하고 보고. 사용자에게 수동 커밋 요청.
- GitHub API rate limit (403): 보고 후 종료, 다음 스케줄 대기.
- merge conflict on push: `git pull --rebase` 후 재시도. 여전히 실패하면
  변경사항을 `.omc/backup-<timestamp>.json` 에 저장하고 보고.
- 검증 스크립트 FAIL: 실패 항목만 재작성해서 재검증. 3회 실패 시 해당
  버전은 skip 하고 보고에 명시.
- 요약 생성 실패: 해당 릴리즈만 skip 하고 다음으로 진행. 최종 보고에
  skip 목록 포함.
```

## Claude Desktop 에서 Routine 등록

1. **Claude Desktop** 실행 → 좌측 사이드바 **Code** 클릭
2. **Routines** 탭 진입 → **Create Routine** (또는 `+`)
3. 각 필드:
   - **Name**: `cc-release-digest`
   - **Description**: `anthropics/claude-code 신규 릴리즈를 한국어로 요약해 data/releases.json 에 추가`
   - **Working directory**: `C:\Users\user\Documents\Personal\cc-release`
     (Routine UI 에 이 필드가 있으면 반드시 설정. 없으면 프롬프트
     본문 첫 섹션의 `cd` 로직으로 대체 가능)
   - **Schedule**: Weekdays, 09:00, Asia/Seoul
     Cron 필드라면: `0 9 * * 1-5`
   - **Prompt**: 위 "프롬프트 본문" 백틱 블록 **안쪽** 전체 복사 붙여넣기
     - 시작 줄: `당신은 donghyeon-dev/cc-release 레포의 릴리즈 큐레이터다.`
     - 끝 줄: `skip 목록 포함.`
4. **Save**
5. 생성된 Routine 에서 **Run now** 클릭 → 수동 테스트

### 기대 결과

"신규 없음" 보고 + `data/releases.json` 무변경 + 커밋 없음. 현재 최신
v2.1.117 이 이미 수록되어 있기 때문.

## Cowork Scheduled Task 정리

기존에 Cowork 에 등록한 태스크는 **삭제**. 둘 다 돌면 커밋 경합 발생.

## 주의사항

- **PC 가동 필수**: 평일 09:00 에 PC 켜져 있어야 Routine 실행. 절전/종료 시 skip.
- **git push 인증**: 현재 로컬 git 설정으로 `origin main` 에 푸시 가능한
  상태여야 함 (SSH 키 또는 credential helper 등록 확인).
- **Claude Code 자체 업데이트 충돌 주의**: Routine 실행 도중 Claude
  Code 가 재시작되면 작업 중단 가능. 가능하면 Routine 실행 시간대에는
  수동 업데이트 회피.
