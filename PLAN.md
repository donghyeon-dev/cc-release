# cc-release 프로젝트 플랜

> Claude Code 릴리즈를 매일 자동 수집 · LLM 요약 · 정적 웹페이지로 발행

## 1. 목표

Claude Code 릴리즈노트가 길고 형식적이어서 "이번에 뭐가 바뀌었는지" 직관적으로 파악하기 어려움. LLM 개발자 관점에서 요약한 내용과 원문을 나란히 볼 수 있는 웹페이지를 자동 업데이트 방식으로 운영.

## 2. 최종 아키텍처

```
[매일 09:00 Claude Cowork 루틴 - Claude Desktop에서 실행]
    |
    | 1) GitHub API로 anthropics/claude-code 신규 릴리즈 조회
    | 2) 이미 처리된 버전은 skip (releases.json 기준)
    | 3) 신규 릴리즈마다 LLM 요약 생성 (개발자 관점, 한국어)
    | 4) data/releases.json 업데이트 + git commit + git push
    |
    v
[GitHub Pages - 정적 사이트]
    - main 브랜치 push 트리거로 GitHub Actions 자동 빌드/배포
    - Next.js 15 App Router + static export
    - UI: 한국어 / 원문: 영어 그대로 / 요약: 한국어
```

## 3. 기술 선택 (확정)

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router | static export로 GH Pages 호환, React 생태계 |
| 스타일 | Tailwind CSS | 빠른 UI 제작 |
| 언어 | TypeScript | 타입 안전성 |
| 패키지 매니저 | pnpm | 이미 설치됨 (v10.5.2) |
| 배포 | GitHub Pages | 무료, 레포 내 통합 |
| 데이터 저장소 | `data/releases.json` (레포에 커밋) | DB 불필요, append-only 성격에 적합, git history가 아카이브 |
| LLM 실행 주체 | Claude Cowork | Claude Desktop 루틴, 별도 API 키 불필요 |
| 알림 | 없음 (웹페이지만) | 회사 메일 외부 발신 제약, Slack 미사용 |
| 브랜치 | `main` | GitHub 기본값 통일 |
| UI 언어 | 한국어 | 사용자 편의 |
| 원문 표기 | 영어 그대로 | 번역 손실 방지 |

## 4. 디렉토리 구조 (목표)

```
cc-release/
|- web/                          Next.js 앱 루트
|  |- app/
|  |  |- layout.tsx
|  |  |- page.tsx                메인 (릴리즈 카드 목록)
|  |  |- releases/[tag]/page.tsx 상세 페이지 (선택, 나중에)
|  |  `- globals.css
|  |- components/
|  |  |- ReleaseCard.tsx         요약 + 원문 토글
|  |  |- SummarySection.tsx      newFeatures / changes / fixes 섹션
|  |  `- OriginalMarkdown.tsx    영어 원문 렌더링 (접기/펴기)
|  |- lib/
|  |  |- data.ts                 releases.json 로드 유틸
|  |  `- types.ts                Release 타입
|  |- next.config.ts             output: 'export', basePath 설정
|  |- package.json
|  `- tsconfig.json
|
|- data/
|  `- releases.json              단일 소스 (Cowork가 업데이트)
|
|- scripts/
|  |- cowork-prompt.md           Cowork 루틴에 붙여넣을 프롬프트
|  `- sample-release.json        수동 테스트용 샘플
|
|- .github/workflows/
|  `- deploy.yml                 main push -> GH Pages 배포
|
|- .gitignore
|- PLAN.md                       이 파일
`- README.md                     Cowork 설정 가이드 포함
```

## 5. 데이터 스키마

`data/releases.json` - 최신순 정렬된 배열

```typescript
interface Release {
  version: string;              // "v1.0.88"
  tagName: string;              // GitHub tag 그대로
  publishedAt: string;          // ISO 8601
  url: string;                  // GitHub release URL
  originalBody: string;         // 영어 원문 markdown
  summary: {
    headline: string;           // 한 줄 요약 (한국어)
    newFeatures: string[];      // 새 기능
    changes: string[];          // 기존 기능 변경/개선
    fixes: string[];            // 버그 수정
    devImpact: string;          // 개발자 관점 영향도/주의사항
  };
  summarizedAt: string;         // ISO 8601, 요약 생성 시각
  summaryModel: string;         // 예: "claude-opus-4-7" (재생성 추적용)
}
```

## 6. UI 구성

### 메인 페이지 (`/`)
- 상단 타이틀: "Claude Code 릴리즈 노트 요약"
- 서브타이틀: "개발자 관점에서 매일 업데이트"
- 최근 업데이트 시각 표시
- 릴리즈 카드 목록 (최신순)

### 릴리즈 카드
- 헤더: 버전 · 배포일 · GitHub 링크 (외부)
- **요약 섹션 (기본 펼침)**:
  - Headline (한국어, 굵게)
  - 새 기능 (unordered list, 아이콘)
  - 변경 (unordered list)
  - 수정 (unordered list)
  - 개발자 영향도 (회색 박스)
- **원문 섹션 (기본 접힘, 토글)**:
  - 영어 markdown 렌더링 (react-markdown 사용)

### 반응형
- 모바일: 카드 단열, 여백 축소
- 데스크톱: 최대 너비 `max-w-4xl` 중앙 정렬

### 다크모드
- Tailwind `dark:` 클래스 활용, 시스템 선호 자동 감지

## 7. Cowork 프롬프트 핵심 로직

```markdown
당신은 anthropics/claude-code 레포의 릴리즈노트 큐레이터다.

1. GitHub API 호출:
   GET https://api.github.com/repos/anthropics/claude-code/releases?per_page=30

2. 로컬 레포 donghyeon-dev/cc-release 를 clone/pull 한 뒤
   data/releases.json 을 읽는다.

3. GitHub 응답 중 releases.json 에 없는 tagName 만 필터링한다.
   신규 릴리즈가 없으면 종료.

4. 각 신규 릴리즈에 대해 다음 JSON 스키마로 요약을 생성한다
   (요약은 한국어, 원문은 영어 그대로 보존):
   {
     "headline": "...",
     "newFeatures": ["..."],
     "changes": ["..."],
     "fixes": ["..."],
     "devImpact": "..."
   }

   요약 원칙:
   - 마케팅 문구 제거, 기술적 사실만
   - 개발자가 실제로 사용/주의할 내용 중심
   - 한 항목 = 한 줄, 불필요한 수식어 제거
   - "개발자 영향도"는 breaking change / migration / 주의사항 위주

5. 기존 data/releases.json 에 신규 항목을 prepend (최신이 위)
   하고 저장한다.

6. git add data/releases.json, commit, push to main.
   커밋 메시지: "chore(data): add release {version} summary"
   신규가 여러 건이면 한 커밋에 묶는다. 메시지는
   "chore(data): add N release summaries (v1.0.85 ~ v1.0.88)"

7. 최종 요약 보고: 신규 몇 건, 어떤 버전들 처리했는지.
```

## 8. GitHub Actions (deploy.yml)

- 트리거: `push to main` (단, `data/**` 또는 `web/**` 변경 시만)
- 단계:
  1. checkout
  2. setup-node@v4 (v22)
  3. pnpm/action-setup
  4. `cd web && pnpm install --frozen-lockfile`
  5. `cd web && pnpm build` (next build, output: 'export')
  6. `actions/upload-pages-artifact` with `web/out`
  7. `actions/deploy-pages`
- Pages 설정: 레포 Settings > Pages > Source: "GitHub Actions"

## 9. 구현 실행 순서 (재부팅 후)

### Phase 1: 병렬 가능한 독립 작업 (동시 진행)
- [ ] 1-A. `pnpm create next-app@latest web` (PATH 이슈 해결 필요)
- [ ] 1-B. `data/releases.json` 스키마 + 샘플 데이터 2건 작성
- [ ] 1-C. `scripts/cowork-prompt.md` 작성
- [ ] 1-D. `.github/workflows/deploy.yml` 작성
- [ ] 1-E. `README.md` (Cowork 설정 가이드)
- [ ] 1-F. `.gitignore`

### Phase 2: UI 구현 (1-A, 1-B 완료 후)
- [ ] 2-A. `lib/types.ts`, `lib/data.ts`
- [ ] 2-B. `components/ReleaseCard.tsx`, `SummarySection.tsx`, `OriginalMarkdown.tsx`
- [ ] 2-C. `app/page.tsx` (메인)
- [ ] 2-D. `app/layout.tsx` 메타/타이틀
- [ ] 2-E. Tailwind 스타일 다듬기, 다크모드

### Phase 3: 배포 · 검증
- [ ] 3-A. `git remote add origin git@github.com:donghyeon-dev/cc-release.git`
- [ ] 3-B. `pnpm build` 로컬 검증
- [ ] 3-C. 첫 `git push` 후 Actions 성공 확인
- [ ] 3-D. GitHub Pages URL 접속 검증
- [ ] 3-E. Cowork 루틴 등록 (Claude Desktop UI)
- [ ] 3-F. 수동 1회 Cowork 실행으로 파이프라인 검증

## 10. 해결 필요한 이슈

### A. pnpm PATH 문제
`pnpm create next-app` 실행 중 내부에서 `pnpm install` 호출 시 cmd 창에서 pnpm을 찾지 못함. 재부팅 후 재시도하거나, 실패 시 대안:
- `npm create next-app` 으로 초기화 후 lockfile 만 pnpm 으로 재생성
- 또는 `corepack enable pnpm` 으로 pnpm 경로 보정

### B. GitHub Pages basePath
레포 이름이 `cc-release` 이므로 Pages URL은
`https://donghyeon-dev.github.io/cc-release/` 형태가 됨.
-> `next.config.ts` 에 `basePath: '/cc-release'`, `assetPrefix: '/cc-release/'` 필요.
-> 로컬 개발 시에는 env로 토글 (`NEXT_PUBLIC_BASE_PATH`).

### C. Cowork 의 git push 권한
- Cowork 가 GitHub 에 push 하려면 credential 이 필요.
- 옵션 1: Cowork 의 GitHub 커넥터 연동 (공식 제공 시)
- 옵션 2: Personal Access Token 을 Cowork 환경에 저장
- 재부팅 후 Cowork 의 실제 제공 기능을 확인하고 선택.

### D. Cowork 실행 환경 제약
- Cowork 는 Claude Desktop 이 켜져 있어야 실행됨.
- 9시에 PC 가 꺼져있으면 스킵 -> catch-up 로직이 프롬프트에 포함되어 있음
  (한 번에 여러 신규 릴리즈 처리).

## 11. Definition of Done

- [ ] `https://donghyeon-dev.github.io/cc-release/` 가 릴리즈 목록을 렌더링
- [ ] 과거 릴리즈 3건 이상이 수동/자동으로 채워져 있음
- [ ] Cowork 루틴이 등록되어 매일 09:00 에 실행 예정으로 표시됨
- [ ] Cowork 한 번 수동 실행으로 신규 릴리즈가 웹에 반영되는 것 검증 완료
- [ ] README 에 "새 PC 에서 Cowork 재설정 방법" 문서화

## 12. 향후 확장 아이디어 (지금은 하지 않음)

- 검색 / 태그 필터
- RSS 피드 생성
- 버전 간 diff 뷰 (v1.0.87 -> v1.0.88 무엇이 바뀌었나)
- claude-code 외 다른 도구 (codex CLI 등) 확장
- "내가 관심있는 기능" 북마크 (로컬 스토리지)
