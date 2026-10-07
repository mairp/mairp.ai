# mairp.ai

The website of Marlon Paz's consulting practice — **Network & AI Systems Consulting**:
multivendor network automation, agentic NetOps/CloudOps, and sovereign local inference.
Live at **https://mairp.ai**.

Built on the [specstride.ai](https://github.com/mairp/specstride.ai) site template (MIT).
Services, engagement models, proof cards, FAQ entries and the Open Source grid are data
in `src/content/`; pages render from them. See [TEMPLATE.md](TEMPLATE.md) and
[DECISIONS.md](DECISIONS.md) (every choice, and the claim → evidence map).

## Run it locally

Needs Node.js 22 or newer.

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # regenerates icons and the OG image, then builds to dist/
npm run check      # astro check (types and templates)
npm run preview    # serve dist/
```

## Deploy

```bash
npm run deploy     # builds and deploys Worker "mairp-site" to mairp.ai (+www)
```

Reads `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from `~/.cf-admin.env` (never
committed). CI builds and checks but never deploys. Rollback: GitHub Pages still serves
the previous site — see DECISIONS.md → Cloudflare.

## The Open Source grid

`src/content/repos.yaml` is generated daily by the unattended `portfolio-sync` pipeline
(`/root/portfolio-sync`); do not edit it by hand. Per-repo descriptions, categories and
pins live in that pipeline's `overrides.json`.

## Licences

Site code: MIT. The CV PDF and the demo video are Marlon Paz's; the mark and OG art are
generated from `scripts/mark.mjs`.
