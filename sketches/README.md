# Release Impact Preview Sketches

Selected release feature:

> Added `/less-permission-prompts` skill — scans transcripts for common read-only Bash and MCP tool calls and proposes a prioritized allowlist for `.claude/settings.json`.

Why this feature:

- It has a concrete command change: `/less-permission-prompts`.
- It has a concrete config output: `.claude/settings.json` permission allowlist.
- It has a clear user impact: fewer repeated permission prompts.
- It fits the proposed left editor / right TUI preview model.

## Variants

1. `001-compact-release-card/`
   - Existing release card with an embedded “릴리즈 체감하기” panel.
   - Best MVP candidate.

2. `002-full-playground/`
   - Full release detail page as an Impact Playground.
   - Strongest product identity.

3. `003-guided-diff-wizard/`
   - Step-by-step educational wizard.
   - Best for explaining config/env changes safely.

## How to view

From repo root:

```bash
xdg-open sketches/001-compact-release-card/index.html
xdg-open sketches/002-full-playground/index.html
xdg-open sketches/003-guided-diff-wizard/index.html
```

Or open each `index.html` in a browser.

## Recommendation

Implement a hybrid:

- Use Variant A inside the release list as the first MVP.
- Promote Variant B as `/releases/[version]` later.
- Borrow Variant C’s warning/step language for risky config changes.
