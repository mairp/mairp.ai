/**
 * MethodScreen.tsx — "The Verified Fabric" method loop (feature
 * 001-whole-site-3d, T050): name + ordered steps from the payload (homepage
 * content collection — payload-only copy, contract rule 6).
 */
import { useRoom3D } from '../../context';

export function MethodScreen() {
  const { payload } = useRoom3D();
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">method</p>
      <h2 className="rs-title">{payload.method.name}</h2>
      <ol className="rs-list">
        {payload.method.steps.map((step, i) => (
          <li key={step}>
            <span className="rs-meta">{String(i + 1).padStart(2, '0')} · </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
