# Contract: Room Payload (page → island)

Stable interface between Astro pages and the 3D island. Versions additive-only.

## Producer
`src/lib/room-payload.ts` exports `buildRoomPayload(route, collections, site): RoomPayload`.
Called in each page's frontmatter; result passed as a single prop:

```astro
---
import { buildRoomPayload } from '../lib/room-payload';
const payload = buildRoomPayload('home', { services, proof, engagements, repos, faq }, SITE);
---
<RoomIsland client:only="react" payload={payload} />
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
