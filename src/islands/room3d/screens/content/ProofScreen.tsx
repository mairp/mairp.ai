/**
 * ProofScreen.tsx — dated proof badges with verbatim evidence links (feature
 * 001-whole-site-3d, T048; FR-010/SC-006: URLs pass through untouched).
 */
import { useRoom3D } from '../../context';

export function ProofScreen() {
  const { payload } = useRoom3D();
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">proof</p>
      <h2 className="rs-title">Evidence-backed claims</h2>
      <div className="rs-cards">
        {payload.proof.map((p) => (
          <div key={p.id} className="rs-card">
            <b>{p.badge}</b>{' '}
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener" aria-label={`${p.name} evidence source`}>
                evidence ↗
              </a>
            )}
            <p>
              {p.source}
              {p.note ? ` — ${p.note}` : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
