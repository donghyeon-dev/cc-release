# Config / Permission Simulator Goal 1 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Start the Config / Permission Simulator milestone with a static-export friendly simulator page that shows how `.claude/settings.json` permission choices change Claude Code workflow behavior.

**Architecture:** Add a new `/config-simulator/` route backed by a small typed scenario catalog. Reuse Feature Lab's existing feature/capture vocabulary where possible, but keep simulator state and validators separate so this milestone can evolve without bloating `/feature-lab/`.

**Tech Stack:** Next.js 16 App Router static export, React client state, TypeScript, Tailwind CSS, JSON data under `data/config-simulator/`, Node validation scripts, GitHub Pages preview.

---

## Context

Release Intelligence and the first Feature Lab evidence pass are now complete enough to move to the next roadmap milestone.

Completed immediately before this plan:

- Release Intelligence rail on the home page.
- Release-card level intelligence highlights explaining why a release matters.
- Feature Lab fallback affordance from highlighted releases.
- Captured Claude Code evidence for `permission-allowlist`, `/compact`, and `/cost` scenes.
- `validate:feature-lab` now requires at least three captured scenes.

The next product gap is practical configuration understanding:

> 사용자는 `.claude/settings.json`, permissions, hooks, MCP 설정을 켰을 때 실제 워크플로우가 어떻게 달라지는지 보고 싶다.

## Product rules

1. The primary unit is a **configuration scenario**, not a release version.
2. Release versions and Feature Lab features are supporting evidence only.
3. Goal 1 must stay static and deterministic; no real shell execution in the browser.
4. If a scene claims actual Claude Code output, it must reference captured evidence. Otherwise label it as an illustrative scenario.
5. Keep the first simulator narrow: permissions/settings first, hooks and MCP later.
6. Preserve GitHub Pages base path compatibility via `withBasePath` or relative app links.
7. Do not change the daily release ingestion routine in this goal.

## Target UX

Add a discoverable `/config-simulator/` page with:

- A short Korean hero explaining that this page previews config choices before editing Claude Code settings.
- Scenario cards for at least three starter configurations:
  - `Safe automation allowlist`
  - `Team permission guardrails`
  - `MCP local workflow boundary`
- A side-by-side before/after panel:
  - before: default/manual permission behavior
  - after: selected `.claude/settings.json` snippet and expected workflow effect
- A generated settings preview block.
- Risk/mitigation callouts.
- Links back to related Feature Lab items and Release Intelligence release cards.

## Out of scope

- Editing or persisting user-specific settings.
- Running Claude Code commands from the browser.
- Full hooks lifecycle visualization.
- Full MCP connection flow.
- Account/workspace-specific permission import.
- Replacing Feature Lab; this route should complement it.

---

## Task 1: Add simulator data model and seed scenarios

**Objective:** Create a typed source of truth for the first simulator scenarios.

**Files:**

- Create: `data/config-simulator/scenarios.json`
- Create: `web/lib/config-simulator.ts`
- Read: `web/lib/feature-lab.ts`

**Data shape:**

```ts
export type ConfigSimulatorScenarioId =
  | "safe-automation-allowlist"
  | "team-permission-guardrails"
  | "mcp-local-boundary";

export interface ConfigSimulatorScenario {
  id: ConfigSimulatorScenarioId;
  title: string;
  summary: string;
  audience: string[];
  settingsFile: ".claude/settings.json" | ".claude/settings.local.json";
  settingsSnippet: string;
  before: {
    title: string;
    bullets: string[];
  };
  after: {
    title: string;
    bullets: string[];
  };
  risks: Array<{ text: string; mitigation: string }>;
  relatedFeatureIds: string[];
  relatedReleaseVersions: string[];
  evidence?: {
    kind: "captured" | "scenario" | "documented";
    captureId?: string;
    notes: string;
  };
}
```

**Implementation notes:**

- Start with three scenarios only.
- Use feature ids that already exist in `data/feature-lab/features.json`.
- Use release versions that already exist in `data/releases.json`.
- Keep snippets copy-pasteable JSON.

**Verification:**

```bash
node -e "const s=require('./data/config-simulator/scenarios.json'); console.log(s.length)"
```

Expected: prints `3`.

---

## Task 2: Add validator for simulator data

**Objective:** Prevent broken scenario ids, invalid JSON snippets, and dead cross-links.

**Files:**

- Create: `scripts/validate-config-simulator.mjs`
- Modify: `web/package.json`

**Validator checks:**

1. `scenarios.json` is an array with at least three records.
2. Every `id` is unique and kebab-case.
3. Every `settingsSnippet` parses as JSON.
4. Every `relatedFeatureIds[]` id exists in Feature Lab data.
5. Every `relatedReleaseVersions[]` version exists in release data.
6. Captured evidence references, if present, exist in `data/feature-lab/claude-code-captures.json`.
7. Each scenario has at least one risk and mitigation.

**TDD:**

1. Add `validate:config-simulator` script before the validator exists.
2. Run it and confirm it fails.
3. Implement the validator.
4. Run it again and confirm it passes.

**Package scripts:**

```json
"validate:config-simulator": "node ../scripts/validate-config-simulator.mjs"
```

Add it to `prebuild` before `next build`.

---

## Task 3: Add `/config-simulator/` route and navigation entry

**Objective:** Make the simulator discoverable from the product homepage.

**Files:**

- Create: `web/app/config-simulator/page.tsx`
- Create: `web/components/config-simulator/ConfigSimulatorPlayground.tsx`
- Modify: `web/app/page.tsx`

**UX requirements:**

- Home page gets a compact CTA card linking to `/config-simulator/`.
- The route renders without client-side data fetching.
- Scenario selection is client-side state only for Goal 1.
- Mobile layout is single-column; desktop uses scenario list + detail panel.
- Back links and CTAs must work under `/cc-release` and `/cc-release/preview`.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
```

Expected: static export includes `out/config-simulator/index.html`.

---

## Task 4: Add simulator URL/static-export smoke checks

**Objective:** Prove the new route and home CTA survive static export.

**Files:**

- Modify or create: `scripts/validate-config-simulator.mjs`
- Modify: `web/package.json`

**Checks after build:**

- With `--require-export`, assert `web/out/config-simulator/index.html` exists.
- Assert exported HTML contains:
  - `Config Simulator`
  - `Safe automation allowlist`
  - `.claude/settings.json`
  - `Feature Lab`
- Assert home export contains a link to `config-simulator`.

**Package scripts:**

Keep one validator but support:

```bash
node ../scripts/validate-config-simulator.mjs --require-export
```

Add postbuild coverage if this route becomes part of shipped navigation.

---

## Task 5: Preview, review, merge, production verification

**Objective:** Verify the new simulator route on GitHub Pages before and after merge.

**Steps:**

1. Branch from updated `main`.
2. Implement tasks 1-4.
3. Run local validation:

```bash
corepack pnpm@10 run validate:config-simulator
corepack pnpm@10 run validate:feature-lab
corepack pnpm@10 run validate:release-intelligence
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
git diff --check
```

4. Create PR.
5. Rebuild preview branch from latest `origin/main` plus the PR commit.
6. Wait for Preview Deploy workflow.
7. Verify preview URLs:

```bash
curl -L 'https://donghyeon-dev.github.io/cc-release/preview/' | grep -E 'Config Simulator|config-simulator'
curl -L 'https://donghyeon-dev.github.io/cc-release/preview/config-simulator/' | grep -E 'Config Simulator|Safe automation allowlist|\.claude/settings.json'
```

8. Merge after checks and preview pass.
9. Wait for production Deploy workflow.
10. Verify production URLs:

```bash
curl -L 'https://donghyeon-dev.github.io/cc-release/' | grep -E 'Config Simulator|config-simulator'
curl -L 'https://donghyeon-dev.github.io/cc-release/config-simulator/' | grep -E 'Config Simulator|Safe automation allowlist|\.claude/settings.json'
```

## Definition of Done

- [ ] `data/config-simulator/scenarios.json` contains at least three valid scenarios.
- [ ] `validate:config-simulator` catches bad JSON snippets and dead cross-links.
- [ ] `/config-simulator/` route renders scenario selection, settings preview, risks, and related links.
- [ ] Home page links to the simulator route.
- [ ] Static export includes `out/config-simulator/index.html`.
- [ ] GitHub Pages preview is deployed and verified.
- [ ] Production deploy is verified after merge.

## Recommended implementation PR

`feat/config-permission-simulator-goal-1`

## Recommended merge point

Merge when the route is discoverable from the home page, all validators/builds pass, preview verifies both home CTA and `/config-simulator/`, and production verification confirms the same after merge.
