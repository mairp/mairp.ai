/**
 * api/[doc].json.ts — lazy content documents (feature 001-whole-site-3d, T086; research R4).
 *
 * Prerendered same-origin JSON served at `/api/faq.json` and `/api/<service-id>.json`:
 * the full FAQ answers and each service's long markdown body, kept out of the
 * per-route Room Payload (<30 KB, contracts rule 4) and fetched only when a
 * lazy screen opens, after the scene is ready. Same collections as the flat
 * pages (FR-007). Bodies are reduced to plain paragraphs; the island renders
 * them through its escaping Inline renderer (code spans + https links only).
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

type Doc = { id: string; kind: 'faq'; items: { id: string; a: string }[] } | { id: string; kind: 'service-body'; paragraphs: string[]; deliverables: string[]; evidence: string[]; links: { label: string; href: string }[] };

/** Markdown body → plain paragraphs: drop HTML tags, heading hashes, list bullets. */
function paragraphs(md: string): string[] {
  return md
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/<[^>]*>/g, '')
        .split('\n')
        .map((l) => l.replace(/^\s*(?:#{1,6}\s+|[-*]\s+)/, '').trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean);
}

export async function getStaticPaths() {
  const faq = (await getCollection('faq')).sort((a, b) => a.data.order - b.data.order);
  const services = await getCollection('services');
  const docs: Doc[] = [
    { id: 'faq', kind: 'faq', items: faq.map((f) => ({ id: f.id, a: f.data.a })) },
    ...services.map((s) => ({ id: s.id, kind: 'service-body' as const, paragraphs: paragraphs(s.body ?? ''),
      deliverables: [...s.data.deliverables],
      evidence: [...s.data.evidence],
      links: s.data.links.map((l) => ({ label: l.label, href: l.href })),
    })),
  ];
  return docs.map((doc) => ({ params: { doc: doc.id }, props: { doc } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify((props as { doc: Doc }).doc), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
