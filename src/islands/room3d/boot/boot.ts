/**
 * boot.ts — island-side boot overlay protocol (feature 001-whole-site-3d, T010).
 *
 * Implements contracts/island-events.md: the page ships a pre-JS `#boot`
 * overlay; the island's first module installs `window.__roomBoot` so the
 * loading progress (`useProgress` from drei) and the SceneReady gate can drive
 * it. `hide()` is called only after the scene has rendered 4 real frames.
 */

/** Minimum reported progress so the bar shows intent before any real progress. */
const MIN_PROGRESS = 0.04;
/** Number of rendered frames required before the scene counts as usable. */
const SCENE_READY_FRAMES = 4;

export interface RoomBoot {
  /** Report asset-loading progress, clamped to [0.04, 0.99]; 1 arrives via hide(). */
  setProgress(fraction: number): void;
  /** Surface a boot failure on the overlay, then land on the flat page (T079). */
  fail(): void;
  /** Fade the overlay out and remove it from the DOM. */
  hide(): void;
}

declare global {
  interface Window {
    __roomBoot?: RoomBoot;
  }
}

function overlay(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.getElementById('boot');
}

export function installRoomBoot(): RoomBoot {
  if (typeof window === 'undefined') {
    // SSR/prerender safety: return a no-op protocol object.
    return { setProgress() {}, hide() {}, fail() {} };
  }
  if (window.__roomBoot) return window.__roomBoot;

  const boot: RoomBoot = {
    setProgress(fraction: number) {
      const node = overlay();
      if (!node) return;
      const clamped = Math.min(0.99, Math.max(MIN_PROGRESS, fraction));
      node.style.setProperty('--p', String(clamped));
    },
    fail() {
      const node = overlay();
      if (!node) return;
      node.classList.add('failed');
      const hint = node.querySelector('.boot-hint');
      if (hint) hint.textContent = '3D unavailable — showing the flat page';
      node.style.setProperty('--p', '1');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => node.remove(), reduced ? 0 : 1200);
    },
    hide() {
      const node = overlay();
      if (!node) return;
      node.style.setProperty('--p', '1');
      node.classList.add('done');
      // Reduced motion: transition is disabled; remove immediately after a tick.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => node.remove(), reduced ? 0 : 500);
    },
  };
  window.__roomBoot = boot;
  return boot;
}

/**
 * SceneReady gate: counts rendered frames via requestAnimationFrame and calls
 * `hide()` after SCENE_READY_FRAMES frames (research R2 boot pattern). Safe to
 * call more than once; cleanup cancels pending frames (StrictMode-safe).
 */
export function createSceneReadyGate(hide: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let frames = 0;
  let raf = 0;
  let fired = false;
  const tick = () => {
    frames += 1;
    if (frames >= SCENE_READY_FRAMES && !fired) {
      fired = true;
      hide();
      return;
    }
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(raf);
}
