/**
 * HomeRoom.tsx — the entry room (feature 001-whole-site-3d, T055).
 *
 * The environment shell + screen meshes come from Environment(); the DOM
 * portals for this room's placements come from Css3dScreens (mounted once at
 * world level, deriving placements from the active room payload). This room
 * adds the navigation hotspots: About door and the contact console is already
 * a screen; the services wall rows navigate per-service (single-interaction
 * service reach, spec US1 scenario 2).
 */
import { Environment } from './environment';
import { Hotspot } from './hotspots';

export function HomeRoom() {
  return (
    <>
      <Environment />
      <Hotspot id="nav-about" position={[-2.6, 0.7, 0]} route="/about/" />
    </>
  );
}
