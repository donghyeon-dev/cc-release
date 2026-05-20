# Feature Lab v2 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn Feature Lab into a product-like Claude Code feature explorer where users can find, compare, understand, and share features by audience, use case, impact, difficulty, release source, and setup behavior.

**Architecture:** Keep the existing Next.js static export architecture and evolve the data-driven feature catalog. Add fields and validators first, then layer UI modules on top of the validated model. Preserve shareable URL state and GitHub Pages preview checks throughout.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, JSON data under `data/feature-lab`, Node.js validation scripts, GitHub Pages preview.

---

## Context

Existing relevant files:

- `data/feature-lab/features.json` — current feature catalog source.
- `web/lib/feature-lab.ts` — TypeScript feature types and labels.
- `web/lib/feature-lab-data.ts` — JSON loader.
- `web/lib/feature-lab-url.ts` — URL state parse/serialize helpers.
- `web/lib/feature-lab-source.ts` — source evidence formatting.
- `web/components/feature-lab/FeatureLabPlayground.tsx` — main client UI.
- `web/app/feature-lab/page.tsx` — route entry.
- `scripts/validate-feature-lab.mjs` — catalog validator.
- `scripts/validate-feature-lab-url-state.mjs` — URL-state validator.
- `scripts/validate-feature-lab-source-card.mjs` — source evidence validator.

Build/verification commands in this environment:

```bash
CI=true corepack pnpm@10 install --frozen-lockfile
corepack pnpm@10 run validate:feature-lab-url-state
corepack pnpm@10 run validate:feature-lab
corepack pnpm@10 run validate:feature-lab-source-card
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
git diff --check
```

Preview rule:

- For visual/product UI changes, verify the deployed GitHub Pages PR preview, not only local build.
- Keep production `/cc-release/` and preview `/cc-release/preview/` distinct.

---

## Milestone PR strategy

Use one long-running draft PR:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feat/feature-lab-v2
```

PR title:

```txt
feat: evolve Feature Lab v2
```

PR body should list:

- Roadmap link: `docs/roadmap.md`
- Plan link: `docs/plans/2026-05-19-feature-lab-v2.md`
- Preview URL
- Current milestone checklist
- Validation commands and results

Commit style:

- `docs: add cc-release product roadmap`
- `test: extend feature lab catalog validation`
- `feat: enrich feature lab content model`
- `feat: add feature comparison panel`
- `feat: improve feature lab empty states`
- `test: add feature lab deep-link coverage`

---

## Phase 0: Roadmap and goal framing

### Task 0.1: Add product roadmap

**Objective:** Save the high-level product direction so future work does not fragment into tiny one-off PRs.

**Files:**

- Create: `docs/roadmap.md`

**Steps:**

1. Create roadmap with product thesis, operating model, milestones, and selected next goal.
2. Ensure it states Feature Lab v2 as the selected next goal.
3. Commit as `docs: add cc-release product roadmap`.

**Verification:**

```bash
git diff --check
```

Expected: no whitespace errors.

### Task 0.2: Add Feature Lab v2 plan

**Objective:** Save the implementation plan for the selected milestone.

**Files:**

- Create: `docs/plans/2026-05-19-feature-lab-v2.md`

**Steps:**

1. Write this plan with exact phases, files, validation commands, and preview requirements.
2. Commit together with Task 0.1 unless already committed.

**Verification:**

```bash
git status --short
```

Expected: only intended docs changed before commit; clean after commit.

---

## Phase 1: Content model expansion with validators first

### Task 1.1: Write failing validator checks for v2 fields

**Objective:** Extend catalog validation before changing production data or UI.

**Files:**

- Modify: `scripts/validate-feature-lab.mjs`
- Read: `web/lib/feature-lab.ts`
- Read: `data/feature-lab/features.json`

**New candidate fields:**

```ts
interface ClaudeCodeFeature {
  useCases?: string[];
  setupSteps?: string[];
  configExamples?: Array<{
    label: string;
    file?: string;
    language: "json" | "bash" | "markdown" | "text";
    code: string;
  }>;
  risks?: Array<{
    level: "low" | "medium" | "high";
    text: string;
    mitigation?: string;
  }>;
  relatedFeatureIds?: string[];
}
```

**Step 1: Add validator requirements behind a transitional rule**

Recommended rule for the first pass:

- Allow missing optional fields to avoid breaking all existing data at once.
- If the fields exist, validate shape strictly.
- Add a `--require-v2-fields` mode or internal list for first converted fixtures to prove failure.

**Step 2: Run validator against an intentionally invalid temporary fixture or strict mode**

Run:

```bash
node scripts/validate-feature-lab.mjs --require-v2-fields
```

Expected: FAIL because current catalog does not yet include v2 fields for all required entries, or because the temporary invalid sample is rejected.

**Step 3: Keep the validator but do not yet update UI**

Run:

```bash
node scripts/validate-feature-lab.mjs
```

Expected: PASS in non-strict transitional mode.

### Task 1.2: Update TypeScript types

**Objective:** Mirror the validated v2 fields in the TypeScript model.

**Files:**

- Modify: `web/lib/feature-lab.ts`

**Step 1: Add types**

Add type aliases/interfaces for config examples, risks, and related features.

**Step 2: Run build/type check through Next build**

Run:

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build succeeds.

### Task 1.3: Enrich a small high-value feature subset

**Objective:** Convert a small set of important features first, instead of bulk-editing all data blindly.

**Files:**

- Modify: `data/feature-lab/features.json`

**Initial subset:**

- `permission-allowlist`
- `allowed-tools-patterns`
- one hooks feature
- one MCP feature
- one model/TUI feature if present

**Step 1: Add v2 fields to selected features**

Each selected feature should get:

- 2–4 `useCases`
- 2–5 `setupSteps`
- 1–2 `configExamples`
- 1–3 `risks` with mitigation where useful
- `relatedFeatureIds` where there is a clear relationship

**Step 2: Validate**

Run:

```bash
corepack pnpm@10 run validate:feature-lab
```

Expected: PASS.

**Step 3: Commit**

```bash
git add web/lib/feature-lab.ts scripts/validate-feature-lab.mjs data/feature-lab/features.json
git commit -m "feat: enrich feature lab content model"
```

---

## Phase 2: UI modules for product-like detail

### Task 2.1: Add detail sections for use cases, setup, examples, and risks

**Objective:** Make selected feature details answer “what changes if I enable this?” more concretely.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Step 1: Add failing static text/check expectation through build or route smoke script**

If no component test framework exists, add validator/source smoke coverage where possible and rely on build plus preview for UI.

**Step 2: Render optional sections**

For selected features, render:

- “Best for” or use cases
- “Setup path” from `setupSteps`
- “Config example” cards with copy buttons
- “Risks & mitigations”
- “Related features” links that update selected feature and URL state

**Step 3: Preserve fallback for older features**

If v2 fields are absent, do not render empty shells.

**Step 4: Verify**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build succeeds.

### Task 2.2: Add related feature navigation

**Objective:** Let users move between connected features without manually searching.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`
- Modify if needed: `web/lib/feature-lab-url.ts`
- Modify if needed: `scripts/validate-feature-lab-url-state.mjs`

**Behavior:**

- Related feature chip click selects that feature.
- URL `feature=<id>` updates.
- Existing search/filter params are preserved unless they make the related feature invisible; if invisible, show a small note or clear conflicting filters.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-url-state
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

---

## Phase 3: Explorer UX improvements

### Task 3.1: Improve empty and invalid states

**Objective:** Avoid dead-end states when filters hide everything or URL contains a stale feature id.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`
- Modify: `web/lib/feature-lab-url.ts`
- Modify: `scripts/validate-feature-lab-url-state.mjs`

**Behaviors:**

- Empty result state shows active filters and one-click reset.
- Invalid `feature` param falls back to first visible feature or catalog default.
- If `feature` is valid but hidden by filters, show “selected feature is outside current filters” with option to clear filters.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-url-state
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

### Task 3.2: Add comparison or selected stack MVP

**Objective:** Allow users to compare two or more related Claude Code features at a glance.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**MVP behavior:**

- Add “Compare” action on feature cards.
- Maintain a local selected comparison list of up to 3 features.
- Show side-by-side rows: audience, difficulty, activation, goodFor, watchOut, risks.
- Keep it client-only for this milestone unless URL state is simple enough.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

---

## Phase 4: QA and preview hardening

### Task 4.1: Add feature deep-link export/smoke check

**Objective:** Ensure every feature id can be used as a shareable deep-link.

**Files:**

- Create or modify: `scripts/validate-feature-lab-url-state.mjs`
- Maybe create: `scripts/validate-feature-lab-deeplinks.mjs`
- Modify: `web/package.json` scripts if needed

**Behavior:**

- Iterate all feature ids.
- Build URL query strings with `feature=<id>` and representative filters.
- Assert parse/serialize round trip.
- Optionally check generated `out/feature-lab/index.html` exists after build.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-url-state
corepack pnpm@10 run validate:feature-lab
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

### Task 4.2: Verify deployed preview

**Objective:** Confirm the reviewer sees the intended UI on GitHub Pages preview.

**Steps:**

1. Push the branch.
2. Keep the PR as draft while iterating.
3. Update the preview branch/workflow according to the repo’s existing preview mechanism.
4. Wait for preview deploy.
5. Verify key URLs by HTTP:

```bash
curl -I 'https://donghyeon-dev.github.io/cc-release/preview/feature-lab/'
curl -L 'https://donghyeon-dev.github.io/cc-release/preview/feature-lab/?feature=permission-allowlist&audience=team' | grep -E 'Feature Lab|Permission|Team|Config|Risks'
```

6. For visual changes, open browser/screenshot and verify navigation path from preview entry page.

**Expected:**

- HTTP 200.
- Feature Lab route includes selected content.
- Main preview entry can navigate to Feature Lab.
- No production/preview URL confusion.

---

## Open decisions

- Whether comparison state should be encoded into URL in v2 or remain local-only for MVP. Decision for Goal 2: keep it local-only; revisit URL encoding after preview feedback.
- Whether all existing 19 features should get v2 fields before merge, or only high-value subset plus graceful fallback.
- Whether Config Simulator should remain inside Feature Lab detail sections or become a separate milestone route.

## Current goal status

Feature Lab v2 foundation is complete through Goal 4.

Completed goal plans:

1. `docs/plans/2026-05-19-feature-lab-v2-goal-2-selected-stack.md`
2. `docs/plans/2026-05-19-feature-lab-v2-goal-3-empty-invalid-states.md`
3. `docs/plans/2026-05-19-feature-lab-v2-goal-4-deeplink-qa.md`

Next roadmap goal:

- `docs/plans/2026-05-20-release-intelligence-goal-1-impact-summary.md`

Goal 4 added:

1. Dedicated deep-link validator for every feature id.
2. Round-trip checks for representative query/filter combinations.
3. `--require-export` mode that checks `web/out/index.html` and `web/out/feature-lab/index.html` after build.
4. `web/package.json` script/prebuild/postbuild integration so broken deep links fail before or immediately after static export.
5. GitHub Pages preview and production verification for representative deep links.

## Definition of Done

- [x] `docs/roadmap.md` and this plan exist.
- [x] Long-running draft PR exists for Feature Lab v2.
- [x] Content model v2 fields are typed and validated.
- [x] At least 5 high-value features include v2 fields.
- [x] Feature detail UI renders use cases, setup steps, config examples, risks, related features.
- [x] Empty/invalid URL states are friendly and tested.
- [x] Feature deep-link/URL validators pass.
- [x] Next static build passes with `NEXT_PUBLIC_BASE_PATH=/cc-release`.
- [x] GitHub Pages preview is deployed and verified.
