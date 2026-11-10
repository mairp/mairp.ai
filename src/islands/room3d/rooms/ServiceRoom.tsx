/**
 * ServiceRoom.tsx — the shared template for the 7 service rooms (feature
 * 001-whole-site-3d, T056). Content screens (detail wall, evidence wall,
 * related-services grid, contact console) render from the service page's
 * payload slice; svc-enablement's `requires-scoping` status is surfaced by
 * the badge + status note inside ServiceScreen.
 */
import { Environment } from './environment';
import { Hotspot } from './hotspots';

export function ServiceRoom() {
  return (
    <>
      <Environment />
      <Hotspot id="nav-home" position={[-2.6, 0.7, 0]} route="/" />
      <Hotspot id="nav-about" position={[2.6, 0.7, 0]} route="/about/" />
    </>
  );
}
