export type ScenarioCategory =
  | "env"
  | "config"
  | "command"
  | "permission"
  | "mcp"
  | "model"
  | "tui"
  | "ide";

export type ScenarioRiskLevel = "low" | "medium" | "high";

export interface ReleaseScenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  releaseVersion: string;
  releaseDate: string;
  sourceQuote: string;
  summary: string;
  impact: string;
  activation: {
    type: "command" | "settings" | "env";
    label: string;
    snippet: string;
  };
  before: {
    editorTitle: string;
    editorText: string;
    terminalTitle: string;
    terminalText: string;
  };
  after: {
    editorTitle: string;
    editorText: string;
    terminalTitle: string;
    terminalText: string;
  };
  suggestions: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  excluded: string[];
  metrics: Array<{
    label: string;
    value: string;
  }>;
  riskLevel: ScenarioRiskLevel;
  riskNote: string;
}

export const lessPermissionPromptsScenario: ReleaseScenario = {
  id: "less-permission-prompts",
  title: "/less-permission-prompts로 반복 권한 요청 줄이기",
  category: "permission",
  releaseVersion: "v2.1.122",
  releaseDate: "2026.05.05",
  sourceQuote:
    "Added `/less-permission-prompts` skill — scans transcripts for common read-only Bash and MCP tool calls and proposes a prioritized allowlist for `.claude/settings.json`.",
  summary:
    "최근 transcript에서 자주 반복된 read-only Bash/MCP 호출을 찾아 `.claude/settings.json` allowlist 후보로 제안한다.",
  impact:
    "반복적으로 승인하던 안전한 조회 명령을 allowlist로 옮겨 작업 중 permission prompt 마찰을 줄인다. 파괴적 명령은 자동 적용하지 않고 리뷰 대상에서 제외하는 흐름이 중요하다.",
  activation: {
    type: "command",
    label: "Claude Code command",
    snippet: "/less-permission-prompts",
  },
  before: {
    editorTitle: ".claude/settings.json",
    editorText: `{
  "permissions": {
    "allow": []
  }
}`,
    terminalTitle: "Before preview",
    terminalText: `› run git status

Claude needs your permission to run:
  Bash(git status)

Allow this command?
  ❯ Yes, allow once
    No

› run git diff --name-only

Claude needs your permission to run:
  Bash(git diff --name-only)`,
  },
  after: {
    editorTitle: ".claude/settings.json",
    editorText: `{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff --name-only:*)",
      "Bash(git log --oneline:*)",
      "mcp__github__get_issue"
    ],
    "deny": [
      "Bash(rm:*)",
      "Bash(curl * | sh)"
    ]
  }
}`,
    terminalTitle: "After preview",
    terminalText: `› /less-permission-prompts

Scanning recent transcripts...

✓ 28 repeated read-only calls found

Top suggestions
  1. Bash(git status:*)        used 11 times
  2. Bash(git diff --name-only:*) used 7 times
  3. Bash(git log --oneline:*) used 4 times
  4. mcp__github__get_issue    used 5 times

✗ excluded: npm install, gh pr merge, rm -rf

Press c to copy settings patch.
No changes applied yet.`,
  },
  suggestions: [
    {
      label: "Bash(git status:*)",
      value: "11x",
      note: "작업 상태 조회. read-only 후보.",
    },
    {
      label: "Bash(git diff --name-only:*)",
      value: "7x",
      note: "변경 파일명 조회. 출력만 읽음.",
    },
    {
      label: "Bash(git log --oneline:*)",
      value: "4x",
      note: "최근 커밋 조회. side effect 없음.",
    },
    {
      label: "mcp__github__get_issue",
      value: "5x",
      note: "GitHub issue 읽기 호출.",
    },
  ],
  excluded: ["Bash(npm install:*)", "Bash(gh pr merge:*)", "Bash(rm -rf:*)"],
  metrics: [
    { label: "예상 prompt 감소", value: "−27/wk" },
    { label: "위험도", value: "Low" },
    { label: "권장 액션", value: "Copy & review" },
  ],
  riskLevel: "low",
  riskNote:
    "제안은 자동 적용이 아니라 복사 후 검토 흐름으로 다룬다. npm install, merge, delete처럼 side effect가 있는 명령은 제외한다.",
};

export const impactPreviewScenarios = [lessPermissionPromptsScenario];
