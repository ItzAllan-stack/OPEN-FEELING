import type { ReactNode } from 'react';

/** Inline markdown rendered in posts: **bold**, *italic*, #hashtag. */
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|#[A-Za-z0-9_]{2,32})/g;

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  text.split(INLINE_PATTERN).forEach((part, i) => {
    if (!part) return;
    if (part.length >= 4 && part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={i}>{part.slice(2, -2)}</strong>
      );
      return;
    }
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      nodes.push(
        <em key={i}>{part.slice(1, -1)}</em>
      );
      return;
    }
    if (part.startsWith('#')) {
      nodes.push(
        <span key={i} className="text-[#9F4E65]">
          {part}
        </span>
      );
      return;
    }
    nodes.push(<span key={i}>{part}</span>);
  });
  return nodes;
}
