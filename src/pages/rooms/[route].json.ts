/**
 * rooms/[route].json.ts — prerendered per-route Room Payload documents
 * (feature 001-whole-site-3d, T012/T066; contracts/room-payload.schema.md).
 *
 * Self-hosted same-origin JSON (FR-016): the island fetches
 * `/rooms/<key>.json` at boot; payload data never appears in first-paint HTML.
 * Built from the same content collections the flat pages render (FR-007);
 * evidence URLs pass through untouched (FR-010).
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildRoomPayload, type RoomCollections, type RoomKind } from '../../lib/room-payload';
import { SITE } from '../../lib/site';

export const prerender = true;

interface RoomDef {
  key: string;
  route: RoomKind;
  serviceId?: string;
}

const ABOUT_DESCRIPTION =
  'Marlon Paz — the consultant behind the practice: trajectory, certifications, publications, languages. Independent network-automation and AI-infrastructure consulting from Abu Dhabi.';

export async function getStaticPaths() {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const defs: RoomDef[] = [
    { key: 'home', route: 'home' },
    { key: 'about', route: 'about' },
    ...services.map((s) => ({ key: s.id, route: 'service' as const, serviceId: s.id })),
  ];
  return defs.map((def) => ({ params: { route: def.key }, props: { def } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { def } = props as { def: RoomDef };
  const collections: RoomCollections = {
    services: await getCollection('services'),
    proof: await getCollection('proof'),
    engagements: await getCollection('engagements'),
    repos: await getCollection('repos'),
    faq: await getCollection('faq'),
  };
  const payload = buildRoomPayload(def.route, collections, SITE, {
    serviceId: def.serviceId,
    // Match the flat pages' titles/descriptions exactly (url-room-map rule 3).
    ...(def.key === 'about' ? { title: 'About', description: ABOUT_DESCRIPTION } : {}),
  });
  return new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
