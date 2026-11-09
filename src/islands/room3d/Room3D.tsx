/**
 * Room3D — root of the lazy-loaded 3D island (feature 001-whole-site-3d).
 *
 * Phase 2 foundation (T011 + T014): WebGL/environment detection and mount
 * gating, plus the Canvas root per research R9. Rooms, screens and the camera
 * rig land with the user stories; this module owns the boundary so three.js
 * never enters a non-island import graph (FR-002).
 *
 * Gating rules (contracts/island-events.md, FR-009):
 * - no webgl2 → render nothing, remove #boot, flat page shows;
 * - stored preference `room3d: 'flat'` → same as above;
 * - mount is deferred to requestIdleCallback (after the page is interactive);
 * - `webglcontextlost` → unmount the canvas layer, flat page is revealed
 *   (flat DOM stays in the accessibility tree; the canvas is an overlay);
 * - hardwareConcurrency ≤ 4 → lite mode (dpr forced to 1; fewer effects later).
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { AgXToneMapping, PCFShadowMap } from 'three';
import { installRoomBoot } from './boot/boot';
import { ThemeBridge } from './fx/ThemeBridge';
import { useRoomRoute } from './routing/useRoomRoute';
import type { RoomPayload } from '../../lib/room-payload';

export interface RoomIslandProps {
  /** Per-page serialized room payload (contracts/room-payload.schema.md). */
  payload?: RoomPayload;
}

/** Stored 3D preference (FR-009): 'flat' permanently declines the experience. */
const PREF_KEY = 'room3d';
/** Frames that must have rendered before the scene counts as usable (T010). */
const GATE_FRAMES = 4;
/** Minimum boot progress shown before any real progress arrives (T010). */
const MIN_PROGRESS = 0.04;

function readPref(): 'flat' | 'on' {
  try {
    return localStorage.getItem(PREF_KEY) === 'flat' ? 'flat' : 'on';
  } catch {
    return 'on';
  }
}

function hasWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function removeBoot() {
  if (typeof document === 'undefined') return;
  document.getElementById('boot')?.remove();
}

/** Reports asset progress to the pre-JS boot overlay (drei useProgress). */
function BootProgressReporter() {
  const { loaded, total } = useProgress();
  useEffect(() => {
    const boot = installRoomBoot();
    boot.setProgress(total > 0 ? loaded / total : MIN_PROGRESS);
  }, [loaded, total]);
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

/** Wires the ThemeBridge into the scene (T012); rooms consume it via props later. */
function SceneSetup() {
  useEffect(() => {
    const bridge = new ThemeBridge();
    return () => bridge.dispose();
  }, []);
  return null;
}

export function RoomIsland({ payload }: RoomIslandProps) {
  const [active, setActive] = useState(false);
  const [lite, setLite] = useState(false);
  const [ctxLost, setCtxLost] = useState(false);
  const [hidden, setHidden] = useState(false);
  const cancelIdle = useRef<(() => void) | null>(null);
  // Persistent session router (T013); room rendering consumes it in later phases.
  const router = useRoomRoute(payload);
  void router;

  // Detection + gating: runs once on hydration (client-side only via client:only).
  useEffect(() => {
    if (!payload || readPref() === 'flat' || !hasWebGL2()) {
      // The island will not run — drop the boot overlay, flat page shows.
      removeBoot();
      return;
    }
    setLite(typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4);
    const schedule = () => setActive(true);
    let handle: number;
    if ('requestIdleCallback' in window) {
      handle = window.requestIdleCallback(schedule, { timeout: 2000 });
      cancelIdle.current = () => window.cancelIdleCallback(handle);
    } else {
      const t = setTimeout(schedule, 200);
      cancelIdle.current = () => clearTimeout(t);
    }
    return () => cancelIdle.current?.();
  }, [payload]);

  // Pause rendering when the tab is hidden (T014).
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // webglcontextlost → reveal the flat page (US3 foundation).
  useEffect(() => {
    if (ctxLost) removeBoot();
  }, [ctxLost]);

  if (!payload || !active || ctxLost) return null;

  const dpr: [number, number] = lite ? [1, 1] : [1, 1.5];

  return (
    <div className="room3d-layer" aria-hidden="true" data-lite={lite ? 'true' : undefined}>
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={dpr}
        frameloop={hidden ? 'never' : 'always'}
        gl={{ toneMapping: AgXToneMapping, antialias: !lite }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              event.preventDefault();
              setCtxLost(true);
            },
            { once: true },
          );
        }}
      >
        <Suspense fallback={null}>
          {/* Rooms, screens and the camera rig mount here in the user-story phases. */}
          <BootProgressReporter />
          <SceneReadyGate />
          <SceneSetup />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default RoomIsland;
