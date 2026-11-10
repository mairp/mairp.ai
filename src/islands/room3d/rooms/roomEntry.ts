/**
 * roomEntry.ts — per-room entry poses (feature 001-whole-site-3d, T070).
 *
 * One table drives BOTH framings: the deep-link/boot landing and the in-app
 * arrival after a room swap. Both resolve through `entryShotFor`, so the camera
 * pose on a fresh-tab open of a route equals the pose reached by navigating to
 * it in-app. Poses come from the room's `overview` shot in rig/shots.ts.
 */
import { ENTRY_SHOT, shotsForRoom, type RoomShotKind, type Shot } from '../rig/shots';

export interface RoomEntryPose {
  key: string;
  position: Shot['position'];
  target: Shot['target'];
}

const KINDS: RoomShotKind[] = ['home', 'service', 'about'];

function resolve(kind: RoomShotKind): RoomEntryPose {
  const shot = shotsForRoom(kind).find((s) => s.key === ENTRY_SHOT) ?? shotsForRoom(kind)[0];
  return { key: shot.key, position: shot.position, target: shot.target };
}

/** Entry pose per room kind (the 7 service rooms share the service template). */
export const ROOM_ENTRY: Record<RoomShotKind, RoomEntryPose> = Object.fromEntries(
  KINDS.map((k) => [k, resolve(k)]),
) as Record<RoomShotKind, RoomEntryPose>;

/** Shot key the camera rig should be on when a room is entered (boot or in-app). */
export function entryShotFor(kind: RoomShotKind): string {
  return ROOM_ENTRY[kind].key;
}
