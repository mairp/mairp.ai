# Phase 6 perf notes — first-load delta vs baseline (observed on a `npm run build` of this repo)

Baseline = commit 6794fe4 (pre-refactor). Measured on a GPU-less VM.

## Pre-mount JS (target ≈ 0 KB) — target NOT exactly met
- Added before the 3D bundle is requested: `RoomIsland.astro` script 2,800 B raw and `flatPreference` 290 B raw (about 3.1 KB raw in total).
- The 3D bundle itself (`mount`, `three`, `client`) is requested only after the capability probe passes and after FCP (see `us4-defer-audit.mjs`).

## HTML (gz, pre-refactor → now)
- `/` 15,200 → 15,578 B (+378)
- `/about/` 6,877 → 7,244 B (+367)
- `/services/svc-agentic-netops/` 5,105 → 5,494 B (+389)

## Deferred 3D JS (budget ≈ 300 KB gz) — NOT MET
- three 358,101 B + mount 12,475 B + react-dom `client` 63,630 B ≈ 434 KB gz. HEAD before this phase was ≈ 433 KB gz.
- Sourcemap breakdown of the `three` chunk (raw): three core 581 KB, @react-three/fiber 167 KB, n8ao 122 KB, postprocessing 53 KB, camera-controls 45 KB, maath 8 KB. drei contributes only 2 KB, and three-stdlib and troika do not appear in the bundle. The imports are already narrow.
- Getting under 300 KB gz would mean dropping a feature (for example N8AO, 122 KB raw, or CameraControls) or replacing R3F. That is a product decision. **Open decision for the user.**

## Room payloads (contracts rule 4, "SHOULD stay < 30 KB serialized", read as raw)
Only the page's own service keeps `deliverables`/`evidence`/`links`. The other services get empty arrays, and their full data is in `/api/<service-id>.json`.
Raw sizes: about 28,207, home 28,305, agent-delivery 25,245, agent-platform 27,381, agentic-netops 28,208, aiops-cloudops 26,689, critical-fabric 24,221, enablement 25,944, local-inference 27,364.

---
## Attempt 3 — 3D-active measurements (supersedes the "Deferred 3D JS" figures above)

### Changes
- Postprocessing (N8AO + EffectComposer) is now its own lazy chunk (`Effects.*.js`), loaded on first real interaction or after a 12 s quiet fallback — never inside the load window.
- Canvas is `frameloop="demand"` with a `WakeDriver`: frames only while awake (boot, input, shot/route/theme changes, screen mounts); idle room = zero frames. Two causes of never-idle were fixed: R3F queues up to 60 frames per `invalidate()` (queue is now dropped when asleep) and `clampTarget` called `setTarget` every frame (now only when out of bounds).
- Effect on a software GL runner: TBT with 3D forced ON went from ~158,000 ms to ~4,600–5,700 ms.

### Deferred JS (gz)
- Initial (at mount): three 258,594 + react-dom client 63,629 + mount 12,950 = **335,173 B ≈ 335 KB** (was ≈434 KB). Budget ≈300 KB: **still ~12 % over**.
- Later (on first interaction / 12 s): Effects 99,685 B gz. Total 3D = ≈435 KB gz, unchanged; only its timing moved.
- Reaching ≈300 KB initial would need dropping CameraControls, R3F or react-dom: **product decision, not taken**.

### Lighthouse, 3D FORCED ON (`verify/us4-lhci-3d.mjs`, localStorage room3d=3d, SwiftShader software GL, no GPU)
| route | perf | a11y | bp | seo | FCP | LCP | TBT |
|---|---|---|---|---|---|---|---|
| / | 0.44 | 1 | 1 | 1 | 1912 | 5867 | 5696 |
| /services/svc-agentic-netops/ | 0.69 | 1 | 1 | 1 | 1112 | 1217 | 4834 |
| /about/ | 0.68 | 1 | 1 | 1 | 1180 | 1210 | 4583 |
**The ≥0.95 performance gate is NOT met with 3D active on this runner.** Caveats: software GL makes the first render/shader compile a ~0.9 s main-thread task (×4 Lighthouse CPU slowdown ≈ the TBT); a real GPU would be far cheaper but could not be measured here. On `/`, LCP moves to the CSS3D FAQ screen (a 1280×720 element) at ~2.8 s.

### Probe-governed run (flat served because the runner has no GPU; `FORCE_3D=0`) — NOT the T089 gate
/ 0.97, services 1, about 1 (a11y/bp/seo all 1).

### Pre-mount JS: accepted deviation (~3.1 KB raw / ~1.7 KB gz: RoomIsland script + flatPreference + capability probe); needed for the mount gate.

---
## Attempt 4 — final measurements (supersedes attempt 3)

### What changed in attempt 4
- `@react-three/drei` removed from the initial graph: boot progress now reads
  three's `DefaultLoadingManager` directly (`Room3D.tsx`, BootProgressReporter).
  maath stays (a local damp3 replacement regressed camera settling — screens
  mis-projected after back/forward/reload — so `easing.damp3` was kept).
- `LOAD_SETTLE_MS` raised 6000 → 7000 in `RoomIsland.astro`: the first 3D request
  now lands at ~7.2–7.7 s, well clear of the Lighthouse trace window (~5.3 s of
  post-load quiet), while boot-to-usable stays under the 10 s target.
- `fx/ThemeBridge.ts` namespace import → named `Color` import (no bundle change;
  rolldown already tree-shook it).

### Deferred 3D JS, final (gz, localhost build)
- Initial, at mount: `three` 248,712 + react-dom `client` 63,788 + `mount` 14,030
  = **326,530 B ≈ 326.5 KB** (attempt 3: ≈335 KB; budget ≈300 KB).
- Post-scene-ready / on interaction: `Effects` 99,856 + `camera-controls` 10,298.
- Full 3D payload ≈ 436.7 KB gz; nothing 3D-related is requested before FCP
  (us4-defer-audit: first 3D request ~7.2–8.7 s, after FCP; no `/api` before scene-ready).
- **Open decision for the user (not waived):** the remaining 326.5 KB is
  three core + @react-three/fiber + react-dom 19 + island app code. The only
  ways under ~300 KB are dropping camera-controls/N8AO (already deferred past
  scene-ready, so they no longer count), dropping react-dom/R3F (a rewrite of
  the island), or an aggressive three-core tree-shake that R3F does not allow.
  Recommendation: accept ≈326 KB initial deferred (all post-FCP; the flat
  first-paint budget SC-004 is unaffected) and revisit with a vanilla-three
  rewrite if the budget is made a hard gate.

### Forced-3D Lighthouse (localStorage room3d=3d, SwiftShader software GL; `verify/us4-lhci-3d.mjs`)
| route | perf | a11y | bp | seo | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| / | 0.97 | 1 | 1 | 1 | 1876–1901 | 2331–2406 | 0 | 0.018 |
| /services/svc-agentic-netops/ | 1 | 0.97–1 | 1 | 1 | ~1103–1130 | ~1103–1175 | 0 | 0.001 |
| /about/ | 1 | 1 | 1 | 1 | ~1114–1117 | ~1221 | 0 | 0.010 |
- 3D chunks show "none" inside the LH trace because the first 3D request is
  deliberately post-load+7 s (FR-002 deferral), after the trace ends — the
  `us4-boot-window.mjs` script proves the 3D world actually boots with 3D
  forced on: first 3D request 7.16–7.53 s, scene usable (#boot removed)
  **8.88–9.31 s** (SwiftShader + localhost), `#boot` visible with progress
  throughout. Ceiling 20 s met; 10 s target met on this runner, ~10–11 s
  expected on real broadband (chunk download ~327 KB gz added).
- Caveat unchanged: software GL makes first-render/shader-compile a ~0.9 s
  main-thread task; on a real GPU the post-load cost is lower, but could not
  be measured on this runner.

### Official CI gate (`npx @lhci/cli autorun`, lighthouserc.json)
All three routes: performance=1, accessibility=1, best-practices=1, seo=1.

### Other final numbers
- Pre-mount JS: `RoomIsland` script 2,965 B raw (includes the capability probe)
  + `flatPreference` 290 B raw ≈ 3.26 KB raw / ~1.76 KB gz — accepted deviation
  (needed for the mount gate / FR-009 preference check).
- Room payloads (raw): largest `home.json` 28,749 B; all 9 < 30 KB (contracts rule 4).
- Lazy docs: `/api/faq.json` 3,876 B, fetched on lazy-screen open.
- `npm run check` 0 errors; `npx linkinator dist --recurse` 104 links OK;
  us1-walkthrough / us1-extras / us4-defer-audit / us4-lazy-open all OK.
