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
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import { Vector3 } from 'three';
import { easing } from 'maath';
import { ROOM_BOUNDS, type Shot } from './shots';

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
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const shot = useMemo(() => shots.find((s) => s.key === activeKey) ?? shots[0], [shots, activeKey]);

  // Run-ref token: any frame loop from a previous transition dies when a new
  // shot starts (T031 cancellation of stale transitions).
  const runRef = useRef(0);
  const flight = useRef({ pos: new Vector3(), target: new Vector3(), active: false });

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
    const c = controls.current;
    if (!c || !shot) return;
    const token = ++runRef.current;
    // camera-controls v3: pan is disabled by mapping every pointer input to
    // rotate/dolly only, so the orbit target stays inside the room bounds
    // (T030); damped dragging via smoothTime (replaces enableDamping).
    const ACTION = CameraControlsImpl.ACTION;
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

    if (reducedMotion) {
      // Jump cut: instant position/target set (US3 T075 behaviour).
      flight.current.active = false;
      c.setLookAt(...shot.position, ...shot.target, false);
      clampTarget(c);
      boundToShot(c, shot);
      return;
    }

    flight.current.pos.copy(c.camera.position);
    if (typeof c.getTarget === 'function') c.getTarget(flight.current.target);
    flight.current.active = true;
    void token;
  }, [shot, reducedMotion]);

  // Per-frame damped transition: damp current pos/target toward the shot and
  // feed CameraControls; stops when converged (or cancelled by a newer run).
  useFrame((_, delta) => {
    // Observable camera position for tests (T075 jump-cut measurement); only
    // touches the DOM when the rounded value changes.
    const p = camera.position;
    const pos = `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
    if (document.body.dataset.cameraPos !== pos) document.body.dataset.cameraPos = pos;
    const c = controls.current;
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

  return <CameraControls ref={controls} makeDefault />;
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
  t.min(box.max).max(box.min);
  c.setTarget(t.x, t.y, t.z, false);
}
