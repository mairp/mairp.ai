/**
 * FaqScreen.tsx — the FAQ set (feature 001-whole-site-3d, T051/T087). Questions
 * come from the payload; the full answers are fetched lazily from `/api/faq.json`
 * when the screen opens (after scene-ready). Answers render only sanitized
 * inline markup (code spans + text links) via the Inline renderer.
 */
import { useRoom3D } from '../../context';
import { Inline } from './Inline';
import { useLazyDoc } from './useLazyDoc';

interface FaqDoc {
  items: { id: string; a: string }[];
}

export function FaqScreen() {
  const { payload } = useRoom3D();
  const { data, state } = useLazyDoc<FaqDoc>('faq');
  const answers = new Map((data?.items ?? []).map((i) => [i.id, i.a]));
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">faq</p>
      <h2 className="rs-title">Frequently asked</h2>
      {state === 'error' && <p className="rs-meta">Answers could not be loaded — see the flat site.</p>}
      <div className="rs-cards">
        {payload.faq.map((f) => (
          <div key={f.id} className="rs-card">
            <b>{f.q}</b>
            <p>{answers.has(f.id) ? <Inline text={answers.get(f.id)!} /> : state === 'loading' ? '…' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
