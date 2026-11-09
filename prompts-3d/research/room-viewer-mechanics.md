# room-viewer ("retro bedroom" 3D TV viewer) — Technical Reference (research agent report)

Path: `/root/little-big-questions/room-viewer` (Vite, plain JS/JSX, React 19, @react-three/fiber v9).

## 1. Dependencies and 3D roles

| Dependency | Version | 3D role |
|---|---|---|
| react / react-dom | ^19.3.1 | UI shell; StrictMode relied on (double-mount guards) |
| three | ^0.186.1 | Core renderer + JS-module extras: CSS3DRenderer/CSS3DObject (Room.jsx), RectAreaLightUniformsLib, BufferGeometryUtils (deinterleaveGeometry, mergeGeometries) |
| @react-three/fiber | ^9.8.2 | Canvas, useFrame, useThree, R3F pointer events on the GLTF scene |
| @react-three/drei | ^10.7.9 | Only useGLTF(+preload), useProgress, CameraControls |
| @react-three/postprocessing | ^3.2.0 | EffectComposer, N8AO, ToneMapping (AgX) |
| postprocessing (transitive) | — | ToneMappingMode.AGX |
| @vitejs/plugin-react ^6.1.2 / vite ^8.3.4 | dev | build |
| react-markdown, remark-gfm, rehype-*, mermaid | — | lazy InfoPanel README rendering (not needed for mairp necessarily) |

Absent by design: drei Environment, Html, useVideoTexture (avoids hls.js ~¼ bundle), OrbitControls — replaced by custom solutions.

## 2. Architecture

- Canvas: `shadows PCFShadowMap`, `gl.toneMapping AgXToneMapping`, camera fov 30 near .05 far 100, **dpr capped 1.5** ("N8AO cost grows with pixel count").
- Lights hand-ported from Blender: ambient (intensity = L·π), warm directional sun (4096² shadow map, radius/bias tuned), point light (40W/(4π) candela). TV glow = rectAreaLight (RectAreaLightUniformsLib.init()).
- Model: single GLB via useGLTF + preload. No HDRI environment.
- Scene prep (Room.jsx useEffect): castShadow/receiveShadow flags; emissive-only materials → MeshBasicMaterial at emissive×intensity; screen geometry swapped for generated rounded-corner ShapeGeometry whose UVs match the unit plane (so CSS3D content aligns); transparent LavaGlass; then mergeStatic.
- **mergeStatic**: ~280 meshes merged in-place per (material uuid, shadow flags, attribute layout, indexed) key; bakes world matrices; skips "live" meshes (individually animated/clickable, `isLive` list) and mirrored meshes; deinterleaveGeometry + mergeGeometries; replaced originals get EMPTY geometry with negative-radius bounding sphere (guaranteed cull). `shadowMap.autoUpdate=false`, re-flagged needsUpdate only during poster animation.
- **Live HTML on 3D screen — TVFeed** (signature mechanic): App renders React DOM via `createPortal` into a detached `<div>` (`document.createElement('div')`); Room stacks a second DOM-only **CSS3DRenderer** scene over the WebGL canvas; page sized 640 CSS px wide; whole scene scaled **CSS_SCALE = 1000** (iOS Safari sub-pixel CSS 3D mis-projection workaround); per frame mirrors camera: `view.copy(camera); view.position.multiplyScalar(CSS_SCALE)`. Screen mesh gets near-black MeshBasicMaterial backing. `pointerEvents: none` — display-only.
- TVVideo variant: hand-rolled THREE.VideoTexture (no hls.js), aspect crop via texture.repeat/offset + updateMatrix, through CRT shader.
- **CRT shader** (crtMaterial.js): ShaderMaterial uniforms {map, uvTransform, time, power}. Barrel bulge; power dot→line→open animation (0.75s on / 0.45s off, "thinner beam burns hotter" white flash + phosphor dot glow); chromatic aberration ±0.0018; phosphor grade pow(v,1.35)+sat 1.25; scanlines sin(y·240·2π) with fwidth density attenuation; aperture grille mod(gl_FragCoord.x,3); vignette; 110Hz flicker; hash noise; glass sheen. Ends with tonemapping_fragment/colorspace_fragment includes (composes with AgX).
- CSS twin for HTML feeds: `.tv-feed*` tube-on/off keyframes (scale 0.01→line→full, brightness(6) flash), feTurbulence static burst overlay keyed by channel, glass overlay (scanlines + reflection + vignette + flicker).
- **Boot flow**: index.html #boot overlay (inline style + SVG logo, status lines, CSS var --p progress, reduced-motion off, role="status") → boot.js setBootProgress/hideBoot → drei useProgress feeds bar → SceneReady counts **4 rendered frames** (shader-compile stutter) before hideBoot. InfoPanel prefetched via requestIdleCallback.
- **Audio**: crtSound.js fully synthesized Web Audio SFX (thump/noise on, falling zap off) with tap-unlock; shared-element silent-WAV iOS unlock (0.1s silent WAV inside Play tap); navigator.audioSession.type='playback' (iOS 17+); default muted.
- **Postprocessing**: EffectComposer multisampling 0 → N8AO (aoRadius .8, intensity 3.5, quality medium, halfRes) → ToneMapping AgX (composer disables renderer tone mapping, so AgX applied here).

## 3. Interaction model

- Stage machine: welcome → playing → explore; `?debug` / `?channel=` params jump ahead.
- **Shot-based camera rig** (CameraRig.jsx): declarative `SHOTS` registry (position/target/smoothTime/labels incl. mobile short labels); drei CameraControls makeDefault with constrained azimuth (room's open quarter, AZIMUTH_MIN/MAX widened per shot) and pan bounded by Box3; shot changes via `c.setLookAt(...)` damped tween (smoothTime 0.9–1.1s); `run` ref cancels stale per-shot timers; arrival side effects (tvAfter + tvDelay → power on); portrait FOV widening to preserve framing.
- Clickable meshes by name (TVPowerButton) with physical press animation + hover glow; pointer cursor.
- Programme rundown (useShow): intro→video→outro per story, auto-advance, keyboard 1–4/←→/space/R in debug; channel switch = state + key bump remount of CSS-timeline bumpers.
- Poster highlight sequence: staggered emissive pops with exponential damping (dt·14).

## 4. Performance / a11y patterns

- Mutual lazy loading of App/Labs; lazy InfoPanel + idle prefetch; dynamic mermaid import.
- useGLTF.preload; boot overlay from first paint; readiness gated on rendered frames.
- mergeStatic (~280→few draw calls); one-shot shadow maps; dpr ≤1.5; multisampling 0; N8AO halfRes/medium.
- Reduced motion handled in boot CSS and labs.css; mobile: responsive FOV, short labels <600px, touch-action manipulation, iOS CSS3D/video-layer/audio-unlock workarounds.
- A11y: boot role="status", aria-labels, aria-pressed toggles, stable subtitle sizing.

## 5. Reusable MECHANICS (theme-agnostic)

1. Shot-based camera rig (SHOTS registry + bounded CameraControls + tweened setLookAt + run-ref cancellation + portrait FOV fitting).
2. Clickable 3D screen with live rich content: portal DOM → detached div → second CSS3DRenderer at CSS_SCALE 1000; rounded-corner screen geometry swap; dark-glass backing; rectAreaLight glow.
3. CRT ShaderMaterial (bulge/power/aberration/scanlines/grille/vignette/flicker + tonemapping includes) and its pure-CSS twin.
4. Boot sequence: pre-JS overlay + useProgress + N-frames-ready gate + reduced-motion.
5. Synthesized Web Audio SFX + iOS unlock patterns.
6. Postprocessing recipe: N8AO halfRes + in-composer AgX.
7. Static-scene optimizations: mergeStatic with live-mesh exemption, one-shot shadows, emissive→basic conversion, cull sentinels.
8. Show state machine: welcome→playing→explore, rundown auto-advance, key-bump replays, arrival-triggered effects.

## 6. Hardcoded bedroom/news content that must be re-themed

- Model URL + mesh-name couplings: TVBody/TVBack/TVScreenImg/TVPowerButton/TVPowerLED/TVBezelBtns, WinPane, Ground, LavaGlass, LavaBlob0–2, Poster* + Backings (HIGHLIGHT_POSTERS list); screen orientation assumptions; ROOM_CENTER/OVERVIEW_DIR/VIEW_W/H/ROOM_BOUNDS; all SHOTS coordinates; press axis.
- Lighting constants ported from the Blender scene — must be re-derived for a new scene.
- Brand/copy: brand.jsx logo paths, intro bumpers, stories.json, news.json, olive-voice.json, jingle mp3, Newsroom copy, ABOUT card, index.html title/meta/OG, palette (#3b3456/#ffc93c/#ff6b5a), fonts (Fredoka/Nunito/Press Start 2P).
- InfoPanel imports repo README + vite fs allow — chrome-specific.
