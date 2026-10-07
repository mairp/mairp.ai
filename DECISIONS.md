# Decisions

Every choice made while building this site, and why. The build brief lived in
`/root/mairp-transform/PROMPT.md`; the content blueprint is the research-synthesized
`GAMECHANGER-PROFILE.md` (six glm-5.3-flash research agents: positioning, services,
competition, messaging, naming, experience). Newest sections at the bottom.

## Positioning

**The one-line promise**

> Networks that verify themselves. AI you can run on your own GPUs.

The practice is sold the way the reference system works: *nothing is reported done
until the device proves it.* The moat is not "AI" — every boutique says AI — it is
**verifiable sobriety**: dated numbers, public repos, filmed demos, one click away.

**Rejected alternatives**

| Alternative | Why not |
|---|---|
| "AI-native network transformation consulting" | Buzzword soup; indistinguishable from every AI agency; collapses the honesty moat. |
| "Sovereign AI consultancy" (as the lead) | Overclaims: sovereign competence is demonstrated with public artifacts (club-3090, agentic-ops-bench, agent-observability-stack) and one anonymized category; leading with it would be seller-speak. |
| A coined firm name (e.g. "Paz Fabric Works") | Inserts a fiction between personally-authored evidence and the person; implies a staffed firm; must be unwound if employment terms tighten. "The Verified Fabric" survives as the **methodology name**, not the firm name. |

**Brand:** "Marlon Paz — Network & AI Systems Consulting", personally branded, mairp.ai
as the hub. Owner sign-off 2026-10-07 (naming, tagline variant "on your own GPUs",
accent, curated+grouped grid, Core42 as credential line only).

## Claim → evidence map (the honesty rule)

| Claim on the site | Evidence |
|---|---|
| 4/4 constructs converge · 0 unverified success reports · 2·2·4 fabric | `agentic-netops` README + demo video (repo, dated 2026-10); the numbers describe the public reference build only |
| Every LLM call traced; cost per agent/model/task | `agent-observability-stack` (repo + public video walkthrough) |
| 30B-class on 1× RTX 3090 vs hosted frontier | `agentic-ops-bench` (repo, dated runs) |
| ~19× query speedup (Intel Arc iGPU, Vulkan) | `qmd-memory-stack` README |
| Quantum-safe ANYsec/MACsec labs | `sros-anysec-lab`, `sros-anysec-macsec-lab` (containerlab + SROS FP5 vSIMs) |
| IEEE / Springer publications | Linked papers (ieeexplore.ieee.org/document/11080420, link.springer.com/article/10.1186/s13677-025-00814-0) |
| Spec-driven delivery method | `specstride` + specstride.ai (live), `mixture-of-loops` |
| "Sovereign inference routing and policy for a Gulf AI holding" | **Anonymized capability category only** — from private-repo evidence; no repo name, client, topology, or detail is ever shown. Same rule for: industrial agentic AI (oil & gas), ISP subscriber assurance on carrier router OS, guarded agent-operated control planes with GitOps DR, multi-agent fleet orchestration at scale, AI enablement/course-material authoring. |
| CCIE · CKA · DevNet Professional · CCNP DC · Nokia DCFP · NVIDIA AI Infra & Ops · Isovalent Lab Champion | Credly-verified; shown as text with link, never the lead story |
| Vendor fluency incl. Juniper, Red Hat | CV-backed career claim (Tigo/Citi estates, Ansible/RHEL ecosystem); vendors shown as a band, not logos |

No testimonials, no "trusted by" logos, no invented case-study metrics — anywhere.

## Design

- **Accent: Signal Teal `#00B3A4` + cyan `#22D3EE`.** Rejected: NVIDIA green `#76B900`
  (another company's trademark; ties a deliberately multivendor practice to one vendor;
  reads as affiliation the practice cannot claim) and the template's pink `#f07cc0`
  (fails enterprise credibility for GCC energy/government buyers). Teal keeps the
  telemetry-on-dark energy of the previous identity, is WCAG-AA legible on near-black
  in both themes (checked), and "signals instrumentation" — the verified-signal story.
  Dark bg moved to a green-tinted near-black `#0f1512` to sit under the teal.
- **The mark** (`scripts/mark.mjs`): a three-node fabric path whose final node carries
  the verification check — intent in, evidence out, as geometry. OG image, touch icon,
  favicon.ico and favicon.svg all regenerate from it.
- **Micro-differentiators (research agent: experience):** dated-number badges (every
  statistic renders with its source date in a mono chip), verification meters on proof
  cards (pure-CSS fill on hover/focus), the print-to-pitch stylesheet (the page prints
  as a one-page consulting brief — services, proof, contact; orbs/nav/chat removed).
- Kept from the template: co3-style hero (orb + ring + dot grid), glow cards,
  bracket groups, Poppins/Inter/JetBrains Mono (self-hosted), dark/light with AA.

## Information architecture

Home bands (research agent: experience, adopted): hero → proof → services (+ engagement
shapes) → method (the loop) → twin → work & publications (accordions) → open-source
ledger (grouped) → trajectory rail → certs & vendor band → FAQ → contact. Plus
`/services/[id]/` (one page per service from its Markdown file), `/about/` (trajectory,
certs, publications, CV PDF), `/404`.

**Old profile → practice:** CV bullet lists became outcome-led service pages; the
trajectory became a one-line-per-stop rail where each stop names the service it
de-risks; the job-title hero became the practice promise; the Open Source grid moved
from a homepage-wide dump to a **grouped ledger** (`network / agents / inference /
method / applied`) below the curated proof band — daily sync continues (below).
Kept: the demo video (now in the work band, lazy poster frame), publications, EN/ES/PT
band, the twin chat, the CV (as "Consultant profile, PDF").

## The lab twin

Ported from the previous site's widget to a bundled external script (CSP-safe):
XSS-safe linkification (model output never touches innerHTML), single-use Turnstile
tokens with reset-after-send, no-preflight POST (JSON body, no custom headers),
session id in sessionStorage, 30s abort. Reframed per the research synthesis: a
technical Q&A twin grounded in the public work — scope-stated, evidence-bound ("shows
its sources"), no-overclaim (disclosed as an AI agent; itself a served inference app
with telemetry), escalation CTA in the panel, and `data-twin-open` triggers on the
home band and service pages. Turnstile site key is public by design; the Worker
(ask.mairp.ai) was not touched.

## Stack

Unchanged from the template: Astro static, TypeScript strict, zero framework JS,
plain CSS with tokens, content collections with Zod, no `'unsafe-inline'` in the CSP
(styles and scripts external; the one inline theme-init is SHA-256-hashed by
`scripts/csp-hash.mjs`). CSP additions vs the template, all deliberate:
`script-src https://challenges.cloudflare.com` (Turnstile), `connect-src
https://ask.mairp.ai https://challenges.cloudflare.com`, `frame-src
https://challenges.cloudflare.com`, `media-src 'self'` (the demo video). JSON-LD is a
Person + ProfessionalService `@graph`.

## Cloudflare

Only the `mairp.ai` zone and the new Worker `mairp-site` are touched. The
`ask.mairp.ai` Worker and every other Worker/zone are untouched.

- Workers with static assets (as the template): `wrangler.jsonc` deploys `dist/` with
  `not_found_handling: "404-page"` and custom domains `mairp.ai` + `www.mairp.ai`;
  the Worker answers www → apex 301.
- **DNS cutover:** mairp.ai previously pointed at GitHub Pages (A records +
  www CNAME). Adding the Worker custom domains replaces those records. **Rollback**
  is re-creating: apex A ×4 → 185.199.108.153 / 185.199.109.153 / 185.199.110.153 /
  185.199.111.153, www CNAME → mairp.github.io (GitHub Pages keeps serving the old
  site; its repo is untouched).
- Zone settings applied conservatively (SSL Full strict, Always Use HTTPS, TLS 1.2
  min / 1.3, Brotli, HTTP/3). **HSTS deliberately not enabled** on this zone (unlike
  specstride.ai): mairp.ai has other subdomains (ask., vpn.) and HSTS-with-
  includeSubDomains is unnecessary risk here; revisit if desired.
- Deploys stay on the host (`~/.cf-admin.env`); CI builds and checks only.

## Open-source ledger sync

`/root/portfolio-sync` (daily cron) now writes `src/content/repos.yaml` in this repo
(the old target — a marked region of `mairp.github.io/index.html` — is retired with
that page) plus the twin's knowledge base (unchanged). Per-repo `category` (network /
agents / inference / method / applied), descriptions, pins and ordering live in its
`overrides.json`. When the site file changes, the pipeline commits this repo **and
runs `npm run deploy` on the host** so the live grid stays current without any deploy
token in GitHub. Identical GitHub state → byte-identical file → no spurious commits.
