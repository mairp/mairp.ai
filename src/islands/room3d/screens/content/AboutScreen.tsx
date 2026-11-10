/**
 * AboutScreen.tsx — bio / trajectory / credentials surfaces (feature
 * 001-whole-site-3d, T052). All copy comes from the payload's AboutData
 * (site.ts CV/bio data verbatim; cert/badge URLs pass through, FR-010).
 * The home room's `trajectory` and `background` screens reuse sections.
 */
import { useRoom3D } from '../../context';

export type AboutSection = 'bio' | 'trajectory' | 'credentials' | 'background';

export function AboutScreen({ section }: { section: AboutSection }) {
  const { payload } = useRoom3D();
  const about = payload.about;

  if (section === 'bio') {
    return (
      <div className="rs-inner">
        <p className="rs-eyebrow">about</p>
        <h1 className="rs-title">{about.name}</h1>
        <p className="rs-lede">{about.tagline}</p>
        <p className="rs-lede">{about.caption}</p>
        <p className="rs-meta">
          {about.practice} · {about.location}
        </p>
        <div className="rs-actions">
          <a className="rs-btn" href={about.cv} target="_blank" rel="noopener">
            CV (PDF)
          </a>
          <a className="rs-btn" href={about.linkedin} target="_blank" rel="noopener">
            LinkedIn
          </a>
        </div>
      </div>
    );
  }

  if (section === 'trajectory') {
    return (
      <div className="rs-inner">
        <p className="rs-eyebrow">trajectory</p>
        <h2 className="rs-title">Trajectory</h2>
        <ul className="rs-tl">
          {about.trajectory.map((t) => (
            <li key={`${t.yr}-${t.ttl}`}>
              <span className="rs-yr">{t.yr}</span> <b>{t.ttl}</b> — <span className="rs-meta">{t.org}</span>
              <p className="rs-meta">{t.derisk}</p>
            </li>
          ))}
        </ul>
        <div className="rs-h2">Publications</div>
        <ul className="rs-list">
          {about.papers.map((p) => (
            <li key={p.href}>
              <a href={p.href} target="_blank" rel="noopener">
                {p.name}
              </a>{' '}
              — <span className="rs-meta">{p.venue}</span> {p.note}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // credentials / background: certs, badges, skills, languages, vendors
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">background</p>
      <h2 className="rs-title">Background &amp; certifications</h2>
      <div className="rs-h2">Certifications</div>
      <div className="rs-cards">
        {about.certs.map((c) => (
          <div key={c} className="rs-card">
            <b>{c}</b>
          </div>
        ))}
      </div>
      <div className="rs-h2">Issued badges</div>
      <ul className="rs-certs">
        {about.badges.map((b) => (
          <li key={b.url}>
            <a className="rs-cert" href={b.url} target="_blank" rel="noopener" title={`Verify: ${b.name}`}>
              <span className="rs-cert-img">
                <img src={`/assets/badges/${b.img}.webp`} alt={`${b.name}, ${b.issuer}`} width={72} height={72} loading="lazy" decoding="async" />
              </span>
              <span className="rs-cert-name">{b.name}</span>
              <span className="rs-meta">{b.issuer} · {b.year}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="rs-h2">Skills</div>
      <div className="rs-cards">
        {Object.entries(about.skills).map(([area, list]) => (
          <div key={area} className="rs-card">
            <b>{area}</b>
            <p>{list}</p>
          </div>
        ))}
      </div>
      <div className="rs-h2">Languages</div>
      <p className="rs-meta">{about.languages.join(' · ')}</p>
      <div className="rs-h2">Vendor experience</div>
      <p className="rs-meta">{about.vendors.join(' · ')}</p>
    </div>
  );
}
