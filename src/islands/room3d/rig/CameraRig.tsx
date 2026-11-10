/**
 * CameraRig.tsx — shot-based cinematic camera rig (feature 001-whole-site-3d,
 * T030/T031/T032; research R8).
 *
 * Mechanics adapted from the reference demo's rig pattern (SHOTS registry,
 * bounded orbit, tweened look-at); every value, framing and label here is
 * mairp-authored for the fabric room (rig/shots.ts).
 *
 * - drei CameraControls `makeDefault` gives the visitor bounded free orbit
 *   (drag + wheel/touch dolly only; pan disabled so the target stays inside
 *   the room's Box3 bounds, clamped per-frame in T030's `clampTarget`).
 * - Shot transitions damp position/target toward the shot's framing with
 *   `easing.damp3` (maath) and feed `controls.setLookAt` per frame; a run-ref
 *   token cancels stale transitions when the shot changes mid-flight (T031).
 * - Reduced motion: transitions become jump cuts (instant set) (T075).
 * - Portrait viewports widen the FOV so shot framing keeps key content
 *   visible (T032, FR-011).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { Box3, MathUtils, Matrix4, Quaternion, Raycaster, Sphere, Spherical, Vector2, Vector3, Vector4 } from 'three';
import { easing } from 'maath';

import { ROOM_BOUNDS, type Shot } from './shots';
import { isSceneReady, SCENE_READY_EVENT } from '../boot/boot';

/**
 * camera-controls is dynamically imported (US4 T085/T089) AND deferred past
 * scene-ready: its chunk is requested only after the boot overlay has been
 * hidden (scene-ready latch, boot.ts) plus an idle slot, so it adds nothing to
 * the initial deferred payload and no boot-window work. `Impl.install({ THREE })` is the camera-controls v3
 * tree-shaking contract (the same subset drei passes).
 */
type CCtor = typeof CameraControlsImpl;
let implPromise: Promise<CCtor> | null = null;
function loadCameraControls(): Promise<CCtor> {
  implPromise ??= import('camera-controls').then((m) => {
    const Impl = ((m as { default?: CCtor }).default ?? (m as unknown as CCtor)) as CCtor;
    Impl.install({
      THREE: {
        Box3,
        MathUtils: { clamp: MathUtils.clamp },
        Matrix4,
        Quaternion,
        Raycaster,
        Sphere,
        Spherical,
        Vector2,
        Vector3,
        Vector4,
      },
    });
    return Impl;
  });
  return implPromise;
}

/**
 * Minimal R3F binding for the dynamically imported camera-controls impl
 * (replaces drei's <CameraControls>, which would pull camera-controls into the
 * static mount chunk). Until the impl arrives the camera sits at its entry
 * shot with no free orbit; shots and screens work as soon as the scene renders.
 * Wake on user-drag events only — 'update' is deliberately NOT hooked because
 * it fires every frame and would defeat render-on-demand idling.
 */
function useLazyCameraControls(camera: import('three').PerspectiveCamera, domElement: HTMLElement | undefined, wake: () => void) {
  const [controls, setControls] = useState<CameraControlsImpl | null>(null);
  const [ctor, setCtor] = useState<CCtor | null>(null);
  useEffect(() => {
    let alive = true;
    let cancelArm = () => {};
    const load = () => {
      void loadCameraControls().then((Impl) => {
        if (!alive || !domElement) return;
        const c = new Impl(camera);
        c.connect(domElement);
        (['controlstart', 'control', 'controlend', 'transitionstart'] as const).forEach((e) =>
          c.addEventListener(e, wake),
        );
        setControls(c);
        // NB: a class constructor is typeof 'function', so React would treat it
        // as a state UPDATER and call it without `new` — wrap it in a thunk.
        setCtor(() => Impl);
        // Render-on-demand: draw a frame so the controls' entry-shot bounds
        // and any pending transition are applied immediately on arrival.
        wake();
      });
    };
    // US4 T089: the chunk is requested only after the scene is usable (boot
    // overlay hidden) AND the main thread is idle — never during boot.
    const arm = () => {
      if ('requestIdleCallback' in window) {
        const h = window.requestIdleCallback(load, { timeout: 4000 });
        cancelArm = () => window.cancelIdleCallback(h);
      } else {
        const t = (window as Window).setTimeout(load, 300);
        cancelArm = () => window.clearTimeout(t);
      }
    };
    if (isSceneReady()) arm();
    else window.addEventListener(SCENE_READY_EVENT, arm, { once: true });
    return () => {
      alive = false;
      cancelArm();
      setControls((current) => {
        if (current) {
          current.disconnect();
          current.dispose?.();
        }
        return null;
      });
    };
  }, [camera, domElement, wake]);
  return { controls, ctor };
}

export interface CameraRigProps {
  shots: Shot[];
  activeKey: string;
  reducedMotion: boolean;
}

/** Base (landscape) vertical FOV; widened on portrait viewports (T032). */
const BASE_FOV = 50;
const PORTRAIT_MAX_FOV = 80;

const tmpPos = new Vector3();
const tmpTarget = new Vector3();
const box = { min: new Vector3(...ROOM_BOUNDS.box.min), max: new Vector3(...ROOM_BOUNDS.box.max) };

export function CameraRig({ shots, activeKey, reducedMotion }: CameraRigProps) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const shot = useMemo(() => shots.find((s) => s.key === activeKey) ?? shots[0], [shots, activeKey]);
  const wake = useRef(() => invalidate()).current;

  // Dynamically imported camera-controls (US4): null until its chunk arrives.
  const { controls, ctor } = useLazyCameraControls(camera as import('three').PerspectiveCamera, gl.domElement, wake);

  // Run-ref token: any frame loop from a previous transition dies when a new
  // shot starts (T031 cancellation of stale transitions).
  const runRef = useRef(0);
  const flight = useRef({ pos: new Vector3(), target: new Vector3(), active: false });
  /** Whether the camera-controls instance has attached at least once (US4). */
  const attached = useRef(false);

  // Portrait FOV fitting (T032): widen vertical FOV as the aspect narrows so
  // screens keep their framing; restore the base FOV on wide viewports.
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const anyCam = camera as unknown as { fov: number; updateProjectionMatrix(): void };
    anyCam.fov = aspect >= 1 ? BASE_FOV : Math.min(PORTRAIT_MAX_FOV, BASE_FOV / Math.max(0.55, aspect) ** 0.75);
    anyCam.updateProjectionMatrix();
    document.body.dataset.cameraFov = anyCam.fov.toFixed(1); // observable for tests
  }, [camera, size]);

  useEffect(() => {
    const c = controls;
    if (!c || !ctor) {
      // camera-controls chunk not arrived yet (deferred past scene-ready,
      // US4 T089): place the camera directly on the shot so the framing is
      // correct from the first rendered frames and the camera is already
      // AT the shot when free orbit arrives (no re-frame drift). Shot
      // changes are jump cuts until the rig chunk is in.
      if (shot) {
        camera.position.set(...shot.position);
        camera.lookAt(tmpTarget.set(...shot.target));
        document.body.dataset.cameraPos = `${shot.position[0].toFixed(2)},${shot.position[1].toFixed(2)},${shot.position[2].toFixed(2)}`;
        invalidate();
      }
      return;
    }
    if (!shot) return;
    const token = ++runRef.current;
    // True only on the run where the deferred camera-controls chunk has just
    // attached (US4): the camera is adopted as-is, no transition.
    const firstAttach = !attached.current;
    attached.current = true;
    // camera-controls v3: pan is disabled by mapping every pointer input to
    // rotate/dolly only, so the orbit target stays inside the room bounds
    // (T030); damped dragging via smoothTime (replaces enableDamping).
    const ACTION = ctor.ACTION;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.ROTATE;
    c.mouseButtons.wheel = ACTION.DOLLY;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY_ROTATE;
    c.smoothTime = 0.12;
    c.draggingSmoothTime = 0.12;
    // Per-shot orbit bounds (T030) are applied once the camera has arrived
    // (boundToShot): unbounded while flying so setLookAt is never clamped.
    c.minAzimuthAngle = -Infinity;
    c.maxAzimuthAngle = Infinity;
    c.minDistance = 1.1;
    c.maxDistance = 15;

    if (reducedMotion || firstAttach) {
      // Reduced motion: jump cut (US3 T075). First attach: the camera is
      // already framed at the shot by the direct placement above, so adopt it
      // without a transition — free orbit arriving must not re-frame.
      flight.current.active = false;
      flight.current.pos.set(...shot.position);
      flight.current.target.set(...shot.target);
      c.setLookAt(...shot.position, ...shot.target, false);
      clampTarget(c);
      boundToShot(c, shot);
      // Render-on-demand: setLookAt(false) only writes CC's internal state
      // and CC's first update() applies its connect-time orientation, so keep
      // the wake window open until the camera has settled at the shot and the
      // screens/hotspot projections have been recomputed (US4 defer).
      invalidate();
      window.dispatchEvent(new Event('room3d-wake'));
      setTimeout(() => window.dispatchEvent(new Event('room3d-wake')), 300);
      return;
    }

    flight.current.pos.copy(c.camera.position);
    if (typeof c.getTarget === 'function') c.getTarget(flight.current.target);
    flight.current.active = true;
    void token;
  }, [shot, reducedMotion, controls, ctor]);

  // Per-frame damped transition: damp current pos/target toward the shot and
  // feed CameraControls; stops when converged (or cancelled by a newer run).
  // camera-controls' own `update(delta)` runs first (priority -1, as drei's
  // binding does) so drags integrate before the transition logic reads state.
  useFrame((_, delta) => {
    if (controls) controls.update(delta);
    // Observable camera position for tests (T075 jump-cut measurement); only
    // touches the DOM when the rounded value changes.
    const p = camera.position;
    const pos = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
    if (document.body.dataset.cameraPos !== pos) document.body.dataset.cameraPos = pos;
    const c = controls;
    if (!c || !shot || !flight.current.active) {
      if (c) clampTarget(c);
      return;
    }
    const smooth = Math.max(0.05, shot.smoothTime);
    easing.damp3(flight.current.pos, shot.position, smooth, delta);
    easing.damp3(flight.current.target, shot.target, smooth, delta);
    c.setLookAt(
      flight.current.pos.x,
      flight.current.pos.y,
      flight.current.pos.z,
      flight.current.target.x,
      flight.current.target.y,
      flight.current.target.z,
      false,
    );
    const settled =
      flight.current.pos.distanceTo(tmpPos.set(...shot.position)) < 0.01 &&
      flight.current.target.distanceTo(tmpTarget.set(...shot.target)) < 0.01;
    if (settled) {
      flight.current.active = false;
      clampTarget(c);
      boundToShot(c, shot);
    }
  });

  return null;
}

/**
 * Orbit bounds for the shot the camera has arrived at. `shot.azimuth` is an
 * offset around the shot's OWN viewing direction: camera-controls' azimuth is
 * absolute (0 = looking down -Z), so absolute bounds only fitted back-wall
 * shots, and the first drag on a side-wall or contact shot swung the camera
 * across the room (contact: out through the front wall). Dolly-out is capped
 * so the camera stays inside the room shell.
 */
function boundToShot(c: CameraControlsImpl, shot: Shot) {
  const theta = c.azimuthAngle;
  c.minAzimuthAngle = theta + shot.azimuth[0];
  c.maxAzimuthAngle = theta + shot.azimuth[1];
  const t = c.getTarget(new Vector3());
  const dir = c.camera.position.clone().sub(t);
  const dist = dir.length();
  dir.normalize();
  let room = Infinity; // distance from the target to the inner shell along dir
  const lim = [ROOM_INNER.x, 0, ROOM_INNER.z];
  for (const axis of [0, 2] as const) {
    const d = dir.getComponent(axis);
    if (Math.abs(d) < 1e-6) continue;
    const edge = (Math.sign(d) * lim[axis] - t.getComponent(axis)) / d;
    room = Math.min(room, edge);
  }
  c.maxDistance = Math.max(dist, Math.min(15, room));
}

/** Inner half-extents the camera may reach (room shell 18 × 14 minus a margin). */
const ROOM_INNER = { x: 8.5, z: 6.6 };

/** Keeps the orbit target inside the room Box3 (T030 pan bounds). */
function clampTarget(c: CameraControlsImpl) {
  const t = c.getTarget(new Vector3());
  const x = t.x, y = t.y, z = t.z;
  t.min(box.max).max(box.min);
  // Only write when actually out of bounds: an unconditional setTarget fires
  // camera-controls 'update' every frame, which defeats render-on-demand idling.
  if (t.x !== x || t.y !== y || t.z !== z) c.setTarget(t.x, t.y, t.z, false);
}
