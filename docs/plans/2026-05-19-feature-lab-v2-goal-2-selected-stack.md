# Feature Lab v2 Goal 2 — Selected Stack & Comparison MVP

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let users collect up to three Claude Code features into a small “selected stack” and compare why/when/how to enable them.

**Architecture:** Keep the first version client-only inside `FeatureLabPlayground.tsx` to avoid expanding URL state too early. Reuse the existing Feature Lab catalog, selected feature detail, v2 playbook fields, source evidence, and filter state. Add validation/build coverage first, then preview-check the deployed GitHub Pages route before treating the goal as complete.

**Tech Stack:** Next.js 15 App Router, React state, TypeScript, Tailwind CSS, existing Feature Lab JSON data, existing Node validators, GitHub Pages preview.

---

## Product intent

Feature Lab currently answers: “What changes if I open this one feature?”

Goal 2 should answer the next question:

> “Which small set of Claude Code features should I enable together for my workflow?”

The UX should feel like building a practical setup recipe, not like a generic table. The comparison exists to help users choose between or combine features.

## Target users

Prioritize these audiences in the first slice:

1. **Team / automation safety:** permissions, allowed tool patterns, hooks.
2. **MCP users:** local MCP server plus permission/config examples.
3. **Power users:** model picker plus config/setup tradeoffs.

## Scope

### In scope

- Add “Add to stack” / “In stack” action on visible feature cards and related-feature links.
- Maintain a selected stack of up to 3 feature ids in local React state.
- Show a compact selected-stack panel near the detail/playbook area.
- Render a comparison matrix for selected features:
  - category
  - audience
  - difficulty
  - activation
  - goodFor
  - watchOut
  - strongest use case
  - top risk or mitigation
  - source/release evidence link
- Allow removing features from the stack.
- Allow clearing the stack.
- When selected stack is empty, show suggested starter stacks.
- Keep existing single-feature deep links working.
- Keep the feature detail selected feature behavior unchanged.

### Out of scope for this goal

- Persisting stack to backend or local storage.
- Encoding stack state into URL query params.
- A separate Config Simulator route.
- Full mobile redesign beyond making the panel usable.
- Adding v2 fields to every feature.

## UX rules

- The feature catalog remains the primary entry point.
- Stack actions must not replace the existing “selected feature” click behavior.
- The selected stack must tolerate features without v2 fields.
- The limit of 3 should be explicit; adding a fourth should show a small inline hint rather than silently replacing an item.
- Suggested stacks should be opinionated and practical:
  - “Safe automation starter”
  - “MCP local workflow”
  - “Model/context control”
- Copy should answer practical questions:
  - “Why these together?”
  - “What changes after enabling them?”
  - “What should I watch out for?”

## Files

Expected files to modify:

- `web/components/feature-lab/FeatureLabPlayground.tsx`
- `scripts/validate-feature-lab-url-state.mjs` if UI assumptions need validator coverage
- `web/package.json` only if a new validator script is added
- `docs/roadmap.md`
- `docs/plans/2026-05-19-feature-lab-v2.md`

No data-model change is required for the MVP, but the implementation may reuse:

- `data/feature-lab/features.json`
- `web/lib/feature-lab.ts`

---

## Implementation tasks

### Task 1: Add selected-stack state and helpers

**Objective:** Track up to three selected comparison features without changing URL behavior.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**

1. Add `selectedStackIds` state near existing selected-feature/filter state.
2. Derive `selectedStackFeatures` from `features` or `allFeatures` by id.
3. Add helpers:
   - `isInSelectedStack(featureId)`
   - `addToSelectedStack(featureId)`
   - `removeFromSelectedStack(featureId)`
   - `clearSelectedStack()`
4. Enforce max size 3.
5. Avoid duplicate ids.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build passes.

### Task 2: Add stack action to feature cards

**Objective:** Let users add/remove features from the stack from the catalog without disrupting feature selection.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**

1. Pass stack action props into the feature catalog/list rendering path.
2. Add a small button on each feature card:
   - `Add to stack` when not selected
   - `In stack` / `Remove` when already selected
3. Stop event propagation if the button is inside a clickable card.
4. Show a short inline max-size hint when users try to add more than 3.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build passes and no TypeScript errors.

### Task 3: Render selected-stack panel

**Objective:** Show the currently selected feature bundle and make it actionable.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**

1. Add `SelectedFeatureStack` component in the same file.
2. Render it above or beside the playbook/detail section.
3. For each selected feature, show:
   - short name
   - category pill
   - difficulty
   - one-line `goodFor`
   - remove button
4. Add a clear-all button.
5. When empty, show suggested starter stack buttons.

**Suggested starter stacks:**

```txt
Safe automation starter: permission-allowlist, allowed-tools-patterns, hooks-notifications
MCP local workflow: local-mcp-server, permission-allowlist, allowed-tools-patterns
Model/context control: model-picker, permission-allowlist, hooks-notifications
```

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build passes.

### Task 4: Add comparison matrix

**Objective:** Help users understand tradeoffs between selected features at a glance.

**Files:**

- Modify: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**

1. Add `FeatureComparisonMatrix` component.
2. Render matrix only when two or more features are in the stack.
3. Rows:
   - Audience
   - Difficulty
   - Activation
   - Good for
   - Watch out
   - Use case
   - Risk / mitigation
   - Source
4. Use graceful fallback text for missing v2 fields:
   - `Not documented yet`
   - `Use source evidence for details`
5. Make source row link to the existing source/release evidence where possible.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: build passes.

### Task 5: Harden URL/deep-link non-regression

**Objective:** Ensure selected-stack UI does not break existing shareable feature/filter URLs.

**Files:**

- Modify if needed: `scripts/validate-feature-lab-url-state.mjs`
- Modify if needed: `web/components/feature-lab/FeatureLabPlayground.tsx`

**Steps:**

1. Confirm `feature`, `category`, `difficulty`, `impact`, and `audience` query params still parse/serialize as before.
2. Confirm stack state is not serialized for this MVP.
3. Confirm invalid feature URLs still fall back safely.
4. Confirm selected detail links still update the browser URL.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-url-state
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: both pass.

### Task 6: Preview deploy and verify

**Objective:** Verify the actual GitHub Pages preview, not just local build output.

**Files:**

- No source file changes required unless preview reveals a bug.

**Steps:**

1. Push `feat/feature-lab-v2`.
2. Rebuild/update the repo’s preview branch according to existing preview workflow.
3. Wait for preview workflow completion.
4. Verify:

```bash
curl -I 'https://donghyeon-dev.github.io/cc-release/preview/feature-lab/'
curl -L 'https://donghyeon-dev.github.io/cc-release/preview/feature-lab/?feature=permission-allowlist&audience=team' | grep -E 'Feature Lab|Permission|Selected stack|Compare|Risks'
```

5. Use browser screenshot if layout changed materially.

**Expected:**

- HTTP 200 for preview Feature Lab route.
- Feature Lab page includes selected-stack/comparison copy.
- Existing deep links still show selected feature details.
- Main preview entry still links to Feature Lab.

---

## Definition of Done

- [ ] Users can add up to 3 features to a selected stack.
- [ ] Users can remove/clear selected stack items.
- [ ] Empty stack shows suggested starter stacks.
- [ ] Two or more selected features show a comparison matrix.
- [ ] Stack UI handles features with missing v2 fields gracefully.
- [ ] Existing feature/filter URL state remains stable.
- [ ] `corepack pnpm@10 run validate:feature-lab` passes.
- [ ] `corepack pnpm@10 run validate:feature-lab-url-state` passes.
- [ ] `NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build` passes.
- [ ] GitHub Pages preview is deployed and verified.

## PR update checklist

After implementation, update PR #24 with:

- Summary of selected-stack/comparison behavior.
- Validation commands and results.
- Preview workflow run URL.
- Verified preview deep links.
- Note that stack state is intentionally local-only for MVP.
