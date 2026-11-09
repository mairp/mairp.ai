# Phase 0 Research: Whole-Site 3D Experience

All NEEDS CLARIFICATION items from Technical Context were resolved during grounding
research (three reports archived in `prompts-3d/research/`; decisions consolidated here).
Format: Decision / Rationale / Alternatives considered.

## R1. React integration & versions

**Decision**: `@astrojs/react@^7.1.5` + `react@^19`/`react-dom@^19` (with @types/*);
3D set installed together: `three` pinned exact 0.186.x, `@react-three/fiber@^9`,
`@react-three/drei@^10`, `@react-three/postprocessing@^3`. Add only the `react()`
integration; never add `@vitejs/plugin-react` manually.
**Rationale**: verified current versions; @astrojs/react 7 supports React 19; R3F v9
requires React 19. Pinning three exactly avoids drei breakage on surprise minor bumps.
**Alternatives**: per-page vanilla three (no React) — rejected: loses R3F ecosystem
(drei CameraControls/useProgress) and demo code reuse; upgrading three to 0.187 as a
set — acceptable later, not during this feature.

## R2. Island mounting: client:only, persistent, post-LCP

**Decision**: ONE persistent island in `Base.astro` via `client:only="react"`, mounted
lazily after primary content (requestIdleCallback gate); all routes keep pre-rendered
static HTML; island renders the 3D layer over the page.
**Rationale**: R3F Canvas SSRs nothing (empty div + SSR hazards from drei/postprocessing);
client:only removes hydration mismatch and `document is not defined` classes of failure.
Persistent island = one WebGL context, one model decode, continuous camera transitions.
Static HTML preserved = SEO/sitemap/linkinator/no-JS intact per FR-013.
**Alternatives**: `client:load` (SSR + hydrate) — rejected (SSR value ≈ 0 for canvas,
extra risk); per-page islands — rejected (context re-creation + shader recompile per
navigation; no continuous camera).

## R3. Routing: History API with real URLs

**Decision**: island drives navigation via `history.pushState`/`popstate` with
trailing slashes preserved; each room maps 1:1 to an existing route; client-side sync
of document.title / meta description / canonical on in-app navigation only. `/404`
stays static, never 3D.
**Rationale**: keeps sitemap, canonical URLs and linkinator green without changes;
deep-link/refresh lands in the right room (FR-006).
**Alternatives**: hash routing — rejected (breaks canonical/SEO parity); client router
library — unnecessary (10 routes, trivial state).

## R4. Content delivery: per-page serialized props

**Decision**: each Astro page embeds its room payload (own content slice + navigation
targets) as island props via a new `src/lib/room-payload.ts` builder; large lazy
content (full FAQ answers, service Markdown bodies beyond a teaser) fetched same-origin
after scene-ready (`connect-src 'self'` already allows it). Whole collections never
serialized (Astro puts island props in page HTML).
**Rationale**: few-KB payloads ≪ one extra round trip; JSON-safe shapes already.
**Alternatives**: one global `/api/*.json` endpoint — kept as option only for heavy
lazy content.

## R5. Screen content rendering: CSS3D portal

**Decision**: adapt the demo's TVFeed mechanic — React DOM rendered via createPortal
into detached divs placed by a second DOM-only CSS3DRenderer over the canvas
(CSS_SCALE=1000 iOS workaround); screen meshes get rounded-corner geometry + dark-glass
backing; content pointer-events enabled on panels that are interactive (links, Twin
button), display-only elsewhere.
**Rationale**: real HTML = accessible text, real links (evidence URLs), reuse of site
tokens/typography; proven in the reference demo.
**Alternatives**: Canvas-texture screens (drei Html → canvas) — rejected: blurry text,
no real links/a11y; drei `<Html>` — rejected (different transform model, occlusion
issues, less control than the proven CSS3D approach).

## R6. Scene aesthetic & environment

**Decision**: original mairp-branded environment ("fabric room": racks, patch panels,
cable runs, in-world screens), built PROCEDURALLY in code (primitive-based geometry in
the island) — no GLB required for v1; an authored, compressed GLB (meshopt/webp,
self-hosted decoders, immutable caching) remains an optional later swap behind the same
scene-prep interface. Colours from tokens via CSS-var → THREE.Color bridge
with data-theme MutationObserver (dark: bg #0f1512, teal #00b3a4 / cyan #22d3ee;
light set supported). Lighting: analytic lights + emissive approach (demo pattern), no
HDRI. CRT-flavoured screen framing/borders, but brand palette (never the demo's).
**Rationale**: satisfies FR/US5 (no demo branding); IBL-free look keeps assets small and
CSP clean. **Content neutrality (FR-015/SC-008, constitution P5)**: the demo repo
contributes aesthetics/mechanics only; its topics (war/elections/inequality/climate
stories), editorial framing, mascots, voices, bumper copy and partner branding are
explicitly excluded from every surface. All content anchors to mairp-owned sources:
content collections, `src/lib/site.ts` CV/bio data, and GitHub portfolio data
(repos.yaml). A content-source audit is a ship gate.
**Alternatives**: self-hosted HDRI — optional follow-up, not v1.

## R7. Assets pipeline

**Decision**: author original GLB(s) into `public/assets/models/`; compress with
gltf-transform (meshopt preferred: smaller decoder, no CDN; draco acceptable with
self-hosted decoders); webp texture compression; `useGLTF.preload`; immutable caching
headers for model paths (wrangler/_headers).
**Rationale**: a 2.5 MB uncompressed GLB alone would break perf goals; meshopt decoder is
WASM served same-origin (CSP-clean).
**Alternatives**: draco via drei's CDN default — rejected (CSP `script-src 'self'` blocks
Google CDN); src/assets + `?url` hashing — deferred (cache-busting via content versioning
in filename is enough for v1).

## R8. Camera rig

**Decision**: SHOTS registry pattern per room (position/target/smoothTime + mobile
labels) with drei CameraControls (makeDefault), azimuth/pan bounds per room, tweened
`setLookAt` transitions, run-ref cancellation of stale transitions, portrait FOV
fitting; reduced-motion → instant jumps.
**Rationale**: direct port of the demo's most reusable mechanic; bounded orbit prevents
leaving the authored scene.
**Alternatives**: free orbit — rejected (authored scene, occluded views); scroll-driven
cinematics — deferred (v1 uses deliberate navigation per FR-004).

## R9. Postprocessing & perf recipe

**Decision**: EffectComposer multisampling 0 → N8AO (halfRes, medium) → in-composer AgX
ToneMapping; dpr ≤ 1.5; mergeStatic-style geometry merging with live-mesh exemption
list; one-shot shadow maps; drop N8AO when `navigator.hardwareConcurrency <= 4`; pause
`useFrame` when `document.hidden`; pause render loop when island hidden/inactive room.
**Rationale**: demo-proven budget controls matching the ≤300 KB deferred-JS + 60s-usable
goals.
**Alternatives**: SSAO pass / higher dpr — rejected by budget.

## R10. Fallbacks & a11y

**Decision**: WebGL2 feature-detect before mounting; failure/context-loss → flat page
(keep DOM under the canvas layer intact); reduced-motion → jump cuts + no postprocessing
+ static boot screen (animations off); keyboard navigation for rooms/screens (focus
moves to screen content when a screen opens; Escape closes); both themes WCAG AA via
existing tokens; boot overlay `role="status"`.
**Rationale**: FR-009/FR-011 + SC-007; flat content must remain the accessible base.
**Alternatives**: "lite 3D" for no-WebGL — nonsensical; skipping focus management —
rejected (screen readers need it).

## R11. CSP & policy compliance

**Decision**: zero new inline scripts (island = external module; Astro island-prop
`<script type="application/json">` already excluded from csp-hash scan — verify in CI);
all loaders/decoders/workers self-hosted; verify blob-worker support, else add
`worker-src 'self' blob:`; run `npm run build` (csp-hash) + linkinator + LHCI in every
change.
**Rationale**: csp-hash.mjs fails the build on any second inline script; CDN fetches
blocked by connect/script-src.
**Alternatives**: loosening CSP — rejected outright.

## R12. Audio

**Decision**: optional, synthesized Web Audio cues only (no assets), default muted,
unlock on first user gesture; ship behind a toggle.
**Rationale**: FR-012; avoids autoplay policy issues and payload.
**Alternatives**: narrated/asset audio — out of scope.

## R13. Performance budget table

| Budget | Value | Enforced by |
|---|---|---|
| First-paint JS delta (flat page) | 0 KB (island deferred post-LCP) | mount gate + LHCI perf |
| First-paint CSS delta | ≈ 0 (island styles merged into one file, small) | cssCodeSplit:false review |
| Deferred island JS (gz) | ≤ ~300 KB | bundle analysis in CI (manual gate v1) |
| 3D assets (compressed GLB) | ≤ ~2 MB total, streamed post-boot | asset pipeline |
| Scene-usable time (mid laptop) | ≤ 60 s from landing incl. boot | quickstart walkthrough |
| LHCI | ≥0.95 × 4 categories × 3 routes | existing lighthouserc.json |

## Constitution re-check (post-Phase-1)

- Evidence-backed claims: contracts carry evidence URLs verbatim from content data — PASS.
- Data-driven content: room payloads generated from collections in room-payload.ts — PASS.
- Performance budgets: R13 table maps to SC-003/SC-004 — PASS.
- Deploy safety: no CI/deploy file changes in the design — PASS.
- Content neutrality & provenance: R6 neutrality clause; room-payload contract restricts
  producers to mairp-owned sources (collections, site.ts CV/bio data, repos.yaml);
  quickstart adds a content-source audit step — PASS.

No violations.
