// Runs inline before first paint: mark that scripts run (so tabs render in their
// final state with no layout shift), apply a theme picked earlier, if any, and
// arm the page-level boot-overlay removal timeout. If the 3D island never
// mounts (no WebGL, declined, failed), the pre-JS #boot overlay is removed so
// the flat page shows; the island's own hide() path wins if it gets there
// first (contracts/island-events.md). A 3D-approved page marks #boot "armed"
// (RoomIsland.astro, T088/T089): its mount is deferred ~6 s after load (US4),
// so the armed overlay is exempt from this fallback timer and stays visible —
// with progress — until the scene is genuinely usable (FR-003). The CSP allows
// exactly this text by its SHA-256 (scripts/csp-hash.mjs) — no other inline
// script may be added.
export const THEME_INIT =
  "document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){};setTimeout(function(){var b=document.getElementById('boot');if(b&&!b.classList.contains('done')&&!b.classList.contains('armed'))b.remove()},3000)";
