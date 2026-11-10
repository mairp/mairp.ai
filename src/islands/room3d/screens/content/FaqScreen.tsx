/**
 * FaqScreen.tsx — the FAQ set (feature 001-whole-site-3d, T051). Answers
 * render only the payload's sanitized inline markup (code spans + text
 * links) via the Inline renderer — same rules as the flat page's inline-md.
 */
import { useRoom3D } from '../../context';
import { Inline } from './Inline';

export function FaqScreen() {
  const { payload } = useRoom3D();
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">faq</p>
      <h2 className="rs-title">Frequently asked</h2>
      <div className="rs-cards">
        {payload.faq.map((f) => (
          <div key={f.id} className="rs-card">
            <b>{f.q}</b>
            <p>
              <Inline text={f.a} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
