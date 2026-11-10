/**
 * cues.ts — optional synthesized audio cues (feature 001-whole-site-3d, T092;
 * FR-012). Web Audio only: every cue is generated with oscillators at play
 * time — no audio files, no third-party fetches (FR-014).
 *
 * Rules:
 * - DEFAULT MUTED. Nothing plays until the visitor explicitly activates the
 *   "Sound" control in the 3D UI (that click is also the tap-unlock for the
 *   AudioContext — it is only created/resumed inside a user gesture).
 * - The on/off choice persists (`room3d:audio`) like the theme and flat-site
 *   preferences; every storage access is wrapped in try/catch.
 * - Cues are tiny (≤ 0.25 s), quiet (gain ≤ 0.08), and skipped entirely when
 *   the AudioContext cannot be created or is suspended.
 * - No demo content: cue names describe mairp navigation actions only.
 */

const AUDIO_PREF_KEY = 'room3d:audio';
const AUDIO_PREF_VALUE = 'on';

export type CueKind = 'nav' | 'open' | 'toggle-on' | 'toggle-off';

function storedPreference(): boolean {
  try {
    return localStorage.getItem(AUDIO_PREF_KEY) === AUDIO_PREF_VALUE;
  } catch {
    return false;
  }
}

function persist(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(AUDIO_PREF_KEY, AUDIO_PREF_VALUE);
    else localStorage.removeItem(AUDIO_PREF_KEY);
  } catch {
    /* storage blocked: choice applies for this page view only */
  }
}

class AudioCues {
  #enabled: boolean;
  #ctx: AudioContext | null = null;

  constructor() {
    this.#enabled = typeof window !== 'undefined' && storedPreference();
  }

  get enabled(): boolean {
    return this.#enabled;
  }

  /**
   * Enable/disable cues. `userGesture` must be true when enabling — the
   * AudioContext is created (and resumed) only inside the click handler, per
   * browser autoplay policies (tap-unlock).
   */
  setEnabled(enabled: boolean, userGesture = false): void {
    this.#enabled = enabled;
    persist(enabled);
    if (enabled && userGesture) this.#unlock();
    if (!enabled) this.#silence();
  }

  /** Toggle from a click handler; returns the new state. */
  toggle(): boolean {
    this.setEnabled(!this.#enabled, true);
    if (this.#enabled) this.play('toggle-on');
    return this.#enabled;
  }

  /** Play one synthesized cue; a no-op while muted or unavailable. */
  play(kind: CueKind): void {
    if (!this.#enabled) return;
    const ctx = this.#ctx;
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const spec = CUES[kind];
    osc.type = spec.type;
    osc.frequency.setValueAtTime(spec.from, t);
    osc.frequency.exponentialRampToValueAtTime(spec.to, t + spec.dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(spec.gain, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + spec.dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /** Create/resume the AudioContext from the activating gesture. */
  #unlock(): void {
    try {
      type Ctor = typeof AudioContext;
      const w = window as Window & { webkitAudioContext?: Ctor };
      const Ctx = window.AudioContext ?? w.webkitAudioContext;
      if (!Ctx) {
        this.#enabled = false;
        return;
      }
      if (!this.#ctx) this.#ctx = new Ctx();
      if (this.#ctx.state === 'suspended') void this.#ctx.resume();
    } catch {
      this.#enabled = false;
    }
  }

  #silence(): void {
    if (this.#ctx && this.#ctx.state === 'running') void this.#ctx.suspend().catch(() => {});
  }
}

/** One-line oscillator specs (Hz, seconds, peak gain) — original mairp cues. */
const CUES: Record<CueKind, { type: OscillatorType; from: number; to: number; dur: number; gain: number }> = {
  nav: { type: 'sine', from: 420, to: 560, dur: 0.16, gain: 0.06 },
  open: { type: 'triangle', from: 620, to: 880, dur: 0.12, gain: 0.05 },
  'toggle-on': { type: 'sine', from: 520, to: 760, dur: 0.18, gain: 0.08 },
  'toggle-off': { type: 'sine', from: 520, to: 300, dur: 0.18, gain: 0.08 },
};

/** Document-lifetime singleton owned by the 3D island. */
export const audioCues = new AudioCues();
