/**
 * FocusScreen.tsx — hero screen (feature 001-whole-site-3d). Renders the
 * practice tagline/caption/practice strings from the payload's AboutData
 * (site.ts verbatim) — no narrative copy of the island's own (contract
 * rule 6).
 */
export function FocusScreen({ title, lede, meta }: { title: string; lede: string; meta: string }) {
  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">mairp.ai</p>
      <h1 className="rs-title">{title}</h1>
      <p className="rs-lede">{lede}</p>
      <p className="rs-meta">{meta}</p>
    </div>
  );
}
