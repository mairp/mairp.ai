/**
 * useRoomRoute.ts — persistent client-side history router for the 3D island
 * (feature 001-whole-site-3d, T013; contracts/url-room-map.md +
 * island-events.md).
 *
 * - Initial room comes from the page's `payload.route` (deep link / refresh).
 * - In-app navigation pushes a trailing-slash URL via history.pushState — no
 *   page reload, no island re-boot (FR-006).
 * - popstate resolves rooms through the URL ↔ room map only; unknown URLs are
 *   ignored (rule 4) and the browser performs its native navigation.
 * - On room change the island syncs document.title, meta[name=description] and
 *   link[rel=canonical] from the destination target's meta (rule 3).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavTarget, RoomPayload } from '../../../lib/room-payload';

export type TransitionPhase = 'idle' | 'transitioning';

export interface RoomRouteState {
  /** Canonical trailing-slash pathname of the current room. */
  route: string;
  /** The navigation target matching the current route (undefined at boot only). */
  target?: NavTarget;
  /** Room-transition state machine phase. */
  phase: TransitionPhase;
  /** Navigate in-app to a mapped route; ignored for unmapped URLs. */
  navigate: (route: string) => void;
}

function ensureTrailingSlash(route: string): string {
  if (route === '') return '/';
  return route.endsWith('/') ? route : `${route}/`;
}

const EMPTY_NAV: NavTarget[] = [];

function findTarget(navigation: NavTarget[], route: string): NavTarget | undefined {
  return navigation.find((n) => n.route === route);
}

/** Sync document title, meta description and canonical link (url-room-map rule 3). */
export function syncDocumentMeta(target: NavTarget) {
  document.title = target.title;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (meta) meta.setAttribute('content', target.description);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', new URL(target.route, location.origin).href);
}

export function useRoomRoute(payload?: RoomPayload): RoomRouteState {
  const initial = useRef(ensureTrailingSlash(payload?.route ?? '/'));
  const [route, setRoute] = useState(initial.current);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const navigation = payload?.navigation ?? EMPTY_NAV;

  const navigate = useCallback(
    (next: string) => {
      const canonicalRoute = ensureTrailingSlash(next);
      if (canonicalRoute === route) return;
      const target = findTarget(navigation, canonicalRoute);
      // Rule 4: this map is the ONLY allowed navigation surface.
      if (!target) return;
      setPhase('transitioning');
      window.history.pushState({ room: canonicalRoute }, '', canonicalRoute);
      // Camera transition swaps the room; meta sync happens with the swap. The
      // transition itself is Phase-3 rig work — resolve immediately for now.
      setRoute(canonicalRoute);
      syncDocumentMeta(target);
      setPhase('idle');
    },
    [navigation, route],
  );

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const canonicalRoute = ensureTrailingSlash(new URL(window.location.href).pathname);
      const target = findTarget(navigation, canonicalRoute);
      if (!target) return; // unmapped URL: native behaviour stands
      void event;
      setPhase('transitioning');
      setRoute(canonicalRoute);
      syncDocumentMeta(target);
      setPhase('idle');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigation]);

  // Boot-time self-check: the URL bar should already match payload.route.
  useEffect(() => {
    const current = ensureTrailingSlash(new URL(window.location.href).pathname);
    if (current !== initial.current && findTarget(navigation, current)) {
      setRoute(current);
    }
  }, [navigation]);

  const target = findTarget(navigation, route);
  return { route, target, phase, navigate };
}
