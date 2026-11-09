# R3F-in-Astro Island Strategy (research agent report)

## 0. Environment facts (verified)

Demo `/root/little-big-questions/room-viewer`: react/react-dom ^19.3.1, @react-three/fiber ^9.8.2, drei ^10.7.9, @react-three/postprocessing ^3.2.0 (latest 3.2.2), three ^0.186.1 (latest 0.187.0). Demo best practices to carry: React.lazy split, static HTML boot screen (boot.js), useGLTF.preload, useProgress.

Target `/root/mairp.ai`: Astro ^7.3.5 (latest 7.4.8), static, trailingSlash always, directory format, inlineStylesheets never, cssCodeSplit false, mdx + sitemap, no @astrojs/react yet. Strict CSP: `script-src 'self'` + exactly ONE hash-pinned inline script (theme init); `scripts/csp-hash.mjs` FAILS the build on a second inline script.

## 1. Correct Astro pattern

```bash
npm i react@^19 react-dom@^19
npm i -D @astrojs/react@^7.1.5 @types/react@^19 @types/react-dom@^19
npm i three@^0.186 @react-three/fiber@^9 @react-three/drei@^10 @react-three/postprocessing@^3
```

- Add `react()` integration; do NOT add @vitejs/plugin-react manually.
- Use **`client:only="react"`** for the Canvas island (no SSR of three.js, no hydration mismatch, no `document is not defined`). Props still serialize into page HTML and reach the client mount.
- Non-canvas islands: client:load/idle fine.
- Tokens: CSS custom properties pierce islands; never hardcode hex. Map tokens→THREE.Color via getComputedStyle + MutationObserver on data-theme.
- Content: **props over JSON endpoints** (few KB data). JSON endpoints only for large lazy content (FAQ, markdown panels) — fetch after scene-ready; `connect-src 'self'` allows same-origin.

## 2. Route strategy

**Recommended hybrid**: keep Astro as router-of-record and static HTML source of truth. All routes keep generating real HTML (services, about, 404 stay .astro full-content pages); ONE persistent island in the base layout (`client:only`) that subscribes to History API / astro:page-load and renders the 3D world as a layer on top. Camera transitions between rooms; URL stays real (pushState with trailing slashes) → deep-linkable, sitemap/canonical/linkinator unchanged. `/404` stays plain Astro. Client-side meta sync (document.title, meta description, canonical) for in-app navigation only.

Per-page islands rejected: context creation + shader recompile on every navigation; no continuous camera.

## 3. Loading & performance

- three+R3F+drei ≈ 150–180 KB gz; a GLB adds MBs. Ship ZERO three.js on first paint; mount island post-LCP (client:only + requestIdleCallback); static hero text is the LCP element.
- Compress GLB: `gltf-transform optimize --compress draco|meshopt --texture-compress webp --simplify --instance`. Meshopt preferred (smaller decoder, no CDN). Self-host decoders (CSP blocks Google CDN).
- Code split: React.lazy Canvas subtree; manualChunks split `three` from app code.
- useGLTF.preload + useProgress → port boot.js; `<link rel=preload as=fetch>` for the GLB.
- Fallbacks: no-WebGL detection → static content; reduced-motion → jump cuts, disable postprocessing; mobile DPR [1,1.5], drop N8AO when hardwareConcurrency ≤4, pause useFrame on document.hidden; webglcontextlost → static fallback.
- Lighthouse: keep ≥0.95 gates; first-load JS budget ≤ ~300 KB gz.

## 4. Asset pipeline

- GLB in `public/assets/models/` + `_headers` rule `max-age=31536000, immutable`; or src/assets + `?url` import for hashing.
- Environment maps: no drei preset CDN (CSP); self-host HDRI or skip IBL (demo's emissive/lights approach — cheapest, consistent).

## 5. Pitfalls

1. Never import Canvas transitively in .astro frontmatter (client:only avoids).
2. React 19 StrictMode double-mount: symmetric cleanup of WebGL resources or context leaks (Chrome caps ~16).
3. R3F v9: React 19 required; JSX-managed geometry/materials disposed by React — don't call .dispose() manually.
4. CSP: self-host draco/HDRIs/workers; verify blob workers (`worker-src 'self' blob:` may be needed); csp-hash must still pass in CI; `<script type="application/json">` island props are excluded from the hash scan.
5. Context loss handlers mandatory on mobile Safari.
6. pushState URLs keep trailing slashes (trailingSlash always).
7. Astro 7 islands serialize props into page HTML — pass per-page slices only, not whole collections.
8. Pin three exactly; upgrade three/drei/fiber as a set.
