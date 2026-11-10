/**
 * Room3D.tsx — root of the lazy-loaded 3D island (feature 001-whole-site-3d).
 *
 * Phase 3 (T066/T067): the island fetches its per-route Room Payload document
 * at boot (`/rooms/<key>.json`, FR-016 — same-origin, never inlined into
 * first-paint HTML), feeds boot progress (useProgress → `__roomBoot`), and
 * hides the overlay only after the SceneReady 4-frame gate. Fetch failure at
 * any phase lands the visitor on the flat page (US3 fallback path).
 *
 * Gating rules (contracts/island-events.md, FR-009, Phase 2 foundation):
 * - no webgl2 → render nothing, remove #boot, flat page shows;
 * - stored preference `room3d: 'flat'` → same as above;
 * - mount is deferred to requestIdleCallback (after the page is interactive);
 * - `webglcontextlost` → unmount the canvas layer, flat page is revealed
 *   (flat DOM stays in the accessibility tree; the canvas is an overlay);
 * - hardwareConcurrency ≤ 4 → lite mode (dpr 1, no N8AO);
 * - prefers-reduced-motion → jump-cut camera moves, no composer.
 */
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { DefaultLoadingManager } from 'three';
import { AgXToneMapping, Color, PCFShadowMap } from 'three';
import { installRoomBoot } from './boot/boot';
import { ThemeBridge } from './fx/ThemeBridge';
import { useThemeTokens } from './fx/useThemeTokens';
import { useRoomRoute } from './routing/useRoomRoute';
import { routeKeyForPath, type RoomPayload } from '../../lib/room-payload';
import { Room3DContext, useRoom3D, type NavTargetRef, type Room3DContextValue } from './context';
import { CameraRig } from './rig/CameraRig';
import { shotsForRoom } from './rig/shots';
import { entryShotFor } from './rooms/roomEntry';
import { HomeRoom } from './rooms/HomeRoom';
import { ServiceRoom } from './rooms/ServiceRoom';
import { AboutRoom } from './rooms/AboutRoom';
import { Css3dScreens, Css3dDriver } from './screens/Css3dScreens';
import { KeyboardNav } from './screens/focus';
import { shotForScreen, placementsForRoom, type ContentKey } from './rooms/screenPlacements';
import { ShotControls } from './rooms/hotspots';
import { FLAT_EVENT, isFlatPreferred, setFlatPreferred } from './flatPreference';
import { audioCues } from './audio/cues';
import { hasWebGL2 } from './capability';
import './screens/screens.css';

/** Frames that must have rendered before the scene counts as usable (T010). */
const GATE_FRAMES = 4;
/** Minimum boot progress shown before any real progress arrives (T010). */
const MIN_PROGRESS = 0.04;

/**
 * Error boundary around the Canvas (T074): if WebGL context creation or the
 * scene throws, drop the 3D layer, remove #boot and leave the flat page.
 */
class CanvasBoundary extends Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error('[room3d] canvas error', err);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function removeBoot() {
  if (typeof document === 'undefined') return;
  document.getElementById('boot')?.remove();
}

/**
 * Reports asset progress to the pre-JS boot overlay. Reads three's
 * DefaultLoadingManager directly (US4 T089 payload trim): this is the same
 * source drei's `useProgress` tracks, without pulling drei/zustand into the
 * initial chunk.
 */
function BootProgressReporter() {
  const [progress, setProgress] = useState(MIN_PROGRESS);
  useEffect(() => {
    const boot = installRoomBoot();
    const onProgress = () => {
      const { itemsLoaded, itemsTotal } = DefaultLoadingManager as unknown as { itemsLoaded: number; itemsTotal: number };
      if (itemsTotal > 0) setProgress(itemsLoaded / itemsTotal);
    };
    DefaultLoadingManager.onStart = onProgress;
    DefaultLoadingManager.onProgress = onProgress;
    DefaultLoadingManager.onLoad = onProgress;
    DefaultLoadingManager.onError = (url) => console.error('[room3d] load error', url);
    return () => {
      DefaultLoadingManager.onStart = DefaultLoadingManager.onProgress = DefaultLoadingManager.onLoad = DefaultLoadingManager.onError = () => {};
    };
  }, []);
  useEffect(() => {
    installRoomBoot().setProgress(progress);
  }, [progress]);
  return null;
}

/** Counts rendered frames via useFrame and hides the boot overlay (SceneReady). */
function SceneReadyGate() {
  const frames = useRef(0);
  const { hide } = installRoomBoot();
  useFrame(() => {
    frames.current += 1;
    // T010: the scene is usable only after 4 real rendered frames.
    if (frames.current === GATE_FRAMES) hide();
  });
  return null;
}

/**
 * Postprocessing (N8AO + composer, ~175 KB raw) is its own chunk, requested only
 * after the scene has rendered usable frames and the main thread has gone quiet
 * (US4: keeps the initial deferred payload and mount-time TBT down).
 */
const LazyEffects = lazy(() => import('./fx/Effects').then((m) => ({ default: m.Effects })));
function WakeOnMount() {
  useEffect(() => () => void window.dispatchEvent(new Event(WAKE_EVENT)), []);
  return null;
}
const FX_FALLBACK_MS = 12000;
function DeferredEffects({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const [on, setOn] = useState(false);
  // Load postprocessing on first real interaction, or after a long quiet fallback
  // delay — never inside the load/TTI window (US4 TBT), never for reduced motion.
  useEffect(() => {
    if (reducedMotion || on) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      cleanup();
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => setOn(true), { timeout: 3000 });
      else setTimeout(() => setOn(true), 200);
    };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    const timer = window.setTimeout(go, FX_FALLBACK_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      evs.forEach((e) => window.removeEventListener(e, go));
    };
    evs.forEach((e) => window.addEventListener(e, go, { passive: true, once: true }));
    return cleanup;
  }, [on, reducedMotion]);
  useEffect(() => {
    if (on) window.dispatchEvent(new Event(WAKE_EVENT));
  }, [on]);
  if (!on) return null;
  return (
    <Suspense fallback={<WakeOnMount />}>
      <LazyEffects lite={lite} reducedMotion={reducedMotion} />
    </Suspense>
  );
}

/**
 * Render-on-activity (US4): the Canvas runs frameloop="demand"; this driver keeps
 * invalidating only while the scene is "awake" (boot, pointer/key/touch/wheel/resize,
 * shot/route/theme/screen changes, FX arrival) and goes fully quiet ~1.5 s after the
 * last activity. An idle room therefore costs zero main-thread/GPU work (battery,
 * TBT/TTI), and a software or weak GPU is no longer saturated by a static scene.
 */
const WAKE_MS = 800;
const BOOT_WAKE_MS = 1200;
export const WAKE_EVENT = 'room3d-wake';
function WakeDriver({ deps }: { deps: unknown[] }) {
  const invalidate = useThree((s) => s.invalidate);
  const getState = useThree((s) => s.get);
  // R3F's invalidate() ACCUMULATES queued frames (up to 60); only request one when none is pending.
  const poke = () => {
    if (getState().internal.frames < 2) invalidate();
  };
  const until = useRef(performance.now() + BOOT_WAKE_MS);
  useEffect(() => {
    const wake = (ms = WAKE_MS) => {
      until.current = Math.max(until.current, performance.now() + ms);
      poke();
    };
    const on = () => wake();
    const evs = ['pointermove', 'pointerdown', 'pointerup', 'wheel', 'keydown', 'touchstart', 'touchmove', 'resize', WAKE_EVENT];
    evs.forEach((e) => window.addEventListener(e, on, { passive: true }));
    wake(BOOT_WAKE_MS);
    return () => evs.forEach((e) => window.removeEventListener(e, on));
  }, [invalidate]);
  useEffect(() => {
    until.current = Math.max(until.current, performance.now() + WAKE_MS * 2);
    poke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useFrame(() => {
    if (performance.now() < until.current) {
      poke();
    } else {
      // Asleep: drop any frames R3F queued up from earlier invalidations (it queues up to 60).
      getState().internal.frames = 0;
    }
  });
  return null;
}

/** Scene background colour tracks the theme tokens (FR-008). */
function SceneBackground() {
  const { theme } = useRoom3D();
  const tokens = useThemeTokens(theme);
  const bg = useMemo(() => new Color(tokens.bg), [tokens.bg]);
  return <color attach="background" args={[bg]} />;
}

/* ── Micro-UI labels for keyboard nav targets (contract rule 6) ───────── */
/* US5 T091: these labels are fresh micro-UI, written for the mairp
   consulting practice; island content strings come from payload only. */

const SCREEN_LABELS: Partial<Record<ContentKey, string>> = {
  hero: 'Practice overview',
  servicesGrid: 'Services grid',
  serviceDetail: 'Service detail',
  serviceEvidence: 'Deliverables and evidence',
  related: 'Related services',
  proof: 'Proof wall',
  method: 'Method',
  work: 'Engagement shapes',
  repos: 'Open-source repos',
  trajectory: 'Trajectory',
  background: 'Background and certifications',
  faq: 'FAQ',
  contact: 'Contact console',
  aboutBio: 'Bio',
  aboutJourney: 'Trajectory and publications',
  aboutCredentials: 'Certifications and skills',
};

/* ── Audio cues toggle (FR-012, T092): default-muted, tap-unlock ──────── */

function AudioToggle() {
  const [on, setOn] = useState(() => audioCues.enabled);
  return (
    <button
      type="button"
      className="room3d-flat-btn"
      aria-pressed={on}
      onClick={() => setOn(audioCues.toggle())}
    >
      {on ? 'Sound: on' : 'Sound: off'}
    </button>
  );
}

/* ── Session: router + room-payload swap + provider + world ───────────── */

interface SessionProps {
  payload: RoomPayload;
  lite: boolean;
  reducedMotion: boolean;
  theme: ThemeBridge;
  onFail: () => void;
}

function RoomSession({ payload, lite, reducedMotion, theme, onFail }: SessionProps) {
  const router = useRoomRoute(payload);
  const [roomPayload, setRoomPayload] = useState<RoomPayload>(payload);
  const [roomFetchState, setRoomFetchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('ready');
  const [activeShot, setShotState] = useState(entryShotFor(payload.room));
  const [openScreenId, setOpenScreen] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const setShot = useCallback((key: string) => setShotState(key), []);
  const openScreen = useCallback((id: string | null) => setOpenScreen(id), []);

  // Audio cues (FR-012, T092): default-muted; a short cue on room arrival and
  // on screen open, only while the visitor has opted in via the Sound control.
  const firstRoute = useRef(true);
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    audioCues.play('nav');
  }, [router.route]);
  const firstScreen = useRef(true);
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    if (openScreenId) audioCues.play('open');
  }, [openScreenId]);

  // Persistent session: on route change, fetch the destination payload doc
  // (FR-016) and swap room content; the 3D world never re-boots (FR-006).
  useEffect(() => {
    if (router.route === roomPayload.route) return;
    const key = routeKeyForPath(router.route);
    if (!key) return;
    let alive = true;
    setRoomFetchState('loading');
    fetch(`/rooms/${key}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`payload ${res.status}`);
        return res.json() as Promise<RoomPayload>;
      })
      .then((next) => {
        if (!alive) return;
        setRoomPayload(next);
        setRoomFetchState('ready');
        setShotState(entryShotFor(next.room));
        setOpenScreen(null);
      })
      .catch(() => {
        if (alive) setRoomFetchState('error');
      });
    return () => {
      alive = false;
    };
  }, [router.route, roomPayload.route]);

  // Pause rendering when the tab is hidden (T014, Phase 2).
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Navigable targets for keyboard cycling (screens + mapped routes).
  const navTargets = useMemo<NavTargetRef[]>(
    () => [
      ...placementsForRoom(roomPayload.room)
        .filter((p) => p.interactive)
        .map((p) => ({
          id: p.id,
          kind: 'screen' as const,
          label: SCREEN_LABELS[p.contentKey] ?? p.id,
          activate: () => {
            setShot(shotForScreen(p.contentKey));
            openScreen(p.id);
          },
        })),
      ...roomPayload.navigation
        .filter((n) => n.route !== roomPayload.route)
        .map((n) => ({
          id: `nav:${n.route}`,
          kind: 'hotspot' as const,
          label: n.label,
          activate: () => router.navigate(n.route),
        })),
    ],
    [roomPayload, router, setShot, openScreen],
  );

  const ctx = useMemo<Room3DContextValue>(
    () => ({
      payload,
      roomPayload,
      route: router.route,
      navigate: router.navigate,
      lite,
      reducedMotion,
      theme,
      activeShot,
      setShot,
      openScreenId,
      openScreen,
      focusedId,
      setFocusedId,
      navTargets,
      registerNavTargets: () => {},
      roomFetchState,
    }),
    [
      payload,
      roomPayload,
      router,
      lite,
      reducedMotion,
      theme,
      activeShot,
      setShot,
      openScreenId,
      openScreen,
      focusedId,
      navTargets,
      roomFetchState,
    ],
  );

  const room = roomPayload.room;

  return (
    <Room3DContext.Provider value={ctx}>
      {/* Canvas container is aria-hidden; screen DOM (CSS3D layer) and the
          shot-controls UI live outside it and stay screen-reader reachable. */}
      <div className="room3d-layer" data-room={router.route} data-lite={lite ? 'true' : undefined}>
        <div aria-hidden="true" className="room3d-canvas">
          <CanvasBoundary onError={onFail}>
          <Canvas
            shadows={{ type: PCFShadowMap }}
            dpr={lite ? [1, 1] : [1, 1.5]}
            frameloop={hidden ? 'never' : 'demand'}
            gl={{ toneMapping: AgXToneMapping }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                'webglcontextlost',
                (event) => {
                  event.preventDefault();
                  removeBoot();
                  // US3 path: reveal the flat page instead of a frozen canvas.
                  document.getElementById('room-island-root')?.classList.add('room3d-ctxlost');
                  setCtxLostGlobal(true);
                },
                { once: true },
              );
            }}
          >
            <Suspense fallback={null}>
              <BootProgressReporter />
              <SceneReadyGate />
              <WakeDriver deps={[activeShot, router.route, theme, openScreenId, focusedId, lite, reducedMotion, roomPayload]} />
              <SceneBackground />
              <CameraRig shots={shotsForRoom(room)} activeKey={activeShot} reducedMotion={reducedMotion} />
              {room === 'home' ? <HomeRoom /> : room === 'about' ? <AboutRoom /> : <ServiceRoom />}
              <Css3dDriver />
              <DeferredEffects lite={lite} reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
          </CanvasBoundary>
        </div>
        <Css3dScreens />
        <div className="room3d-ui">
          <ShotControls />
          <KeyboardNav />
          <AudioToggle />
          <button type="button" className="room3d-flat-btn" onClick={() => setFlatPreferred()}>
            Use flat site
          </button>
        </div>
      </div>
    </Room3DContext.Provider>
  );
}

/** Context-loss signal shared with the mount gate (module-level store). */
let setCtxLostExternal: ((lost: boolean) => void) | null = null;
function setCtxLostGlobal(lost: boolean) {
  setCtxLostExternal?.(lost);
}

/* ── Mount gating + boot payload fetch ────────────────────────────────── */

export function RoomIsland() {
  const [active, setActive] = useState(false);
  const [lite, setLite] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [payload, setPayload] = useState<RoomPayload | null>(null);
  const [bootFailed, setBootFailed] = useState(false);
  const [ctxLost, setCtxLost] = useState(false);
  const [declined, setDeclined] = useState(false);
  // Document-lifetime singleton; the island is its only owner (no dispose:
  // StrictMode double-mount would leave a disposed observer disconnected).
  const [theme] = useState(() => new ThemeBridge());
  const cancelIdle = useRef<(() => void) | null>(null);

  useEffect(() => {
    setCtxLostExternal = setCtxLost;
    return () => {
      setCtxLostExternal = null;
    };
  }, []);

  // "Use flat site" (boot overlay or in-session control): stand down at once.
  useEffect(() => {
    const onFlat = () => {
      setDeclined(true);
      removeBoot();
    };
    window.addEventListener(FLAT_EVENT, onFlat);
    return () => window.removeEventListener(FLAT_EVENT, onFlat);
  }, []);

  // Detection + gating: runs once on mount (client-side island).
  useEffect(() => {
    if (isFlatPreferred() || !hasWebGL2()) {
      removeBoot();
      return;
    }
    setLite(typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onMotion = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onMotion);
    // Second detection immediately before the Canvas is created (T074).
    const schedule = () => {
      if (isFlatPreferred() || !hasWebGL2()) {
        removeBoot();
        return;
      }
      setActive(true);
    };
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(schedule, { timeout: 2000 });
      cancelIdle.current = () => window.cancelIdleCallback(handle);
    } else {
      const t = setTimeout(schedule, 200);
      cancelIdle.current = () => clearTimeout(t);
    }
    return () => {
      cancelIdle.current?.();
      mq.removeEventListener?.('change', onMotion);
    };
  }, []);

  // T066: fetch this route's Room Payload document at boot. Failure → boot
  // failed state → flat page (never a broken 3D state).
  useEffect(() => {
    if (!active || payload || bootFailed) return;
    const key = routeKeyForPath(new URL(window.location.href).pathname);
    if (!key) {
      removeBoot();
      return;
    }
    let alive = true;
    const boot = installRoomBoot();
    boot.setProgress(0.12);
    fetch(`/rooms/${key}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`payload ${res.status}`);
        boot.setProgress(0.4);
        return res.json() as Promise<RoomPayload>;
      })
      .then((next) => {
        if (alive) setPayload(next);
      })
      .catch(() => {
        if (!alive) return;
        setBootFailed(true);
        boot.fail();
      });
    return () => {
      alive = false;
    };
  }, [active, payload, bootFailed]);

  if (!active || !payload || bootFailed || ctxLost || declined) return null;

  return (
    <RoomSession
      payload={payload}
      lite={lite}
      reducedMotion={reducedMotion}
      theme={theme}
      onFail={() => {
        installRoomBoot().fail();
        setBootFailed(true);
      }}
    />
  );
}

export default RoomIsland;
