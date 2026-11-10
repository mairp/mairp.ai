/**
 * ContactScreen.tsx — contact console (feature 001-whole-site-3d, T054/
 * T061/T062; contracts/island-events.md interactivity parity):
 * - copy-email reuses the page's CopyButton behaviour: it dispatches a click
 *   on the flat page's `button.copy[data-copy]` for the practice email (its
 *   own clipboard+aria-live pattern announces "Copied to clipboard"). If the
 *   flat button is absent, the screen writes the clipboard itself and
 *   announces through its own aria-live region — never a silent copy.
 * - the Twin trigger clicks the existing `[data-twin-open]` launcher — the
 *   island never reimplements the chat.
 * - evidence/CTA links are real anchors opening in a new tab.
 */
import { useCallback, useRef, useState } from 'react';
import { useRoom3D } from '../../context';

export function ContactScreen() {
  const { payload } = useRoom3D();
  const { email, twinAvailable } = payload.contact;
  const about = payload.about;
  const [done, setDone] = useState(false);
  const liveRef = useRef<HTMLSpanElement>(null);

  const copyEmail = useCallback(async () => {
    // Preferred path: the flat page's CopyButton for the same email.
    const pageBtn = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button.copy[data-copy]'),
    ).find((b) => b.dataset.copy === email && !b.hidden);
    if (pageBtn) {
      pageBtn.click();
      return;
    }
    // Fallback: same clipboard + aria-live pattern, owned by the screen.
    try {
      await navigator.clipboard.writeText(email);
      if (liveRef.current) liveRef.current.textContent = 'Copied to clipboard';
      setDone(true);
      window.setTimeout(() => {
        setDone(false);
        if (liveRef.current) liveRef.current.textContent = '';
      }, 1800);
    } catch {
      if (liveRef.current) liveRef.current.textContent = 'Select the email to copy';
    }
  }, [email]);

  const openTwin = useCallback(() => {
    const launcher = document.querySelector<HTMLElement>('[data-twin-open]');
    launcher?.click();
  }, []);

  return (
    <div className="rs-inner">
      <p className="rs-eyebrow">contact</p>
      <h2 className="rs-title">Start a conversation</h2>
      <p className="rs-lede">
        Direct to {about.name} — {about.location}
      </p>
      <p>
        <b className="rs-meta">{email}</b>
      </p>
      <div className="rs-actions">
        <button type="button" className="rs-btn" data-done={done ? '' : undefined} onClick={copyEmail}>
          Copy email
        </button>
        {twinAvailable && (
          <button type="button" className="rs-btn" onClick={openTwin}>
            Ask the Twin
          </button>
        )}
        <a className="rs-btn" href={about.cv} target="_blank" rel="noopener">
          CV (PDF)
        </a>
        <a className="rs-btn" href={about.github} target="_blank" rel="noopener">
          GitHub
        </a>
      </div>
      {/* aria-live announcement mirrors the flat CopyButton behaviour */}
      <span ref={liveRef} aria-live="polite" className="visually-hidden" />
    </div>
  );
}
