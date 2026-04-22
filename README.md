# cc-release

Claude Code 릴리즈를 매일 자동으로 수집·요약하여 개발자 친화적인 웹페이지로 발행하는 프로젝트.

**Live**: https://donghyeon-dev.github.io/cc-release/

## 왜 만들었나

- Claude Code 공식 릴리즈 노트는 포맷이 길고 마케팅 톤이 섞여 있어 "이번에 뭐가 바뀐 거지?" 가 즉시 안 와닿음.
- LLM 으로 개발자 관점에서 **핵심만 요약**한 뷰와 **원문**을 함께 보여주면 더 빠르게 파악 가능.
- Claude Cowork 의 스케줄 루틴 기능을 활용해 완전 자동화.

## 구조

```
cc-release/
├── web/                    Next.js 정적 사이트 (GitHub Pages 배포)
├── data/releases.json      Cowork 가 매일 업데이트하는 단일 소스
├── scripts/
│   └── cowork-prompt.md    Cowork 루틴에 붙여넣을 프롬프트
└── .github/workflows/
    └── deploy.yml          main push 시 자동 배포
```

### 데이터 흐름

```
매일 09:00
  Claude Desktop (Cowork 루틴)
    └─ GitHub API 로 anthropics/claude-code 신규 릴리즈 조회
        └─ 개발자 관점 요약 생성 (한국어)
            └─ data/releases.json 에 prepend + git push
                └─ GitHub Actions 가 Next.js 빌드 & GH Pages 배포
```

## 로컬 개발

```bash
cd web
pnpm install
pnpm dev
# http://localhost:3000 접속
```

빌드 검증:

```bash
cd web
pnpm build
# web/out 에 정적 파일 생성
```

## 데이터 스키마

`data/releases.json` 은 최신순 배열. 각 항목은:

```ts
interface Release {
  version: string;          // "v1.0.88"
  tagName: string;          // GitHub tag 그대로
  publishedAt: string;      // ISO 8601
  url: string;              // GitHub release URL
  originalBody: string;     // 영어 원문 markdown (번역 X)
  summary: {
    headline: string;       // 한 줄 요약 (한국어)
    newFeatures: string[];
    changes: string[];
    fixes: string[];
    devImpact: string;      // 개발자 관점 영향도 (한국어)
  };
  summarizedAt: string;
  summaryModel: string;     // 예: "claude-opus-4-7"
}
```

## 배포 & Cowork 설정

단계별 배포 · Cowork 루틴 등록 가이드는 [`docs/SETUP.md`](./docs/SETUP.md) 참조.

Cowork 프롬프트 원문은 [`scripts/cowork-prompt.md`](./scripts/cowork-prompt.md).

1. Claude Desktop 실행 → Cowork 패널 오픈
2. `Create routine` 클릭
3. `scripts/cowork-prompt.md` 의 "프롬프트 본문" 섹션을 복사해서 붙여넣기
4. Schedule: `Daily at 09:00 (Asia/Seoul)`
5. Connectors: **GitHub** (repo scope 필요), **Filesystem** (workspace 경로 허용)
6. 첫 실행: `Run now` 로 수동 실행하여 검증

### 주의사항

- **Claude Desktop 이 켜져 있어야** 실행됨. PC 가 꺼진 날은 스킵되며, 다음 실행 시 놓친 릴리즈를 모두 catch-up 함 (프롬프트에 포함).
- GitHub push 를 위해 Cowork 환경에 git credential 이 필요. 첫 실행 시 안내에 따라 PAT 또는 SSH 키 등록.

## 배포

- `main` 브랜치에 `web/**` 또는 `data/**` 변경이 push 되면 GitHub Actions 가 자동 배포.
- GitHub Pages 설정: Repository Settings → Pages → Source: `GitHub Actions`.

## 재설정 (새 PC 등)

1. 이 레포 clone
2. GitHub Pages 는 자동 동작 (변경 불필요)
3. Cowork 루틴만 새로 등록 (`scripts/cowork-prompt.md` 참조)

## 향후 확장 아이디어

- [ ] 검색 / 태그 필터
- [ ] 버전 간 diff 뷰 (v1.0.87 → v1.0.88)
- [ ] RSS 피드
- [ ] 관심 기능 북마크 (localStorage)

## License

MIT
