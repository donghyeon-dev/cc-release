# Feature Lab Evidence Goal: Captured Claude Code TUI Data

**Goal:** Replace purely inferred Feature Lab terminal narratives with captured Claude Code evidence, starting with permission allowlist behavior, so the TUI panel stops pretending that scenario prose is exact CLI output.

## Problem

The Feature Lab TUI panel currently renders hand-authored scenes such as menus, prompts, and success toasts. They are useful for explaining intent, but several lines read like invented Claude Code UI rather than actual Claude Code output. This creates trust debt: readers may assume the panel is a real transcript.

## Decision

Before expanding Release Intelligence, add an evidence layer for Feature Lab terminal scenes:

1. Store real Claude Code capture records under `data/feature-lab/claude-code-captures.json`.
2. Allow each `beforeExperience` / `afterExperience` scene to link to a capture via `scene.evidence.captureId`.
3. Show whether the panel is a `Captured run` or an illustrative `Scenario transcript`.
4. Validate capture records and capture references during `validate-feature-lab`.

## Initial captured run

Captured with Claude Code 2.1.143 in this repo:

```bash
claude -p 'Run git status and summarize whether the working tree is clean. Do not change files.' \
  --output-format stream-json \
  --verbose \
  --max-turns 3 \
  --allowedTools 'Bash(git status:*)' \
  --settings /tmp/claude-allow-settings.json \
  --no-session-persistence
```

The settings file permitted `Bash(git status:*)`, and the actual stream produced:

- assistant tool event: `Bash(command="git status", description="Show working tree status")`
- tool stdout: `On branch feat/claude-code-captured-tui-evidence\nnothing to commit, working tree clean`
- assistant result: working tree is clean summary

This capture now backs the `permission-allowlist.afterExperience` scene.

## Acceptance criteria

- [x] Captures are stored as structured data.
- [x] Scene evidence can link to a capture id.
- [x] Validator fails on missing capture references.
- [x] The TUI panel displays whether it is a captured run or scenario transcript.
- [x] At least one high-value feature uses a captured Claude Code run.
- [ ] Future passes replace or downgrade remaining synthetic `/permissions`, `/memory`, `/cost`, and other slash-command scenes after running those commands in real Claude Code.

## Follow-up

The next implementation goal can still be Release Intelligence Goal 1, but future Feature Lab scene updates must not invent exact Claude Code CLI output. If no capture exists, the UI should keep the `Scenario transcript` label or use less exact language.
