/**
 * EngagementsScreen.tsx — engagement shapes (feature 001-whole-site-3d, T053):
 * name, duration, deliverable and prerequisites from the payload's Engagement
 * records (homepage content collection).
 */
import { useRoom3D } from '../../context';

export function EngagementsScreen() {
  const { payload } = useRoom3D();
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">engagement shapes</p>
      <h2 className="rs-title">Ways to work together</h2>
      <div className="rs-cards">
        {payload.engagements.map((e) => (
          <div key={e.id} className="rs-card">
            <b>{e.name}</b> <span className="rs-badge">{e.duration}</span>
            <p>
              <b>Deliverable:</b> {e.deliverable}
            </p>
            <p>
              <b>Prerequisites:</b> {e.prerequisites}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
