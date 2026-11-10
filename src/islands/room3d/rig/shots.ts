/**
 * shots.ts — SHOTS registry types + per-room shot data (feature
 * 001-whole-site-3d, T029; research R8 camera-rig mechanics adapted from the
 * reference demo's SHOTS pattern — all framings, labels and values are
 * mairp-authored for the fabric room; nothing is copied from the demo).
 *
 * A Shot is one named camera framing inside a room: a position/target pair,
 * a damping time for the transition, azimuth bounds the visitor may orbit
 * within while on the shot, and optional arrival side effects. Every room
 * exposes an entry shot (key 'overview') used both at boot and as the
 * deep-link landing framing (T070 contract, Phase 4 consumes the same table).
 */

export interface Shot {
  /** Stable key (drives the shot-controls UI + keyboard cycle order). */
  key: string;
  /** Accessible label (shot-controls button text). */
  label: string;
  /** Short label for viewports < 600 px (FR-011). */
  shortLabel: string;
  /** Camera position, world units, room-local coordinates. */
  position: [number, number, number];
  /** Camera look-at target, world units. */
  target: [number, number, number];
  /** Transition damping time in seconds (smaller = snappier). */
  smoothTime: number;
  /** Azimuth orbit bounds [min, max] radians relative to the shot direction. */
  azimuth: [number, number];
  /** Optional arrival side effect (e.g. 'glow' pulses screen emissive). */
  arrival?: 'glow' | 'none';
}

/** World dimensions of the procedural fabric room (rooms/environment.tsx). */
export const ROOM_BOUNDS = {
  /** Half-extents for pan/target clamping (Box3 in CameraRig, T030). */
  box: { min: [-8, 0.2, -6.4], max: [8, 3.2, 6.4] } as const,
};

const OVERVIEW: Shot = {
  key: 'overview',
  label: 'Overview',
  shortLabel: 'View',
  position: [0, 2.3, 4.2],
  target: [0, 1.9, -6],
  smoothTime: 0.9,
  azimuth: [-0.5, 0.5],
  arrival: 'none',
};

/* ── Home room: overview/proof/services/method/work/repos/trajectory/ ──
   background/faq/contact (T055 shot set). Screens sit on the back, left and
   right walls plus one free-standing contact console (screenPlacements.ts). */

export const HOME_SHOTS: Shot[] = [
  OVERVIEW,
  {
    key: 'hero',
    label: 'Practice overview',
    shortLabel: 'Home',
    position: [0, 1.9, -2.6],
    target: [0, 1.9, -6.9],
    smoothTime: 0.7,
    azimuth: [-0.28, 0.28],
    arrival: 'glow',
  },
  {
    key: 'proof',
    label: 'Proof wall',
    shortLabel: 'Proof',
    position: [-4.4, 1.9, -4.6],
    target: [-8.85, 1.9, -4.6],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'services',
    label: 'Services grid',
    shortLabel: 'Services',
    position: [4.2, 1.9, -4.6],
    target: [8.85, 1.9, -4.6],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'method',
    label: 'The Verified Fabric',
    shortLabel: 'Method',
    position: [-3.4, 1.9, -4.4],
    target: [-4.6, 1.9, -6.9],
    smoothTime: 0.6,
    azimuth: [-0.25, 0.25],
    arrival: 'glow',
  },
  {
    key: 'work',
    label: 'Engagement shapes',
    shortLabel: 'Work',
    position: [3.4, 1.9, -4.4],
    target: [4.6, 1.9, -6.9],
    smoothTime: 0.6,
    azimuth: [-0.25, 0.25],
    arrival: 'glow',
  },
  {
    key: 'repos',
    label: 'Open-source wall',
    shortLabel: 'Repos',
    position: [-4.6, 1.9, 0],
    target: [-8.85, 1.9, 0],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'trajectory',
    label: 'Trajectory rail',
    shortLabel: 'Path',
    position: [4.6, 1.9, 0],
    target: [8.85, 1.9, 0],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'background',
    label: 'Background & certs',
    shortLabel: 'Bio',
    position: [4.6, 1.9, 4.6],
    target: [8.85, 1.9, 4.6],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'faq',
    label: 'FAQ',
    shortLabel: 'FAQ',
    position: [-4.6, 1.9, 4.6],
    target: [-8.85, 1.9, 4.6],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'contact',
    label: 'Contact console',
    shortLabel: 'Contact',
    position: [0, 1.8, 2.2],
    target: [0, 1.7, 5.4],
    smoothTime: 0.6,
    azimuth: [-0.35, 0.35],
    arrival: 'glow',
  },
];

/* ── Service room template: one detail wall + related-services wall ──── */

export const SERVICE_SHOTS: Shot[] = [
  {
    key: 'overview',
    label: 'Room overview',
    shortLabel: 'View',
    position: [0, 2.3, 4.2],
    target: [0, 1.9, -6],
    smoothTime: 0.9,
    azimuth: [-0.5, 0.5],
    arrival: 'none',
  },
  {
    key: 'detail',
    label: 'Service detail',
    shortLabel: 'Detail',
    position: [0, 1.9, -2.2],
    target: [0, 1.95, -6.9],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'evidence',
    label: 'Evidence & deliverables',
    shortLabel: 'Evidence',
    position: [-4.4, 1.9, -3.2],
    target: [-8.85, 1.9, -3.2],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'related',
    label: 'Related services',
    shortLabel: 'Related',
    position: [4.2, 1.9, -3.0],
    target: [8.85, 1.9, -3.2],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'contact',
    label: 'Contact console',
    shortLabel: 'Contact',
    position: [0, 1.8, 2.2],
    target: [0, 1.7, 5.4],
    smoothTime: 0.6,
    azimuth: [-0.35, 0.35],
    arrival: 'glow',
  },
];

/* ── About room: bio/trajectory/certs wall ───────────────────────────── */

export const ABOUT_SHOTS: Shot[] = [
  {
    key: 'overview',
    label: 'Room overview',
    shortLabel: 'View',
    position: [0, 2.3, 4.2],
    target: [0, 1.9, -6],
    smoothTime: 0.9,
    azimuth: [-0.5, 0.5],
    arrival: 'none',
  },
  {
    key: 'bio',
    label: 'Bio',
    shortLabel: 'Bio',
    position: [0, 1.9, -2.2],
    target: [0, 1.95, -6.9],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'trajectory',
    label: 'Trajectory & papers',
    shortLabel: 'Path',
    position: [-4.4, 1.9, -3.2],
    target: [-8.85, 1.9, -3.2],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'credentials',
    label: 'Certs, badges & skills',
    shortLabel: 'Certs',
    position: [4.2, 1.9, -3.0],
    target: [8.85, 1.9, -3.2],
    smoothTime: 0.7,
    azimuth: [-0.3, 0.3],
    arrival: 'glow',
  },
  {
    key: 'contact',
    label: 'Contact console',
    shortLabel: 'Contact',
    position: [0, 1.8, 2.2],
    target: [0, 1.7, 5.4],
    smoothTime: 0.6,
    azimuth: [-0.35, 0.35],
    arrival: 'glow',
  },
];

/** Shots for a room kind, by payload key ('home' | 'about' | service id). */
export function shotsForRoom(kind: RoomShotKind): Shot[] {
  switch (kind) {
    case 'home':
      return HOME_SHOTS;
    case 'service':
      return SERVICE_SHOTS;
    case 'about':
      return ABOUT_SHOTS;
  }
}

export type RoomShotKind = 'home' | 'service' | 'about';

/** Entry shot key of a room (boot/deep-link framing). */
export const ENTRY_SHOT = 'overview';
