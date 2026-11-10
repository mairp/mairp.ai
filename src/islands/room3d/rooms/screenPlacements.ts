/**
 * screenPlacements.ts — screen-placement registry (feature 001-whole-site-3d,
 * T036; data-model.md "ScreenPlacement").
 *
 * Per room, a screen id maps to a world transform + size + the content key the
 * room renders on it. The CSS3D layer (screens/Css3dScreens.tsx) aligns a DOM
 * portal to each placement; the WebGL layer (rooms/environment.tsx) draws a
 * rounded-corner dark-glass mesh underneath it. All coordinates are room-local
 * and mairp-authored (no reference-demo geometry).
 */

export type ContentKey =
  | 'hero'
  | 'servicesGrid'
  | 'serviceDetail'
  | 'serviceEvidence'
  | 'related'
  | 'proof'
  | 'method'
  | 'work'
  | 'repos'
  | 'trajectory'
  | 'background'
  | 'faq'
  | 'contact'
  | 'aboutBio'
  | 'aboutJourney'
  | 'aboutCredentials';

export interface ScreenPlacement {
  id: string;
  /** Which room shows this screen ('service' = the shared service template). */
  room: 'home' | 'service' | 'about';
  /** World position of the screen centre (room-local). */
  position: [number, number, number];
  /** Y rotation in radians (screen faces -Z when 0). */
  rotationY: number;
  /** World size (metres). DOM portals are laid out at 640 px per `width`. */
  width: number;
  height: number;
  contentKey: ContentKey;
  /** Interactive screens accept pointer events (links/buttons); others none. */
  interactive: boolean;
  /** Screen content scrolls (long lists: repos, faq, about). */
  scroll?: boolean;
  /** Deferred (FR-003): mounted progressively after the priority screens, post boot-hide. */
  lazy?: boolean;
}

/* Home room: back wall (z = -6.9), left wall (x = -8.9, faces +X → rotY π/2),
   right wall (x = +8.9, faces -X → rotY -π/2), contact console at z = 5.4. */
export const HOME_PLACEMENTS: ScreenPlacement[] = [
  { id: 'home-hero', room: 'home', position: [0, 1.9, -6.9], rotationY: 0, width: 5.2, height: 3.0, contentKey: 'hero', interactive: false },
  { id: 'home-method', room: 'home', position: [-4.6, 1.9, -6.88], rotationY: 0, width: 3.4, height: 2.3, contentKey: 'method', interactive: false },
  { id: 'home-work', room: 'home', position: [4.6, 1.9, -6.88], rotationY: 0, width: 3.4, height: 2.3, contentKey: 'work', interactive: false },
  { id: 'home-proof', room: 'home', position: [-8.9, 1.9, -4.2], rotationY: Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'proof', interactive: true, lazy: true },
  { id: 'home-services', room: 'home', position: [8.9, 1.9, -4.2], rotationY: -Math.PI / 2, width: 4.0, height: 2.6, contentKey: 'servicesGrid', interactive: true, scroll: true, lazy: true },
  { id: 'home-repos', room: 'home', position: [-8.9, 1.9, 0], rotationY: Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'repos', interactive: true, scroll: true, lazy: true },
  { id: 'home-trajectory', room: 'home', position: [8.9, 1.9, 0], rotationY: -Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'trajectory', interactive: true, scroll: true, lazy: true },
  { id: 'home-faq', room: 'home', position: [-8.9, 1.9, 4.2], rotationY: Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'faq', interactive: true, scroll: true, lazy: true },
  { id: 'home-background', room: 'home', position: [8.9, 1.9, 4.2], rotationY: -Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'background', interactive: true, scroll: true, lazy: true },
  { id: 'home-contact', room: 'home', position: [0, 1.7, 5.4], rotationY: Math.PI, width: 3.2, height: 2.1, contentKey: 'contact', interactive: true, lazy: true },
];

/* Service room template: detail wall, evidence/deliverables wall, related. */
export const SERVICE_PLACEMENTS: ScreenPlacement[] = [
  { id: 'svc-detail', room: 'service', position: [0, 1.95, -6.9], rotationY: 0, width: 5.6, height: 3.2, contentKey: 'serviceDetail', interactive: true, scroll: true },
  { id: 'svc-evidence', room: 'service', position: [-8.9, 1.9, -3.2], rotationY: Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'serviceEvidence', interactive: true, scroll: true, lazy: true },
  { id: 'svc-related', room: 'service', position: [8.9, 1.9, -3.2], rotationY: -Math.PI / 2, width: 4.0, height: 2.6, contentKey: 'related', interactive: true, scroll: true, lazy: true },
  { id: 'svc-contact', room: 'service', position: [0, 1.7, 5.4], rotationY: Math.PI, width: 3.2, height: 2.1, contentKey: 'contact', interactive: true, lazy: true },
];

/* About room: bio wall, journey wall, credentials wall, contact console. */
export const ABOUT_PLACEMENTS: ScreenPlacement[] = [
  { id: 'about-bio', room: 'about', position: [0, 1.95, -6.9], rotationY: 0, width: 5.2, height: 3.0, contentKey: 'aboutBio', interactive: false },
  { id: 'about-journey', room: 'about', position: [-8.9, 1.9, -3.2], rotationY: Math.PI / 2, width: 3.6, height: 2.5, contentKey: 'aboutJourney', interactive: true, scroll: true, lazy: true },
  { id: 'about-credentials', room: 'about', position: [8.9, 1.9, -3.2], rotationY: -Math.PI / 2, width: 4.0, height: 2.6, contentKey: 'aboutCredentials', interactive: true, scroll: true, lazy: true },
  { id: 'about-contact', room: 'about', position: [0, 1.7, 5.4], rotationY: Math.PI, width: 3.2, height: 2.1, contentKey: 'contact', interactive: true, lazy: true },
];

export function placementsForRoom(room: ScreenPlacement['room']): ScreenPlacement[] {
  switch (room) {
    case 'home':
      return HOME_PLACEMENTS;
    case 'service':
      return SERVICE_PLACEMENTS;
    case 'about':
      return ABOUT_PLACEMENTS;
  }
}

/** Shot key that frames a screen (used by keyboard nav "open": Enter zooms). */
export function shotForScreen(contentKey: ContentKey): string {
  const map: Partial<Record<ContentKey, string>> = {
    hero: 'hero',
    servicesGrid: 'services',
    proof: 'proof',
    method: 'method',
    work: 'work',
    repos: 'repos',
    trajectory: 'trajectory',
    background: 'background',
    faq: 'faq',
    contact: 'contact',
    serviceDetail: 'detail',
    serviceEvidence: 'evidence',
    related: 'related',
    aboutBio: 'bio',
    aboutJourney: 'trajectory',
    aboutCredentials: 'credentials',
  };
  return map[contentKey] ?? 'overview';
}
