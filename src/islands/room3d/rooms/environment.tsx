/**
 * environment.tsx — the original mairp "fabric room" (feature 001-whole-site-3d,
 * T033–T038; research R6/R7).
 *
 * A PROCEDURAL in-code scene composed from primitive geometry: floor, walls,
 * ceiling cable tray, network racks with unit rails, patch panels with accent
 * LEDs, cable runs, and rounded-corner screen meshes under every ScreenPlacement.
 * Colours come exclusively from the site's design tokens via ThemeBridge
 * (Signal Teal accent / cyan accent-2, dark-first with live light theme) —
 * no hardcoded hex, and no assets from the reference demo. Sized to the perf
 * budget: a few hundred merged primitives, one shadow-casting light, one-shot
 * shadow maps (rooms/prepareScene.ts). Per the U1 remediation decision, an
 * authored GLB under public/assets/models/ remains an OPTIONAL later swap;
 * no decoder plumbing is exercised on this path (T017 is conditional).
 *
 * US5 T090: no hardcoded hex; palette strictly from ThemeBridge tokens
 * (floor/walls tokens.bg/surface · racks/LEDs tokens.border/surface/
 * accent/accent-2 · screens tokens.bg/border/accent · lights tokens.fg/
 * accent/accent-2).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { type Color, DoubleSide, Shape, ShapeGeometry } from 'three';
import { useRoom3D } from '../context';
import { useThemeTokens } from '../fx/useThemeTokens';
import { prepareScene } from './prepareScene';
import { placementsForRoom, type ScreenPlacement } from './screenPlacements';

/** Room shell dimensions (metres) — matches rig/shots.ts ROOM_BOUNDS. */
const W = 18; // x extent
const D = 14; // z extent
const H = 4.4; // wall height
/** Rack centre |x|: spans 7.1–8.3, clear of the back-wall screens (|x| ≤ 6.3) and the side walls. */
const RACK_X = 7.7;

/** Rounded-corner plane geometry for screen glass (T037). */
export function makeRoundedPlaneGeometry(width: number, height: number, radius = 0.08): ShapeGeometry {
  const r = Math.min(radius, width / 2 - 0.01, height / 2 - 0.01);
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new ShapeGeometry(shape);
}

/** One network rack: carcass + unit rails + patch panel LEDs. */
function Rack({
  position,
  ledColor,
  frameColor,
  accentColor,
}: {
  position: [number, number, number];
  ledColor: Color;
  frameColor: Color;
  accentColor: Color;
}) {
  const units = 10;
  return (
    <group position={position}>
      {/* carcass */}
      <mesh userData={{ static: true, shadow: 'both' }}>
        <boxGeometry args={[1.2, 2.3, 0.7]} />
        <meshStandardMaterial color={frameColor} roughness={0.6} metalness={0.4} />
      </mesh>
      {/* unit rails: thin slats */}
      {Array.from({ length: units }, (_, i) => (
        <mesh key={i} position={[0, -1.15 + 0.115 + (i * 2.2) / units, 0.36]} userData={{ static: true }}>
          <boxGeometry args={[1.14, 0.02, 0.01]} />
          <meshStandardMaterial color={ledColor} roughness={0.8} />
        </mesh>
      ))}
      {/* patch panel rows with status LEDs (accent token) */}
      {[0, 1].map((row) => (
        <group key={row} position={[0, 0.86 - row * 0.24, 0.37]}>
          <mesh userData={{ static: true }}>
            <boxGeometry args={[1.1, 0.16, 0.02]} />
            <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.5} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh
              key={i}
              position={[-0.48 + i * 0.088, 0, 0.02]}
              userData={{ static: true, emissiveOnly: true }}
            >
              <boxGeometry args={[0.028, 0.028, 0.01]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Cable tray run along a wall base + vertical drop, with a status LED. */
function CableRun({
  from,
  to,
  ledColor,
  accentColor,
}: {
  from: [number, number, number];
  to: [number, number, number];
  ledColor: Color;
  accentColor: Color;
}) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    Math.min(from[1], to[1]),
    (from[2] + to[2]) / 2,
  ];
  return (
    <group>
      <mesh
        position={mid}
        rotation={[0, -angle, 0]}
        userData={{ static: true, shadow: 'cast' }}
      >
        <boxGeometry args={[len, 0.07, 0.16]} />
        <meshStandardMaterial color={ledColor} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[from[0], from[1] + 0.05, from[2]]} userData={{ static: true, emissiveOnly: true }}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

/** Screen mesh per placement: rounded glass + accent frame (T037). */
function ScreenMesh({ placement, glassColor, frameColor, glowColor }: {
  placement: ScreenPlacement;
  glassColor: Color;
  frameColor: Color;
  glowColor: Color;
}) {
  const geometry = useMemo(
    () => makeRoundedPlaneGeometry(placement.width, placement.height, 0.09),
    [placement.width, placement.height],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const frame = useMemo(
    () => makeRoundedPlaneGeometry(placement.width + 0.14, placement.height + 0.14, 0.13),
    [placement.width, placement.height],
  );
  useEffect(() => () => frame.dispose(), [frame]);
  return (
    <group
      position={placement.position}
      rotation={[0, placement.rotationY, 0]}
      userData={{ live: true }}
    >
      {/* dark-glass backing, slightly in front of the wall */}
      <mesh geometry={frame} position={[0, 0, -0.015]} userData={{ live: true }}>
        <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.3} side={DoubleSide} />
      </mesh>
      <mesh geometry={geometry} userData={{ live: true }}>
        <meshStandardMaterial
          color={glassColor}
          roughness={0.28}
          metalness={0.1}
          emissive={glowColor}
          emissiveIntensity={0.16}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function Environment() {
  const { roomPayload } = useRoom3D();
  const tokens = useThemeTokens(useRoom3D().theme);
  const gl = useThree((s) => s.gl);
  const groupRef = useRef<null | Parameters<typeof prepareScene>[0]>(null);
  const prepared = useRef(false);

  const roomKind = roomPayload.room;
  const placements = useMemo(() => placementsForRoom(roomKind), [roomKind]);

  // One-shot scene preparation after first render (T039–T041).
  useEffect(() => {
    const root = groupRef.current;
    if (!root || prepared.current) return;
    prepared.current = true;
    return prepareScene(root, { gl });
  }, [gl, roomKind]);

  // Light intensities are re-derived for this scene (T038) — never demo
  // constants; colours track the tokens so the light theme lifts the room.
  return (
    <group ref={groupRef}>
      {/* ── shell ─────────────────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} userData={{ static: true, shadow: 'receive' }}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={tokens.surface} roughness={0.85} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, H / 2, -D / 2]} userData={{ static: true, shadow: 'receive' }}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={tokens.bg} roughness={0.9} />
      </mesh>
      {/* side walls */}
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} userData={{ static: true, shadow: 'receive' }}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={tokens.bg} roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} userData={{ static: true, shadow: 'receive' }}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={tokens.bg} roughness={0.9} />
      </mesh>
      {/* front wall (behind the contact console) and ceiling: without them
          the page background showed through as grey bands */}
      <mesh position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} userData={{ static: true, shadow: 'receive' }}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={tokens.bg} roughness={0.9} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} userData={{ static: true }}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={tokens.bg} roughness={0.95} />
      </mesh>
      {/* ceiling cable tray grid (muted lines), spanning the full W × D ceiling */}
      <gridHelper args={[1, 10, tokens.muted, tokens.muted]} scale={[W, 1, D]} position={[0, H - 0.01, 0]} />

      {/* ── props ─────────────────────────────────────────────────────── */}
      <Rack position={[-RACK_X, 1.35, -D / 2 + 0.42]} ledColor={tokens.border} frameColor={tokens.surface} accentColor={tokens.accent} />
      <Rack position={[RACK_X, 1.35, -D / 2 + 0.42]} ledColor={tokens.border} frameColor={tokens.surface} accentColor={tokens.accent2} />
      <CableRun from={[-W / 2 + 0.6, 0.06, -D / 2 + 1.6]} to={[W / 2 - 0.6, 0.06, -D / 2 + 1.6]} ledColor={tokens.surface} accentColor={tokens.accent} />
      <CableRun from={[-W / 2 + 0.6, 0.06, D / 2 - 1.4]} to={[W / 2 - 0.6, 0.06, D / 2 - 1.4]} ledColor={tokens.surface} accentColor={tokens.accent2} />

      {/* ── screens (meshes; DOM portals align via Css3dScreens) ─────── */}
      {placements.map((p) => (
        <ScreenMesh
          key={p.id}
          placement={p}
          glassColor={tokens.bg}
          frameColor={tokens.border}
          glowColor={tokens.accent}
        />
      ))}

      {/* ── lighting (T038) ───────────────────────────────────────────── */}
      <ambientLight intensity={0.55} color={tokens.fg} />
      <directionalLight
        position={[2, 5.4, 6]}
        intensity={1.1}
        color={tokens.fg}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* screen-glow accents (point lights, no shadows — budget) */}
      <pointLight position={[0, 2.4, -5.4]} intensity={2.4} distance={7} decay={1.8} color={tokens.accent} />
      <pointLight position={[-RACK_X, 2.6, -D / 2 + 0.6]} intensity={1.6} distance={5} decay={1.8} color={tokens.accent2} />
      <pointLight position={[RACK_X, 2.6, -D / 2 + 0.6]} intensity={1.6} distance={5} decay={1.8} color={tokens.accent} />
      <pointLight position={[0, 2.2, 4.6]} intensity={1.4} distance={5} decay={1.8} color={tokens.accent2} />
    </group>
  );
}
