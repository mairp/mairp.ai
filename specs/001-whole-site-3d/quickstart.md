# Quickstart: Validating the Whole-Site 3D Experience

Prerequisites: Node ≥ 22, deps installed (`npm i`), working dir `/root/mairp.ai`. The
v1 environment is procedural (in-code geometry — see research.md R6); a compressed GLB
in `public/assets/models/` is an optional later swap and not needed to validate.

## 1. Build & policy gates (must pass)

```bash
npm run build        # gen-og → astro build → csp-hash (fails on any 2nd inline script)
npm run check        # astro check (TS strict)
npx linkinator dist --recurse   # (CI flags apply) links/canonicals intact
npx lhci autorun     # ≥0.95 × {performance, accessibility, best-practices, SEO}
                     # on /, /services/svc-agentic-netops/, /about/
```

Expected: all green; dist HTML contains complete flat content per route; exactly one
hash-pinned inline script per page.

## 2. Run and walk the site in 3D

```bash
npm run dev   # http://localhost:4321
```

Walkthrough (desktop, WebGL2 browser):
1. Open `/` → boot overlay shows progress → scene fades in → hero/proof content visible
   on in-world screens; flat content still present beneath (view-source / disable JS to confirm).
2. Click "Services" navigation → camera tween → 7 services readable with one-liners.
3. Click a service → URL becomes `/services/<id>/`, title updates, service detail screens
   (facts, deliverables, evidence links, related) readable; evidence links open in new tab.
4. Browser Back → previous room; Forward → service room again; Refresh → same room.
5. Toggle theme (ThemeToggle) → 3D colours remap live; toggle back.
6. Open the Twin chat from a 3D screen trigger → existing dialog works (Turnstile flow).
7. Copy email from the contact screen → clipboard contains address; aria-live announces.
8. Visit `/about/` directly in a NEW tab → boots straight into the about room.
9. Visit `/services/svc-enablement/` (requires-scoping service) → status note shown.
10. Visit a bogus URL → static themed 404, island not mounted.

## 3. Fallback scenarios

- No WebGL (Chrome: disable via flag / block WebGL): every route → flat page, no
  canvas, no `#boot` stuck, console clean.
- JS disabled: every route → complete flat content (the pre-refactor site).
- Reduced motion (OS setting): 3D allowed but transitions are jump cuts; postprocessing
  off; boot animations static.
- Decline control (FR-009): click "use flat site" at boot → flat page, island unmounted;
  reload → stays flat (preference persisted); footer re-enable → 3D returns. Repeat the
  decline from inside a running 3D session.
- Low-power emulation (hardwareConcurrency ≤ 4): lite mode (no N8AO, dpr 1) still usable;
  capable touch device (portrait 360 px): 3D on by default, tap targets ≥44 px.
- Context loss (devtools or stress test): canvas layer drops, flat page revealed.
- Payload fetch failure (block `/rooms/*.json` in devtools): boot surfaces the failure
  and the flat page is shown (edge case: offline/asset failure mid-boot).

## 4. Performance spot checks

- Network tab on cold load of `/`: no three.js/GLB request before primary content
  render (island deferred); deferred JS bundle ≤ ~300 KB gz; GLB ≤ ~2 MB compressed.
- FR-016 check: view-source any route — payload data is NOT inlined in the HTML; the
  island fetches `/rooms/<route>.json` at boot (same-origin, ≤ ~30 KB).
- Boot-to-usable timing (SC-009): scripted check (Playwright) — cold load `/` on a
  mid-range profile, measure from navigation start to `#boot` hidden: ≤10 s target,
  ≤20 s hard ceiling; key content progressively readable during boot.
- Lighthouse CI passes on all three audited routes (gate #1).

## 5. Content-parity checklist

For each route, diff the information presented in 3D screens against the flat page:
same claims, same evidence links (spot-check proof badge URLs), same facts. Any missing
content or rewritten evidence URL is a defect (FR-007/FR-010).

## 6. Content-source audit (ship gate — FR-015/SC-008)

- Extract every user-visible string and list every asset used by the island
  (`src/islands/room3d/`, screen components, boot copy, environment props).
- For each, verify provenance in mairp-owned sources: `src/content/` collections,
  `src/lib/site.ts` (CV/bio, certs, trajectory, papers), `src/content/repos.yaml`
  (GitHub portfolio), or mairp brand assets (`scripts/mark.mjs` lineage).
- Verify ZERO strings/assets trace to the reference demo (`/root/little-big-questions`)
  — no topics, stories, editorial framing, mascots, voices, bumper copy, partner names,
  palette or fonts from that repo. Allowed from the demo: code-pattern study only
  (mechanics/aesthetics), never content.
- The experience must read as a professional consulting portfolio (page + CV + GitHub
  work), not as a news/editorial product. Any failure blocks ship.
