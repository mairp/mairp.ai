/**
 * mount.tsx — manual mount point for the 3D island (feature 001-whole-site-3d).
 *
 * Loaded as a bundled external module by RoomIsland.astro (CSP-safe, no inline
 * scripts). Reads the page's Room Payload JSON data block and mounts the
 * RoomIsland React component into #room-island-root. The heavy three.js graph
 * is therefore only fetched when this module is requested at all — after the
 * page is interactive (FR-002/SC-004).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RoomIsland from './Room3D';
import type { RoomPayload } from '../../lib/room-payload';

export function mountRoomIsland(rootId = 'room-island-root', payloadId = 'room-payload'): void {
  if (typeof document === 'undefined') return;
  const rootEl = document.getElementById(rootId);
  const dataEl = document.getElementById(payloadId);
  if (!rootEl || !dataEl) return;
  let payload: RoomPayload;
  try {
    payload = JSON.parse(dataEl.textContent ?? '') as RoomPayload;
  } catch {
    return; // malformed payload: flat page stands, island stays dormant
  }
  createRoot(rootEl).render(
    <StrictMode>
      <RoomIsland payload={payload} />
    </StrictMode>,
  );
}
