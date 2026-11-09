# Contract: Island Events & Host Interop

How the 3D island interacts with the surrounding page (flat DOM, theme, Twin chat,
boot overlay, fallback).

## Boot overlay
- Page ships a pre-JS `#boot` overlay (inline styles, `role="status"`, progress via CSS
  var `--p`, reduced-motion disables its animations).
- Island protocol: `window.__roomBoot = { setProgress(f: number): void; hide(): void }`
  installed by the island's first module; `setProgress` fed by useProgress (clamped
  ≥ 0.04), `hide()` only after 4 rendered frames gate (SceneReady).
- If the island never mounts (no-WebGL/JS), a page-level timeout (≈ 3 s) removes `#boot`
  so flat content shows. This timeout is the ONLY page-side script and runs as part of
  the existing bundled theme-init module — no new inline scripts (CSP).

## Theme
- Island reads tokens from computed CSS vars; observes `documentElement` attribute
  changes on `data-theme` and `prefers-color-scheme` media changes; re-maps THREE colors.
- Island MUST NOT toggle themes itself; it consumes ThemeToggle state.

## Fallback & failure
- `document.createElement('canvas').getContext('webgl2') === null` → island renders
  `null`; flat page stays visible; `#boot` removed.
- `webglcontextlost` → island unmounts its canvas layer and reveals the flat page
  (flat DOM remains in the accessibility tree at all times; canvas layer is an overlay).
- Lite mode (hardwareConcurrency ≤ 4): N8AO dropped, dpr forced 1 — no other change.

## Flat-page interactivity parity (inside 3D)
- Twin chat: island screens MAY include a Twin trigger that clicks the existing
  `[data-twin-open]` launcher — the island never reimplements the chat.
- Copy email: screens call the existing CopyButton behavior (dispatch click on the
  page's `button.copy[data-copy]` or reuse its clipboard+aria-live pattern); clipboard
  write must surface the existing aria-live announcement.
- Evidence links inside screens are real `<a href>` elements (CSS3D portal), opening in
  a new tab; never canvas-painted text.

## History/meta
- Island owns: pushState/popstate navigation, document.title, meta[name=description],
  link[rel=canonical] updates on in-app navigation (see url-room-map.md).
- Island MUST NOT touch: sitemap, RSS (none), service worker (none), analytics (none).

## Keyboard/a11y
- Rooms: `J`/`K` (or `←`/`→`) cycle navigation targets; `Enter` opens focused screen;
  `Escape` closes screen; focus is moved into open screen DOM and restored on close.
  Tasks referencing keyboard nav use these exact keys.
- All screen DOM is real HTML reachable by screen readers; the canvas container is
  `aria-hidden`, the boot overlay is `role="status"`.
