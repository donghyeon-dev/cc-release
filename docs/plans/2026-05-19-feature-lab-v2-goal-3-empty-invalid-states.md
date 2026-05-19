# Feature Lab v2 Goal 3: Empty and Invalid State Hardening

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make `/feature-lab/` resilient when filters produce no results, a shared URL contains an invalid feature id, or the selected feature is hidden by active filters.

**Architecture:** Keep the existing static Next.js route and client-only URL state. Add lightweight validator coverage for the required UI strings and URL-state cases, then render contextual recovery actions in `FeatureLabPlayground.tsx` without changing the selected-stack URL decision from Goal 2.

**Tech Stack:** Next.js App Router, React state/effects, TypeScript, Tailwind CSS, Node.js validators, GitHub Pages preview.

---

## Scope

- Empty result state shows the active filter/search chips and a one-click reset action.
- Invalid `feature=<id>` URL falls back to the first visible/default feature and shows a dismissible recovery notice.
- Valid selected feature hidden by active filters shows a notice with actions to clear filters or jump back to a visible feature.
- Pagination remains stable when filters change or no results exist.
- Existing shareable URL params remain limited to `feature`, `q`, `category`, `difficulty`, `impact`, and `audience`.

## Out of scope

- Encoding selected stack in the URL.
- Adding account/saved preferences.
- Redesigning the full Feature Lab layout.

## Task 1: Add validator expectations

**Objective:** Create failing checks for Goal 3 UI/recovery behavior before implementation.

**Files:**
- Modify: `scripts/validate-feature-lab-url-state.mjs`
- Modify: `web/package.json` if a separate script is needed

**Steps:**
1. Add assertions for representative invalid feature parsing and filter serialization.
2. Add component string checks for:
   - `No matching features`
   - `Active filters`
   - `Clear filters`
   - `Selected feature is outside current filters`
   - `Unknown feature id`
3. Run `corepack pnpm@10 run validate:feature-lab-url-state` and verify it fails before UI work, then passes after implementation.

## Task 2: Implement catalog empty state recovery

**Objective:** Replace the generic no-results block with a useful recovery panel.

**Files:**
- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**
1. Derive active filter labels from `query`, `activeCategory`, `activeDifficulty`, `activeImpactTag`, and `activeAudience`.
2. Render `No matching features` with active filter chips.
3. Add `Clear filters` action that calls the existing reset handler.
4. Ensure pagination shows `Page 1 / 1` and disabled controls when there are no results.

## Task 3: Implement invalid and hidden selected-feature notices

**Objective:** Make shared/deep links self-healing and explain what happened.

**Files:**
- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`
- Modify if needed: `web/lib/feature-lab-url.ts`

**Steps:**
1. During URL hydration, detect a `feature` param that does not exist in `features` and show `Unknown feature id` notice.
2. If the selected feature exists but is not in the current filtered results, show `Selected feature is outside current filters`.
3. Provide actions:
   - `Clear filters` keeps the selected feature visible.
   - `Show first matching feature` selects the first filtered feature when one exists.
4. Keep URL updates stable and avoid infinite hydration/update loops.

## Task 4: Verify and preview

**Objective:** Prove Goal 3 works locally and on deployed GitHub Pages preview.

**Commands:**
```bash
corepack pnpm@10 run validate:feature-lab
corepack pnpm@10 run validate:feature-lab-url-state
corepack pnpm@10 run validate:feature-lab-source-card
corepack pnpm@10 run validate:feature-lab-selected-stack
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
git diff --check
```

**Preview checks:**
- `/preview/feature-lab/?feature=not-a-real-feature` shows recovery notice and still renders.
- `/preview/feature-lab/?feature=permission-allowlist&category=env` shows hidden-selection notice.
- `/preview/feature-lab/?q=zzzz-no-results` shows empty result recovery panel.

## Recommended merge point

Merge this goal after validators/build pass, preview URLs are verified, and the PR body lists Goal 3 verification results.
