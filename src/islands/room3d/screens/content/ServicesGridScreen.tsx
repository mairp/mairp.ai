/**
 * ServicesGridScreen.tsx — all 7 services with one-liners (feature
 * 001-whole-site-3d, T047/T056 related mode). Each row is a real button that
 * navigates to that service's room (persistent session, FR-006). In related
 * mode (a service room's right wall) only the page payload's related slice
 * (self + related services) is listed — that is exactly what the payload
 * slice carries on service pages (contracts/room-payload.schema.md).
 */
import { useRoom3D } from '../../context';

export function ServicesGridScreen({ relatedTo }: { relatedTo?: string }) {
  const { payload, navigate } = useRoom3D();
  const services = payload.services;
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">{relatedTo ? 'related services' : 'services'}</p>
      <h2 className="rs-title">
        {relatedTo ? 'Related to this service' : 'Consulting services'}
      </h2>
      <div className="rs-cards">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            className="rs-grid-item"
            onClick={() => navigate(`/services/${s.id}/`)}
            aria-label={`Open ${s.name}`}
          >
            <b>{s.name}</b>
            {s.id === relatedTo && ' '}
            {s.id === relatedTo && <span className="rs-badge">this page</span>}
            <p className="rs-one">{s.oneLine}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
