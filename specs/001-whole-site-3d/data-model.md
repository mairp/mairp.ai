# Phase 1 Data Model: Whole-Site 3D Experience

Entities for the 3D layer. Source of truth for content fields = existing Astro
collections (`src/content.config.ts`) and `src/lib/site.ts`; this model defines only
the derived/serialized shapes the island consumes, plus scene-graph entities.

## Derived data entities (serialized page → island)

Delivery (FR-016): each RoomPayload is prerendered to a self-hosted JSON document at
`/rooms/<route>.json` (endpoint `src/pages/rooms/[route].json.ts`, built by
`src/lib/room-payload.ts`) and fetched by the island at 3D boot — never inlined into
first-paint HTML.

### RoomPayload (per page)
| Field | Type | Source | Validation |
|---|---|---|---|
| route | string (trailing slash) | Astro.url.pathname | must match a UrlRoomMap entry |
| room | RoomKind | derived from route | enum: home / service / about / notfound-handled-static |
| title, description | string | page meta | non-empty |
| services | ServiceSummary[] | services collection (home: all 7 ordered; service page: own + related) | matches content schema subset |
| proof | ProofBadge[] | proof.yaml (home) | badge/source/url/note verbatim |
| engagements | Engagement[] | engagements.yaml (home) | verbatim |
| reposByCategory | Record<Category, RepoSummary[]> | repos.yaml (read-only) | category enum enforced |
| faq | FaqItem[] | faq.yaml (lazy-eligible) | sanitized inline-md output only |
| about | AboutData | src/lib/site.ts (SITE, trajectory, papers, skills, certs, badges, vendors) | verbatim |
| contact | { email, twinAvailable } | SITE | email verified format |
| navigation | RoomLink[] | derived from UrlRoomMap | each target has label + route |
| method | { name, steps } | index content ("The Verified Fabric") | verbatim |

### ServiceSummary
id, name, oneLine, summary, status ('available'|'requires-scoping'), statusNote,
duration, deliverables[], evidence[], vendors[], links[{label,href}], related[ids],
bodyExcerpt (optional markdown-derived teaser; full body lazy).

### ProofBadge
name, badge (dated claim string), source (dated origin), url? (evidence link — MUST be
preserved verbatim; FR-010), note.

### RepoSummary
name, url, description, lang?, langColor?, stars?, forks?, category (enum:
network|agents|inference|method|applied), pinned. Read-only from generated repos.yaml.

### FaqItem
q, a (sanitized inline-md: backtick code + text links only), order.

### AboutData
person (name, tagline, caption, email, location, languages), trajectory[]
(role/org/period/notes), papers[] (title/venue/url), skills map, certs[] (name/issuer/
verifyUrl), badges[] (label/image/verifyUrl), vendors[] (text-only names).

**Validation rules**: all payloads must be JSON-serializable; markdown bodies are never
passed raw — only sanitized HTML/excerpts or lazy-fetched. Evidence URLs are immutable
passthrough.

## Scene-graph entities (island-internal)

### Room
id (= route key), RoomKind, camera bounds (azimuth min/max, pan Box3), shots: Shot[],
screens: ScreenPlacement[], hotspots: Hotspot[], neighbours (via navigation).

### Shot
key, label, shortLabel (mobile), position [x,y,z], target [x,y,z], smoothTime (s),
reducedMotionBehaviour ('jump'), optional arrival effects.

### ScreenPlacement
attached mesh id, size (w×h in world units), corner radius, contentKey (→ payload
slice), interactive bool, lazy bool (fetch-on-open).

### ThemeBridge
token map { bg, surface, accent, accent2, fg, muted, border } read from computed CSS
vars; MutationObserver on data-theme → THREE.Color updates; must re-apply on system
scheme change.

### BootState
phases: idle → mounting → fetchingPayload (`/rooms/<route>.json`; failure → failed) →
loadingAssets (progress 0..1) → compilingFrames (4-frame gate) → ready | failed(reason).
Drives pre-JS boot overlay; failed → fallback mode. Boot-to-usable budget: ≤10 s target
/ ≤20 s hard ceiling (SC-009).

### FallbackDecision
inputs: `flatSitePreferred` (persisted visitor choice), webgl2 support,
prefers-reduced-motion, hardwareConcurrency, contextlost event; outcomes: flat
(preference or no-WebGL) / full3d / lite3d (no N8AO, dpr 1).

### FlatSitePreference
persisted visitor choice ("use flat site"), stored in `localStorage` (same store pattern
as theme). Offered at boot AND while 3D runs (FR-009). Value `true` → island never
mounts; a footer re-enable affordance flips it back. `undefined` (never chosen) → 3D per
device defaults (enabled on capable touch, lite auto-selected on low power — FR-011).

## State transitions

- Room navigation: currentRoom → transition (camera tween) → newRoom; URL/title updated
  at transition start; popstate → reverse lookup.
- Screen open: closed → opening (tween/focus move) → open (content mounted; lazy fetch
  if lazy) → closed (Escape/blur).
- Boot: any failure at any phase → failed → fallback flat; context loss at runtime →
  flat (content preserved underneath).
- Theme: any switch → ThemeBridge re-map → materials/lights update live.
