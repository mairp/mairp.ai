/**
 * context.tsx — shared island state passed down to rooms, screens and the rig
 * (feature 001-whole-site-3d, Phase 3).
 *
 * Holds the fetched Room Payload (FR-016), the ThemeBridge instance, the
 * persistent-session router (useRoomRoute) and the active shot/screen focus
 * state consumed by hotspots and the shot-controls UI.
 */
import { createContext, useContext } from 'react';
import type { ThemeBridge } from './fx/ThemeBridge';
import type { RoomPayload } from '../../lib/room-payload';

/** A keyboard/pointer-navigable target in the current room (T063). */
export interface NavTargetRef {
  id: string;
  kind: 'screen' | 'hotspot';
  label: string;
  /** Navigate to a mapped route (hotspot) or open a screen (zoom shot + DOM focus). */
  activate(): void;
}

export interface Room3DContextValue {
  payload: RoomPayload;
  /** Payload of the room currently displayed (may trail the route during fetch). */
  roomPayload: RoomPayload;
  /** Current canonical route (persistent session, useRoomRoute). */
  route: string;
  navigate(route: string): void;
  /** Low-power flag: N8AO dropped, dpr 1 (contracts/island-events.md). */
  lite: boolean;
  /** Reduced-motion flag: camera transitions become jump cuts (T075 behaviour). */
  reducedMotion: boolean;
  theme: ThemeBridge;
  /** Active shot key of the current room (shot-controls UI + rig). */
  activeShot: string;
  setShot(key: string): void;
  /** Currently opened (focused) screen id, or null. */
  openScreenId: string | null;
  openScreen(id: string | null): void;
  /** Keyboard-cycled focus target id (T063), or null. */
  focusedId: string | null;
  setFocusedId(id: string | null): void;
  /** Ordered navigable targets of the current room (registered by rooms). */
  navTargets: NavTargetRef[];
  registerNavTargets(targets: NavTargetRef[]): void;
  /** 'loading' during room payload fetch; 'error' → keep current room visible. */
  roomFetchState: 'idle' | 'loading' | 'ready' | 'error';
}

export const Room3DContext = createContext<Room3DContextValue | null>(null);

export function useRoom3D(): Room3DContextValue {
  const ctx = useContext(Room3DContext);
  if (!ctx) throw new Error('useRoom3D must be used inside the Room3D island provider');
  return ctx;
}
