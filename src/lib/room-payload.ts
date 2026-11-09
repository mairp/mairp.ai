/**
 * room-payload.ts — builds the per-page Room Payload consumed by the 3D island
 * (feature 001-whole-site-3d). Implements contracts/room-payload.schema.md.
 *
 * Provenance rule (FR-015 / constitution P5): every string here traces to a
 * mairp-owned source — the Astro content collections (src/content/), the CV/bio
 * data in src/lib/site.ts, or the generated repos.yaml (GitHub portfolio data).
 * Nothing from any reference repository enters a payload.
 *
 * The result is JSON-safe only (no Dates, no raw markdown bodies); evidence
 * URLs pass through untouched (claim→evidence rule, FR-010).
 */

import type { CollectionEntry } from 'astro:content';
import { SITE, METHOD, METHOD_STEPS, TRAJECTORY_HOME, PAPERS, SKILLS, CERTS, BADGES, VENDORS } from './site';

/* ── Contract types (T007) — JSON-safe only ──────────────────────────── */

export type RoomKind = 'home' | 'service' | 'about';
export type RepoCategory = 'network' | 'agents' | 'inference' | 'method' | 'applied';

export interface ServiceSummary {
  id: string;
  name: string;
  oneLine: string;
  summary: string;
  status: 'available' | 'requires-scoping';
  statusNote: string;
  duration: string;
  deliverables: string[];
  evidence: string[];
  vendors: string[];
  links: { label: string; href: string }[];
  related: string[];
}

export interface ProofBadge {
  id: string;
  name: string;
  badge: string;
  source: string;
  url?: string;
  note: string;
}

export interface Engagement {
  id: string;
  name: string;
  duration: string;
  deliverable: string;
  prerequisites: string;
}

export interface RepoSummary {
  name: string;
  url: string;
  description: string;
  lang?: string;
  langColor?: string;
  stars?: number;
  forks?: number | 'fork';
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface AboutData {
  name: string;
  practice: string;
  tagline: string;
  caption: string;
  location: string;
  languages: readonly string[];
  cv: string;
  github: string;
  linkedin: string;
  credly: string;
  certs: readonly string[];
  badges: { name: string; issuer: string; year: number; url: string }[];
  vendors: readonly string[];
  trajectory: { yr: string; ttl: string; org: string; derisk: string }[];
  papers: { name: string; venue: string; href: string; note: string }[];
  skills: Record<string, string>;
}

export interface NavTarget {
  label: string;
  route: string;
  shortLabel?: string;
  /** Destination page meta, used by the island to sync document.title etc. */
  title: string;
  description: string;
}

export interface RoomPayload {
  route: string;
  room: RoomKind;
  serviceId?: string;
  title: string;
  description: string;
  services: ServiceSummary[];
  proof: ProofBadge[];
  engagements: Engagement[];
  reposByCategory: Record<RepoCategory, RepoSummary[]>;
  faq: FaqItem[];
  about: AboutData;
  contact: { email: string; twinAvailable: true };
  navigation: NavTarget[];
  method: { name: string; steps: string[] };
}

/* ── URL ↔ room map (contracts/url-room-map.md) ──────────────────────── */

export const REPO_CATEGORIES: readonly RepoCategory[] = ['network', 'agents', 'inference', 'method', 'applied'];

/* ── Builder (T006) ──────────────────────────────────────────────────── */

export interface RoomCollections {
  services: CollectionEntry<'services'>[];
  proof: CollectionEntry<'proof'>[];
  engagements: CollectionEntry<'engagements'>[];
  repos: CollectionEntry<'repos'>[];
  faq: CollectionEntry<'faq'>[];
}

const byOrder =
  <T extends { data: { order: number } }>() =>
  (a: T, b: T) =>
    a.data.order - b.data.order;

function toServiceSummary(entry: CollectionEntry<'services'>): ServiceSummary {
  const s = entry.data;
  return {
    id: entry.id,
    name: s.name,
    oneLine: s.oneLine,
    summary: s.summary,
    status: s.status,
    statusNote: s.statusNote,
    duration: s.duration,
    deliverables: [...s.deliverables],
    evidence: [...s.evidence],
    vendors: [...s.vendors],
    links: s.links.map((l) => ({ label: l.label, href: l.href })),
    related: [...s.related],
  };
}

/** Trailing-slash canonical route for a payload route id (url-room-map). */
export function routeFor(id: string): string {
  if (id === 'home') return '/';
  if (id === 'about') return '/about/';
  return `/services/${id}/`;
}

export type BuildRoomPayloadOptions = {
  /** For service pages: the page's own service id (its slice + meta come first). */
  serviceId?: string;
  title?: string;
  description?: string;
};

export function buildRoomPayload(
  route: RoomKind,
  collections: RoomCollections,
  site: typeof SITE,
  opts: BuildRoomPayloadOptions = {},
): RoomPayload {
  const services = [...collections.services].sort(byOrder()).map(toServiceSummary);
  const proof = [...collections.proof].sort(byOrder()).map((p) => ({
    id: p.id,
    name: p.data.name,
    badge: p.data.badge,
    source: p.data.source,
    url: p.data.url,
    note: p.data.note,
  }));
  const engagements = [...collections.engagements].sort(byOrder()).map((e) => ({
    id: e.id,
    name: e.data.name,
    duration: e.data.duration,
    deliverable: e.data.deliverable,
    prerequisites: e.data.prerequisites,
  }));
  const reposByCategory = Object.fromEntries(
    REPO_CATEGORIES.map((cat) => [
      cat,
      collections.repos
        .filter((r) => r.data.category === cat)
        .sort(byOrder())
        .map((r) => ({
          name: r.data.name,
          url: r.data.url,
          description: r.data.description,
          lang: r.data.lang,
          langColor: r.data.langColor,
          stars: r.data.stars,
          forks: r.data.forks,
        })),
    ]),
  ) as Record<RepoCategory, RepoSummary[]>;
  const faq = [...collections.faq].sort(byOrder()).map((f) => ({ id: f.id, q: f.data.q, a: f.data.a }));

  const about: AboutData = {
    name: site.name,
    practice: site.practice,
    tagline: site.tagline,
    caption: site.caption,
    location: site.location,
    languages: site.languages,
    cv: site.cv,
    github: site.github,
    linkedin: site.linkedin,
    credly: site.credly,
    certs: CERTS,
    badges: BADGES.map((b) => ({ name: b.name, issuer: b.issuer, year: b.year, url: b.url })),
    vendors: VENDORS,
    trajectory: TRAJECTORY_HOME,
    papers: PAPERS,
    skills: SKILLS,
  };

  // Page-relevant service slice + meta. Home/about carry all services;
  // a service page leads with its own entry followed by its related ones.
  const self = opts.serviceId ? services.find((s) => s.id === opts.serviceId) : undefined;
  const slice = self
    ? [self, ...services.filter((s) => self.related.includes(s.id) || s.related.includes(self.id))]
    : services;

  const title =
    opts.title ??
    (self ? `${self.name} · ${site.name}` : site.title);
  const description = opts.description ?? (self ? self.oneLine : site.description);

  // Navigation targets: the full URL ↔ room map; every target carries the meta
  // the island needs to sync document.title/description/canonical in-app.
  const navigation: NavTarget[] = [
    {
      label: 'Home',
      route: '/',
      shortLabel: 'Home',
      title: site.title,
      description: site.description,
    },
    {
      label: 'About',
      route: '/about/',
      shortLabel: 'About',
      title: `About · ${site.name}`,
      description:
        'Marlon Paz — the consultant behind the practice: trajectory, certifications, publications, languages. Independent network-automation and AI-infrastructure consulting from Abu Dhabi.',
    },
    ...services.map((s) => ({
      label: s.name,
      route: routeFor(s.id),
      shortLabel: s.name.replace(/ — .*$/, ''),
      title: `${s.name} · ${site.name}`,
      description: s.oneLine,
    })),
  ];

  return {
    route: routeFor(opts.serviceId ?? route),
    room: route,
    serviceId: opts.serviceId,
    title,
    description,
    services: slice,
    proof,
    engagements,
    reposByCategory,
    faq,
    about,
    contact: { email: site.email, twinAvailable: true },
    navigation,
    method: { name: METHOD, steps: [...METHOD_STEPS] },
  };
}
