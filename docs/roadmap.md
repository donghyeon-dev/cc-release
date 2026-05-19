# cc-release Product Roadmap

> cc-release를 “Claude Code 릴리즈 요약 페이지”에서 “Claude Code 기능·설정·릴리즈 변화 이해를 돕는 인터랙티브 가이드”로 고도화하기 위한 제품 로드맵.

## Product thesis

Claude Code의 릴리즈 노트와 기능 문서는 빠르게 늘어나지만, 사용자는 보통 다음 질문에 답하고 싶다.

- 이번 릴리즈가 내 워크플로우에 어떤 영향을 주는가?
- 어떤 설정을 켜면 실제 사용 경험이 어떻게 달라지는가?
- 내 상황(solo dev, team, CI, MCP user, power user)에 맞는 기능은 무엇인가?
- 안전하게 자동화하려면 어떤 permission/hook/MCP 설정을 써야 하는가?

따라서 cc-release의 장기 방향은 단순 changelog가 아니라 다음을 결합한 제품이다.

1. 릴리즈 변화 해석
2. Claude Code 기능 카탈로그
3. 설정/권한/자동화 체험형 예시
4. 공식 문서·릴리즈 근거 기반의 신뢰 가능한 archive

## Operating model

작은 개선마다 PR을 만들지 않고, milestone 단위의 long-running draft PR을 유지한다.

- 각 milestone은 하나의 product goal을 가진다.
- 변경은 여러 커밋으로 누적한다.
- PR preview에서 사용자가 확인 가능한 단위로 중간 검증한다.
- merge 전에는 GitHub Pages preview에서 실제 navigation/deep-link를 확인한다.

권장 PR 단위:

| Milestone | Branch/PR 예시 | Merge 기준 |
| --- | --- | --- |
| Feature Lab v2 | `feat/feature-lab-v2` | 기능 탐색/비교/공유 경험이 제품형으로 완성 |
| Release Intelligence | `feat/release-intelligence` | 릴리즈 변화의 의미/영향/연결 기능 표시 |
| Config Simulator | `feat/config-simulator` | 설정 전후와 permission/hook/MCP 흐름 체험 가능 |
| Visual Polish | `feat/product-polish` | landing/navigation/mobile/metadata 정리 |
| QA Suite | `feat/qa-suite` | 데이터·URL·route·preview 검증 자동화 |

## Roadmap

### 1. Feature Lab v2 — selected next goal

**Goal:** Claude Code 기능을 audience, use case, difficulty, impact, release source 기준으로 탐색하고, 각 기능의 설정 전후 차이를 이해할 수 있는 제품형 페이지로 만든다.

**Why now:** 이미 `/feature-lab/`의 기본 구조, catalog, URL state, audience filter, source evidence가 존재한다. 가장 적은 리스크로 체감 품질을 올릴 수 있다.

**Scope:**

- Feature detail model 확장
- use case / scenario / risk / config example 데이터 정리
- feature comparison 또는 “selected stack” UX
- source evidence와 related release 연결 강화
- shareable URL과 empty/invalid state UX 개선
- 모바일/preview navigation polish
- validators 강화

**Out of scope for this milestone:**

- 전체 릴리즈 요약 UX 재설계
- 외부 API/자동 수집 파이프라인 변경
- 사용자 계정/저장 기능

**Definition of Done:**

- `/feature-lab/`에서 사용자가 “내 상황에 맞는 기능”을 찾고 공유할 수 있다.
- 선택한 기능의 before/after, setup snippet, risks, source/release 근거가 한 화면에서 이해된다.
- 필터/검색/선택 상태가 URL로 안정적으로 공유된다.
- 모든 feature id deep-link가 static export에서 유효하다.
- validators와 Next build가 통과한다.
- GitHub Pages preview에서 주요 deep-link와 navigation을 HTTP/browser로 확인한다.

### 2. Content Model & Validation

**Goal:** features, releases, docs source 데이터를 확장 가능한 content model로 정리하고 검증 파이프라인을 강화한다.

**Candidate work:**

- `ClaudeCodeFeature` schema에 `useCases`, `scenarios`, `configExamples`, `risks`, `sourceRefs` 추가 검토
- feature ↔ release ↔ docs source 관계 검증
- 중복 id / dead source / missing related release 검증
- static export 대상 feature id 점검

### 3. Release Intelligence

**Goal:** Claude Code 릴리즈 변화가 사용자에게 어떤 의미인지 해석하는 페이지를 만든다.

**Candidate work:**

- 릴리즈별 중요 변화, risk, migration note, impacted audience 요약
- Feature Lab 기능과 관련 릴리즈 상호 링크
- “놓치면 안 되는 변화” 섹션
- version timeline 개선

### 4. Config / Permission Simulator

**Goal:** Claude Code 설정, permissions, hooks, MCP가 실제 워크플로우에서 어떻게 작동하는지 체험하게 한다.

**Candidate work:**

- `.claude/settings.json` preview
- allowed tools pattern simulator
- permission prompt simulator
- hooks lifecycle visualization
- MCP connection flow
- safe/unsafe configuration examples

### 5. Product Polish

**Goal:** 사이트 전체를 제품형 archive처럼 보이게 다듬는다.

**Candidate work:**

- landing hero and primary CTA
- navigation IA
- mobile layout
- OpenGraph metadata
- screenshot-friendly preview route
- copywriting cleanup

### 6. QA Suite

**Goal:** 더 큰 milestone PR을 안전하게 돌릴 수 있도록 검증 자동화를 강화한다.

**Candidate work:**

- all feature deep-link check
- filter serialization/fallback tests
- source URL sanity check
- route smoke test against exported `out/`
- GitHub Pages preview HTTP verification script

## Current next action

Continue **Feature Lab v2** after PR #25 with **Goal 4: Deep-Link and Static Export QA**.

- Main milestone plan: `docs/plans/2026-05-19-feature-lab-v2.md`
- Completed Goal 2 plan: `docs/plans/2026-05-19-feature-lab-v2-goal-2-selected-stack.md`
- Completed Goal 3 plan: `docs/plans/2026-05-19-feature-lab-v2-goal-3-empty-invalid-states.md`
- Next goal plan: `docs/plans/2026-05-19-feature-lab-v2-goal-4-deeplink-qa.md`
- Recommended merge point: after all Feature Lab deep-link helpers, representative filters, static export artifacts, GitHub Pages preview, and production routes are verified.
