# Project Constitution

## Principles

1. **Claims must be evidence-backed** — every marketing claim on mairp.ai maps to evidence per DECISIONS.md; no invented content.
2. **Content stays data-driven** — page content flows from `src/content/` collections; do not hardcode copy in templates.
3. **Performance budgets hold** — Lighthouse budgets in `lighthouserc.json` must not regress; 3D must be lazy-loaded with graceful fallbacks.
4. **Deploy safety** — CI never deploys; deploys are explicit via `npm run deploy`; rollback path must remain intact.
5. **Content neutrality & provenance** — reference repositories may contribute only aesthetics/mechanics; all content must be traceable to owner-authored sources (content collections, CV/bio data, GitHub/portfolio data). No topics, narratives, editorial framing, or branding from reference repos may ship.
