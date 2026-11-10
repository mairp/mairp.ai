/**
 * AboutRoom.tsx — the about room (feature 001-whole-site-3d, T057): bio wall,
 * trajectory/papers wall, certs/badges/skills wall, contact console + entry
 * hotspots back to the practice.
 */
import { Environment } from './environment';
import { Hotspot } from './hotspots';

export function AboutRoom() {
  return (
    <>
      <Environment />
      <Hotspot id="nav-home" position={[-2.6, 0.7, 0]} route="/" />
      <Hotspot id="nav-services-entry" position={[2.6, 0.7, 0]} route="/" />
    </>
  );
}
