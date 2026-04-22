import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changelogPath = path.join(root, 'docs', 'changelog.md');
const releasesPath = path.join(root, '.omc', 'all-releases-lite.json');
const outPath = path.join(root, '.omc', 'generated-releases.json');

const summarizedAt = process.env.SUMMARIZED_AT || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const summaryModel = process.env.SUMMARY_MODEL || 'gpt-5';

const changelog = fs.readFileSync(changelogPath, 'utf8');
const githubReleases = JSON.parse(fs.readFileSync(releasesPath, 'utf8'));

function versionParts(version) {
  return version.replace(/^v/, '').split('.').map((part) => Number.parseInt(part, 10));
}

function compareVersionsDesc(a, b) {
  const av = versionParts(a);
  const bv = versionParts(b);
  for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
    const diff = (bv[i] || 0) - (av[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function isoDate(dateText) {
  const date = new Date(`${dateText} 00:00:00 UTC`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${dateText}`);
  return date.toISOString().slice(0, 10) + 'T00:00:00Z';
}

function normalizeBullets(body) {
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\*\s+/, '- '));
  return lines.join('\n');
}

function parseChangelog(source) {
  const result = new Map();
  const re = /<Update\s+label="([^"]+)"\s+description="([^"]+)">\s*([\s\S]*?)\s*<\/Update>/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const [, label, description, body] = match;
    result.set(`v${label}`, {
      version: `v${label}`,
      tagName: `v${label}`,
      publishedAt: isoDate(description),
      originalBody: normalizeBullets(body),
    });
  }
  return result;
}

const changelogByVersion = parseChangelog(changelog);
const githubByVersion = new Map(
  githubReleases.map((release) => [
    release.tag_name,
    {
      version: release.tag_name,
      tagName: release.tag_name,
      publishedAt: release.published_at,
      url: release.html_url,
      originalBody: release.body,
    },
  ]),
);

function cleanLine(line) {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function releaseLines(body) {
  return body
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line && !/^what'?s changed$/i.test(line));
}

function isFix(line) {
  return /\bfix(ed|es)?\b|bug|crash|hang|regression|wrong|incorrect|not working|issue|error|leak|corrupt|vulnerability|security|bypass|race|fail(ed|ing)?|timeout|freeze|broken|duplicate|missing|respect|overflow|mislabel|unreachable/i.test(line);
}

function isNewFeature(line) {
  return (/^(add(ed)?|new|introduc(ed|ing)?|released)\b/i.test(line)
    || /\b(can now|now supports|are now supported|is now available|support for|added support for|env var|environment variable|new .+ command|command lets|option to|setting to)\b/i.test(line)
  )
    && !/^changed\b/i.test(line)
    && !/^improved\b/i.test(line)
    && !isFix(line);
}

function isNoise(line) {
  return /\b(chore|ci|internal|docs only|documentation only)\b/i.test(line);
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function extractEntities(line) {
  const backtickItems = [...line.matchAll(/`([^`]+)`/g)].map((match) => `\`${match[1]}\``);
  const slashCommands = [...line.matchAll(/(?<![\w/])\/[a-z][a-z0-9-]*(?=\b|[<\s])/gi)].map((match) => `\`${match[0]}\``);
  const flags = [...line.matchAll(/(?<![\w-])--[a-z][a-z0-9-]*/gi)].map((match) => `\`${match[0]}\``);
  const envVars = [...line.matchAll(/\b[A-Z][A-Z0-9_]{3,}\b/g)].map((match) => `\`${match[0]}\``);
  const settings = [...line.matchAll(/\b[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+\b/g)].map((match) => `\`${match[0]}\``);
  const statusCodes = [...line.matchAll(/\b\d{3}\b(?:\s+No Content)?/g)].map((match) => `\`${match[0].trim()}\``);
  const measures = [...line.matchAll(/\b\d+(?:\.\d+)?\s?(?:%|MB|K|M|ms|s|seconds?|minutes?|분|초)\b/gi)].map((match) => match[0].replace(/\s+/, ''));
  const paths = [...line.matchAll(/(?:~\/|\/private\/|C:\\)[^\s,)]+/g)].map((match) => `\`${match[0]}\``);
  const namedTokens = [];
  const namedRe = /\b(Windows|macOS|Linux|VSCode|VS Code|Cursor|Windsurf|Bedrock|Vertex|Foundry|Bash|PowerShell|WebFetch|Glob|Grep|Todo|MCP|OAuth|OpenTelemetry|SDK|LSP|JSON|Node|Bun|npm|GitHub|iTerm2|Ghostty|Kitty|kitty|WezTerm|Warp|Sonnet\s+\d(?:\.\d)?|Opus\s+\d(?:\.\d)?|Remote Control|Advisor Tool|ToolSearch)\b/g;
  for (const match of line.matchAll(namedRe)) {
    namedTokens.push(match[1].replace(/^VS Code$/, 'VSCode'));
  }
  const filteredSettings = settings.filter((token) => !/^`(?:e\.g|i\.e)`$/i.test(token));
  return uniq([...backtickItems, ...slashCommands, ...flags, ...envVars, ...filteredSettings, ...statusCodes, ...measures, ...paths, ...namedTokens]);
}

function mainEntity(line, fallback = '') {
  return extractEntities(line)[0] || fallback;
}

function detailToken(line) {
  const quoted = [...line.matchAll(/"([^"]{3,60})"/g)]
    .map((match) => match[1])
    .find((value) => /^[\w\s+./:-]+$/.test(value) && value.split(/\s+/).length <= 4);
  if (quoted) return `\`${quoted}\``;

  const withoutCode = line
    .replace(/`[^`]+`/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^A-Za-z0-9_+./:-]+/g, ' ');
  const stop = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'for', 'from', 'has', 'have', 'in', 'into', 'is', 'it', 'its',
    'now', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'via', 'was', 'when', 'where', 'with', 'without',
    'add', 'added', 'adding', 'changed', 'fixed', 'fixes', 'improved', 'new', 'no', 'not', 'longer', 'support', 'supports',
    'claude', 'code', 'users', 'user', 'issue', 'bug', 'error', 'errors',
  ]);
  const words = withoutCode
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !stop.has(word.toLowerCase()))
    .filter((word) => !/^\d+$/.test(word));
  const picked = words.slice(0, 3).join(' ');
  return picked ? `\`${picked}\`` : '';
}

function topicFor(line) {
  if (/windows/i.test(line)) return 'Windows';
  if (/macOS|linux/i.test(line)) return /macOS/i.test(line) && /linux/i.test(line) ? 'macOS/Linux' : /macOS/i.test(line) ? 'macOS' : 'Linux';
  if (/vscode|vs code|ide|cursor|windsurf/i.test(line)) return 'IDE';
  if (/mcp/i.test(line)) return 'MCP';
  if (/plugin/i.test(line)) return '플러그인';
  if (/hook/i.test(line)) return '훅';
  if (/sdk/i.test(line)) return 'SDK';
  if (/bedrock|vertex|foundry/i.test(line)) return line.match(/bedrock/i) ? 'Bedrock' : line.match(/vertex/i) ? 'Vertex' : 'Foundry';
  if (/otel|opentelemetry|trace/i.test(line)) return '관측성';
  if (/\/resume|--resume|--continue|session/i.test(line)) return '세션';
  if (/bash|shell|terminal|tui|fullscreen|kitty|iterm|ghostty|wezterm|warp/i.test(line)) return '터미널';
  if (/model|opus|sonnet|effort|auto mode/i.test(line)) return '모델 설정';
  if (/permission|allowed|deny|sandbox/i.test(line)) return '권한';
  if (/web search|web fetch|webfetch/i.test(line)) return '웹 도구';
  if (/slash|command/i.test(line)) return '명령';
  if (/theme/i.test(line)) return '테마';
  if (/config|settings/i.test(line)) return '설정';
  if (/memory/i.test(line)) return '메모리';
  return 'CLI';
}

function subjectFor(line) {
  const entities = extractEntities(line);
  const detail = detailToken(line);
  if (entities.length > 0) {
    const subjectParts = entities.slice(0, 3);
    const isMostlyGeneric = subjectParts.every((token) => /^(MCP|SDK|API|Bash|Windows|macOS|Linux|IDE|VSCode|CLI|JSON|npm|Bun|GitHub|OAuth|OpenTelemetry|Remote Control|PowerShell|Sonnet|Opus)/i.test(token.replace(/`/g, '')));
    if (detail && (subjectParts.length < 2 || isMostlyGeneric)) subjectParts.push(detail);
    return uniq(subjectParts).slice(0, 4).join('·');
  }
  return detail || topicFor(line);
}

function actionFor(line, category) {
  if (/forked subagents/i.test(line)) return '외부 빌드의 서브에이전트 fork 활성화';
  if (/frontmatter.*mcpServers/i.test(line)) return '에이전트 frontmatter 서버 설정 로드';
  if (/frontmatter.*hooks/i.test(line)) return '에이전트 frontmatter 훅 실행';
  if (/deniedDomains/i.test(line)) return '허용 와일드카드보다 우선하는 도메인 차단';
  if (/blockedMarketplaces|strictKnownMarketplaces/i.test(line)) return '마켓플레이스 제한 정책 적용 범위 확대';
  if (/cleanupPeriodDays/i.test(line)) return '보존 기간 정리 대상 확대';
  if (/Default effort|effort.*high|effort.*medium/i.test(line)) return '기본 effort 값 변경';
  if (/xhigh/i.test(line)) return '새 effort 단계 선택';
  if (/Auto mode/i.test(line)) return '자동 모델 선택 사용';
  if (/PowerShell/i.test(line)) return 'PowerShell 도구 opt-in 제어';
  if (/ultrareview/i.test(line)) return '병렬 에이전트 코드 리뷰 실행';
  if (/less-permission-prompts/i.test(line)) return '반복 권한 요청 allowlist 후보 추출';
  if (/terminal-setup/i.test(line)) return '터미널별 입력·스크롤 설정 적용';
  if (/release-notes/i.test(line)) return '릴리즈 노트 즉시 열람';
  if (/custom slash commands|slash commands|Slash command/i.test(line)) return '슬래시 명령 탐색과 실행 개선';
  if (/autocomplete|typeahead|@-mention|@ file|file suggestions/i.test(line)) return '파일·명령 자동완성 범위 조정';
  if (/OAuth/i.test(line)) return 'OAuth 인증 흐름 처리';
  if (/MCP/i.test(line) && /startup|connect|reconnect|stdio|SSE|HTTP/i.test(line)) return 'MCP 서버 연결 처리';
  if (/plugin/i.test(line) && /dependenc/i.test(line)) return '플러그인 의존성 해석';
  if (/plugin/i.test(line)) return '플러그인 설치·목록 관리';
  if (/resume|continue/i.test(line)) return '세션 재개 처리';
  if (/context/i.test(line)) return '컨텍스트 사용량 계산';
  if (/permission|sandbox|allow|deny|dangerous/i.test(line)) return '권한·샌드박스 판정';
  if (/WebFetch|web fetch|web search/i.test(line)) return '웹 도구 입력 처리';
  if (/OpenTelemetry|OTEL|trace/i.test(line)) return '관측성 이벤트 필드 기록';
  if (/Bash|shell|command/i.test(line)) return '셸 명령 실행 처리';
  if (/render|display|scroll|cursor|terminal|TUI|fullscreen/i.test(line)) return '터미널 표시와 입력 처리';
  if (/memory|CPU|performance|faster|latency|startup/i.test(line)) return '성능·자원 사용 조정';
  if (/crash|crashes|crashing/i.test(line)) return '크래시 조건 처리';
  if (/hang|hanging|freeze|freezes/i.test(line)) return '멈춤 조건 처리';
  if (/renamed|migrated|deprecated|removed/i.test(line)) return '이름·저장 위치 변경';
  if (/setting|config/i.test(line)) return '설정 항목 처리';
  if (/SDK/i.test(line)) return 'SDK 이벤트·입출력 처리';
  if (category === 'feature') return '새 사용 경로 제공';
  if (category === 'fix') return '오류 조건 보정';
  return '동작 범위 조정';
}

function impactFor(line, category) {
  const detail = detailToken(line) || subjectFor(line);
  if (/67%|40MB/i.test(line)) return '대형 세션 재개 대기 시간 감소';
  if (/200K|1M/i.test(line)) return 'Opus 4.7에서 조기 auto-compact 방지';
  if (/204/i.test(line)) return '프록시 응답에서 크래시 대신 원인 확인 가능';
  if (/401|access token|OAuth/i.test(line)) return '토큰 만료 중에도 세션 유지';
  if (/400|429|rate limit/i.test(line)) return 'provider별 실패 원인 파악과 재시도 판단 용이';
  if (/Windows/i.test(line)) return 'Windows 환경의 키 입력·경로·프로세스 동작 안정화';
  if (/macOS|Linux/i.test(line)) return '플랫폼별 네이티브 실행 경로의 차이 감소';
  if (/VSCode|VS Code|IDE|Cursor|Windsurf/i.test(line)) return 'IDE 터미널과 확장 화면에서 표시 오류 감소';
  if (/Bedrock|Vertex|Foundry/i.test(line)) return '엔터프라이즈 provider 설정의 요청 실패 감소';
  if (/permission|sandbox|allow|deny|dangerous|security|vulnerability|bypass|command injection/i.test(line)) return '자동 승인 규칙의 우회 가능성 축소';
  if (/plugin/i.test(line) && /dependenc/i.test(line)) return '설치 중 누락·충돌 의존성 진단 가능';
  if (/MCP/i.test(line)) return '서버가 많거나 연결이 불안정한 환경의 대기 시간 감소';
  if (/OpenTelemetry|OTEL|trace/i.test(line)) return '운영 로그에서 명령·토큰·비용 원인 추적 가능';
  if (/memory|CPU|leak|out-of-memory/i.test(line)) return '장시간 세션의 자원 증가와 강제 종료 위험 감소';
  if (/autocomplete|search|menu|picker|dialog/i.test(line)) return '대화 중 필요한 항목을 더 빨리 찾음';
  if (/resume|continue|session/i.test(line)) return '작업 중단 후 이어가기 실패 감소';
  if (/Bash|shell|terminal|TUI|fullscreen/i.test(line)) return '터미널 기반 반복 작업의 입력 지연과 표시 깨짐 감소';
  if (/SDK/i.test(line)) return 'headless·자동화 클라이언트의 이벤트 처리 안정화';
  if (/setting|config|environment variable|env var/i.test(line)) return '팀 설정과 실행 환경에서 동작을 명시적으로 제어';
  if (category === 'feature') return `${detail} 기능을 명령 흐름에서 직접 사용`;
  if (category === 'fix') return `${detail} 실패 조건의 원인 확인 가능`;
  return `${detail} 입력·설정 확인 단계 축소`;
}

function sentenceFor(line, category) {
  const subject = subjectFor(line);
  return `${subject} ${actionFor(line, category)} — ${impactFor(line, category)}`;
}

function koreanFeature(line) {
  const entity = mainEntity(line);
  const topic = topicFor(line);
  if (/forked subagents/i.test(line)) return `외부 빌드에서 ${entity || '`CLAUDE_CODE_FORK_SUBAGENT`'}로 서브에이전트 fork 활성화 가능`;
  if (/Introducing.*Sonnet.*Opus/i.test(line)) return `Sonnet 4와 Opus 4 모델 도입 — 정식 출시 환경에서 최신 모델 선택 가능`;
  if (/frontmatter.*mcpServers/i.test(line)) return `${entity || '`--agent`'} 실행 시 에이전트 frontmatter의 \`mcpServers\` 로드 지원`;
  if (/deniedDomains/i.test(line)) return `와일드카드 허용보다 우선하는 ${entity || '`sandbox.network.deniedDomains`'} 차단 설정 추가`;
  if (/xhigh.*effort/i.test(line)) return `Opus 4.7용 \`xhigh\` effort 추가 — \`/effort\`, \`--effort\`, 모델 선택기에서 사용 가능`;
  if (/Auto mode.*Max/i.test(line)) return `Max 구독자에게 Opus 4.7 자동 모드 제공 — 모델 선택 부담 감소`;
  if (/PowerShell tool/i.test(line)) return `PowerShell 도구 opt-in 제공 — ${extractEntities(line).slice(0, 2).join(', ') || '플랫폼별 설정'}로 사용 제어`;
  if (/less-permission-prompts/i.test(line)) return `\`/less-permission-prompts\` 스킬 추가 — 반복되는 읽기 전용 권한 요청을 allowlist 후보로 정리`;
  if (/ultrareview/i.test(line)) return `\`/ultrareview\` 추가 — 현재 브랜치나 PR을 병렬 에이전트로 종합 리뷰`;
  if (/\/tui/i.test(line)) return `\`/tui\` 명령과 \`tui\` 설정 추가 — 같은 대화에서 fullscreen 렌더링 전환 가능`;
  if (/push notification/i.test(line)) return `Remote Control 환경에서 Claude가 모바일 push 알림을 보낼 수 있는 도구 추가`;
  if (/LSP/i.test(line)) return `LSP 도구 추가 — 정의 이동, 참조 검색, hover 문서 등 코드 인텔리전스 사용 가능`;
  if (/TypeScript SDK/i.test(line)) return `TypeScript SDK 공개 — \`@anthropic-ai/claude-code\`로 Claude Code 연동 가능`;
  if (/Python SDK/i.test(line)) return `Python SDK 공개 — \`claude-code-sdk\`로 Python 자동화 연동 가능`;
  if (/generally available/i.test(line)) return `정식 출시 — Sonnet 4와 Opus 4 모델 기반 사용 가능`;
  return sentenceFor(line, 'feature');
}

function koreanChange(line) {
  const entity = mainEntity(line);
  const entities = extractEntities(line);
  const topic = topicFor(line);
  if (/\/resume.*67%|67%.*40MB/i.test(line)) return `\`/resume\`로 40MB 이상 대형 세션 로드가 최대 67% 빨라짐 — 긴 히스토리 재개 대기 단축`;
  if (/Default effort.*high.*medium/i.test(line)) return `Pro/Max 구독자의 Opus 4.6·Sonnet 4.6 기본 effort가 \`medium\`에서 \`high\`로 상향`;
  if (/Glob.*Grep.*bfs.*ugrep/i.test(line)) return `macOS/Linux 네이티브 빌드에서 \`Glob\`·\`Grep\` 대신 \`bfs\`·\`ugrep\`를 Bash 경유로 사용 — 검색 왕복 비용 감소`;
  if (/where\.exe/i.test(line)) return `Windows에서 \`where.exe\` 조회를 프로세스별 캐싱 — 서브프로세스 실행 지연 감소`;
  if (/cleanupPeriodDays/i.test(line)) return `\`cleanupPeriodDays\` 정리 범위가 \`~/.claude/tasks/\`, \`~/.claude/shell-snapshots/\`, \`~/.claude/backups/\`까지 확대`;
  if (/concurrent connect|Faster MCP startup|startup/i.test(line)) return `${subjectFor(line)} 시작 처리 병렬화 — 서버가 많을 때 초기 대기 시간 감소`;
  if (/persist across restarts|startup header/i.test(line)) return `\`/model\` 선택 유지 방식 개선 — 프로젝트 pin이 있어도 재시작 후 선택 상태 파악 용이`;
  if (/summarize stale, large sessions/i.test(line)) return `\`/resume\`에서 오래되고 큰 세션 요약 제안 — 재로딩 전 컨텍스트 부담 완화`;
  if (/rate limit/i.test(line)) return `${subjectFor(line)} rate limit 상황 표시 — 자동화가 무한 재시도 대신 대기 판단 가능`;
  if (/renamed|migrated|deprecated|removed/i.test(line)) return `${subjectFor(line)} 이름·저장 위치 변경 — 참조 중인 설정과 문서 갱신 필요`;
  if (/changed .*default|default .*now|no longer requires/i.test(line)) return `${subjectFor(line)} 기본 동작 변경 — 별도 옵션 없이 새 흐름 적용`;
  if (/telemetry|OpenTelemetry|trace/i.test(line)) return `${subjectFor(line)} 이벤트 필드 확장 — 운영 로그에서 명령·토큰·비용 원인 추적 가능`;
  if (/permission|sandbox|allow|deny/i.test(line)) return `${subjectFor(line)} 판정 범위 조정 — 자동 승인 규칙의 우회 가능성 축소`;
  return sentenceFor(line, 'change');
}

function koreanFix(line) {
  const entity = mainEntity(line);
  const topic = topicFor(line);
  if (/proxy.*204/i.test(line)) return `프록시가 \`204 No Content\`를 반환할 때 \`TypeError\` 크래시 대신 명확한 오류 노출`;
  if (/OAuth.*Please run \/login|access token.*expires/i.test(line)) return `OAuth 토큰 만료 시 세션이 끊기지 않도록 \`401\`에서 토큰을 재갱신`;
  if (/WebFetch.*large HTML/i.test(line)) return `\`WebFetch\`가 큰 HTML 페이지에서 멈추지 않도록 변환 전 입력을 제한`;
  if (/NO_PROXY/i.test(line)) return `Bun 실행 환경의 원격 API 요청에서 \`NO_PROXY\` 설정 적용`;
  if (/Opus 4\.7.*200K.*1M/i.test(line)) return `Opus 4.7 세션의 \`/context\` 계산을 1M 컨텍스트 기준으로 수정 — 조기 auto-compact 방지`;
  if (/permission dialog.*teammate/i.test(line)) return `에이전트 팀원이 도구 권한을 요청할 때 권한 대화상자가 크래시하지 않도록 수정`;
  if (/command injection/i.test(line)) return `Bash 명령 처리의 command injection 취약점 차단 — 변조된 입력 실행 위험 완화`;
  if (/wildcard permission rules/i.test(line)) return `와일드카드 권한 규칙이 셸 연산자 포함 복합 명령까지 허용하던 우회 경로 차단`;
  return sentenceFor(line, 'fix');
}

function toKorean(line, category) {
  if (/breaking change/i.test(line)) {
    const entity = mainEntity(line, '관련 설정');
    return `${entity} 호환성 변경 — 기존 설정이나 자동화의 입력 형식 확인 필요`;
  }
  if (category === 'fix') return koreanFix(line);
  if (category === 'feature') return koreanFeature(line);
  return koreanChange(line);
}

function headlineFor(lines, version) {
  const joined = lines.join(' ').toLowerCase();
  if (version === 'v1.0.0') return 'Claude Code 정식 출시';
  if (/security|vulnerability|bypass|command injection|dangerous/.test(joined)) return '보안 및 안정성 개선';
  if (/plugin/.test(joined)) return '플러그인 동작 개선';
  if (/mcp/.test(joined)) return 'MCP 지원 개선';
  if (/windows/.test(joined)) return 'Windows 지원 개선';
  if (/vscode|ide/.test(joined)) return 'IDE 연동 개선';
  if (/model|opus|sonnet|effort|auto mode/.test(joined)) return '모델 설정 개선';
  if (/resume|continue|session/.test(joined)) return '세션 관리 개선';
  if (/bash|terminal|tui|fullscreen|shell/.test(joined)) return '터미널 사용성 개선';
  if (lines.some((line) => isFix(line)) && lines.length <= 2) return '버그 수정';
  return 'Claude Code 기능 개선';
}

function devImpact(lines) {
  const impacts = [];
  if (lines.some((line) => /Default effort.*high.*medium/i.test(line))) impacts.push('Pro/Max 사용자의 Opus 4.6·Sonnet 4.6 기본 effort가 `high`로 동작한다. 응답 품질은 올라갈 수 있지만 토큰 사용량 증가 가능성이 있어 비용 모니터링이 필요하다.');
  if (lines.some((line) => /Breaking change.*Bedrock ARN/i.test(line))) impacts.push('Bedrock ARN을 `ANTHROPIC_MODEL` 또는 `ANTHROPIC_SMALL_FAST_MODEL`에 넣는 설정은 `%2F` 대신 `/` 표기로 바꿔야 한다. 기존 배포 환경의 모델 ARN 값을 점검해야 한다.');
  if (lines.some((line) => /--print JSON output/i.test(line))) impacts.push('`--print` JSON 출력이 중첩 message 객체로 바뀌어 기존 파서가 깨질 수 있다. 로그 수집이나 CI 자동화에서 JSON 경로를 다시 확인해야 한다.');
  const migrationLine = lines.find((line) => /deprecated|renamed|removed|migrated|minimum|changed .*syntax|from .* to /i.test(line));
  if (migrationLine) impacts.push(`${subjectFor(migrationLine)} 변경은 자동화의 참조 경로를 바꿀 수 있다. 이 명령·설정 이름을 쓰는 스크립트는 새 형식으로 갱신해야 한다.`);
  const permissionLine = lines.find((line) => /sandbox\.network\.deniedDomains|blockedMarketplaces|strictKnownMarketplaces|dangerouslyDisableSandbox|command injection|wildcard permission|dangerous-path|Bash deny|find -exec|PermissionRequest/i.test(line));
  if (permissionLine) impacts.push(`${subjectFor(permissionLine)} 권한 판정이 더 엄격해진다. allow 규칙이나 자동 승인 워크플로가 차단될 수 있어 실제 명령 패턴으로 재검토해야 한다.`);
  const envLine = lines.find((line) => /CLAUDE_CODE_USE_POWERSHELL_TOOL|CLAUDE_CODE_FORK_SUBAGENT|NO_PROXY|CLAUDE_ENV_FILE|CLAUDE_CODE_TMPDIR|CLAUDE_CODE_DISABLE_BACKGROUND_TASKS|OTEL_LOG_RAW_API_BODIES|cleanupPeriodDays/i.test(line));
  if (envLine) impacts.push(`${subjectFor(envLine)} 값이 실행 동작을 좌우한다. 팀 공용 환경에서는 필요한 값만 명시하고 업데이트 전후 기본값 차이를 확인해야 한다.`);
  const platformLine = lines.find((line) => /Windows|macOS|Linux|Bedrock|Vertex|Foundry|VSCode|VS Code/i.test(line));
  if (platformLine) impacts.push(`${subjectFor(platformLine)} 환경에 한정된 변경이 포함되어 있다. 이 플랫폼 사용자는 업데이트 직후 키 입력, 경로 처리, provider 요청을 확인하는 편이 안전하다.`);
  return impacts.slice(0, 3).join(' ');
}

function ensureUniqueSummaryBullets(items) {
  const seen = new Map();
  for (const item of items) {
    for (const field of ['newFeatures', 'changes', 'fixes']) {
      item.summary[field] = item.summary[field].map((text) => {
        if (!seen.has(text)) {
          seen.set(text, item.version);
          return text;
        }
        const disambiguated = `${text} — ${item.version} 항목`;
        seen.set(disambiguated, item.version);
        return disambiguated;
      });
    }
  }
}

function summarize(version, body) {
  const lines = releaseLines(body).filter((line) => !isNoise(line));
  const features = [];
  const changes = [];
  const fixes = [];

  for (const line of lines) {
    if (isFix(line)) fixes.push(toKorean(line, 'fix'));
    else if (isNewFeature(line)) features.push(toKorean(line, 'feature'));
    else changes.push(toKorean(line, 'change'));
  }

  return {
    headline: headlineFor(lines, version),
    newFeatures: uniq(features),
    changes: uniq(changes),
    fixes: uniq(fixes),
    devImpact: devImpact(lines),
  };
}

const versions = new Set([...changelogByVersion.keys(), ...githubByVersion.keys()]);
const entries = [...versions].map((version) => {
  const base = githubByVersion.get(version) || changelogByVersion.get(version);
  if (!base) throw new Error(`Missing source for ${version}`);
  return {
    version: base.version,
    tagName: base.tagName,
    publishedAt: base.publishedAt,
    ...(base.url ? { url: base.url } : {}),
    originalBody: base.originalBody,
    summary: summarize(version, base.originalBody),
    summarizedAt,
    summaryModel,
  };
});

entries.sort((a, b) => {
  const dateDiff = Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  if (dateDiff !== 0) return dateDiff;
  return compareVersionsDesc(a.version, b.version);
});

ensureUniqueSummaryBullets(entries);

function validate(items) {
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.version.startsWith('v') || !item.tagName.startsWith('v')) throw new Error(`Bad tag ${item.version}`);
    if (!iso.test(item.publishedAt)) throw new Error(`Bad date ${item.version}: ${item.publishedAt}`);
    if (!Array.isArray(item.summary.newFeatures) || !Array.isArray(item.summary.changes) || !Array.isArray(item.summary.fixes)) throw new Error(`Bad arrays ${item.version}`);
    const parts = versionParts(item.version);
    const isGithubRange = parts[0] > 2 || (parts[0] === 2 && (parts[1] > 0 || (parts[1] === 0 && parts[2] >= 73)));
    const hasGithub = githubByVersion.has(item.version);
    if (hasGithub && !item.url) throw new Error(`Missing URL ${item.version}`);
    if (!hasGithub && item.url) throw new Error(`Unexpected URL ${item.version}`);
    if (i > 0) {
      const prev = items[i - 1];
      const dateDiff = Date.parse(prev.publishedAt) - Date.parse(item.publishedAt);
      if (dateDiff < 0) throw new Error(`Sort error ${prev.version} before ${item.version}`);
      if (dateDiff === 0 && compareVersionsDesc(prev.version, item.version) > 0) throw new Error(`Version sort error ${prev.version} before ${item.version}`);
    }
    if (isGithubRange && !hasGithub && item.url) throw new Error(`Skipped release should not have URL ${item.version}`);
  }
}

validate(entries);
fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`);
console.error(JSON.stringify({
  changelog: changelogByVersion.size,
  github: githubByVersion.size,
  output: entries.length,
  outPath,
}, null, 2));
