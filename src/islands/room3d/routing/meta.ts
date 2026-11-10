/**
 * meta.ts — document head sync for in-app room navigation (feature
 * 001-whole-site-3d, T071; contracts/url-room-map.md rule 3).
 *
 * Updates ONLY document.title, meta[name=description] and link[rel=canonical]
 * from the destination NavTarget. Existing elements are mutated in place;
 * sitemap and every other head tag are never touched, and no elements are
 * created (the static page always ships these three).
 */
import type { NavTarget } from '../../../lib/room-payload';

export function syncDocumentMeta(target: NavTarget): void {
  document.title = target.title;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.setAttribute('content', target.description);
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', new URL(target.route, location.origin).href);
}
