/**
 * Effects.tsx — cinematic postprocessing pipeline (feature 001-whole-site-3d,
 * T065; research R9). EffectComposer with multisampling 0 (the composer's own
 * buffers handle AA) → N8AO at half resolution / medium quality → in-composer
 * AgX tone mapping (so the renderer's own tone mapping is disabled while the
 * composer is active, avoiding a double pass).
 *
 * Lite mode (hardwareConcurrency ≤ 4): N8AO dropped, nothing else changes (the
 * composer keeps AgX tone mapping; dpr is forced to 1 by Room3D). Under
 * prefers-reduced-motion (T076) the composer is skipped entirely and the raw
 * scene renders with the renderer's own AgX tone mapping.
 *
 * US5 T090: no colour literals — postprocessing adjusts the token-painted
 * scene only.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function Effects({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const gl = useThree((s) => s.gl);
  const skip = reducedMotion;

  useEffect(() => {
    if (skip) return;
    const previous = gl.toneMapping;
    gl.toneMapping = 0; // NoToneMapping while the composer owns tone mapping
    return () => {
      gl.toneMapping = previous;
    };
  }, [gl, skip]);

  if (skip) return null;
  return (
    <EffectComposer key={lite ? 'lite' : 'full'} multisampling={0} enableNormalPass={false}>
      {!lite && <N8AO halfRes quality="medium" />}
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
