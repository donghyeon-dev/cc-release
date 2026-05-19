# Feature Lab v2 Goal 4: Deep-Link and Static Export QA

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add automated QA coverage that proves every Feature Lab feature id can be used as a shareable URL and that the static export contains the route assets needed for GitHub Pages.

**Architecture:** Keep the site static-export friendly. Add a Node validator that imports the existing URL helpers, reads the source catalog, round-trips every feature id through `feature=<id>`, checks representative filter combinations, and optionally verifies `web/out/feature-lab/index.html` after a build. Wire it into `web/package.json` so future builds fail before broken deep links ship.

**Tech Stack:** Node.js validation scripts, TypeScript URL helper import via `--experimental-strip-types`, Next.js static export output under `web/out`, GitHub Pages preview.

---

## Scope

- Create a dedicated deep-link validator script.
- Validate every catalog feature id through parse/build URL helpers.
- Validate representative query/filter combinations without needing browser hydration.
- Check static export output only when `web/out/feature-lab/index.html` exists, and require it with an explicit flag after build.
- Wire the validator into package scripts and prebuild.
- Verify preview and production routes after merge.

## Out of scope

- Browser interaction coverage for every feature id.
- URL-encoding selected comparison stack state.
- Data model expansion beyond existing Feature Lab v2 fields.

---

## Task 1: Add failing deep-link validator expectation

**Objective:** Prove the new QA gate is missing before implementation.

**Files:**

- Create: `scripts/validate-feature-lab-deeplinks.mjs`
- Modify: `web/package.json`

**Steps:**

1. Add a package script name first:
   - `validate:feature-lab-deeplinks`
2. Run it before the script exists.

**Expected RED command:**

```bash
corepack pnpm@10 run validate:feature-lab-deeplinks
```

Expected: FAIL because the script target is missing or the validator is not implemented yet.

---

## Task 2: Implement catalog URL round-trip validator

**Objective:** Validate all feature ids without relying on a browser.

**Files:**

- Create: `scripts/validate-feature-lab-deeplinks.mjs`
- Read: `data/feature-lab/features.json`
- Read: `web/lib/feature-lab-url.ts`

**Behavior:**

For every feature in `features.json`:

- Assert id is a non-empty string.
- Build a search string with `buildFeatureLabSearch("", { featureId: id, ...all filters })`.
- Parse it back with `parseFeatureLabParams`.
- Assert the parsed `featureId` equals the original id.
- Build a href with `buildFeatureLabHref({ id })` and assert it includes `/feature-lab/?feature=`.
- Validate representative filters for `audience`, `category`, `difficulty`, `impact`, and `q` round-trip correctly.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-deeplinks
```

Expected: PASS and print feature count.

---

## Task 3: Add static export route check

**Objective:** Catch missing Feature Lab export artifacts after `next build`.

**Files:**

- Modify: `scripts/validate-feature-lab-deeplinks.mjs`

**Behavior:**

- Default mode: skip `web/out` check if the export directory does not exist.
- With `--require-export`: assert `web/out/feature-lab/index.html` exists and contains `Feature Lab`.
- Also assert `web/out/index.html` exists when `--require-export` is used.

**Verification:**

```bash
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
corepack pnpm@10 run validate:feature-lab-deeplinks -- --require-export
```

Expected: PASS.

---

## Task 4: Wire into build and docs

**Objective:** Make the new QA gate run automatically.

**Files:**

- Modify: `web/package.json`
- Modify: `docs/roadmap.md`
- Modify: `docs/plans/2026-05-19-feature-lab-v2.md`

**Behavior:**

- Add `validate:feature-lab-deeplinks` script.
- Add the validator to `prebuild` before `validate:feature-lab-selected-stack`.
- Update roadmap/current next action to describe Goal 4 completion and recommended merge point.
- Update main milestone plan next goal/definition of done language.

**Verification:**

```bash
corepack pnpm@10 run validate:feature-lab-deeplinks
NEXT_PUBLIC_BASE_PATH=/cc-release corepack pnpm@10 build
corepack pnpm@10 run validate:feature-lab-deeplinks -- --require-export
```

Expected: all pass.

---

## Preview verification

After PR preview deploy, verify:

- `https://donghyeon-dev.github.io/cc-release/preview/feature-lab/`
- `https://donghyeon-dev.github.io/cc-release/preview/feature-lab/?feature=permission-allowlist`
- `https://donghyeon-dev.github.io/cc-release/preview/feature-lab/?feature=mcp-oauth-auth&audience=mcp-user`
- `https://donghyeon-dev.github.io/cc-release/preview/feature-lab/?feature=hooks-lifecycle&impact=automation`

Use HTTP 200 checks and at least one DOM/text smoke check that confirms Feature Lab and the selected feature content render after hydration.

## Recommended merge point

Merge after validator/build pass, independent review approves, preview deploy succeeds, and production deploy is verified with the same representative deep links.
