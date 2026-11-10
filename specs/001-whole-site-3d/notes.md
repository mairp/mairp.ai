# Notes — 001-whole-site-3d

## SC-009 boot-to-usable time (T068, Phase 3)

Measured with `verify/us1-walkthrough.mjs` (Playwright/headless Chromium, software
WebGL via ANGLE/SwiftShader, 1440×900, `astro preview` of the production build,
single page open). Time = `goto` → `#boot` overlay removed (4-frame SceneReady gate).

| Run | Home `/` boot | `/about/` deep link |
|-----|---------------|---------------------|
| 1   | 4.18 s        | 5.47 s              |
| 2   | 3.05 s        | 4.47 s              |
| 3   | 3.88 s        | 5.63 s              |

All runs are within the 10 s target and 20 s ceiling. Caveat: this is the CI/dev
VM with software rendering, not a mid-range laptop with a GPU; re-measure there
before ship. (Observed: with several WebGL pages open at once under software GL,
a deep-link boot took ~27 s — contention artefact, not a single-page measure.)

### Attempt 3 re-measure (progressive screens, FR-003)

Same method, `verify/us1-walkthrough.mjs`, production build: home boot 5.18 s and
5.49 s (two runs), `/about/` deep link 6.7 s. At boot-hide 4–5 of 10 home screens
exist; the full set of 10 appeared 6.3 s after hide under software GL (the
120 ms-per-screen timer is starved by SwiftShader's main-thread load; expected
well under 1.5 s on a GPU machine, not measured here).
