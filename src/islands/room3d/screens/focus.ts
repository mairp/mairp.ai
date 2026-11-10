/**
 * focus.ts — keyboard navigation + focus management (feature 001-whole-site-3d,
 * T063/T064; contracts/island-events.md "Keyboard/a11y").
 *
 * Exact keys per contract:
 * - `J` / `→` cycle to the next navigation target;
 * - `K` / `←` cycle to the previous one;
 * - `Enter` activates the focused target (opens its screen: zoom shot + DOM
 *   focus moves into the screen);
 * - `Escape` closes the open screen (returns to the room overview shot) and
 *   restores focus to the previously focused element.
 *
 * The canvas container is `aria-hidden` (Room3D); all screen DOM lives in the
 * CSS3D layer and is real HTML reachable by screen readers.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useRoom3D } from '../context';
import { ENTRY_SHOT } from '../rig/shots';

export function KeyboardNav() {
  const { navTargets, focusedId, setFocusedId, openScreenId, openScreen, setShot } = useRoom3D();
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      if (navTargets.length === 0) return;
      const idx = navTargets.findIndex((t) => t.id === focusedId);
      const next = navTargets[(idx + dir + navTargets.length) % navTargets.length];
      setFocusedId(next.id);
    },
    [navTargets, focusedId, setFocusedId],
  );

  const activate = useCallback(() => {
    const target = navTargets.find((t) => t.id === focusedId) ?? navTargets[0];
    if (!target) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    target.activate();
  }, [navTargets, focusedId]);

  const close = useCallback(() => {
    if (openScreenId) openScreen(null);
    setFocusedId(null);
    setShot(ENTRY_SHOT);
    // Restore focus to the element focused before opening (T064).
    lastFocusRef.current?.focus?.();
    lastFocusRef.current = null;
  }, [openScreenId, openScreen, setFocusedId, setShot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never steal keys while typing in the Twin chat or any input/textarea.
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      switch (e.key) {
        case 'j':
        case 'J':
        case 'ArrowRight':
          cycle(1);
          break;
        case 'k':
        case 'K':
        case 'ArrowLeft':
          cycle(-1);
          break;
        case 'Enter':
          // Keep native activation of focused links/buttons (screen content).
          if (el && el.closest('a, button, summary, select')) return;
          activate();
          break;
        case 'Escape':
          close();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle, activate, close]);

  // Focus management (T064): when a screen opens, move focus into its DOM.
  useEffect(() => {
    if (!openScreenId) return;
    const node = document.querySelector<HTMLElement>(`[data-screen-id="${openScreenId}"]`);
    const focusable = node?.querySelector<HTMLElement>('a, button, [tabindex]');
    (focusable ?? node)?.focus?.();
  }, [openScreenId]);

  return null;
}
