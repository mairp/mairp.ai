/**
 * Effects.tsx — cinematic postprocessing pipeline (feature 001-whole-site-3d,
 * T065; research R9). EffectComposer with multisampling 0 (the composer's own
 * buffers handle AA) → N8AO at half resolution / medium quality → in-composer
 * AgX tone mapping (so the renderer's own tone mapping is disabled while the
 * composer is active, avoiding a double pass).
 *
 * Skipped entirely in lite mode (hardwareConcurrency ≤ 4) and under
 * prefers-reduced-motion (US3 behaviour): those paths render the raw scene
 * with the renderer's AgX tone mapping, which stays on.
 */
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function Effects({ lite, reducedMotion }: { lite: boolean; reducedMotion: boolean }) {
  const gl = useThree((s) => s.gl);
  const skip = lite || reducedMotion;

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
    <EffectComposer key={skip ? 'off' : 'on'} multisampling={0} enableNormalPass={false}>
      <N8AO halfRes quality="medium" />
      <ToneMapping mode={ToneMappingMode.AGX} />
    </EffectComposer>
  );
}
