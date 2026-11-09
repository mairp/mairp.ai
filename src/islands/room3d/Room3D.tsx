/**
 * Room3D — root of the lazy-loaded 3D island for the whole-site 3D experience
 * (feature 001-whole-site-3d, Phase 1 skeleton).
 *
 * Phase 1 (attempt 4): pass-through component. The full Canvas + boot + rig
 * implementation lands in later phases; this module only establishes the island
 * boundary so no three.js code enters any non-island import graph. `payload` is optional
 * to align with the Astro wrapper's optional prop (attempt 3 edit).
 */

export interface RoomIslandProps {
  /** Per-page serialized room payload (see contracts/room-payload.schema.md). */
  payload?: unknown;
}

export function RoomIsland({ payload: _payload }: RoomIslandProps) {
  // Temporary Phase-1 pass-through: renders nothing until the 3D world ships.
  return null;
}

export default RoomIsland;
