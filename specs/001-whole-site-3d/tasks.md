---
description: "Task list for feature 001-whole-site-3d (fine-grained: smallest viable scope per task)"
---

# Tasks: Whole-Site 3D Experience

**Input**: Design documents from `/specs/001-whole-site-3d/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested — validation uses the existing CI gates (`npm run build` incl. csp-hash, `astro check`, linkinator, LHCI ≥0.95) and the walkthroughs in quickstart.md.

**Organization**: Tasks grouped by user story (US1 navigate-in-3D, US2 deep links, US3 fallbacks, US4 performance, US5 branding/neutrality). **Granularity**: every task touches one concern (ideally one file/one function group) so each is a small, reviewable, independently committable unit.

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

### Payload types & builder (contracts/room-payload.schema.md)

- [x] T006 [P] Define the core payload types `RoomKind`, `RoomPayload`, `RoomLink`, and `ContactInfo` in `src/lib/room-payload.ts` matching contracts/room-payload.schema.md (JSON-safe only)
- [x] T007 [P] Define the entity types `ServiceSummary`, `ProofBadge`, `Engagement`, `RepoSummary`, `FaqItem`, `AboutData` in `src/lib/room-payload.ts` (fields per data-model.md; evidence URLs documented as immutable passthrough per FR-010)
- [x] T008 [P] Implement `buildServiceSummaries()` in `src/lib/room-payload.ts`: map the services collection (all 7, order-preserved; own + related slice for service pages) including bodyExcerpt handling — no raw markdown bodies
- [x] T009 [P] Implement `buildHomeSlices()` in `src/lib/room-payload.ts`: proof (badges + evidence URLs verbatim), engagements, reposByCategory (from generated repos.yaml, read-only), faq (sanitized inline-md output only), and method steps from the homepage content
- [x] T010 [P] Implement `buildAboutData()` in `src/lib/room-payload.ts`: serialize SITE, trajectory, papers, skills, certs, badges, vendors from `src/lib/site.ts` verbatim into the AboutData shape
- [x] T011 Implement `buildRoomPayload(route)` assembly in `src/lib/room-payload.ts`: compose title/description, contact, navigation (from contracts/url-room-map.md), and the slices above into one RoomPayload per route key
- [x] T012 Create the prerendered endpoint `src/pages/rooms/[route].json.ts`: getStaticPaths over every 3D room in contracts/url-room-map.md (home + 7 services + about; `/404` EXCLUDED), each returning `buildRoomPayload()` output
- [x] T013 Verify payload documents: run `npm run build`, confirm `/rooms/*.json` files exist in dist, each < 30 KB, each parses, and no payload data appears in any route's HTML (FR-016; SC-004 baseline)

### Mounting & boot overlay (contracts/island-events.md)

- [x] T014 Add the `#boot` overlay markup + inline styles to `src/layouts/Base.astro` (mairp-branded status lines, `role="status"`, CSS var `--p` progress, `prefers-reduced-motion` disables animations — demo pattern, mairp copy only)
- [x] T015 Add the boot-removal fallback timeout to the existing bundled theme-init module (`src/lib/theme-init.ts`): ~3 s after DOMContentLoaded, remove `#boot` if the island never took ownership — NO new inline scripts (csp-hash stays green)
- [x] T016 [P] Implement `src/islands/room3d/boot/boot.ts` window API: install `window.__roomBoot = { setProgress, hide }`; `setProgress` clamps ≥ 0.04 and writes CSS var `--p`; `hide()` fades via `.done` then removes the node
- [x] T017 [P] Implement the `SceneReady` gate in `src/islands/room3d/boot/boot.ts`: count 4 rendered frames before allowing `hide()` (shader-compile stutter guard, research R2)
- [x] T018 Implement boot ownership handoff in `src/islands/room3d/boot/boot.ts`: once the island installs `__roomBoot`, cancel the theme-init timeout (T015) so only one party owns `#boot`

### Mount gating & environment detection (Room3D)

- [x] T019 Implement the WebGL2 feature-detect helper in `src/islands/room3d/env.ts` (`document.createElement('canvas').getContext('webgl2')`) plus the lite-mode probe (`navigator.hardwareConcurrency <= 4`) and reduced-motion probe (`prefers-reduced-motion`)
- [x] T020 Implement mount gating in `src/islands/room3d/Room3D.tsx`: requestIdleCallback post-LCP mount, webgl2 check before any Canvas creation (null → render nothing), persisted flat-site preference check consumed (gate extended in T071)
- [x] T021 Set up the Canvas root in `src/islands/room3d/Room3D.tsx` per research R9: `<Canvas shadows PCFShadowMap gl={{ toneMapping: AgXToneMapping }} dpr={[1, 1.5]}>` inside Suspense, `frameloop` pausing when `document.hidden`
- [x] T022 Audit StrictMode-safe cleanup in `src/islands/room3d/Room3D.tsx` and children: every effect disposes symmetrically (no WebGL context leaks on double-mount, research §5 pitfall 2)
- [x] T023 [P] Add the `webglcontextlost` listener stub in `src/islands/room3d/Room3D.tsx` that flags a lost-context state (recovery UI itself is US3/T066)

### Theme bridge

- [x] T024 [P] Implement token reading in `src/islands/room3d/fx/ThemeBridge.ts`: read bg/surface/accent/accent2/fg/muted/border from computed CSS vars into THREE.Color
- [x] T025 [P] Implement live re-mapping in `src/islands/room3d/fx/ThemeBridge.ts`: MutationObserver on `documentElement[data-theme]` + `prefers-color-scheme` media listener → re-read tokens → notify subscribers (island never toggles themes itself)

### History router

- [x] T026 [P] Implement initial-route parsing in `src/islands/room3d/routing/useRoomRoute.ts`: read the current pathname, normalize trailing slash, look up the room in the URL↔room map (contracts/url-room-map.md); unknown route → do not mount
- [x] T027 Implement in-app navigation in `src/islands/room3d/routing/useRoomRoute.ts`: `navigate(route)` → `history.pushState` (trailing slash preserved) → room-transition state machine (currentRoom → transitioning → newRoom)
- [x] T028 Implement popstate handling in `src/islands/room3d/routing/useRoomRoute.ts`: reverse map lookup, transition to the previous room without reload; the 3D world never re-boots (FR-006)

**Checkpoint**: Foundation ready — every route ships flat content + a payload JSON, island mount is gated, boot/theme/routing infrastructure testable. User story work can begin.

---

## Phase 3: User Story 1 — Discover and navigate the practice in 3D (Priority: P1) 🎯 MVP

**Goal**: A bootable, navigable 3D environment presenting mairp's services, proof, method, repos, about, FAQ and contact on readable in-world screens.

**Independent Test**: open `/` in a WebGL2 desktop browser → boot completes → navigate entry room → services → a specific service room and read its summary/deliverables/evidence; contact reachable with working copy-email + Twin trigger.

### Camera rig (research R8)

- [x] T029 [US1] Define the SHOTS registry types + per-room shot data structure in `src/islands/room3d/rig/shots.ts` (key, label, shortLabel for <600px, position, target, smoothTime, azimuth bounds, arrival effects)
- [x] T030 [US1] Implement the bounded CameraControls setup in `src/islands/room3d/rig/CameraRig.tsx`: drei CameraControls `makeDefault`, per-shot azimuth min/max and pan Box3 constraints from shots.ts
- [x] T031 [US1] Implement tweened shot transitions in `src/islands/room3d/rig/CameraRig.tsx`: damped `setLookAt` (smoothTime per shot), run-ref cancellation of stale transitions on rapid shot changes
- [x] T032 [US1] Implement portrait FOV fitting in `src/islands/room3d/rig/CameraRig.tsx`: widen FOV on narrow viewports so shot framing keeps key content visible (demo pattern)

### Procedural environment (research R6/R7 — original mairp "fabric room", no GLB required)

- [x] T033 [P] [US1] Build the room shell (floor, walls, ceiling grid) in `src/islands/room3d/rooms/environment.tsx` using primitives + ThemeBridge token materials only
- [x] T034 [P] [US1] Build the rack props (network racks with rails + unit outlines) in `src/islands/room3d/rooms/environment.tsx` as reusable instanced/merged geometry
- [x] T035 [P] [US1] Build patch panels + cable-run props in `src/islands/room3d/rooms/environment.tsx` (accent-colored status LEDs using accent2 token)
- [x] T036 [US1] Define the screen-placement registry in `src/islands/room3d/rooms/screenPlacements.ts`: per room, screen id → world position/rotation/size/contentKey/interactive/lazy (data-model.md ScreenPlacement)
- [x] T037 [US1] Create the screen mesh geometry in `src/islands/room3d/rooms/environment.tsx`: rounded-corner planes per placement with dark-glass backing material
- [x] T038 [US1] Add the lighting rig in `src/islands/room3d/rooms/environment.tsx`: ambient + directional + screen-glow rect/point lights, colors from ThemeBridge tokens; light intensities re-derived for this scene (never demo constants)

### Scene preparation & optimization (research R9)

- [x] T039 [US1] Implement shadow/emissive prep in `src/islands/room3d/rooms/prepareScene.ts`: castShadow/receiveShadow flags, emissive-only materials → MeshBasicMaterial
- [x] T040 [US1] Implement mergeStatic-style static geometry merging in `src/islands/room3d/rooms/prepareScene.ts`: merge by (material, shadow flags, attribute layout) with a live-mesh exemption list; replaced originals get empty geometry + negative-radius bounding sphere
- [x] T041 [US1] Enable one-shot shadow maps in `src/islands/room3d/rooms/prepareScene.ts`: `shadowMap.autoUpdate = false`, re-flag `needsUpdate` only when lights/scene change

### CSS3D screen system (research R5)

- [x] T042 [P] [US1] Implement the DOM-only CSS3DRenderer layer in `src/islands/room3d/screens/Css3dScreens.tsx`: second renderer stacked over the canvas, CSS_SCALE=1000, per-frame camera mirroring (`view.copy(camera); view.position.multiplyScalar(CSS_SCALE)`)
- [x] T043 [P] [US1] Implement portal mounting in `src/islands/room3d/screens/Css3dScreens.tsx`: `createPortal` into detached divs sized 640 CSS px wide, one per ScreenPlacement, aligned to screen meshes
- [x] T044 [US1] Wire pointer-events policy in `src/islands/room3d/screens/Css3dScreens.tsx`: interactive screens accept pointer events (links/buttons); display-only screens `pointer-events: none`

### Screen content components (payload-only copy; contracts rule 6)

- [x] T045 [P] [US1] Create `src/islands/room3d/screens/screens.css` with token-driven styles (CSS vars only — no hardcoded hex) for all screen surfaces
- [x] T046 [P] [US1] Implement `ServiceScreen` in `src/islands/room3d/screens/content/ServiceScreen.tsx`: name/oneLine/status/statusNote/duration, fact cards, deliverables, evidence list with real `<a target="_blank">` links
- [x] T047 [P] [US1] Implement `ServicesGridScreen` in `src/islands/room3d/screens/content/ServicesGridScreen.tsx`: all 7 services with one-liners, each clickable → navigate to its service room
- [x] T048 [P] [US1] Implement `ProofScreen` in `src/islands/room3d/screens/content/ProofScreen.tsx`: dated badges with source + evidence URLs verbatim (FR-010/SC-006)
- [x] T049 [P] [US1] Implement `ReposScreen` in `src/islands/room3d/screens/content/ReposScreen.tsx`: repos grouped by the 5 categories, name/url/description/lang/stars from RepoSummary
- [x] T050 [P] [US1] Implement `MethodScreen` in `src/islands/room3d/screens/content/MethodScreen.tsx`: "The Verified Fabric" name + loop steps from the payload
- [x] T051 [P] [US1] Implement `FaqScreen` in `src/islands/room3d/screens/content/FaqScreen.tsx`: 9 Q/A items rendering only sanitized inline-md (code spans + text links)
- [x] T052 [P] [US1] Implement `AboutScreen` in `src/islands/room3d/screens/content/AboutScreen.tsx`: bio lede, trajectory timeline, certs/badges, skills, publications from AboutData
- [x] T053 [US1] Implement `EngagementsScreen` in `src/islands/room3d/screens/content/EngagementsScreen.tsx`: 6 engagement shapes with deliverable + prerequisites
- [x] T054 [US1] Implement `ContactScreen` in `src/islands/room3d/screens/content/ContactScreen.tsx`: email display + copy affordance + Twin trigger + CV/link CTAs (interactivity wired in T056/T057)

### Rooms

- [x] T055 [US1] Build the home room `src/islands/room3d/rooms/HomeRoom.tsx`: shot set (overview/proof/services/method/work/repos/trajectory/background/faq/contact) + screen placements bound to payload slices + hotspots
- [x] T056 [US1] Build the service room template `src/islands/room3d/rooms/ServiceRoom.tsx`: ServiceScreen + related-services screens from the page payload slice; requires-scoping status handling (svc-enablement)
- [x] T057 [US1] Build the about room `src/islands/room3d/rooms/AboutRoom.tsx`: AboutScreen placements + entry shot + navigation hotspots
- [x] T058 [US1] Implement the hotspot mesh component in `src/islands/room3d/rooms/hotspots.tsx`: clickable 3D affordances (R3F pointer events) triggering room navigation
- [x] T059 [US1] Implement hover/press feedback in `src/islands/room3d/rooms/hotspots.tsx`: pointer cursor, hover glow/emissive pop, press animation (demo mechanic, mairp styling)
- [x] T060 [US1] Implement the shot-controls UI in `src/islands/room3d/rooms/hotspots.tsx`: on-screen shot labels (short labels < 600 px) as accessible buttons driving CameraRig

### Interactivity parity (contracts/island-events.md)

- [x] T061 [US1] Wire copy-email in `src/islands/room3d/screens/content/ContactScreen.tsx`: reuse the page CopyButton behavior (dispatch click on `button.copy[data-copy]` or its clipboard+aria-live pattern); announce via existing aria-live
- [x] T062 [US1] Wire the Twin trigger in `src/islands/room3d/screens/content/ContactScreen.tsx`: click the existing `[data-twin-open]` launcher — never reimplement the chat
- [x] T063 [US1] Implement keyboard navigation in `src/islands/room3d/screens/focus.ts`: `J`/`K` or `←`/`→` cycle navigation targets, `Enter` opens focused screen, `Escape` closes; canvas container `aria-hidden`
- [x] T064 [US1] Implement focus management in `src/islands/room3d/screens/focus.ts`: focus moves into open screen DOM on open, restored to the triggering hotspot on close

### Postprocessing & boot wiring

- [x] T065 [US1] Implement the postprocessing pipeline `src/islands/room3d/fx/Effects.tsx`: EffectComposer multisampling 0 → N8AO (halfRes, medium) → in-composer AgX ToneMapping; skip N8AO when lite flag set
- [x] T066 [US1] Wire payload fetch at boot in `src/islands/room3d/Room3D.tsx`: fetch `/rooms/<routeKey>.json` (FR-016, same-origin), hold in React context for screens; fetch failure → boot failed state (US3 fallback)
- [x] T067 [US1] Wire boot progress in `src/islands/room3d/Room3D.tsx`: useProgress → `__roomBoot.setProgress`; progressive screen rendering as payload slices/assets arrive (FR-003); SceneReady 4-frame gate → `hide()`
- [x] T068 [US1] Validate US1 independently: dev-server walkthrough of quickstart.md §2 steps 1–7 (boot, navigate, service detail, back/forward, theme toggle, Twin, copy-email) and `npm run build && npm run check` green; **record boot-to-usable time on the reference machine (SC-009: ≤10 s target / ≤20 s ceiling) in `specs/001-whole-site-3d/notes.md`**

**Checkpoint**: MVP — the practice is fully discoverable and navigable in 3D from the homepage.

---

## Phase 4: User Story 2 — Deep links land in the right place (Priority: P1)

**Goal**: Every URL boots directly into its matching room; URL/title/history stay in sync.

**Independent Test**: fresh-tab open of each route in contracts/url-room-map.md lands in the matching room; browser back/forward navigate rooms; refresh reopens the same room.

### Implementation for User Story 2

- [x] T069 [US2] Boot-time deep-link resolution in `src/islands/room3d/routing/useRoomRoute.ts`: initial room = pathname lookup (T026) drives which room renders first — depends on T026
- [x] T070 [P] [US2] Define per-room entry poses in `src/islands/room3d/rooms/roomEntry.ts`: entry shot (position/target) per room so deep-link landing framing matches in-app arrival framing
- [x] T071 [P] [US2] Implement meta sync in `src/islands/room3d/routing/meta.ts`: on in-app navigation set document.title + meta[name=description] + link[rel=canonical] from destination payload/navigation data; never touch sitemap or other head tags
- [x] T072 [US2] Create the route-walk validation script `scripts/validate-rooms.mjs` (node, dev-server probe): for each of the 10 map entries assert the island boots into the matching room and flat HTML content is present (SC-005)
- [x] T073 [US2] Validate US2 independently: quickstart.md §2 steps 4+8 (deep link, back/forward, refresh) on all services + about; run `node scripts/validate-rooms.mjs`; linkinator still green

**Checkpoint**: US1 + US2 both functional — navigable 3D with correct deep links.

---

## Phase 5: User Story 3 — Graceful fallback everywhere (Priority: P2)

**Goal**: No-WebGL, no-JS, reduced-motion, low-power, context-loss, and declined visitors always get complete flat pages or safe reduced behaviour.

**Independent Test**: load every route with WebGL disabled / JS disabled / reduced-motion emulated; verify flat content, no stuck boot, no console errors; context loss recovers; decline persists.

### Implementation for User Story 3

- [x] T074 [US3] Harden the no-WebGL path in `src/islands/room3d/Room3D.tsx`: detect at mount AND before Canvas creation; render null, ensure `#boot` removal fires, flat page fully interactive
- [x] T075 [US3] Implement reduced-motion camera behaviour in `src/islands/room3d/rig/CameraRig.tsx`: transitions become jump cuts (instant position/target set) when the T019 probe is true
- [x] T076 [US3] Disable postprocessing under reduced-motion in `src/islands/room3d/fx/Effects.tsx`: composer skipped entirely (boot overlay animations already static per T014)
- [x] T077 [US3] Implement lite mode in `src/islands/room3d/fx/Effects.tsx` + `Room3D.tsx`: hardwareConcurrency ≤ 4 → drop N8AO, dpr forced 1 — no other changes (contracts/island-events.md)
- [x] T078 [US3] Implement context-loss recovery in `src/islands/room3d/Room3D.tsx`: `webglcontextlost` → unmount canvas overlay + CSS3D layer revealing intact flat DOM; optional re-init on `webglcontextrestored`
- [x] T079 [P] [US3] Implement asset/payload fetch-failure handling in `src/islands/room3d/boot/boot.ts` + `Room3D.tsx`: failure surfaces on boot progress and lands the visitor on flat content (spec edge case)
- [x] T080 [US3] Add the flat-site preference helper `src/islands/room3d/flatPreference.ts`: read/write/clear the persisted "use flat site" localStorage choice (same store pattern as theme)
- [x] T081 [US3] Add the "use flat site" control to the boot overlay in `src/layouts/Base.astro`: visible at boot, sets the preference (T080) and skips island mount; consumed by the T020 mount gate on subsequent visits
- [x] T082 [US3] Add the in-session "use flat site" control to the island UI (`src/islands/room3d/Room3D.tsx`): unmounts the island mid-3D, reveals the flat page, persists the choice (FR-009)
- [x] T083 [US3] Add the re-enable affordance to the flat site footer (`src/components/Footer.astro`): clears the preference so 3D returns on the next visit — visible only when the preference is set
- [x] T084 [US3] Validate US3 independently: quickstart.md §3 all scenarios on `/`, `/services/svc-agentic-netops/`, `/about/`; decline control persists across reload and is re-enableable; zero broken states

**Checkpoint**: Fallback safety net complete.

---

## Phase 6: User Story 4 — Performance stays within budget (Priority: P2)

**Goal**: First-paint payload unchanged; 3D fully deferred; LHCI ≥0.95 × 4 on all audited routes.

**Independent Test**: LHCI run + network inspection per quickstart.md §4 vs pre-refactor baseline.

### Implementation for User Story 4

- [x] T085 [P] [US4] Add Vite chunking in astro.config.mjs `vite.build.rollupOptions.output.manualChunks`: isolate `three` (and fiber/drei/postprocessing) from island app code so shader/app edits don't invalidate the three chunk
- [x] T086 [P] [US4] Create the lazy-content endpoint `src/pages/api/[doc].ts` (`prerender = true`) serving full FAQ answers and long service markdown bodies as sanitized documents, fetched only after scene-ready (research R4)
- [x] T087 [US4] Wire lazy fetch-on-open in `FaqScreen` + `ServiceScreen` (`src/islands/room3d/screens/content/`): fetch the T086 document when a lazy screen opens; keep per-route `/rooms/*.json` payloads < 30 KB (contracts rule 4)
- [x] T088 [US4] Run the defer-first audit: verify in devtools no three.js/GLB/payload request precedes primary content render; confirm the mount gate (T020) holds under 4× CPU throttling; verify `#boot` shows progress meanwhile
- [x] T089 [US4] Validate US4: full LHCI autorun ≥0.95 × 4 on `/`, `/services/svc-agentic-netops/`, `/about/`; record first-load JS delta vs baseline (≈0 KB pre-mount, ≤ ~300 KB gz deferred) in the feature dir notes

**Checkpoint**: Performance gates hold with the 3D layer installed.

---

## Phase 7: User Story 5 — Re-themed mairp experience, not a demo clone (Priority: P3)

**Goal**: Original mairp aesthetics throughout; content strictly from mairp sources; neutrality audit passes.

**Independent Test**: theme toggle remaps 3D colours; every text string/asset traces to mairp sources; zero demo content (SC-008 audit).

### Implementation for User Story 5

- [ ] T090 [P] [US5] Environmental theming pass over `src/islands/room3d/rooms/prepareScene.ts` + environment materials: palette ONLY from ThemeBridge tokens (teal/cyan/dark bg/light set), CRT-flavoured screen framing in mairp style; demo palette (#3b3456/#ffc93c/#ff6b5a) and fonts absent
- [ ] T091 [P] [US5] Review boot copy + micro-UI labels across `src/layouts/Base.astro` overlay and `src/islands/room3d/`: status lines written fresh for a consulting practice; island copy limited to payload content + micro-UI labels (contracts rule 6)
- [ ] T092 [US5] Optional synthesized audio cues `src/islands/room3d/audio/cues.ts` (Web Audio only, default muted, tap-unlock, ship behind a toggle) — FR-012; omit entirely if it risks scope
- [ ] T093 [US5] Create the content-source audit table `specs/001-whole-site-3d/content-audit.md`: provenance row for every string/asset in `src/islands/room3d/` → mairp sources (collections, site.ts, repos.yaml, mark.mjs lineage); zero entries from the demo repo (quickstart §6)
- [ ] T094 [US5] Validate US5 independently: theme toggle in 3D (both themes WCAG AA), audit table complete, spot-check evidence links on proof screens (SC-006)

**Checkpoint**: All user stories functional and independently validated.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, docs, and full gate run

- [ ] T095 [P] Update `README.md` and `DECISIONS.md`: document the 3D architecture (island pattern, payload contract, neutrality rule, asset pipeline) as decisions with rationale
- [ ] T096 [P] Touch device pass per FR-011: 3D enabled by default on a capable touch device (or emulation), lite auto-engaged per T077, tap targets ≥44 CSS px on hotspots/screens, all rooms usable from 360 px viewport, portrait FOV verified, `touch-action: manipulation` guards
- [ ] T097 Verify CSP posture end-to-end: exactly one hash-pinned inline script per page in dist, no payload JSON inlined in HTML (FR-016), no CDN requests in network log, blob-worker usage verified or `worker-src 'self' blob:` added deliberately (research R11)
- [ ] T098 [P] Create the scripted boot-time check `scripts/validate-boot-time.mjs` (Playwright, mid-range profile): cold load `/` → measure navigation start to `#boot` hidden; assert ≤10 s target / ≤20 s ceiling (SC-009)
- [ ] T099 Full gate run per quickstart.md §1: `npm run build`, `npm run check`, linkinator, LHCI; then §2–§6 walkthroughs including route-walk (T072), boot-time check (T098) and content audit (T093); fix and re-run until green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; T005 gates everything (build must stay green from day one)
- **Foundational (Phase 2)**: depends on Setup; BLOCKS all user stories (payload/boot/theme/routing are consumed by every story). Internal order: T006–T010 [P] types/slices → T011 assembly → T012 endpoint → T013 verify; T014/T015 before T016–T018; T019 before T020
- **US1 (Phase 3)**: depends on Phase 2 — the MVP core (rig, scene, screens, rooms). Internal order: rig (T029–T032) + environment (T033–T038) + screens (T042–T054) are three parallel tracks; rooms (T055–T057) need environment + screens; wiring (T058–T067) needs rooms
- **US2 (Phase 4)**: depends on T026 (router parse) and US1 rooms for meaningful validation
- **US3 (Phase 5)**: depends on Phase 2 (T019/T020) + T016; independent of US1/US2 content work — can be built in parallel with US1
- **US4 (Phase 6)**: depends on US1 being installed (something to defer/measure); T085/T086 can start after Phase 1
- **US5 (Phase 7)**: depends on US1 (surfaces exist to theme/audit); audit (T093) last before polish
- **Polish (Phase 8)**: depends on all stories

### User Story Dependencies

- **US1**: Foundational only — no cross-story dependencies
- **US2**: Foundational (T026–T028) + US1 rooms for validation content
- **US3**: Foundational (T016/T019/T020) only — can be built in parallel with US1
- **US4**: US1 installed; T085/T086 [P] early
- **US5**: US1 surfaces; audit (T093) last before polish

### Parallel Opportunities

- Phase 2: T006–T010, T014–T017, T019, T023–T025, T026 are distinct files — parallelizable within their sub-tracks
- US1 track A (rig T029–T032), track B (environment T033–T038, prep T039–T041), track C (screens T042–T054) run fully in parallel; rooms/wiring converge
- US3: parallel with US1 (different files: gating/fallback vs rooms/screens)
- US4: T085/T086 [P] anytime after Phase 1
- US5: T090/T091 parallel; T092 optional

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (foundation blocks everything)
2. Phase 3 (US1): rig + environment + screens in parallel → rooms → wiring
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
- Constitution P5 (content neutrality & provenance) applies to EVERY task: no demo content, mairp sources only; T093 audit is the enforcement gate
- Commit after each task (they are deliberately small — one commit per task is the expected rhythm)
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
