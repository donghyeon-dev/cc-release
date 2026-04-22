import { Fragment } from "react";

interface Props {
  text: string;
  onCodeClick?: (token: string) => void;
  highlightToken?: string | null;
  sourceTag?: string;
}

const BACKTICK_PATTERN = /`([^`\n]+)`/g;

export function InlineCode({
  text,
  onCodeClick,
  highlightToken,
  sourceTag,
}: Props) {
  if (!text) return null;
  if (!text.includes("`")) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  BACKTICK_PATTERN.lastIndex = 0;
  while ((match = BACKTICK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`t-${key++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    const token = match[1];
    const isHighlight = !!highlightToken && highlightToken === token;
    const className = [
      "inline-code",
      onCodeClick ? "inline-code-link" : "",
      isHighlight ? "inline-code-highlight" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (onCodeClick) {
      nodes.push(
        <button
          key={`c-${key++}`}
          type="button"
          className={className}
          data-code-token={token}
          data-source={sourceTag}
          onClick={() => onCodeClick(token)}
        >
          {token}
        </button>,
      );
    } else {
      nodes.push(
        <code
          key={`c-${key++}`}
          className={className}
          data-code-token={token}
          data-source={sourceTag}
        >
          {token}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return <>{nodes}</>;
}
