# Contract: Room Payload (page → island)

Stable interface between Astro pages and the 3D island. Versions additive-only.

## Producer
`src/lib/room-payload.ts` exports `buildRoomPayload(route, collections, site): RoomPayload`.
A prerendered static endpoint `src/pages/rooms/[route].json.ts` (`prerender = true`)
calls it per route and serves the payload as a self-hosted JSON document (FR-016).
Pages mount the island WITHOUT payload props; the island fetches its route's document
at boot:

```ts
// island boot (same-origin; CSP-clean)
const payload: RoomPayload = await fetch(`/rooms/${routeKey}.json`).then(r => r.json());
```

```astro
---
// Base.astro (via RoomIsland.astro) — no payload prop
<RoomIsland client:only="react" route={Astro.url.pathname} />
---
```

## Shape (authoritative; see ../data-model.md for field detail)

```ts
type RoomKind = 'home' | 'service' | 'about';

interface RoomPayload {
  route: string;                 // trailing-slash pathname
  room: RoomKind;
  serviceId?: string;            // when room === 'service'
  title: string;
  description: string;
  services: ServiceSummary[];    // page-relevant slice, order-preserved
  proof: ProofBadge[];
  engagements: Engagement[];
  reposByCategory: Record<'network'|'agents'|'inference'|'method'|'applied', RepoSummary[]>;
  faq: FaqItem[];
  about: AboutData;              // shared AboutData on every page (small)
  contact: { email: string; twinAvailable: true };
  navigation: { label: string; route: string; shortLabel?: string }[];
  method: { name: string; steps: string[] };
}
```

## Rules
1. JSON-serializable only; no Date objects, no markdown raw bodies (excerpts or
   lazy-fetched sanitized HTML).
2. Evidence URLs in `proof[].url`, `links[].href`, papers, certs/badges verify URLs are
   passthrough — never rewritten or dropped (claim→evidence rule).
3. `reposByCategory` is read-only derived data; the generator owns repos.yaml.
4. Payload size guard: per-page payload SHOULD stay < 30 KB serialized; oversize content
   moves to lazy fetch, not to trimming field definitions.
5. Unknown/extra fields MUST be ignored by the island (forward compatibility).
6. **Content provenance (FR-015/SC-008)**: payloads are built ONLY from mairp-owned
   sources — `src/content/` collections, `src/lib/site.ts` (CV/bio, certs, trajectory,
   papers), and the generated `repos.yaml` (GitHub portfolio). No content from any
   reference repository (including the room-viewer demo) may enter a payload. The
   island renders payload content exclusively; it MUST NOT carry its own narrative copy
   beyond micro-UI labels (e.g. "Back", "Open").

## Consumer
`src/islands/room3d/` reads only this contract — never imports Astro content APIs.
Fetch failure or invalid JSON at boot is a boot failure (BootState.failed) → flat-page
fallback, never a broken 3D state.
