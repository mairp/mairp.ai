/**
 * prepareScene.ts — static scene preparation (feature 001-whole-site-3d,
 * T039/T040/T041; research R9).
 *
 * Ported AESTHETIC/MECHANIC patterns from the reference demo's mergeStatic
 * pass (shadow flags, emissive→basic conversion, merge-by-material, one-shot
 * shadow maps); implemented from scratch for the mairp procedural fabric room
 * — no demo code or assets ship.
 *
 * Applied once to the environment root after mount:
 * - shadow flags from `userData.shadow` hints ('cast' | 'receive' | 'both');
 * - emissive-only materials (LEDs, screen backings) → MeshBasicMaterial so
 *   they skip lighting math;
 * - `userData.static === true` meshes are merged by material into single
 *   draw-call meshes; originals get an empty geometry with a negative-radius
 *   bounding sphere (never drawn again). `userData.live === true` meshes
 *   (screens, hotspots) are exempt and keep their own geometry;
 * - WebGL shadow maps are one-shot: `shadowMap.autoUpdate = false`, re-flagged
 *   `needsUpdate` only when lights/scene change.
 *
 * US5 T090: this pass sets NO colours of its own — the emissive→basic
 * conversion clones the material's own (token-derived) emissive colour, so
 * the palette stays 100% ThemeBridge tokens.
 */
import {
  BufferGeometry,
  Material,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Sphere,
  Vector3,
  WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface PrepareSceneOptions {
  /** Renderer, for the one-shot shadow-map flag (T041). */
  gl: WebGLRenderer;
}

type ShadowHint = 'cast' | 'receive' | 'both' | 'none';

export function prepareScene(root: Object3D, opts: PrepareSceneOptions): () => void {
  const cleanups: (() => void)[] = [];

  // 1. Shadow flags + emissive-only material conversion (T039).
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const hint = (mesh.userData.shadow as ShadowHint | undefined) ?? 'none';
    if (hint === 'cast' || hint === 'both') mesh.castShadow = true;
    if (hint === 'receive' || hint === 'both') mesh.receiveShadow = true;

    const mat = mesh.material as MeshStandardMaterial | undefined;
    if (
      mat &&
      (mat as MeshStandardMaterial).isMeshStandardMaterial &&
      mesh.userData.emissiveOnly === true
    ) {
      const basic = new MeshBasicMaterial({
        color: mat.emissive instanceof Color ? mat.emissive.clone() : new Color(1, 1, 1),
      });
      mesh.material = basic;
      cleanups.push(() => basic.dispose());
    }
  });

  // 2. Static merge (T040): merge by (material parameters, shadow flags, attribute
  //    layout); replace originals with empty geometry + negative-radius sphere.
  const groups = new Map<string, Mesh[]>();
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData.live === true || mesh.userData.static !== true) return;
    const mat = mesh.material as Material | undefined;
    if (!mat?.uuid) return;
    const layout = attributeSignature(mesh.geometry);
    const key = `${materialSignature(mat)}|${mesh.castShadow ? 'c' : '-'}${mesh.receiveShadow ? 'r' : '-'}|${layout}`;
    const list = groups.get(key);
    if (list) list.push(mesh);
    else groups.set(key, [mesh]);
  });

  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue; // nothing to merge
    root.updateMatrixWorld(true);
    const worldGeoms = meshes.map((m) => {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(worldGeoms);
    for (const g of worldGeoms) g.dispose();
    if (!merged) continue;
    meshes.forEach((m) => {
      m.geometry.dispose();
      m.geometry = new BufferGeometry();
      // Negative-radius bounding sphere: never intersects frustum culling or
      // raycasting — the merged copy draws instead (demo pattern, original).
      m.geometry.boundingSphere = new Sphere(m.getWorldPosition(new Vector3()), -1);
      m.visible = false;
    });
    const first = meshes[0];
    const mergedMesh = new Mesh(merged, first.material);
    mergedMesh.castShadow = first.castShadow;
    mergedMesh.receiveShadow = first.receiveShadow;
    mergedMesh.userData.static = true;
    root.add(mergedMesh); // world-space geometry → identity transform at root
    cleanups.push(() => merged.dispose());
  }

  // 3. One-shot shadow maps (T041): static lights + static scene → render the
  //    shadow map once, then freeze auto updates.
  if (typeof document !== 'undefined') {
    let before = 0;
    let after = 0;
    for (const g of groups.values()) {
      before += g.length;
      after += g.length >= 2 ? 1 : g.length;
    }
    // Observable merge result (draw calls for static meshes: before → after).
    document.body.dataset.mergeStats = `${before}->${after}`;
  }
  opts.gl.shadowMap.autoUpdate = false;
  opts.gl.shadowMap.needsUpdate = true;
  cleanups.push(() => {
    opts.gl.shadowMap.autoUpdate = true;
  });

  return () => {
    for (const fn of cleanups) fn();
  };
}

/**
 * Parameter-based material signature: meshes declaring separate-but-identical
 * materials (R3F creates one instance per JSX element) still merge together.
 */
function materialSignature(mat: Material): string {
  const m = mat as Material & {
    color?: Color; emissive?: Color; emissiveIntensity?: number;
    roughness?: number; metalness?: number;
  };
  return [
    m.type,
    m.color?.getHexString() ?? '',
    m.emissive?.getHexString() ?? '',
    m.emissiveIntensity ?? '',
    m.roughness ?? '',
    m.metalness ?? '',
    m.side,
    m.transparent ? 't' : '',
  ].join(':');
}

/** Stable attribute-layout signature so merges never mix incompatible buffers. */
function attributeSignature(geometry: BufferGeometry): string {
  return Object.keys(geometry.attributes)
    .sort()
    .map((name) => `${name}:${geometry.attributes[name].itemSize}`)
    .join(',') + (geometry.index ? '|i' : '');
}
