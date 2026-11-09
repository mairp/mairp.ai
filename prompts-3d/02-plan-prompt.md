# Prompt 2 — for `/speckit-plan`

Plan the whole-site 3D refactor of mairp.ai specified in
`specs/<feature-dir>/spec.md`. The plan must be grounded in the three research reports
under `prompts-3d/research/` (read them first):

- `mairp-inventory.md` — full page map, content-collection schemas, theming tokens,
  brand/claim rules, build/deploy/CSP/Lighthouse constraints.
- `room-viewer-mechanics.md` — the demo's reusable mechanics (shot-based CameraRig,
  CSS3DRenderer "live HTML on screens", CRT shader + CSS twin, boot flow, synthesized
  audio, N8AO+AgX postprocessing, mergeStatic-style optimizations) and what must be
  re-themed.
- `astro-r3f-integration.md` — the Astro integration strategy (versions, client:only,
  props-over-endpoints, persistent-island route strategy, asset compression, CSP and
  Lighthouse pitfalls).

## Technical direction to plan against (resolve, don't re-litigate, unless the plan finds a blocker)

1. **Stack**: add `@astrojs/react@^7.1.5` + `react@^19` renderer; `three` (pinned
   exact, e.g. 0.186.x), `@react-three/fiber@^9`, `@react-three/drei@^10`,
   `@react-three/postprocessing@^3` — installed as a set. Add the `react()` integration
   to `astro.config.mjs`; do NOT add `@vitejs/plugin-react` manually.
2. **Mounting**: the 3D world is ONE persistent island mounted in `src/layouts/Base.astro`
   via `client:only="react"`; all Astro routes keep pre-rendering real static HTML; the
   island mounts after LCP (requestIdleCallback) and reads a per-page serialized
   "room payload" (page-specific slice of `getCollection` data embedded as island
   props — never whole collections).
3. **Routing**: History API (pushState + popstate, trailing slashes preserved) drives
   room↔room camera transitions; URL/title/meta/canonical updated client-side on in-app
   navigation; back/forward, deep links and refresh work; sitemap/linkinator/404
   unchanged; `/404` and no-JS stay fully static.
4. **Scene design**: an original mairp-branded environment (network/infrastructure
   motif — e.g. a "fabric room" of racks, patch panels, and in-world screens), lit to
   the site's tokens (Signal Teal `#00b3a4` / cyan `#22d3ee`, dark-first, light-theme
   support via CSS-var → THREE.Color mapping with a data-theme MutationObserver).
   In-world screens show real content via the CSS3DRenderer-portal mechanic (live HTML
   over WebGL, CSS_SCALE workaround) for services/proof/FAQ/repos/about panels.
5. **Mechanics to port from the demo** (re-theme, don't clone): SHOTS-style camera rig
   with bounded orbit and tweened setLookAt; boot overlay (pre-JS, useProgress,
   N-frames-ready gate, reduced-motion off); CRT-style screen aesthetic with a CSS twin;
   N8AO halfRes + in-composer AgX tone mapping, dpr ≤1.5, multisampling 0; mergeStatic-
   style geometry merging with a live-mesh exemption list; one-shot shadow maps;
   synthesized Web Audio cues (default muted, tap-unlock) — optional.
6. **Content pipeline**: decide the exact per-room payload shapes (services with
   deliverables/evidence/related, proof badges, engagements, FAQ, repos by category,
   about/trajectory/certs/badges, contact) and how Markdown service bodies reach the
   screens; repos.yaml stays untouched (read-only consumption).
7. **Assets**: original mairp-themed 3D assets authored as GLB in
   `public/assets/models/`, compressed (meshopt or draco + webp textures), decoders
   self-hosted under `public/` (strict CSP, no CDN); `_headers`/wrangler immutable
   caching for model paths; no HDRI CDN (use lights/emissive or self-hosted HDR).
8. **Fallbacks & a11y**: no-WebGL detection → flat pages; reduced-motion → jump cuts
   + no postprocessing; lite mode on low-end (hardwareConcurrency ≤4 drops N8AO);
   webglcontextlost → flat fallback; keyboard navigation parity for rooms/screens;
   focus management when screens open; WCAG AA in both themes.
9. **Preserve**: Twin chat widget (Turnstile + ask.mairp.ai), ThemeToggle, CopyButton,
   claim→evidence rules, `inlineStylesheets: 'never'`, `cssCodeSplit: false`, the
   single hash-pinned inline script (csp-hash.mjs must keep passing — verify island
   JSON-prop scripts are excluded), Lighthouse ≥0.95 on all four categories for `/`,
   `/services/svc-agentic-netops/`, `/about/`.
10. **Out of scope**: content/schema changes, deploy pipeline changes, hand-editing
    repos.yaml or generated OG/icon/CSP artifacts.

## Expected plan artifacts

Phase 0 `research.md` should resolve (at minimum): exact dependency set + peer risks
(React 19/R3F v9/Astro 7), GLB authoring & compression pipeline choice (meshopt vs
draco), room-payload serialization design, screen-content rendering approach
(CSS3DRenderer portal vs Canvas textures), CSP verification steps, and a performance
budget table (first-paint vs deferred 3D budgets mapped to the LHCI gates).

Phase 1: `data-model.md` for room payloads and scene-graph entities; contracts for the
page↔island interface (room payload schema, URL↔room mapping, island events, theme
bridge); `quickstart.md` with runnable validation (dev server walkthrough per route,
fallback testing, CSP build check, LHCI run).

Constitution check: verify the plan honors `.specify/memory/constitution.md` principles
(evidence-backed claims, content stays data-driven, performance budgets, deploy safety).
