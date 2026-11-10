/**
 * ServiceScreen.tsx — one service's detail (feature 001-whole-site-3d, T046).
 * Renders only the ServiceSummary payload slice: name/one-line/status/
 * statusNote/duration, fact cards (duration/status/vendors), deliverables and
 * the dated evidence list as real <a target="_blank"> links (FR-010).
 */
import { useRoom3D } from '../../context';
import type { ServiceSummary } from '../../../../lib/room-payload';

export function ServiceScreen({ mode }: { mode: 'detail' | 'evidence' }) {
  const { payload, navigate } = useRoom3D();
  const self: ServiceSummary | undefined =
    payload.services.find((s) => s.id === payload.serviceId) ?? payload.services[0];
  if (!self) return null;

  if (mode === 'evidence') {
    return (
      <div className="rs-inner">
        <p className="rs-eyebrow">evidence</p>
        <h2 className="rs-title">Deliverables &amp; evidence</h2>
        <div className="rs-h2">Deliverables</div>
        <ul className="rs-list">
          {self.deliverables.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <div className="rs-h2">Evidence</div>
        <ul className="rs-list">
          {self.evidence.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        {self.links.length > 0 && (
          <>
            <div className="rs-h2">Links</div>
            <ul className="rs-list">
              {self.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="rs-actions">
          <button type="button" className="rs-btn" onClick={() => navigate('/')}>
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">service</p>
      <h1 className="rs-title">{self.name}</h1>
      <p className="rs-lede">{self.summary}</p>
      <p>
        <span className="rs-badge" data-status={self.status}>
          {self.status === 'requires-scoping' ? 'Requires scoping' : 'Available'}
        </span>{' '}
        <span className="rs-meta">{self.duration}</span>
      </p>
      {self.statusNote && <p className="rs-meta">{self.statusNote}</p>}

      <div className="rs-h2">Fact cards</div>
      <div className="rs-cards">
        <div className="rs-card">
          <b>Engagement length</b>
          <p>{self.duration}</p>
        </div>
        <div className="rs-card">
          <b>Status</b>
          <p>
            {self.status === 'requires-scoping' ? 'Requires scoping' : 'Available'}
            {self.statusNote ? ` — ${self.statusNote}` : ''}
          </p>
        </div>
        <div className="rs-card">
          <b>Vendor surface</b>
          <p>{self.vendors.join(' · ')}</p>
        </div>
      </div>

      <div className="rs-h2">Deliverables</div>
      <ul className="rs-list">
        {self.deliverables.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <div className="rs-h2">Evidence</div>
      <ul className="rs-list">
        {self.evidence.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>

      <div className="rs-actions">
        {payload.navigation
          .filter((n) => n.route !== payload.route)
          .slice(0, 3)
          .map((n) => (
            <button key={n.route} type="button" className="rs-btn" onClick={() => navigate(n.route)}>
              {n.shortLabel ?? n.label}
            </button>
          ))}
      </div>
    </div>
  );
}
