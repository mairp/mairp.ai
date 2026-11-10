/**
 * MobileReader.tsx — readable copy of the active screen on phones.
 *
 * In-world screens are laid out 640 CSS px wide and projected into the room,
 * so on a ~390 px portrait viewport their text lands at 6–7 px. On narrow
 * viewports (≤ 600 px) the screen the current shot frames is ALSO rendered
 * flat, full width, in a scrollable sheet above the shot strip (FR-011: every
 * room usable from a 360 px viewport). Same ScreenSurface, same payload — no
 * copy of its own. The overview shot frames no single screen: no sheet.
 *
 * While the sheet is open the 3D view (canvas + CSS3D layer, which share one
 * size) shrinks to a landscape window between the site header and the sheet,
 * so the desktop shot framing applies as-is: the framed screen fits the
 * width and nothing is hidden under the header or the sheet.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRoom3D } from '../context';
import { placementsForRoom, shotForScreen } from '../rooms/screenPlacements';
import { ScreenSurface } from './ScreenSurface';

const NARROW = '(max-width: 600px)';

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(NARROW).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

export function MobileReader() {
  const { roomPayload, activeShot } = useRoom3D();
  const narrow = useNarrow();
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  const placement = useMemo(
    () => placementsForRoom(roomPayload.room).find((p) => shotForScreen(p.contentKey) === activeShot),
    [roomPayload.room, activeShot],
  );

  // A new shot always opens its sheet again.
  useEffect(() => setCollapsed(false), [activeShot]);

  const open = narrow && !!placement && !collapsed;

  // Split the viewport: header | 3D window | reader sheet | shot strip.
  useLayoutEffect(() => {
    const layer = document.querySelector<HTMLElement>('.room3d-layer');
    if (!layer) return;
    if (!open) {
      delete layer.dataset.reader;
      return;
    }
    const layout = () => {
      const header = document.querySelector('header');
      const top = Math.max(0, header ? header.getBoundingClientRect().bottom : 0);
      const ui = layer.querySelector('.room3d-ui');
      const stripTop = ui ? ui.getBoundingClientRect().top : window.innerHeight;
      const room = Math.max(0, stripTop - top);
      const view = Math.max(170, Math.round(room * 0.42));
      layer.style.setProperty('--room3d-top', `${top}px`);
      layer.style.setProperty('--room3d-view-h', `${view}px`);
      layer.style.setProperty('--room3d-reader-bottom', `${Math.round(window.innerHeight - stripTop + 8)}px`);
      layer.dataset.reader = 'open';
    };
    layout();
    window.addEventListener('resize', layout);
    return () => {
      window.removeEventListener('resize', layout);
      delete layer.dataset.reader;
    };
  }, [open]);

  if (!narrow || !placement) return null;

  return (
    <section
      ref={ref}
      className={`room3d-reader${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Screen content"
      data-reader-for={placement.id}
    >
      <button
        type="button"
        className="room3d-reader-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
      >
        {collapsed ? 'Show text' : 'Hide text'}
      </button>
      {!collapsed && <ScreenSurface placement={placement} payload={roomPayload} reader />}
    </section>
  );
}
