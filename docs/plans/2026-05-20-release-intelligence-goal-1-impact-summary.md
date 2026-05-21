# Release Intelligence Goal 1: Impact Summary Rail Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the release list from a chronological archive into a release intelligence surface by adding a compact “what matters now” rail backed by validated release summary data.

**Architecture:** Keep the existing static-export Next.js app and `data/releases.json` as the source of truth. Add a small derived intelligence layer in `web/lib/` that classifies already-structured release summaries into high-signal groups, then render it above the release list with anchors back to existing release cards. Avoid changing the daily ingestion pipeline in this goal.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, `data/releases.json`, `scripts/validate-releases.mjs`, GitHub Pages preview.

---

## Context

Feature Lab v2 is functionally complete through Goal 4:

- Feature detail model and UI are enriched.
- Selected stack/comparison UX exists.
- Empty/invalid URL recovery states exist.
- Deep-link/static-export validators are wired into `prebuild`/`postbuild`.
- Preview and production deep-links were verified in PR #26.

The roadmap’s next product milestone is **Release Intelligence**:

> Claude Code 릴리즈 변화가 사용자에게 어떤 의미인지 해석하는 페이지를 만든다.

This goal intentionally starts small: it should use existing structured data and produce an immediately visible, low-risk intelligence layer.

## Product rules

1. Do not rewrite `data/releases.json` in this goal.
2. Do not change the Claude Desktop daily Routine prompt in this goal; that was handled separately in PRs #27 and #28.
3. Use existing `summary.newFeatures`, `summary.changes`, `summary.fixes`, `summary.devImpact`, and related Feature Lab links.
4. Prefer specific tokens already in release bullets over generic wording.
5. Keep the first UI addition compact and scannable; do not redesign the whole release list.
6. Preserve existing release card anchors: `#release-<version>`.

## Target UX

Add a rail/card near the top of the home page, before the release list:

- Title: `Release Intelligence`
- Short Korean description: latest changes grouped by practical impact.
- Three to four sections, for example:
  - `놓치면 안 되는 변화` — releases with concrete `devImpact` items.
  - `자동화/권한 영향` — releases mentioning hooks, permission, sandbox, MCP, OAuth, plugin, background/session automation.
  - `성능/안정성 개선` — releases mentioning speed, crash, hang, Windows/WSL, proxy, rendering, resume.
  - `Feature Lab로 이어지는 릴리즈` — recent releases with related feature links.
- Each item links to the existing release card anchor and shows version, date, headline, and one compact reason.

## Out of scope

- Dedicated `/release-intelligence/` route.
- New persistent schema fields such as `importance`, `riskLevel`, or `impactedAudience`.
- Editing historical release summaries.
- Daily routine scheduling changes.
- Full timeline redesign.

---

## Task 1: Add derived release intelligence helpers

**Objective:** Create a deterministic, testable/validatable helper that selects high-signal release items from existing data.

**Files:**

- Create: `web/lib/release-intelligence.ts`
- Read: `web/lib/types.ts`
- Read: `web/lib/dev-impact.ts`
- Read: `web/lib/bullet.ts`

**Implementation notes:**

Create exported types:

```ts
export type ReleaseIntelligenceBucketId =
  | "must-know"
  | "automation-permissions"
  | "stability-performance"
  | "feature-lab-linked";

export interface ReleaseIntelligenceItem {
  version: string;
  publishedAt: string;
  headline: string;
  reason: string;
  href: string;
}

export interface ReleaseIntelligenceBucket {
  id: ReleaseIntelligenceBucketId;
  title: string;
  description: string;
  items: ReleaseIntelligenceItem[];
}
```

Add a function:

```ts
export function buildReleaseIntelligence(
  releases: Release[],
  options?: { maxPerBucket?: number; relatedReleaseVersions?: Set<string> },
): ReleaseIntelligenceBucket[]
```

Rules:

- Default `maxPerBucket = 4`.
- `href` should be `#release-${release.version}`.
- `must-know`: releases with non-empty structured `summary.devImpact`, reason from first devImpact text.
- `automation-permissions`: text match across headline/bullets/devImpact for tokens like `permission`, `permissions`, `sandbox`, `hook`, `hooks`, `MCP`, `OAuth`, `plugin`, `background`, `subagent`, `agent`, `workflow`.
- `stability-performance`: tokens like `fix`, `crash`, `hang`, `faster`, `speed`, `performance`, `Windows`, `WSL`, `proxy`, `resume`, `rendering`, `stale`, `idle`.
- `feature-lab-linked`: releases whose version appears in `relatedReleaseVersions`.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: TypeScript build succeeds.

---

## Task 2: Add a validator/smoke script for release intelligence

**Objective:** Prevent the rail from silently rendering empty or broken buckets as release data changes.

**Files:**

- Create: `scripts/validate-release-intelligence.mjs`
- Modify: `web/package.json`
- Read: `data/releases.json`
- Read: `data/feature-lab/features.json`

**Behavior:**

The script should:

1. Load `data/releases.json`.
2. Load `data/feature-lab/features.json`.
3. Build related release version set from `feature.relatedReleases`.
4. Import/use the same matching logic when practical, or duplicate a small deterministic check if importing TS is too costly.
5. Assert:
   - at least 3 intelligence buckets exist,
   - each bucket has at least 1 item for the current dataset,
   - each item version exists in `data/releases.json`,
   - each `href` is `#release-<version>`,
   - no item reason is an empty/generic string.

Add package script:

```json
"validate:release-intelligence": "node ../scripts/validate-release-intelligence.mjs"
```

Wire it into `prebuild` after `validate-releases.mjs` if `prebuild` already validates releases; otherwise add it to documented manual validation first.

**TDD:**

1. Add script entry to `web/package.json` before the file exists.
2. Run:

```bash
corepack pnpm@10 run validate:release-intelligence
```

Expected: FAIL because script is missing.

3. Implement script.
4. Re-run and expect PASS.

---

## Task 3: Render the Release Intelligence rail on the home page

**Objective:** Make the next milestone visible to users without redesigning the release cards.

**Files:**

- Create: `web/components/ReleaseIntelligenceRail.tsx`
- Modify: `web/app/page.tsx`
- Read: `web/components/ReleaseList.tsx`

**Behavior:**

- Home page computes related release version set from Feature Lab features.
- Home page calls `buildReleaseIntelligence(releases, { relatedReleaseVersions })`.
- Render `ReleaseIntelligenceRail` between the Feature Lab CTA section and the release list.
- Each item links to `#release-vX.Y.Z`.
- Use Korean copy.
- Keep mobile layout single-column and desktop layout grid/cards.
- If all buckets are empty, render nothing.

**Copy direction:**

- Heading: `Release Intelligence`
- Description: `최근 Claude Code 변경 중 설정·권한·자동화·안정성에 바로 영향을 줄 수 있는 항목만 먼저 모았습니다.`
- CTA text per item: `릴리즈 보기 →`

**Verification:**

```bash
corepack pnpm@10 run validate:release-intelligence
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: PASS and static export succeeds.

---

## Task 4: Preview and production verification

**Objective:** Verify the rail on deployed GitHub Pages, not only local build.

**Steps:**

1. Push PR branch.
2. Rebuild preview branch from latest `origin/main` plus PR commit.
3. Wait for Preview Deploy workflow.
4. Verify preview HTTP/DOM:

```bash
curl -L 'https://donghyeon-dev.github.io/cc-release/preview/' | grep -E 'Release Intelligence|놓치면 안 되는 변화|자동화|안정성'
```

5. Browser/screenshot check if available:
   - Home page shows the Release Intelligence rail above the release list.
   - At least one item link scrolls/navigates to an existing release card anchor.
6. Merge PR.
7. Wait for production Deploy workflow.
8. Verify production:

```bash
curl -L 'https://donghyeon-dev.github.io/cc-release/' | grep -E 'Release Intelligence|놓치면 안 되는 변화|자동화|안정성'
```

## Validation commands

Run before PR:

```bash
corepack pnpm@10 run validate:release-intelligence
corepack pnpm@10 run validate:feature-lab
corepack pnpm@10 run validate:feature-lab-url-state
corepack pnpm@10 run validate:feature-lab-source-card
corepack pnpm@10 run validate:feature-lab-deeplinks
corepack pnpm@10 run validate:feature-lab-selected-stack
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
git diff --check
```

## Definition of Done

- [x] `buildReleaseIntelligence` creates deterministic non-empty buckets from current data.
- [x] Validator catches empty/malformed release intelligence output.
- [x] Home page renders Release Intelligence rail above the release list.
- [x] Rail item anchors link to existing release cards.
- [ ] Existing release list/search behavior still works.
- [ ] GitHub Pages preview is deployed and verified.
- [ ] Production deploy is verified after merge.
