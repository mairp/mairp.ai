/**
 * flatPreference.ts — persisted "use flat site" choice (FR-009, T080).
 *
 * Same localStorage pattern as the theme (`theme-init.ts`): a single key, every
 * access wrapped in try/catch (storage may be blocked). Deliberately free of
 * React/three imports so the page-level mount gate, the boot overlay control and
 * the footer re-enable control can load it without pulling in the 3D graph.
 */
export const FLAT_PREF_KEY = 'room3d';
export const FLAT_PREF_VALUE = 'flat';
/** Fired on `window` when the visitor declines 3D (boot overlay or in-session). */
export const FLAT_EVENT = 'room3d:flat';

export function isFlatPreferred(): boolean {
  try {
    return localStorage.getItem(FLAT_PREF_KEY) === FLAT_PREF_VALUE;
  } catch {
    return false;
  }
}

/** Persist the decline and tell any running/pending island to stand down. */
export function setFlatPreferred(): void {
  try {
    localStorage.setItem(FLAT_PREF_KEY, FLAT_PREF_VALUE);
  } catch {
    /* storage blocked: the decline still applies for this page view */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FLAT_EVENT));
}

export function clearFlatPreferred(): void {
  try {
    localStorage.removeItem(FLAT_PREF_KEY);
  } catch {
    /* ignore */
  }
}
