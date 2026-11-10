/**
 * Inline.tsx — minimal payload-string markup for screen content (feature
 * 001-whole-site-3d, T051). Payload FAQ answers may carry inline markdown
 * (code spans + links) exactly as the flat site's inline-md allows; here the
 * string is HTML-escaped first, then only those two patterns are applied, and
 * links always open in a new tab (evidence links, FR-010).
 */
import { useMemo } from 'react';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toHtml(src: string): string {
  return esc(src)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function Inline({ text }: { text: string }) {
  const html = useMemo(() => toHtml(text), [text]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
