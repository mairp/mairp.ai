/**
 * ReposScreen.tsx — the full open-source repos grid (feature 001-whole-site-3d,
 * T049), grouped by the 5 categories of the generated repos.yaml (read-only
 * data; contract rule 3). Names/URLs/descriptions come verbatim from the
 * payload's RepoSummary records.
 */
import { useRoom3D } from '../../context';
import { REPO_CATEGORIES, type RepoCategory } from '../../../../lib/room-payload';

/** Category labels mirror the flat homepage's grid headers (mairp-owned). */
const LABELS: Record<RepoCategory, string> = {
  network: 'Network & fabric',
  agents: 'Agents & platforms',
  inference: 'Local inference',
  method: 'Method & delivery',
  applied: 'Applied agents',
};

export function ReposScreen() {
  const { payload } = useRoom3D();
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">open source</p>
      <h2 className="rs-title">Open-source engineering</h2>
      {REPO_CATEGORIES.map((cat) => {
        const repos = payload.reposByCategory[cat] ?? [];
        if (repos.length === 0) return null;
        return (
          <div key={cat} className="rs-sec">
            <div className="rs-h2">
              {LABELS[cat]} · {repos.length}
            </div>
            <div className="rs-cards">
              {repos.map((r) => (
                <div key={r.url} className="rs-card">
                  <b>
                    <a href={r.url} target="_blank" rel="noopener">
                      {r.name}
                    </a>
                  </b>{' '}
                  <span className="rs-meta">
                    {r.lang}
                    {typeof r.stars === 'number' ? ` · ${r.stars}★` : ''}
                  </span>
                  <p>{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
