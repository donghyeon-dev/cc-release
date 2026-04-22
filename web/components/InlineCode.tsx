import { Fragment } from "react";

interface Props {
  text: string;
}

const BACKTICK_PATTERN = /`([^`\n]+)`/g;

export function InlineCode({ text }: Props) {
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
    nodes.push(
      <code key={`c-${key++}`} className="inline-code">
        {match[1]}
      </code>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`t-${key++}`}>{text.slice(lastIndex)}</Fragment>,
    );
  }

  return <>{nodes}</>;
}
