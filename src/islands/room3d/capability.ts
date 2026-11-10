/**
 * capability.ts — dependency-free WebGL capability probe (feature 001-whole-site-3d, US3/US4).
 * No React/three imports, so the page-level mount gate can run it BEFORE requesting
 * the 3D bundle: unusable GPUs never download or parse the island at all.
 */
export function hasWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Software rasterizers (SwiftShader/llvmpipe) cannot run the postprocessed scene
    // within budget (multi-second main-thread stalls): treat as "no usable GPU" and
    // serve the flat site (US3 low-power path). Opt back in with localStorage
    // room3d="3d" (used by the headless verify scripts).
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software/i.test(renderer)) {
      try {
        return localStorage.getItem('room3d') === '3d';
      } catch {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
