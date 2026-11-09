# Prompt 1 — for `/speckit-specify`

Refactor the mairp.ai website into an immersive whole-site 3D experience, reusing the
interaction MECHANICS of the 3D room-viewer demo at `/root/little-big-questions/room-viewer`
(boot/loading sequence, shot-based cinematic camera rig, clickable in-world screens that
display rich content, CRT-style screen aesthetic, subtle audio cues, cinematic
postprocessing). The demo provides mechanics only — all content, theming, models and assets
must be original and mairp-branded (Signal Teal/cyan palette, dark-first with light theme;
no reuse of the bedroom GLB, news audio, or kids-news branding).

## What the site is today

mairp.ai is the consulting site of Marlon Paz (Network & AI Systems Consulting): an Astro
static site, content-driven from `src/content/` collections, deployed to Cloudflare
Workers, with zero framework JavaScript today. Its brand moat is "verifiable sobriety":
every claim links to dated public evidence per `DECISIONS.md`.

## Scope: whole site in 3D

Every route becomes part of one coherent, navigable 3D environment ("rooms" or
"stations"), not flat pages:

- `/` home: hero, proof cards, services grid (7 services), engagement shapes, "The
  Verified Fabric" method loop, work highlights, open-source repos grid (29 repos, 5
  categories), trajectory rail, background/certs, FAQ (9 items), contact.
- `/services/<id>/` — 7 service detail pages (svc-agentic-netops, svc-aiops-cloudops,
  svc-local-inference, svc-agent-platform, svc-critical-fabric, svc-agent-delivery,
  svc-enablement) each with fact cards, deliverables, evidence, related services.
- `/about` — bio, trajectory timeline, certs/badges, skills, publications, languages.
- `/404` — may stay a themed static page (must remain a real static page).

## Non-negotiable constraints

1. **Content parity**: every piece of current content stays present and readable,
   sourced from the existing `src/content/` collections and `src/lib/site.ts` — no
   content loss, no invented claims; the DECISIONS.md claim→evidence map must hold.
2. **Architecture**: a lazy-loaded client island inside the existing Astro site; Astro
   remains the router of record, generating real static HTML for every URL (SEO,
   sitemap, linkinator, no-JS fallbacks intact); the 3D world overlays/progressively
   replaces the flat pages when WebGL is available.
3. **Deep links**: each room maps 1:1 to a real URL; refresh/deep-link lands in the
   right room; document title/meta/canonical stay correct.
4. **Interactivity parity**: the Twin chat widget (Turnstile-gated, ask.mairp.ai),
   ThemeToggle (dark/light with tokens), CopyButton and copy-email must remain usable
   inside the 3D experience.
5. **Accessibility & performance**: reduced-motion, no-WebGL, low-power and
   `webglcontextlost` fallbacks serve the flat pages; existing Lighthouse ≥0.95 gates
   (performance, accessibility, best-practices, SEO) must not regress; three.js ships
   zero on first paint; heavy assets compressed and self-hosted (strict CSP: `script-src
   'self'`, exactly one hash-pinned inline script; no CDN fetches).
6. **Do not hand-edit**: `src/content/repos.yaml` (generated), OG/icon/CSP artifacts.

## Primary users & scenarios

1. A potential client arrives from search at any URL: understands the offering within
   seconds, whether in 3D or fallback; can reach a service page in one interaction.
2. A user deep-links/refreshes `/services/svc-agentic-netops/`: the 3D experience opens
   directly at that service's room/panel.
3. A mobile or low-power visitor: gets a clean choice/automatic fallback to the flat
   site, never a broken canvas.
4. A crawler or no-JS visitor: sees the existing complete flat pages.

## Success criteria (directional)

- All current routes render full content in both 3D and fallback modes.
- Room navigation keeps URL, title, meta and history in sync; back/forward work.
- First-paint payload of the flat pages is unchanged (3D fully deferred post-LCP).
- Smooth on a mid-range laptop; graceful everywhere else.
