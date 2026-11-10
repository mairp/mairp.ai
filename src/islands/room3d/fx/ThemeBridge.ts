/**
 * ThemeBridge.ts — maps the site's design tokens to THREE.Color values and
 * keeps the mapping live under theme switches (feature 001-whole-site-3d, T012;
 * data-model.md "ThemeBridge").
 *
 * The island never toggles themes itself: it reads computed CSS custom
 * properties from the document root, observes `data-theme` attribute changes
 * (ThemeToggle) and `prefers-color-scheme` media changes, and re-maps on each.
 */
import { Color } from 'three';

/** Token name → payload key consumed by rooms/fx. */
export interface ThemeTokens {
  bg: Color;
  surface: Color;
  accent: Color;
  accent2: Color;
  fg: Color;
  muted: Color;
  border: Color;
}

const VAR_NAMES: Record<keyof ThemeTokens, string> = {
  bg: '--bg',
  surface: '--surface',
  accent: '--accent',
  accent2: '--accent-2',
  fg: '--fg',
  muted: '--muted',
  border: '--border',
};

export class ThemeBridge {
  readonly tokens: ThemeTokens;
  #root: HTMLElement;
  #observer: MutationObserver;
  #media: MediaQueryList;
  #onMedia: () => void;
  #listeners = new Set<(tokens: ThemeTokens) => void>();

  constructor(root: HTMLElement = document.documentElement) {
    this.#root = root;
    this.tokens = {
      bg: new Color(),
      surface: new Color(),
      accent: new Color(),
      accent2: new Color(),
      fg: new Color(),
      muted: new Color(),
      border: new Color(),
    };
    this.#read();

    this.#observer = new MutationObserver(() => this.#read());
    this.#observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    this.#media = window.matchMedia('(prefers-color-scheme: light)');
    this.#onMedia = () => this.#read();
    this.#media.addEventListener('change', this.#onMedia);
  }

  /** Subscribe to live token updates; returns an unsubscribe function. */
  subscribe(fn: (tokens: ThemeTokens) => void): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  /** Re-read tokens from computed CSS vars and notify subscribers. */
  #read() {
    const style = getComputedStyle(this.#root);
    for (const key of Object.keys(VAR_NAMES) as (keyof ThemeTokens)[]) {
      const raw = style.getPropertyValue(VAR_NAMES[key]).trim();
      if (raw) this.tokens[key].set(raw);
    }
    for (const fn of this.#listeners) fn(this.tokens);
  }

  dispose() {
    this.#observer.disconnect();
    this.#media.removeEventListener('change', this.#onMedia);
    this.#listeners.clear();
  }
}
