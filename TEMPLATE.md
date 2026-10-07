# Using this site as a template

Retargeted from the specstride.ai site template. Everything on the site is **data**,
not design: pages and components read the content collections in `src/content/`,
validated by the Zod schemas in `src/content.config.ts`. A typo in a data file fails
the build with the file and field named.

## Recipes

### Edit a service
`src/content/services/<id>.md` — front matter (`name`, `oneLine`, `summary`,
`deliverables[]`, `evidence[]`, `vendors[]`, `duration`, `status`, `related[]`) plus an
optional Markdown body that becomes the service page's depth. The home grid, the
`/services/<id>/` page and the "pairs with" cards all render from it.

### Add an engagement shape / FAQ entry / proof card
Append to `src/content/engagements.yaml`, `faq.yaml` or `proof.yaml`. FAQ answers accept
`` `code` `` and `[text](https://…)` and nothing else (escaped by `src/lib/inline-md.ts`).

### Site-wide copy, nav, vendors, certs
`src/lib/site.ts` (SITE, NAV, VENDORS, CERTS, METHOD).

### Colours and type
`src/styles/tokens.css` only. Both themes must stay WCAG AA (`scripts/a11y.mjs` checks).

### The mark and social card
`scripts/mark.mjs` (geometry) and `scripts/gen-og.mjs` (raster); `npm run build`
regenerates `public/og.png`, icons and favicons.

### The Open Source grid
`src/content/repos.yaml` is **generated** daily by `/root/portfolio-sync` — never edit
by hand. Categories and wording live in that pipeline's `overrides.json`.

## Quality checks

```bash
npx wrangler dev --port 8788                     # serve dist/ like production
node scripts/screens.mjs http://127.0.0.1:8788   # screenshots, 390/768/1440, both themes
node scripts/a11y.mjs http://127.0.0.1:8788      # axe-core on every page, both themes
npx linkinator http://127.0.0.1:8788/ --recurse  # links
npx lighthouse http://127.0.0.1:8788/            # mobile Lighthouse
```

CI (`.github/workflows/ci.yml`) runs build, `astro check`, the link check and
Lighthouse CI on every PR and on `main`.
