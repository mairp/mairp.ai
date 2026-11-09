# Prompt 3 — derive & run the whole pipeline to a merged PR (unattended-safe)

Execute the full delivery pipeline for the Whole-Site 3D Experience feature
(`specs/001-whole-site-3d/`) from the current working tree to an automatically
merged PR. Follow the phases strictly in order. The overriding rule: **never get
blocked on something stupid** — every gate has a defined unblock procedure below;
if a gate fails, apply its fix loop (max 3 attempts, then record the failure and
continue with the safest fallback, never skipping a hard gate silently).

Repo facts (verified 2026-11-10): GitHub `mairp/mairp.ai`, `gh` CLI authenticated
as `mairp`; CI workflow `.github/workflows/ci.yml` runs on every PR: `npm run build`
(incl. `scripts/csp-hash.mjs`) → `npm run check` → linkinator → LHCI
(`lighthouserc.json`, ≥0.95 × 4 categories on `/`, `/services/svc-agentic-netops/`,
`/about/`). Job/check name: `build` / "Build / astro check / Link check /
Lighthouse CI". The `deploy` job only fires on push to `main` and is a no-op
without Cloudflare secrets — deploys stay manual (`npm run deploy`) per
DECISIONS.md; DO NOT change that.

## Phase 0 — Branch & commit hygiene (no blockers allowed)

1. Create the feature branch `specs/001-whole-site-3d` from the current `main`
   working tree (do NOT stash or discard anything; all current uncommitted changes
   belong to this feature).
2. Commit in small logical groups (specs artifacts; then each implementation group),
   Conventional-Commit style (`feat(room3d): ...`, `docs(specs): ...`). Every
   commit must keep `npm run build && npm run check` green — if a group cannot be
   made green, finish it to green before committing (that is the anti-blocker rule,
   not an excuse to skip).
3. Do NOT touch: `src/content/repos.yaml` (portfolio-sync generated),
   `public/og.png`/icons (gen-og/mark.mjs outputs), the CSP hash output,
   `.github/workflows/ci.yml` (except nothing), deploy scripts. These are the
   classic stupid blockers — treat edits to them as bugs and revert.

## Phase 1 — Implementation (`/speckit-implement`)

4. Execute `specs/001-whole-site-3d/tasks.md` top-to-bottom (T006 → T099; T001–T005
   are already done). One task = one commit where practical; the tasks were
   deliberately split to the smallest viable scope — keep it that way, do not
   merge tasks or batch unrelated files.
5. Source of truth while implementing (resolve every question from these, never
   invent): `plan.md`, `research.md` (esp. R4 per-route JSON payloads per FR-016,
   R6 procedural environment, R9 perf recipe, R10/R11 fallback+CSP), `data-model.md`,
   `contracts/room-payload.schema.md`, `contracts/url-room-map.md`,
   `contracts/island-events.md`, `quickstart.md`, and `spec.md` FRs. Constitution
   (`.specify/memory/constitution.md`) applies to every task: evidence-backed
   claims (FR-010), data-driven content (FR-007), performance budgets (FR-002/SC-003),
   deploy safety (no CI/deploy changes), content neutrality (FR-015 — zero demo
   content; audit gate T093).
6. Task T092 (audio) is optional — skip it if it would add risk or scope; skipping
   a marked-optional task is never a blocker.

## Phase 2 — Local gate loop (fix before push, max 3 fix iterations per gate)

7. Run the full local gate: `npm run build && npm run check`, then
   `npx astro preview --port 4321 &` + linkinator with the same skip flags CI uses
   (copy them from `.github/workflows/ci.yml` exactly), then `npx @lhci/cli autorun`.
8. Known trap doors (fix proactively, don't wait for CI):
   - **csp-hash fails** → a second inline script or an inlined payload snuck into a
     page: payloads must come from `/rooms/*.json` fetches (FR-016), never inline
     JSON in HTML; island code is external modules only.
   - **LHCI perf regression** → something three.js is reachable at first paint:
     enforce the requestIdleCallback mount gate and manualChunks split (T085),
     never loosen lighthouserc.json thresholds (that is a forbidden shortcut).
   - **linkinator failures** → trailing slash drift: every internal URL keeps
     `trailingSlash: 'always'` semantics; pushState URLs end with `/`.
   - ** astro check failures** → strict TS in the island: type payloads via
     `src/lib/room-payload.ts` types; no `any` escapes.
9. If a gate still fails after 3 fix loops, STOP that gate, write the failing
   output + diagnosis to `specs/001-whole-site-3d/notes.md`, and do not open the
   PR with a red local gate unless the failure is provably environment-only
   (e.g. missing local service) — note that proof in the PR body.

## Phase 3 — Pre-merge specstride gate (dry-run)

10. Run the `specstride-run` skill in **`dry-run` mode** against the feature's
    launch contract (derived from spec.md success criteria + quickstart.md gates).
    Dry-run stops after the plan — it changes nothing; that is the point: it is a
    free consistency check of the launch contract before merge.
11. If the dry-run plan reports contract errors, fix the contract/artifacts and
    re-run (max 3 loops). Record "specstride dry-run: clean" in the PR body.
    Do NOT run a full specstride launch in this pipeline — full launches are a
    separate, explicit human-invoked step after merge.

## Phase 4 — PR & automatic merge (Mergify)

12. Push the branch and open the PR to `main` with `gh pr create`; title
    `feat: whole-site 3D experience (specs/001-whole-site-3d)`; body must include:
    summary, the spec/plan/tasks links, gate results (build/check/link/LHCI +
    boot-time note from T068/T098 + content audit from T093), and the specstride
    dry-run result. Do not request reviewers (merge is unattended).
13. Add the Mergify configuration as part of the PR (file `.github/mergify.yml`;
    if the repo prefers root `mergify.yml`, that works too — pick one, don't add
    both). Rule: merge `specs/001-whole-site-3d` → `main` when **CI is green only,
    no review required**:

    ```yaml
    # .github/mergify.yml — requires the Mergify GitHub App installed on mairp/mairp.ai
    queue_rules:
      - name: default
        conditions:
          - check-success=Build          # ci.yml job "build" (includes astro check, linkinator, LHCI)

    pull_request_rules:
      - name: automatic merge on green CI
        conditions:
          - base=main
          - -draft
          - check-success=Build
          - author=mairp
        actions:
          queue:
            name: default
            method: squash
    ```

    Adapt the `check-success` value to the actual check name GitHub reports
    (verify with `gh pr checks` once CI starts; the ci.yml job id is `build`).
    Use squash to keep `main` history clean; delete the branch after merge.
14. Enable GitHub auto-merge on the PR as a **belt-and-braces fallback**
    (`gh pr merge --auto --squash`) so the merge still happens via native
    auto-merge if the Mergify App is not (yet) installed on the repo — this is
    the #1 stupid blocker; do not let Mergify App absence stall the pipeline.
    If neither mechanism is available, stop and report instead of force-merging.
15. Watch the PR (`gh pr checks --watch` in a bounded loop). On CI failure, apply
    the Phase 2 fix loop on the same branch (push fixes; Mergify/auto-merge
    re-evaluates automatically). Max 3 fix-push cycles; then report the failure.
16. After merge: delete the remote branch, pull `main` locally, run the full gate
    once more on `main` (`npm run build && npm run check`) to confirm the merged
    state is green, and append a completion entry to `specs/001-whole-site-3d/notes.md`
    (merge SHA, gate results, boot-time measurement, audit table reference).
    Production deploy remains a manual `npm run deploy` — never automated here.

## Hard rules (violations = pipeline bugs, not shortcuts)

- Never edit: repos.yaml, generated OG/icon artifacts, lighthouserc thresholds,
  ci.yml, CSP hash output, or deploy scripts.
- Never inline payload data into page HTML (FR-016); never add a second inline
  script (FR-014/csp-hash).
- Never loosen a gate to make it pass; fix the cause.
- Never force-merge, bypass branch protection, or merge with red checks.
- Never run a full (non-dry) specstride launch inside this pipeline.
- `/404` stays fully static; no-JS visitors always get complete flat HTML.

## Definition of done

PR `specs/001-whole-site-3d` → `main` exists with all gates green, Mergify rule
merged in it, and the PR is merged (squash) automatically; local `main` re-verified
green; notes.md records the run. Report: merge SHA, task completion count
(T006–T099, with any intentionally skipped optional tasks), gate outputs summary,
and any deviation + reason.
