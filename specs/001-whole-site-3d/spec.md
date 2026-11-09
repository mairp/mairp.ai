# Feature Specification: Whole-Site 3D Experience

**Feature Branch**: `001-whole-site-3d`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Refactor the mairp.ai website into an immersive whole-site 3D experience, reusing the interaction MECHANICS of the 3D room-viewer demo at /root/little-big-questions/room-viewer (boot/loading sequence, shot-based cinematic camera rig, clickable in-world screens that display rich content, CRT-style screen aesthetic, subtle audio cues, cinematic postprocessing). The demo provides mechanics only — all content, theming, models and assets must be original and mairp-branded (Signal Teal/cyan palette, dark-first with light theme; no reuse of the bedroom GLB, news audio, or kids-news branding). Every route becomes part of one coherent, navigable 3D environment delivered as a lazy-loaded client island inside the existing Astro static site, with content parity, deep links, interactivity parity, and accessibility/performance guardrails intact."

## Content Neutrality (non-negotiable)

The reference demo (`/root/little-big-questions/room-viewer`) is a children's news show
whose content covers geopolitically sensitive current-affairs topics (war, elections,
inequality, climate narratives) and carries an editorial/mascot/branding identity.
**Only its visual and interaction AESTHETICS may be studied and adapted** — boot-screen
pattern, camera-rig mechanics, screen-material styling, audio-cue approach,
postprocessing recipe. Nothing else may be inherited:

- NO topics, narratives, news stories, editorial framing, mascots, voices, show rundowns,
  bumper copy, partner/brand references, or palette from the demo may appear in mairp.ai.
- ALL content shown in the 3D experience MUST originate from Marlon Paz's own materials:
  the site's existing content collections (`src/content/`), `src/lib/site.ts` (bio/CV
  data, certs, trajectory, papers), and the GitHub/portfolio data already consumed via
  the generated `repos.yaml` (portfolio-sync). No external or invented content.
- The experience presents a professional consulting practice; it is not a news or
  commentary product. It MUST NOT editorialize, take positions, or reference current
  events beyond the practice's own evidence-backed technical claims.

## Scope: Routes & Content Inventory

Every route of the site becomes part of one coherent, navigable 3D environment
("rooms"/"stations") — not flat pages overlaid:

- `/` home: hero, proof cards, services grid (7 services), engagement shapes,
  "The Verified Fabric" method loop, work highlights, open-source repos grid
  (29 repos, 5 categories), trajectory rail, background/certs, FAQ (9 items), contact.
- `/services/<id>/` — 7 service detail pages (svc-agentic-netops, svc-aiops-cloudops,
  svc-local-inference, svc-agent-platform, svc-critical-fabric, svc-agent-delivery,
  svc-enablement), each with fact cards, deliverables, evidence, related services.
- `/about` — bio, trajectory timeline, certs/badges, skills, publications, languages.
- `/404` — remains a themed static page (a real static page; never replaced by 3D).

All content is sourced from the existing `src/content/` collections and
`src/lib/site.ts`; no content is lost, none invented, and the DECISIONS.md
claim→evidence map must hold everywhere it appears (flat or 3D).

## Clarifications

### Session 2026-11-10

- Q: Should in-3D navigation be a persistent client-side session or a full page load per room? → A: Persistent session — rooms swap via history.pushState with no page reload; the 3D world never re-boots between rooms.
- Q: How is each route's Room Payload delivered to the 3D layer? → A: Self-hosted per-route JSON fetched at 3D boot; payloads are not inlined into first-paint HTML.
- Q: Is the 3D experience enabled by default on mobile? → A: Yes, on capable touch devices, with the lite mode auto-selected on low-power hardware.
- Q: Can a visitor permanently decline the 3D experience in favour of the flat site? → A: Yes — an explicit "use flat site" control at boot and during 3D, persisted as a preference.
- Q: What is the boot-time budget for the 3D experience becoming usable? → A: Target ≤10 seconds, hard ceiling ≤20 seconds on a mid-range laptop over broadband, with content progressively readable at the ceiling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and navigate the practice in 3D (Priority: P1)

A potential client arrives at the site (any entry URL) and experiences an immersive 3D
environment that presents mairp.ai's services, proof, methodology and contact paths.
From the entry room they can move — via camera shots and clickable in-world screens —
to any other area (services, proof, open-source, about, FAQ, contact) and read the real
site content on in-world panels.

**Why this priority**: this is the core value of the refactor; without a working,
readable, navigable 3D presentation of the practice, nothing else matters.

**Independent Test**: open the homepage, wait for the 3D world to boot, navigate from
the entry room to a service room and read that service's summary, deliverables and
evidence on an in-world screen; deliverable = a complete, readable journey in 3D.

**Acceptance Scenarios**:

1. **Given** the site loads in a WebGL-capable desktop browser, **When** the boot
   sequence completes, **Then** a 3D environment themed with mairp branding is visible
   with the homepage content (hero, proof badges, service names) presented in-world.
2. **Given** the 3D experience is active, **When** the visitor selects a navigation
   affordance (screen, hotspot, or shot control) for "Services", **Then** the camera
   transitions smoothly to the services area and all 7 service names with one-line
   summaries are readable — a service page is reachable in a single interaction from
   the entry room.
3. **Given** the services area, **When** the visitor clicks a specific service, **Then**
   its full detail content (fact cards, deliverables, evidence, related services,
   duration, status) is displayed on readable in-world screens.
4. **Given** any room, **When** the visitor selects "Contact", **Then** the email
   address with working copy-to-clipboard and the Twin chat entry point are reachable
   and functional inside the 3D experience.

---

### User Story 2 - Deep links land in the right place (Priority: P1)

A user who opens or refreshes a specific URL — e.g. `/services/svc-agentic-netops/` or
`/about` — enters the 3D experience directly positioned at the room/panel corresponding
to that URL, with the browser URL, page title, meta description and history behaving
normally (back/forward navigate rooms).

**Why this priority**: the site's URLs are its SEO and sharing surface; a 3D layer that
breaks deep linking would break the business.

**Independent Test**: paste each existing route into a fresh browser tab and verify the
3D experience opens at the matching room and the fallback HTML for that route is also
correct.

**Acceptance Scenarios**:

1. **Given** a fresh tab, **When** the user opens `/services/svc-critical-fabric/`,
   **Then** the 3D experience boots directly into that service's room without manual
   navigation, and the document title/description match the service.
2. **Given** inside the 3D experience, **When** the user navigates between rooms,
   **Then** the URL updates to the matching route and the browser back button returns
   to the previous room.
3. **Given** inside the 3D experience, **When** the user refreshes, **Then** the same
   room reopens.

---

### User Story 3 - Graceful fallback everywhere (Priority: P2)

A visitor without WebGL support, with JavaScript disabled, on a low-power device, with
reduced-motion preference, or after a WebGL context loss, gets the existing complete
flat pages (all content, ThemeToggle, CopyButton, Twin chat) instead of a broken or
blank canvas.

**Why this priority**: the site serves professional clients on unknown devices; the
fallback is the safety net that keeps the business reachable and preserves SEO and the
site's Lighthouse posture.

**Independent Test**: load every route with WebGL disabled / JS disabled / reduced-motion
emulated and verify the full flat content renders and current interactivity works.

**Acceptance Scenarios**:

1. **Given** a browser with WebGL disabled, **When** any route loads, **Then** the
   complete flat page content is shown with no 3D attempt and no console errors
   surfacing to the user.
2. **Given** reduced-motion is enabled, **When** the 3D experience runs, **Then** camera
   flights become jump cuts and non-essential animation is suppressed.
3. **Given** the 3D experience is running, **When** the WebGL context is lost, **Then**
   the visitor is shown the flat page content instead of a frozen canvas.
4. **Given** JavaScript is disabled, **When** any route is fetched by a crawler or
   browser, **Then** the full static HTML content of that route is present.

---

### User Story 4 - Performance stays within budget (Priority: P2)

The flat pages' first-paint experience (payload, LCP) is unchanged by the 3D layer: 3D
code and assets load only after the page is interactive and only when 3D will actually
be used; a visible progress experience covers asset loading.

**Why this priority**: the site's Lighthouse ≥0.95 gates and measured TBT/CLS are
hard CI requirements; an unbounded 3D payload would fail the build.

**Independent Test**: run the existing Lighthouse CI configuration on `/`,
`/services/svc-agentic-netops/`, `/about/` and compare first-load JS/CSS against the
pre-refactor baseline.

**Acceptance Scenarios**:

1. **Given** the refactored site, **When** Lighthouse CI runs on the three configured
   routes, **Then** performance, accessibility, best-practices and SEO scores stay ≥0.95.
2. **Given** a fresh page load, **When** the HTML is inspected, **Then** no 3D library
   code is requested before the page's primary content is rendered.
3. **Given** the 3D experience is booting, **When** assets stream in, **Then** a visible
   loading progress indicator is shown and completes when the scene is truly usable.

---

### User Story 5 - Re-themed mairp experience, not a demo clone (Priority: P3)

The 3D world uses original mairp-branded environments, models, colours, typography and
copy (Signal Teal/cyan palette, dark-first with working light theme, "verifiable
sobriety" voice); no asset, text or audio from the source demo's children-news branding
appears. All evidence-bearing claims keep their dated evidence links.

**Why this priority**: brand integrity and the claim→evidence rules are contractual for
this site, but they are constraints on top of Stories 1–4 rather than journeys of
their own.

**Independent Test**: inspect every screen/panel surface in the 3D experience for
mairp-sourced content and verify each dated claim links to its evidence per
DECISIONS.md.

**Acceptance Scenarios**:

1. **Given** the 3D experience in dark theme, **When** the visitor toggles to light
   theme, **Then** the 3D environment's colours update to the light token set.
2. **Given** a proof badge in the 3D experience (e.g. "4/4 constructs converge · 0
   unverified success reports"), **When** the visitor opens its link, **Then** the dated
   public evidence source is reachable.
3. **Given** the whole 3D experience, **When** its text/assets are reviewed, **Then**
   nothing references the demo's content or branding.

---

### Edge Cases

- What happens when the visitor's GPU is very weak (postprocessing too heavy)? The
  experience degrades (lite mode: fewer effects, lower resolution) rather than stuttering
  or crashing.
- What happens on an unusual viewport (portrait mobile, very small window)? The camera
  framing adapts so key content stays visible; controls remain touch-usable.
- What happens when a content collection changes (a service is added/renamed)? The 3D
  rooms derive from the same content data as the flat pages, so both stay consistent
  without manual 3D-side edits.
- What happens when the visitor is offline or an asset fetch fails mid-boot? The boot
  progress surfaces the failure and the visitor lands on the flat page content.
- What happens when the visitor opens the 404 route? A themed static 404 page is served;
  it is never replaced by the 3D world.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST present every existing route (home, 7 service pages, about,
  404) as content within a navigable 3D environment when 3D is available, preserving the
  full content of each route.
- **FR-002**: The 3D experience MUST load only after the page's primary content has
  rendered, and only in browsers where WebGL is available; zero 3D framework code may
  ship at first paint (this supports FR-013's static-HTML guarantee; see also FR-013).
- **FR-003**: The 3D environment MUST provide a boot/loading sequence with visible
  progress from first paint until the scene is genuinely usable. The experience MUST
  become usable within 10 seconds on a mid-range laptop over a broadband connection
  (target; hard ceiling 20 seconds), and key content MUST be progressively readable
  as assets arrive rather than appearing only at full load.
- **FR-004**: The visitor MUST be able to move between rooms via deliberate
  interactions (clickable screens/hotspots, shot controls) with smooth camera
  transitions; free orbit MAY be permitted within scene-appropriate bounds.
- **FR-005**: In-world screens MUST display the site's real content — service details,
  proof badges with evidence links, engagement shapes, method description, the full
  open-source repos grid, trajectory, background/certs, FAQ, contact — in readable form,
  at parity with the flat homepage inventory (see Scope above).
- **FR-006**: Each room MUST map 1:1 to an existing URL; the browser URL, title,
  description and canonical MUST stay synchronized during in-3D navigation, and
  back/forward/refresh/deep-link MUST work. In-3D navigation MUST run as a persistent
  client-side session (URL updated via history state changes, no full page reload);
  the 3D world MUST NOT re-boot or lose state when the visitor moves between rooms.
- **FR-007**: The 3D experience MUST source all content from the same content data as
  the flat pages, so a single content edit updates both; the generated repos file and
  build artifacts MUST NOT be hand-edited.
- **FR-008**: The experience MUST keep working: dark/light theme toggle (affecting the
  3D environment), email copy-to-clipboard, and the Twin chat entry point.
- **FR-009**: The system MUST detect unavailable/failed WebGL, reduced-motion
  preference, and context loss, and in each case present the flat page content (or
  reduced-motion-safe 3D behaviour, respectively). The visitor MUST also be able to
  explicitly decline the 3D experience in favour of the flat fallback via a visible
  control offered at boot and while the 3D experience is running; the choice is
  persisted and honoured on subsequent visits until changed.
- **FR-010**: All dated claims shown in 3D MUST keep their evidence links per the
  site's claim→evidence record; no new claims may be introduced.
- **FR-011**: The experience MUST remain usable on touch devices (tap targets at least
  44 CSS px, all rooms usable from a 360 px-wide viewport) and degrade on low-power
  hardware (reduced effects/resolution) rather than becoming unusable. On capable
  touch/mobile devices the 3D experience is enabled by default, with the lite mode
  auto-selected on low-power hardware.
- **FR-012**: Ambient/audio cues, if present, MUST be default-muted and user-activated
  only.
- **FR-013**: The site MUST continue to serve complete static HTML for every route for
  crawlers, no-JS visitors, and the fallback path, with sitemap, canonical URLs and the
  404 route behaviour unchanged.
- **FR-014**: The site's strict security policy MUST continue to hold after the
  refactor: scripts from self only, exactly one hash-pinned inline script, no
  third-party CDN fetches introduced by 3D code (asset loaders/decoders self-hosted).
- **FR-015**: Content neutrality: the 3D experience MUST present ONLY content derived
  from the site's own content collections, `src/lib/site.ts` CV/bio data, and the
  GitHub/portfolio repos data. The reference demo's topics, stories, editorial framing,
  branding, mascots, voices or copy MUST NOT appear in any surface (screens, bumpers,
  boot copy, environment props, status lines). A content-source audit (every text string
  and asset traceable to mairp-owned sources) MUST pass before ship.
- **FR-016**: Each route's Room Payload MUST be delivered to the 3D layer as a
  self-hosted per-route data document fetched at 3D boot time — NOT inlined into the
  route's first-paint HTML — so first-paint payload stays at the pre-refactor baseline
  (FR-002/FR-013) and the strict security policy (FR-014) holds: no third-party
  fetches, no additional inline scripts.

### Key Entities *(include if feature involves data)*

- **Room**: a navigable area of the 3D world corresponding 1:1 to a site route; has a
  camera framing (shots), one or more content surfaces, and links to related rooms.
- **Content Surface (screen/panel)**: an in-world display rendering rich site content
  (headings, lists, badges, links, code snippets, sanitized inline formatting) sourced
  from the site's content data.
- **Room Payload**: the page-specific slice of content data a route provides to the 3D
  layer (its own content plus the data needed for navigation targets), delivered as a
  self-hosted per-route data document fetched at boot (FR-016).
- **Shot**: a named camera framing (position/target/transition timing) within a room,
  optionally with mobile-specific labels and arrival side effects.
- **Theme Bridge**: the mapping between the site's design tokens (dark/light) and the
  3D environment's colours and materials, kept live under theme switches.
- **Boot Sequence**: the pre-3D loading experience reporting asset progress and
  completion.
- **Fallback Mode**: the flat-page presentation served when 3D is unavailable, declined,
  or fails.

## Terminology

**Flat fallback** is the canonical term throughout these artifacts for the complete
static Astro page presentation served when 3D is unavailable, declined, or fails
(data-model.md's "Fallback Mode" entity implements it; plan/research/tasks saying
"flat page" or "static page" refer to the same thing).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing routes render their complete content in the 3D
  experience and in fallback mode (verified per-route checklist).
- **SC-002**: A visitor can go from landing on the site to reading a specific service's
  deliverables and evidence in the 3D experience within 60 seconds on a mid-range
  laptop, including boot time.
- **SC-003**: Lighthouse scores on `/`, `/services/svc-agentic-netops/`, `/about/` stay
  ≥0.95 for performance, accessibility, best-practices and SEO.
- **SC-004**: First-paint network payload of each route is unchanged versus the
  pre-refactor baseline (3D libraries and assets deferred).
- **SC-005**: Every deep link (all 10+ routes) opens the correct room, verified by an
  automated per-route check; browser back/forward navigate rooms correctly.
- **SC-006**: All claim-bearing surfaces in 3D carry working evidence links, verified
  against the claim→evidence record with zero unlinked claims.
- **SC-007**: Fallback scenarios (no-WebGL, no-JS, reduced-motion, context loss) each
  verified to present complete flat content with zero broken states.
- **SC-008**: Content-source audit: 100% of text strings and assets in the 3D experience
  trace to mairp-owned sources (content collections, site.ts CV/bio data, GitHub
  portfolio data, mairp brand assets); zero strings/assets traceable to the reference
  demo's content, topics or branding.
- **SC-009**: Boot-to-usable time for the 3D experience is ≤10 seconds (target) /
  ≤20 seconds (ceiling) on a mid-range laptop over broadband, verified by a scripted
  boot-time check; key content is progressively readable during boot.

## Assumptions

- The existing Astro content collections and `src/lib/site.ts` data remain the single
  source of content; schemas are not changed by this feature.
- Original 3D assets will be authored/derived for mairp (an infrastructure-motivated
  environment); none are reused from the source demo.
- The demo at `/root/little-big-questions/room-viewer` is a reference implementation for
  interaction mechanics and aesthetics ONLY (see Content Neutrality above); its code
  patterns may be adapted, never its content, topics, branding or copy — and no part of
  it ships verbatim.
- All displayed content is anchored to Marlon Paz's own materials: the site's content
  collections, the CV/bio data in `src/lib/site.ts`, and the GitHub/portfolio repo data
  (generated repos.yaml).
- Deployment and CI behaviour (build → check → linkinator → Lighthouse; deploy only via
  the explicit deploy command) are unchanged.
- Audio is optional polish; if included it ships muted with explicit user activation.
- The Twin chat service (Turnstile-gated external endpoint) remains as-is.
