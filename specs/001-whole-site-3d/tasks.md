---
description: "Task list for feature 001-whole-site-3d"
---

# Tasks: Whole-Site 3D Experience

**Input**: Design documents from `/specs/001-whole-site-3d/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested — validation uses the existing CI gates (`npm run build` incl. csp-hash, `astro check`, linkinator, LHCI ≥0.95) and the walkthroughs in quickstart.md.

**Organization**: Tasks grouped by user story (US1 navigate-in-3D, US2 deep links, US3 fallbacks, US4 performance, US5 branding/neutrality) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Single Astro project at repository root. Island code in `src/islands/room3d/`; wrapper in `src/components/`; payload builder in `src/lib/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, Astro integration, and island skeleton

- [x] T001 Install the dependency set as pinned in plan.md/R1 into package.json: `react@^19 react-dom@^19`, dev `@astrojs/react@^7.1.5 @types/react@^19 @types/react-dom@^19`, and the 3D set `three@0.186.x (exact) @react-three/fiber@^9 @react-three/drei@^10 @react-three/postprocessing@^3`
- [x] T002 Add the `react()` integration to integrations array in astro.config.mjs (keep mdx/sitemap and all existing build options untouched; do NOT add @vitejs/plugin-react)
- [x] T003 [P] Create the island module skeleton directory `src/islands/room3d/` with `Room3D.tsx` (temporary pass-through component rendering null) and export a `RoomIsland` React component
- [x] T004 [P] Create the Astro wrapper `src/components/RoomIsland.astro` that renders the React island with `client:only="react"` (NO payload prop — payloads are fetched at boot per FR-016)
- [x] T005 Verify baseline: `npm run build && npm run check` pass with the react integration installed and zero visible change to pages (guards csp-hash gate early per research R11)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Payload contract, URL↔room map, theme bridge, boot overlay, mount gating — required by EVERY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement the room payload builder `src/lib/room-payload.ts` with `buildRoomPayload()` producing the `RoomPayload` shape from contracts/room-payload.schema.md (mairp-owned sources only: content collections, src/lib/site.ts, repos.yaml — constitution P5/FR-015); include per-page service slices, proof, engagements, reposByCategory, faq, about (SITE/trajectory/papers/skills/certs/badges verbatim), contact, navigation from contracts/url-room-map.md, and method steps
- [ ] T007 Add TypeScript types for RoomPayload and its entities (ServiceSummary, ProofBadge, RepoSummary, FaqItem, AboutData, Engagement) in `src/lib/room-payload.ts` matching contracts/room-payload.schema.md; JSON-safe only, evidence URLs passthrough
- [ ] T008 Mount the island on every page and ship payload endpoints per FR-016: create the prerendered per-route JSON endpoint `src/pages/rooms/[route].json.ts` (getStaticPaths over contracts/url-room-map.md; one entry per 3D room; `/404` excluded), call `buildRoomPayload()` there and in page frontmatter only where needed for route data, and render `<RoomIsland client:only="react" />` from `src/components/RoomIsland.astro` in `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/services/[id].astro` — NO serialized payload props in page HTML (csp-hash + SC-004 stay at baseline)
- [ ] T009 Implement the pre-JS boot overlay in `src/layouts/Base.astro` following the demo pattern (inline styles only, `role="status"`, CSS var `--p` progress, rotating status lines themed to mairp copy, `prefers-reduced-motion` disables animations) plus a page-level removal timeout wired into the existing bundled theme-init module — NO new inline script (csp-hash must stay green, contracts/island-events.md)
- [ ] T010 Implement `src/islands/room3d/boot/boot.ts` exposing `window.__roomBoot = { setProgress, hide }` (clamp ≥0.04; `.done` fade; remove node), a `SceneReady` gate that calls `hide()` only after 4 rendered frames (research R2/room-viewer-mechanics §boot), and progressive content surfacing (screens/payload slices report readiness so key content is readable before full load — FR-003/SC-009)
- [ ] T011 Implement WebGL/environment detection and mount gating in `src/islands/room3d/Room3D.tsx`: webgl2 feature detect (null → island renders nothing, boot removed), requestIdleCallback post-LCP mount, `hardwareConcurrency <= 4` lite-mode flag, and `webglcontextlost` → reveal flat page (contracts/island-events.md; US3 foundation)
- [ ] T012 Implement the theme bridge `src/islands/room3d/fx/ThemeBridge.ts`: read tokens (bg/surface/accent/accent2/fg/muted/border) from computed CSS vars into THREE.Color; MutationObserver on `data-theme` + `prefers-color-scheme` listener re-maps live (data-model.md ThemeBridge)
- [ ] T013 Implement the persistent history router `src/islands/room3d/routing/useRoomRoute.ts`: parse initial room from `payload.route`, pushState/popstate with trailing slashes per contracts/url-room-map.md, client-side document.title/meta-description/canonical sync on in-app navigation, and room-transition state machine
- [ ] T014 Set up the Canvas root in `src/islands/room3d/Room3D.tsx` per research R9: `<Canvas shadows PCFShadowMap gl={{toneMapping: AgXToneMapping}} dpr={[1,1.5]}>`, Suspense boundary, React.StrictMode-safe effect cleanups (no WebGL context leaks), pause `useFrame` when `document.hidden` or island inactive

**Checkpoint**: Foundation ready — every page ships flat content + payload, island mounts gated, boot/theme/routing infrastructure testable. User story work can begin.

---

## Phase 3: User Story 1 — Discover and navigate the practice in 3D (Priority: P1) 🎯 MVP

**Goal**: A bootable, navigable 3D environment presenting mairp's services, proof, method, repos, about, FAQ and contact on readable in-world screens.

**Independent Test**: open `/` in a WebGL2 desktop browser → boot completes → navigate entry room → services → a specific service room and read its summary/deliverables/evidence; contact reachable with working copy-email + Twin trigger.

### Implementation for User Story 1

- [ ] T015 [US1] Implement the shot-based camera rig `src/islands/room3d/rig/CameraRig.tsx` per research R8: SHOTS registry (position/target/smoothTime/label/shortLabel), drei CameraControls makeDefault with per-room azimuth+pan Box3 bounds, tweened `setLookAt` transitions, run-ref cancellation of stale transitions, portrait FOV fitting
- [ ] T016 [US1] Build the original mairp-branded environment ("fabric room": racks, patch panels, cable runs, screen meshes) as a PROCEDURAL in-code scene (primitive-based geometry composed in `src/islands/room3d/rooms/environment.tsx` — no GLB required), using ONLY mairp palette/brand motifs and sized to the perf budget (research R7/R9; decision recorded per U1 remediation: an authored GLB in `public/assets/models/` with meshopt/webp compression remains an OPTIONAL later swap; no demo assets under either path)
- [ ] T017 [US1] Conditional asset plumbing (only exercised if/when a GLB is adopted per T016's optional path): self-host meshopt/draco decoders under `public/`, wire loaders to local paths (no CDN, research R7/R11), and add immutable caching for `/assets/models/*` via the wrangler assets config or a new `_headers` file (neither exists yet — create whichever fits the current Cloudflare assets setup)
- [ ] T018 [US1] Implement GLB scene preparation + static merging in `src/islands/room3d/rooms/prepareScene.ts` (port demo mergeStatic pattern): castShadow flags, emissive→MeshBasicMaterial conversion, rounded-corner screen-geometry swap with matching UVs, live-mesh exemption list, merge-by-material, one-shot shadow maps (`shadowMap.autoUpdate=false`)
- [ ] T019 [P] [US1] Implement the CSS3D screen system `src/islands/room3d/screens/Css3dScreens.tsx`: second DOM-only CSS3DRenderer over the canvas, createPortal into detached divs, CSS_SCALE=1000, per-frame camera mirroring, dark-glass backing material, rounded corners (demo TVFeed pattern; research R5)
- [ ] T020 [P] [US1] Implement screen content components in `src/islands/room3d/screens/content/` rendering ONLY payload data per provenance rule (contracts/room-payload.schema.md rule 6): ServiceScreen, ProofScreen (dated badges + evidence links), ServicesGridScreen, ReposScreen (5 categories), MethodScreen, FaqScreen, AboutScreen, ContactScreen (copy-email + Twin trigger), reusing site tokens/typography via CSS vars in `src/islands/room3d/screens/screens.css`
- [ ] T021 [US1] Build the home room `src/islands/room3d/rooms/HomeRoom.tsx`: shot set (overview/proof/services/method/work/repos/trajectory/background/faq/contact), screen placements bound to payload slices, navigation hotspots to other rooms
- [ ] T022 [US1] Build the service room template `src/islands/room3d/rooms/ServiceRoom.tsx`: fact cards, deliverables, evidence list, related-services screens from the page payload slice; status/statusNote handling for svc-enablement (requires-scoping)
- [ ] T023 [US1] Build the about room `src/islands/room3d/rooms/AboutRoom.tsx`: bio, trajectory timeline, certs/badges wall, skills, publications screens from AboutData payload
- [ ] T024 [US1] Implement in-world navigation interactions in `src/islands/room3d/rooms/hotspots.tsx`: clickable screens/hotspots (R3F pointer events), hover cursor/pointer states, room-transition triggers wired to useRoomRoute, shot controls UI (labels from SHOTS, mobile short labels)
- [ ] T025 [US1] Implement contact interactivity parity inside screens per contracts/island-events.md: ContactScreen copy-email reuses the page CopyButton behavior with aria-live announcement; Twin trigger clicks the existing `[data-twin-open]` launcher (never reimplement the chat); evidence links are real `<a target="_blank">` in CSS3D DOM
- [ ] T026 [US1] Add keyboard navigation per contracts/island-events.md (exact keys defined there): `J`/`K` or `←`/`→` cycle navigation targets, `Enter` opens focused screen, `Escape` closes, focus moves into open screen DOM and restores on close; canvas container `aria-hidden`
- [ ] T027 [US1] Implement postprocessing pipeline `src/islands/room3d/fx/Effects.tsx` per research R9: EffectComposer multisampling 0 → N8AO halfRes/medium → in-composer AgX ToneMapping; skip N8AO in lite mode (T011 flag)
- [ ] T028 [US1] Wire boot completion to scene readiness in `src/islands/room3d/Room3D.tsx`: fetch the route's payload JSON from `/rooms/<route>.json` (FR-016, same-origin, no props), useProgress → `__roomBoot.setProgress`, progressive screen rendering as slices arrive, SceneReady 4-frame gate → `hide()` (T010); failure at any phase → failed → fallback (US3 path)
- [ ] T029 [US1] Validate US1 independently: dev-server walkthrough of quickstart.md §2 steps 1–7 (boot, navigate, service detail, back/forward, theme toggle, Twin, copy-email) and `npm run build && npm run check` green; **record boot-to-usable time on the reference machine (mid-range laptop per SC-009, target ≤ 10 s / hard ceiling ≤ 20 s from landing incl. boot) in `specs/001-whole-site-3d/notes.md`**

**Checkpoint**: MVP — the practice is fully discoverable and navigable in 3D from the homepage.

---

## Phase 4: User Story 2 — Deep links land in the right place (Priority: P1)

**Goal**: Every URL boots directly into its matching room; URL/title/history stay in sync.

**Independent Test**: fresh-tab open of each route in contracts/url-room-map.md lands in the matching room; browser back/forward navigate rooms; refresh reopens the same room.

### Implementation for User Story 2

- [ ] T030 [US2] Boot-time deep-link resolution in `src/islands/room3d/routing/useRoomRoute.ts`: initial room = payload.route lookup in the URL↔room map; unknown routes never mount (static 404 stands alone) — depends on T013
- [ ] T031 [US2] Room-entry camera poses in `src/islands/room3d/rooms/roomEntry.ts`: define per-room entry shot (position/target) used when a room is entered directly (deep link/refresh) so the landing framing matches the in-app arrival framing
- [ ] T032 [US2] Meta sync completeness in `src/islands/room3d/routing/meta.ts`: on in-app navigation set document.title + meta[name=description] + link[rel=canonical] from destination payload/navigation data; never touch sitemap or other head tags (contracts/url-room-map.md rule 3)
- [ ] T033 [US2] Add a route-walk validation script `scripts/validate-rooms.mjs` (node, dev-server probe): for each of the 10 map entries assert the island boots into the matching room and flat HTML content is present — wired as the SC-005 check; run manually per quickstart.md §2 step 8
- [ ] T034 [US2] Validate US2 independently: quickstart.md §2 steps 4+8 (deep link, back/forward, refresh) on all services + about; linkinator still green

**Checkpoint**: US1 + US2 both functional — navigable 3D with correct deep links.

---

## Phase 5: User Story 3 — Graceful fallback everywhere (Priority: P2)

**Goal**: No-WebGL, no-JS, reduced-motion, low-power, and context-loss visitors always get complete flat pages or safe reduced behaviour.

**Independent Test**: load every route with WebGL disabled / JS disabled / reduced-motion emulated; verify flat content, no stuck boot, no console errors; context loss recovers.

### Implementation for User Story 3

- [ ] T035 [US3] Harden no-WebGL path in `src/islands/room3d/Room3D.tsx`: detect at mount AND before Canvas creation; render null, ensure `#boot` removal timeout fires, flat page fully interactive (depends on T011)
- [ ] T036 [US3] Reduced-motion behaviour in `src/islands/room3d/rig/CameraRig.tsx` and `src/islands/room3d/fx/Effects.tsx`: camera transitions become jump cuts (smoothTime 0), postprocessing disabled, boot overlay animations already static (T009)
- [ ] T037 [US3] Lite mode in `src/islands/room3d/fx/Effects.tsx` + `Room3D.tsx`: hardwareConcurrency ≤ 4 → drop N8AO, dpr forced 1 (no other changes) per contracts/island-events.md
- [ ] T038 [US3] Context-loss recovery in `src/islands/room3d/Room3D.tsx`: `webglcontextlost` → unmount canvas overlay revealing intact flat DOM; optional re-init on `webglcontextrestored` (research R10)
- [ ] T039 [P] [US3] Asset-failure handling in boot flow (`boot/boot.ts` + Room3D): GLB/asset fetch failure surfaces on boot progress and lands the visitor on flat content (spec edge case)
- [ ] T054 [US3] Decline control per FR-009: add a visible "use flat site" control on the boot overlay (`src/layouts/Base.astro`) and while 3D is running (island UI), which unmounts/reveals the flat page, persists the preference (localStorage), and is honoured on subsequent visits by the T011 mount gate until the visitor re-enables 3D
- [ ] T040 [US3] Validate US3 independently: execute quickstart.md §3 all five scenarios on `/`, `/services/svc-agentic-netops/`, `/about/`; verify the decline control (T054) persists across reload and is re-enableable; zero broken states

**Checkpoint**: Fallback safety net complete.

---

## Phase 6: User Story 4 — Performance stays within budget (Priority: P2)

**Goal**: First-paint payload unchanged; 3D fully deferred; LHCI ≥0.95 × 4 on all audited routes.

**Independent Test**: LHCI run + network inspection per quickstart.md §4 vs pre-refactor baseline.

### Implementation for User Story 4

- [ ] T041 [P] [US4] Vite chunking in astro.config.mjs `vite.build.rollupOptions.output.manualChunks`: isolate `three` (and fiber/drei/postprocessing) from island app code so shader/app edits don't invalidate the three chunk (research R2/§3)
- [ ] T042 [US4] Lazy content fetch path: FaqScreen and long service markdown bodies fetch same-origin after scene-ready per research R4 (endpoint file `src/pages/api/[doc].ts` with `prerender = true` if needed); keep each per-route payload JSON document < 30 KB serialized (contracts rule 4)
- [ ] T043 [US4] Defer-first audit: verify in devtools no three.js/GLB request precedes primary content render; add `<link rel="preload" as="fetch">` for the GLB only where 3D entry is near-certain, and confirm the mount gate (T011) holds on slow CPU throttling
- [ ] T044 [US4] Validate US4: full LHCI autorun ≥0.95 × 4 on `/`, `/services/svc-agentic-netops/`, `/about/`; record first-load JS delta vs baseline (target ≈ 0 KB pre-mount, ≤ ~300 KB gz deferred) in the feature dir notes

**Checkpoint**: Performance gates hold with the 3D layer installed.

---

## Phase 7: User Story 5 — Re-themed mairp experience, not a demo clone (Priority: P3)

**Goal**: Original mairp aesthetics throughout; content strictly from mairp sources; neutrality audit passes.

**Independent Test**: theme toggle remaps 3D colours; every text string/asset traces to mairp sources; zero demo content (SC-008 audit).

### Implementation for User Story 5

- [ ] T045 [P] [US5] Mairp environmental theming pass over `src/islands/room3d/rooms/prepareScene.ts` + materials: palette ONLY from ThemeBridge tokens (teal/cyan/dark bg/light set), CRT-flavoured screen framing in brand style; demo palette (#3b3456/#ffc93c/#ff6b5a) and fonts absent
- [ ] T046 [P] [US5] Mairp boot copy + micro-UI labels review across `src/layouts/Base.astro` boot overlay and `src/islands/room3d/`: status lines/labels written fresh for a consulting practice; island copy limited to payload content + micro-UI labels (contracts rule 6)
- [ ] T047 [US5] Optional synthesized audio cues `src/islands/room3d/audio/cues.ts` (Web Audio only, default muted, tap-unlock, ship behind a toggle) — FR-012; omit entirely if it risks scope
- [ ] T048 [US5] Run the content-source audit (quickstart.md §6) over `src/islands/room3d/`: provenance table for every string/asset → mairp sources (collections, site.ts, repos.yaml, mark.mjs lineage); zero entries from the demo repo; record the table in `specs/001-whole-site-3d/content-audit.md`
- [ ] T049 [US5] Validate US5 independently: theme toggle in 3D (both themes WCAG AA via existing scripts/a11y.mjs scope), audit table complete, spot-check evidence links on proof screens (SC-006)

**Checkpoint**: All user stories functional and independently validated.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, docs, and full gate run

- [ ] T050 [P] Update `README.md` and `DECISIONS.md`: document the 3D architecture (island pattern, payload contract, neutrality rule, asset pipeline) as decisions with rationale
- [ ] T051 [P] Touch device pass per FR-011's measurable floor: verify 3D is enabled by default on a capable touch/mobile device (or emulation) with lite mode auto-engaged per T037's threshold; tap targets ≥44 CSS px on hotspots/screens, all rooms usable from a 360 px-wide viewport, portrait FOV framing verified, `touch-action: manipulation` guards (research R10/mobile patterns)
- [ ] T052 Verify CSP posture end-to-end: exactly one hash-pinned inline script per page in dist, island JSON-prop scripts excluded, no CDN requests in network log, blob-worker usage verified or `worker-src 'self' blob:` added deliberately (research R11)
- [ ] T053 Full gate run per quickstart.md §1: `npm run build`, `npm run check`, linkinator, LHCI; then §2–§6 walkthroughs including the route-walk script (T033) and content audit (T048); fix and re-run until green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; T005 gates everything (build must stay green from day one)
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories (payload/boot/theme/routing are consumed by every story)
- **US1 (Phase 3)**: depends on Phase 2 — the MVP core (rig, scene, screens, rooms)
- **US2 (Phase 4)**: depends on T013 (foundational router) and benefits from US1 rooms but is independently testable via entry poses; do after US1 for meaningful rooms
- **US3 (Phase 5)**: depends on Phase 2 (T011) + T010; independent of US1/US2 content work
- **US4 (Phase 6)**: depends on US1 being installed (something to defer/measure); T041 can start after Phase 1
- **US5 (Phase 7)**: depends on US1 (surfaces exist to theme/audit); T045/T046 parallelizable
- **Polish (Phase 8)**: depends on all stories

### User Story Dependencies

- **US1**: Foundational only — no cross-story dependencies
- **US2**: Foundational (T013) + US1 rooms for validation content
- **US3**: Foundational (T010/T011) only — can be built in parallel with US1
- **US4**: US1 installed; T041 [P] early
- **US5**: US1 surfaces; audit (T048) last before polish

### Within Each User Story

Screens/components [P] first → rooms/wiring → integration → validation task last.

### Parallel Opportunities

- Phase 1: T003, T004
- Phase 2: T006–T014 mostly distinct files (payload/bridge/router/boot) — parallelizable after T003/T004
- US1: T019/T020 (screens) parallel with T016/T017 (assets); rooms depend on both
- US3: parallel with US1 (different files: gating/fallback vs rooms/screens)
- US4: T041 [P] anytime after Phase 1
- US5: T045/T046/T047 parallel

---

## Parallel Example: User Story 1

```bash
# Assets and screen systems first (independent files):
Task: "Procedural environment scene (T016; GLB path T017/T018 only if adopted)"
Task: "Self-host decoders + cache headers (T017)"
Task: "Css3dScreens.tsx portal system (T019)"
Task: "Screen content components from payload (T020)"
# Then rooms & wiring (depend on the above):
Task: "HomeRoom/ServiceRoom/AboutRoom + hotspots (T021–T024)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (foundation blocks everything)
2. Phase 3 (US1): rig + scene + screens + rooms
3. **STOP and VALIDATE**: quickstart.md §2 steps 1–7 + build/check green
4. Demo-ready 3D homepage experience

### Incremental Delivery

1. Foundation → US1 (MVP: discover & navigate)
2. +US2 (deep links) → every URL is a valid entry point
3. +US3 (fallbacks) → safe everywhere
4. +US4 (performance gates) → CI-green
5. +US5 (branding/neutrality audit) → ship-ready
6. Phase 8 polish → full gate run

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. A: US1 (scene/rooms) · B: US3 (fallbacks/gating) · C: US2 (routing/meta) — US3/US2 touch disjoint files from US1
3. US4/US5 converge for gate runs

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution P5 (content neutrality & provenance) applies to EVERY task: no demo content, mairp sources only; T048 audit is the enforcement gate
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
