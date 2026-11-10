/**
 * hotspots.tsx — in-world navigation affordances (feature 001-whole-site-3d,
 * T058/T059/T060).
 *
 * - `Hotspot`: a clickable 3D marker (R3F pointer events) that triggers room
 *   navigation or opens a screen. Hover feedback: pointer cursor + emissive
 *   glow pop; keyboard focus pulses the marker (demo mechanic, mairp styling
 *   via token colours).
 * - `ShotControls`: the on-screen shot-controls UI — accessible DOM buttons
 *   labelled from the SHOTS registry (short labels under 600 px, FR-011).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Vector3, type Mesh, type MeshStandardMaterial } from 'three';

const _proj = new Vector3();
import { useRoom3D } from '../context';
import { useThemeTokens } from '../fx/useThemeTokens';
import { ENTRY_SHOT, shotsForRoom, type Shot } from '../rig/shots';
import { shotForScreen, type ContentKey } from './screenPlacements';

export interface HotspotProps {
  id: string;
  position: [number, number, number];
  /** Navigate to a mapped route (persistent session). */
  route?: string;
  /** Or open a screen: zoom to its shot + DOM focus. */
  screen?: { id: string; contentKey: ContentKey };
}

export function Hotspot({ id, position, route, screen }: HotspotProps) {
  const { navigate, openScreen, setShot, focusedId, setFocusedId, openScreenId, reducedMotion } = useRoom3D();
  const tokens = useThemeTokens(useRoom3D().theme);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const meshRef = useRef<Mesh>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const matRef = useRef<MeshStandardMaterial>(null);
  // Reflect state on <body> so tests can observe hover/press feedback.
  const setFlag = (k: 'hotspotHover' | 'hotspotPress', v: boolean) => {
    if (v) document.body.dataset[k] = id;
    else delete document.body.dataset[k];
  };
  const focused = focusedId === id;
  const active = openScreenId === screen?.id;

  const color = hovered || focused || active ? tokens.accent2 : tokens.accent;

  // Reset cursor/flags if unmounted while hovered or pressed.
  useEffect(
    () => () => {
      document.body.style.cursor = '';
      delete document.body.dataset.hotspotHover;
      delete document.body.dataset.hotspotPress;
    },
    [],
  );

  const targetScale = pressed ? 0.92 : focused || hovered ? 1.18 : 1;
  const targetEmissive = pressed ? 2.0 : hovered || focused || active ? 1.2 : 0.45;
  useFrame((_, dt) => {
    const m = meshRef.current;
    const mat = matRef.current;
    if (!m || !mat) return;
    // Observable screen-space centre (CSS px) so tests can aim at the hotspot.
    m.getWorldPosition(_proj).project(camera);
    document.body.dataset[`hotspotPx${id.replace(/[^a-z0-9]/gi, '')}`] =
      _proj.z > 1
        ? '-9999,-9999' // behind the camera
        : `${Math.round((_proj.x * 0.5 + 0.5) * size.width)},${Math.round((-_proj.y * 0.5 + 0.5) * size.height)}`;
    if (reducedMotion) {
      m.scale.setScalar(targetScale);
      mat.emissiveIntensity = targetEmissive;
      return;
    }
    const k = 1 - Math.exp(-18 * Math.min(dt, 0.1));
    m.scale.setScalar(m.scale.x + (targetScale - m.scale.x) * k);
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * k;
  });

  const release = () => {
    setPressed(false);
    setFlag('hotspotPress', false);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setFocusedId(id);
    if (route) {
      navigate(route);
    } else if (screen) {
      setShot(shotForScreen(screen.contentKey));
      openScreen(screen.id);
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerDown={(e) => {
          e.stopPropagation(); // don't start a camera drag
          setPressed(true);
          setFlag('hotspotPress', true);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setFlag('hotspotHover', true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          release();
          setFlag('hotspotHover', false);
          document.body.style.cursor = '';
        }}
        userData={{ live: true }}
      >
        <boxGeometry args={[0.34, 0.34, 0.06]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          roughness={0.3}
        />
      </mesh>
      {/* corner ticks, mairp brand motif */}
      <mesh position={[0, 0.28, 0]} userData={{ live: true }}>
        <boxGeometry args={[0.4, 0.03, 0.03]} />
        <meshStandardMaterial color={tokens.border} emissive={tokens.border} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/**
 * ShotControls — accessible DOM overlay driving the CameraRig (T060).
 * Rendered in the island's non-canvas DOM layer by Room3D.
 */
export function ShotControls() {
  const { roomPayload, activeShot, setShot, openScreen, openScreenId } = useRoom3D();
  const shots = useMemo(() => shotsForRoom(roomPayload.room), [roomPayload.room]);

  const pick = (shot: Shot) => {
    // Opening a screen's shot also closes any previously opened screen DOM.
    if (openScreenId && shot.key === ENTRY_SHOT) openScreen(null);
    setShot(shot.key);
  };

  const short = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <div className="room3d-shots" role="toolbar" aria-label="Camera shots">
      {shots.map((s) => (
        <button
          key={s.key}
          type="button"
          aria-pressed={activeShot === s.key}
          onClick={() => pick(s)}
        >
          {short ? s.shortLabel : s.label}
        </button>
      ))}
    </div>
  );
}
