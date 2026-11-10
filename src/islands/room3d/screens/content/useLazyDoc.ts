/**
 * useLazyDoc.ts — fetch a lazy content document (`/api/<doc>.json`, T086/T087)
 * for a lazy screen — but only AFTER the scene is usable (US4 defer-first:
 * boot.hide() fires 'room3d:sceneready'; a missing #boot counts as ready too,
 * covering fallback paths). Cached per session; failures surface as 'error' so
 * the screen can show its payload-only content instead.
 */
import { useEffect, useState } from 'react';

const cache = new Map<string, Promise<unknown>>();

function sceneReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.getElementById('boot')) return Promise.resolve();
  return new Promise((res) => {
    const done = () => {
      window.clearInterval(iv);
      res();
    };
    window.addEventListener('room3d:sceneready', done, { once: true });
    // Belt-and-braces poll: a fallback path may remove #boot without the event.
    const iv = window.setInterval(() => {
      if (!document.getElementById('boot')) done();
    }, 250);
  });
}

export function useLazyDoc<T>(doc: string | undefined): { data?: T; state: 'loading' | 'ready' | 'error' } {
  const [res, setRes] = useState<{ key?: string; data?: T; state: 'loading' | 'ready' | 'error' }>({ state: 'loading' });
  useEffect(() => {
    if (!doc) return;
    let live = true;
    void sceneReady().then(() => {
      if (!live) return;
      let p = cache.get(doc);
      if (!p) {
        p = fetch(`/api/${doc}.json`, { credentials: 'same-origin' }).then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        });
        cache.set(doc, p);
        p.catch(() => cache.delete(doc));
      }
      p.then(
        (d) => live && setRes({ key: doc, data: d as T, state: 'ready' }),
        () => live && setRes({ key: doc, state: 'error' }),
      );
    });
    return () => {
      live = false;
    };
  }, [doc]);
  return res.key === doc || !doc ? res : { state: 'loading' };
}
