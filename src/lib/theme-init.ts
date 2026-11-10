// The one inline script, run before first paint: marks that scripts run.
// The CSP allows exactly this text by its SHA-256 (scripts/csp-hash.mjs).
export const THEME_INIT = "document.documentElement.classList.add('js')";
