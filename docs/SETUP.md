# 설치 · 배포 가이드

이 문서는 레포 초기 push 이후, 웹페이지 배포와 Cowork 자동화 설정을 마무리하기 위한 단계별 가이드입니다.

## 체크리스트 개요

- [ ] 1. GitHub 레포에 초기 커밋 push
- [ ] 2. GitHub Pages 소스를 "GitHub Actions" 로 설정
- [ ] 3. 첫 Actions 빌드 확인 → 배포 URL 접속 검증
- [ ] 4. Claude Desktop 에서 Cowork 루틴 등록
- [ ] 5. Cowork 수동 "Run now" 로 전체 파이프라인 검증

---

## 1. GitHub 레포에 초기 커밋 push

현재 로컬에는 첫 커밋이 준비된 상태입니다. 원격 연결 후 push 하세요.

### HTTPS 방식

```bash
cd C:/Users/user/Documents/Personal/cc-release
git remote add origin https://github.com/donghyeon-dev/cc-release.git
git push -u origin main
```

### SSH 방식 (선호 시)

```bash
git remote add origin git@github.com:donghyeon-dev/cc-release.git
git push -u origin main
```

### 인증 방법

- **HTTPS**: Windows Credential Manager 또는 GitHub CLI 가 자동 처리.
  GitHub CLI 설치되어 있으면 `gh auth login` 한 번 실행 후 push.
- **SSH**: `~/.ssh/id_ed25519.pub` 가 GitHub 계정에 등록되어 있어야 함.

### 원격이 "비어있지 않은" 경우

GitHub 에서 레포 생성 시 README/LICENSE/gitignore 를 추가했다면 원격이 비어있지 않습니다. 이 경우:

```bash
git pull origin main --rebase --allow-unrelated-histories
git push -u origin main
```

충돌이 나면 로컬 버전 우선으로 해결 (`git checkout --ours` 후 `git add`, `git rebase --continue`).

---

## 2. GitHub Pages 소스 설정

Push 성공 후, GitHub 레포 웹 UI 에서 Pages 소스를 변경해야 Actions 기반 배포가 동작합니다.

1. 브라우저에서 `https://github.com/donghyeon-dev/cc-release` 접속
2. 상단 **Settings** 탭
3. 좌측 사이드바에서 **Pages** 클릭
4. "Build and deployment" 섹션의 **Source** 드롭다운:
   - 현재 값: `Deploy from a branch` (기본)
   - 변경 값: **`GitHub Actions`**
5. 저장 (드롭다운 선택만으로 자동 저장됨)

> ⚠️ 이 단계를 건너뛰면 Actions 워크플로우는 성공해도 실제 Pages 호스팅은 동작하지 않습니다.

---

## 3. 첫 Actions 빌드 확인

Push 가 완료되면 `.github/workflows/deploy.yml` 이 자동 트리거됩니다.

1. GitHub 레포 상단 **Actions** 탭
2. 가장 최근 워크플로우 실행 클릭 → `build` → `deploy` 두 job 성공 확인
3. `deploy` job 하단의 "Environment: github-pages" URL 클릭 →
   `https://donghyeon-dev.github.io/cc-release/` 접속
4. 샘플 릴리즈 2건이 카드로 렌더링되는지 확인

### 실패 시

- `build` job 실패: 로그에서 오류 확인. 대부분 Node/pnpm 버전 또는 TS 오류.
- `deploy` job 실패: Pages 소스가 "GitHub Actions" 로 설정 안 된 경우 (2단계).
- 페이지가 404: basePath 문제. `.github/workflows/deploy.yml` 의
  `NEXT_PUBLIC_BASE_PATH: /cc-release` 값이 레포 이름과 일치하는지 확인.

---

## 4. Claude Desktop 에서 Cowork 루틴 등록

### 사전 조건

- Claude Desktop 앱 설치 (Windows 용)
- Claude 유료 플랜 (Pro / Max / Team / Enterprise) — Cowork 는 유료 전용

### 단계

1. **Claude Desktop 실행**
2. 상단 메뉴 또는 사이드바의 **Cowork** 탭 오픈
3. **Create routine** 버튼 클릭
4. 루틴 이름: `Claude Code 릴리즈 요약`
5. 프롬프트 입력란에 [`scripts/cowork-prompt.md`](../scripts/cowork-prompt.md) 의
   "프롬프트 본문" 섹션 전체 복사 → 붙여넣기
6. **Schedule** 설정:
   - Frequency: `Daily`
   - Time: `09:00`
   - Timezone: `Asia/Seoul` (KST)
7. **Connectors** 활성화:
   - **GitHub** — `repo` scope (read + write 필요)
   - **Filesystem** — 작업 디렉토리 `~/cowork-workspace/` 허용
8. **Save** 클릭

### GitHub 인증 (첫 실행 시)

Cowork 의 GitHub 커넥터가 OAuth 로 권한 요청합니다:
- `donghyeon-dev/cc-release` 레포에 대한 `contents: write` 권한 승인
- 승인 후 이후 실행은 자동

---

## 5. 수동 검증 실행

### "Run now" 로 파이프라인 검증

1. 등록한 루틴 카드에서 **Run now** 클릭
2. 실행 로그 탭에서 진행 상황 관찰:
   - ✓ GitHub API 호출 → 릴리즈 목록 수신
   - ✓ 신규 릴리즈 N건 식별
   - ✓ 각 릴리즈에 대해 요약 생성
   - ✓ `data/releases.json` 업데이트
   - ✓ `git push origin main` 성공
3. GitHub 레포에서 새 커밋 확인 (`chore(data): add ...`)
4. 몇 분 뒤 Actions 가 자동 재배포 → 웹페이지에 실제 릴리즈 반영 확인

### 예상 결과

- 샘플 데이터 (`v1.0.0-sample-1`, `v1.0.0-sample-2`) 는 그대로 남음
  (Cowork 는 기존 항목을 덮지 않음, 신규만 prepend)
- **샘플 제거 원하는 경우**: 수동으로 `data/releases.json` 에서 sample 2건 삭제
  후 커밋·푸시. 이후 Cowork 가 실제 anthropics/claude-code 릴리즈로 채움.

---

## 6. 운영 팁

### Claude Desktop 꺼진 날

- 9 시에 Desktop 이 꺼져있으면 그날 실행은 스킵됩니다.
- 다음 실행 시 **catch-up** 로직이 작동 — 누락된 모든 신규 릴리즈를 한 번에 처리.
- 장기간 (예: 휴가) 자리를 비우는 경우, 돌아와서 수동 "Run now" 한 번이면 싱크.

### 요약 품질이 마음에 안 들 때

- `scripts/cowork-prompt.md` 의 "요약 원칙" 섹션 수정
- Cowork 루틴 편집에서 프롬프트 업데이트
- 기존 `data/releases.json` 의 해당 항목을 삭제하면 다음 실행 때 재생성됨

### 다른 레포로 확장

프롬프트의 `anthropics/claude-code` 를 다른 레포로 바꾸면 그대로 적용.
UI 타이틀 (`web/app/page.tsx`, `web/app/layout.tsx`) 도 함께 수정 권장.

---

## 체크리스트 (최종)

- [ ] 1. `git push -u origin main` 성공
- [ ] 2. Settings → Pages → Source = `GitHub Actions`
- [ ] 3. Actions 워크플로우 `build` + `deploy` 성공
- [ ] 4. `https://donghyeon-dev.github.io/cc-release/` 접속 → 샘플 2건 정상 렌더링
- [ ] 5. Claude Desktop Cowork 루틴 등록 (Daily 09:00 KST)
- [ ] 6. Cowork "Run now" 수동 실행 → 실제 릴리즈가 웹에 반영됨
- [ ] (선택) `data/releases.json` 에서 `v1.0.0-sample-*` 2건 제거 후 커밋
