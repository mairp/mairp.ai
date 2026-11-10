/**
 * Css3dScreens.tsx — DOM-only CSS3D screen layer (feature 001-whole-site-3d,
 * T042–T044; research R5, demo TVFeed pattern adapted as mechanics only).
 *
 * A second, DOM-only CSS3DRenderer is stacked over the WebGL canvas. Each
 * ScreenPlacement gets a detached div (laid out 640 CSS px wide) mounted via
 * createPortal, attached to a CSS3DObject in a px-space CSS scene:
 *
 *   CSS_SCALE = 1000  — CSS-world units are 1000 px per WebGL world unit.
 *   object position  = placement.position × CSS_SCALE
 *   object scale     = placement.width × CSS_SCALE / 640 (640 px element)
 *   camera           = mirrored every frame: position × CSS_SCALE, same
 *                      rotation/fov (view.copy(camera) pattern).
 *
 * Pointer-events policy (T044): the layer itself is inert; interactive
 * placements accept pointer events on their portal div; display-only screens
 * are `pointer-events: none` so clicks reach the canvas/hotspots.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { Object3D, PerspectiveCamera, Quaternion, Scene } from 'three';
import { useRoom3D } from '../context';
import { placementsForRoom } from '../rooms/screenPlacements';
import { ScreenSurface } from './ScreenSurface';
import type { ScreenPlacement } from '../rooms/screenPlacements';

export const CSS_SCALE = 1000;
/** DOM layout width of every screen surface, CSS px. */
export const SCREEN_CSS_WIDTH = 640;

type Rig = {
  scene: Scene;
  renderer: CSS3DRenderer;
  mirror: PerspectiveCamera;
  cameraRoot: Object3D;
};

/**
 * Document-lifetime CSS3D rig, shared between the DOM half (Css3dScreens:
 * layer + portals, outside the Canvas) and the Canvas half (Css3dDriver:
 * per-frame camera mirroring). R3F's reconciler cannot host DOM nodes or
 * react-dom portals, so the two halves must live in different React trees.
 */
let sharedRig: Rig | null = null;
function getRig(): Rig {
  if (!sharedRig) {
    const scene = new Scene();
    const renderer = new CSS3DRenderer();
    const mirror = new PerspectiveCamera();
    const cameraRoot = new Object3D(); // css-scene camera anchor (px space)
    scene.add(cameraRoot);
    cameraRoot.add(mirror);
    sharedRig = { scene, renderer, mirror, cameraRoot };
  }
  return sharedRig;
}

/** DOM half (render OUTSIDE <Canvas>): the CSS3D layer + one portal per screen. */
export function Css3dScreens() {
  const { roomPayload } = useRoom3D();
  const rig = useMemo(getRig, []);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Mount the renderer's DOM element once: an absolutely-positioned, inert
  // layer above the canvas. Interactive screens opt in via their portal div.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const el = rig.renderer.domElement;
    el.style.position = 'absolute';
    el.style.inset = '0';
    el.style.pointerEvents = 'none';
    layer.appendChild(el);
    return () => {
      el.remove();
    };
  }, [rig]);

  const placements = useMemo(() => placementsForRoom(roomPayload.room), [roomPayload.room]);

  // Progressive mounting (FR-003): priority (non-lazy) screens mount with the
  // first commit so the boot gate can lift; lazy screens follow one per tick.
  const ordered = useMemo(
    () => [...placements.filter((p) => !p.lazy), ...placements.filter((p) => p.lazy)],
    [placements],
  );
  const priorityCount = useMemo(() => placements.filter((p) => !p.lazy).length, [placements]);
  const [shown, setShown] = useState(priorityCount);
  useEffect(() => {
    setShown(priorityCount);
    let n = priorityCount;
    const timer = setInterval(() => {
      n += 1;
      setShown(n);
      // Render-on-demand: a newly mounted screen is positioned by the next CSS3D render.
      window.dispatchEvent(new Event('room3d-wake'));
      if (n >= ordered.length) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, [ordered, priorityCount]);

  return (
    <div ref={layerRef} className="room3d-css3d" aria-hidden={false}>
      {ordered.slice(0, shown).map((p) => (
        <Css3dScreen key={`${roomPayload.room}:${p.id}`} placement={p} rig={rig} />
      ))}
    </div>
  );
}

/** Canvas half (render INSIDE <Canvas>): sizes the layer and mirrors the camera each frame. */
export function Css3dDriver() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const rig = useMemo(getRig, []);

  useEffect(() => {
    rig.renderer.setSize(size.width, size.height);
  }, [rig, size]);

  useEffect(() => {
    rig.mirror.fov = camera.fov;
    rig.mirror.aspect = size.width / Math.max(1, size.height);
    rig.mirror.updateProjectionMatrix();
  }, [rig, camera, camera.fov, size]);

  // Per-frame camera mirroring (T042): position × CSS_SCALE, same rotation.
  useFrame(() => {
    if (rig.mirror.fov !== camera.fov) {
      rig.mirror.fov = camera.fov;
      rig.mirror.updateProjectionMatrix();
    }
    rig.cameraRoot.position.copy(camera.position).multiplyScalar(CSS_SCALE);
    rig.cameraRoot.quaternion.copy(camera.quaternion as Quaternion);
    rig.cameraRoot.updateMatrixWorld(true);
    rig.renderer.render(rig.scene, rig.mirror);
  });
  return null;
}

/** One screen: detached div + portal + CSS3DObject aligned to its mesh. */
function Css3dScreen({ placement, rig }: { placement: ScreenPlacement; rig: {
  scene: Scene;
  renderer: CSS3DRenderer;
  mirror: PerspectiveCamera;
  cameraRoot: Object3D;
} }) {
  const { roomPayload } = useRoom3D();

  const holder = useMemo(() => {
    const div = document.createElement('div');
    div.className = 'rs-screen-portal';
    div.style.width = `${SCREEN_CSS_WIDTH}px`;
    div.style.height = `${Math.round((SCREEN_CSS_WIDTH * placement.height) / placement.width)}px`;
    div.style.backfaceVisibility = 'hidden'; // never show a mirrored back face
    div.dataset.screen = placement.id;
    return div;
  }, [placement.id, placement.width, placement.height]);

  useEffect(() => {
    const obj = new CSS3DObject(holder);
    obj.position.set(
      placement.position[0] * CSS_SCALE,
      placement.position[1] * CSS_SCALE,
      placement.position[2] * CSS_SCALE,
    );
    obj.rotation.set(0, placement.rotationY, 0);
    const s = (placement.width * CSS_SCALE) / SCREEN_CSS_WIDTH;
    obj.scale.set(s, s, s);
    rig.scene.add(obj);
    return () => {
      rig.scene.remove(obj);
      holder.remove();
    };
  }, [rig, holder, placement]);

  // Pointer-events policy (T044): interactive screens take events, display
  // screens stay inert so orbit drags pass through to the canvas.
  useEffect(() => {
    holder.style.pointerEvents = placement.interactive ? 'auto' : 'none';
  }, [holder, placement.interactive]);

  return createPortal(<ScreenSurface placement={placement} payload={roomPayload} />, holder);
}
