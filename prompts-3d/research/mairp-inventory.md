# mairp.ai — Technical Reference (research agent report)

Site: `/root/mairp.ai` — consulting site for Marlon Paz (Network & AI Systems Consulting), built on the specstride.ai template, static Astro, deployed to Cloudflare Workers at `mairp.ai` + `www`.

## 1. Page map

| Route | File | Renders | Content sources |
|---|---|---|---|
| `/` | `src/pages/index.astro` | Buyer journey, 10 banded sections via `Section.astro`: hero → #proof → #services (+ engagement shapes) → #method ("The Verified Fabric" loop) → #twin → #work (accordions: demo video, IEEE/Springer papers, quantum-safe labs, specstride) → #open-source (repos grouped by category) → #trajectory (5-stop rail) → #background (CertBadges, certs, vendors, quantum-safe card) → #faq → #contact (email + CopyButton + "ladder") | collections: `services`, `proof`, `engagements`, `repos` (via FAQ/CertBadges: `faq`); hardcoded in page: `trajectory[]`, `papers[]`, categories, method loop |
| `/services/<id>/` (7 pages) | `src/pages/services/[id].astro` | `getStaticPaths` per service: name/oneLine hero, shape+outcome fact cards, deliverables, evidence list, `links`, Markdown body (`render(entry)`), "pairs with" related-service cards, scoping CTA + `data-twin-open` | `services` collection only |
| `/about/` | `src/pages/about.astro` | Consultant bio: lede, CTAs (CV PDF, email), trajectory timeline (6 stops incl. B.Sc.), CertBadges + certs/vendors, skills card, quantum-safe bracket, publications, languages | hardcoded in page + `SITE/CERTS/VENDORS/BADGES` from `src/lib/site.ts`; NOT collection-driven |
| `/404` (noindex) | `src/pages/404.astro` | Terminal-styled "NOT VERIFIED" 404, CTAs home/#services | none |
| `/sitemap-index.xml` | @astrojs/sitemap (excludes `/404`) | — | — |

All pages share `src/layouts/Base.astro` (meta/OG/Twitter, canonical, JSON-LD `@graph` of Person + ProfessionalService — note: OfferCatalog list is stale vs the 7 real services, skip link, Header, Footer, Twin widget, inline `THEME_INIT` script, theme-color meta, Poppins preload).

## 2. Content model (`src/content.config.ts`, Zod)

### Collections
- **services** — glob `src/content/services/*.{md,mdx}`, one file per service. Schema: `name:str, order:num, status:enum('available'|'requires-scoping'), oneLine:str, summary:str, statusNote:str(default''), duration:str, deliverables:str[], evidence:str[], vendors:str[] (default[]), links:{label:href:z.url()}[] (default[]), related:id[] (default[])`. Optional MD body → page prose.
- **engagements** — `src/content/engagements.yaml`: `name, order, duration, deliverable, prerequisites`.
- **proof** — `src/content/proof.yaml`: `name, order, badge (dated number), source (where from, dated), url?:url, note`.
- **faq** — `src/content/faq.yaml`: `q, a, order`. Answers allow only `` `code` `` and `[text](url)` (sanitized by `src/lib/inline-md.ts`).
- **repos** — `src/content/repos.yaml`: `name, url, description, lang?, langColor?, stars?:num, forks?:num|'fork', category:enum('network'|'agents'|'inference'|'method'|'applied'), pinned:bool(default false), order`. **GENERATED daily by /root/portfolio-sync — never hand-edit.**

### Content entity inventory

**Services (7; home grid renders 3+3+1):**
| id | name | order | status | duration |
|---|---|---|---|---|
| svc-agentic-netops | Agentic Network Operations — Intent-to-Fabric | 1 | available | 8–12 wks (PoC 4–6) |
| svc-aiops-cloudops | Agentic CloudOps & AIOps — Signal to Action | 2 | available | 6–10 wks |
| svc-local-inference | Sovereign Inference & GPU Economics | 3 | available | 6–10 wks |
| svc-agent-platform | Agent-Fleet Platform — Memory, Routing, Observability | 4 | available | 8–12 wks |
| svc-critical-fabric | Critical-Network Security & Telemetry Assessment | 5 | available | 3–6 wks |
| svc-agent-delivery | Applied Agent Delivery | 6 | available | 4–8 wks/workflow |
| svc-enablement | Fractional Architecture & Team Enablement | 7 | requires-scoping | 3–12 mo retainers |

**Proof cards (4):** agentic-netops ("4/4 constructs converge · 0 unverified success reports") · agent-observability-stack ("every LLM call traced · cost per agent, model, task") · agentic-ops-bench ("30B-class on 1× RTX 3090 vs hosted frontier") · qmd-memory-stack ("~19× query speedup (Intel Arc iGPU, Vulkan)").

**Engagements (6):** Architecture & Strategy Advisory · Automation/Inference Readiness Assessment · Fabric Convergence Proof-of-Value · Implementation & Delivery · AIOps & Agent-Platform Build · Fractional Architect & Enablement (each with deliverable + prerequisites).

**FAQ (9):** build-vs-advise · vendors · confidentiality · engagement shape · local-vs-cloud · pricing · agent control · training · applied quantum-safe.

**Repos (29)** grouped network/agents/inference/method/applied.

**About/CV (in `src/lib/site.ts`, not collections):** `SITE` (Marlon Paz, marlon.paz@ieee.org, tagline "Infrastructure that verifies itself.", caption "AI you can run on your own GPUs.", Abu Dhabi UAE, EN/ES/PT, CV PDF, github/linkedin/credly) · `NAV` (4) · `VENDORS` (7) · `CERTS` (10) · `BADGES` (15-entry wall, self-hosted webp) · `METHOD = 'The Verified Fabric'` · trajectory (Tigo → Citi → Cisco/Layer2 → Nokia → Core42) · papers (IEEE 11080420, Springer s13677-025-00814-0) · skills map.

## 3. Theming

- Tokens in `src/styles/tokens.css` only. Fonts: Poppins (display), Inter Variable (sans), JetBrains Mono (mono), self-hosted.
- Dark default: bg `#0f1512`, surface `#161d1a`/`#1d2622`, border `#2c3a35`, fg `#d2ddd8`, muted `#93a5a0`, **accent Signal Teal `#00b3a4` + cyan `#22d3ee`**. Light: bg `#fafaf7`, accent `#0a7d70`/`#0e7490`.
- Theme: `:root` dark default; light via media query + `[data-theme='light']`. `THEME_INIT` inline pre-paint, SHA-256-hashed into CSP by `scripts/csp-hash.mjs`. Both themes must stay WCAG AA (`scripts/a11y.mjs`).

**Brand voice/claims:** personally branded; taglines above; moat = **verifiable sobriety** — every claim links to dated public evidence; "The Verified Fabric" methodology name only; no testimonials/logos/invented metrics; confidential work = anonymized capability categories; NVIDIA green/pink rejected as accents; vendor band text-only.

**Claim→evidence rules (DECISIONS.md) must hold in any redesign:** 4/4 constructs → agentic-netops repo/video; LLM tracing → agent-observability-stack; 30B-on-3090 → agentic-ops-bench; 19× → qmd-memory-stack; quantum-safe → sros labs; publications → IEEE/Springer; method → specstride + mixture-of-loops; Gulf AI/oil&gas/ISP → anonymized categories only; certs → Credly/NVIDIA verify links; vendor fluency → CV-backed band.

## 4. Build / deploy constraints

- **Astro ^7.3.5**, `output: 'static'`, `trailingSlash: 'always'`, integrations: @astrojs/mdx, @astrojs/sitemap. `inlineStylesheets: 'never'`, `assetsInlineLimit: 0`, `cssCodeSplit: false`. Node ≥22, TS strict. **Zero framework JS today.**
- **CSP** (scripts/csp-hash.mjs): hashed inline theme-init only; allowlist for challenges.cloudflare.com + `https://ask.mairp.ai` connect; media-src 'self'. **Any new external scripts must be added to the CSP deliberately.**
- **lighthouserc.json**: `/`, `/services/svc-agentic-netops/`, `/about/`; **assert ≥0.95 error on performance, accessibility, best-practices, SEO.**
- CI: build → astro check → linkinator → LHCI → artifact. Deploy only on main push with CF secrets; `npm run deploy` via scripts/deploy.sh + ~/.cf-admin.env. Worker: www→apex 301 + ASSETS fetch, 404-page handling. Rollback = GitHub Pages. HSTS off.
- Perf decisions to respect: text-wrap balance h1/h2 only; hover-only halos; SVG dot tile; no per-card scroll timelines on repo cards; content-visibility on below-fold bands; measured TBT 140ms / CLS 0.018.

## 5. Must NOT be hand-regenerated

`src/content/repos.yaml` (portfolio-sync) · `public/og.png`, icons/favicons (scripts/mark.mjs + gen-og.mjs) · CSP hash.

## 6. Existing JS interactivity (vanilla, CSP-safe)

- ThemeToggle: `[data-theme-toggle]`, persists localStorage.theme.
- CopyButton: `button.copy[data-copy]`, aria-live.
- **Twin** chat (`src/components/Twin.astro`): launcher + dialog; opens via `[data-twin-open]`; POSTs to `https://ask.mairp.ai` with Turnstile gating; session in sessionStorage; XSS-safe linkification; hidden in print. **Must keep working in the 3D redesign.**
- FAQ: native details/summary. CSS-only: `.reveal` (guarded), `.meter`, glow cards, print stylesheet.
