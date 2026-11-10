/**
 * mount.tsx — manual mount point for the 3D island (feature 001-whole-site-3d).
 *
 * Loaded as a bundled external module by RoomIsland.astro (CSP-safe, no inline
 * scripts). Mounts the RoomIsland React component into #room-island-root with
 * NO payload prop: the island fetches its Room Payload document at boot
 * (`/rooms/<key>.json`, FR-016 — payload data never appears in first-paint
 * HTML). The heavy three.js graph is therefore only fetched when this module
 * is requested at all — after the page is interactive (FR-002/SC-004).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RoomIsland from './Room3D';

export function mountRoomIsland(rootId = 'room-island-root'): void {
  if (typeof document === 'undefined') return;
  const rootEl = document.getElementById(rootId);
  if (!rootEl) return;
  createRoot(rootEl).render(
    <StrictMode>
      <RoomIsland />
    </StrictMode>,
  );
}
