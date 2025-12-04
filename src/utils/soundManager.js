// src/utils/soundManager.js
// Lightweight, app-wide sound manager for Vite + React
// - Uses HTMLAudioElement (no external deps)
// - Handles cache-busted asset imports via Vite
// - Supports overlapping playback (cloning)
// - Global mute/volume, per-play options, stop by key
// - Safe unlock on first user gesture (mobile autoplay policies)

// Use RELATIVE imports to avoid alias issues
// Folder tree context:
//   src/
//     assets/soundfx/{move.wav, lose.mp3, sidebar.mp3, winning.mp3}
//     utils/soundManager.js  <-- this file

import moveWav from "../assets/soundfx/move.wav";
import loseMp3 from "../assets/soundfx/lose.mp3";
import sidebarMp3 from "../assets/soundfx/sidebar.mp3";
import winWav from "../assets/soundfx/win.wav";
import btnclickMp3 from "../assets/soundfx/btn-click.mp3";
import slideWav from "../assets/soundfx/slide.wav";


const manifest = {
  move: moveWav,
  lose: loseMp3,
  sidebar: sidebarMp3,
  win: winWav,
  button: btnclickMp3,
  slide: slideWav,
};

class SoundManager {
  constructor() {
    this._enabled = false; // will be unlocked on first user gesture
    this._muted = false;
    this._volume = 1.0; // global volume 0..1

    // base Audio objects (one per key) kept paused; we clone for overlaps
    this._bases = new Map();
    // live playing instances by key -> Set<HTMLAudioElement>
    this._playing = new Map();

    this._autoUnlockAttached = false;

    // Pre-create base elements for faster first play
    Object.entries(manifest).forEach(([key, url]) => {
      const a = new Audio(url);
      a.preload = "auto";
      this._bases.set(key, a);
      this._playing.set(key, new Set());
    });
  }

  // Attach a one-time listener that unlocks audio on first user interaction
  attachAutoUnlock() {
    if (this._autoUnlockAttached) return;
    const unlock = () => {
      this.unlock();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
    this._autoUnlockAttached = true;
  }

  // Attempt to satisfy mobile autoplay policies by doing a tiny play/pause
  unlock() {
    if (this._enabled) return;
    this._enabled = true;
    // Try to play & immediately pause a short, silent segment for each base
    this._bases.forEach((base) => {
      try {
        base.volume = 0; // silent nudge
        const playPromise = base.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              try { base.pause(); base.currentTime = 0; } catch {}
            })
            .catch(() => {});
        }
      } catch {}
    });
  }

  // Load all base elements (useful if you want to prefetch on app load)
  preload() {
    this._bases.forEach((a) => { try { a.load(); } catch {} });
  }

  // Global controls
  setMuted(muted) { this._muted = !!muted; }
  toggleMute() { this._muted = !this._muted; }
  isMuted() { return this._muted; }

  setVolume(v) { this._volume = Math.max(0, Math.min(1, Number(v) || 0)); }
  getVolume() { return this._volume; }

  // Play a sound by key
  // options: { volume=1, rate=1, loop=false, interrupt=false }
  play(key, options = {}) {
    const base = this._bases.get(key);
    if (!base) {
      if (import.meta.env.DEV) console.warn(`[Sound] Unknown key: ${key}`);
      return null;
    }

    const {
      volume = 1,
      rate = 1,
      loop = false,
      interrupt = false, // stop other instances of same key before playing
    } = options;

    if (interrupt) this.stop(key);

    // Clone for overlapping playback
    const node = base.cloneNode(true);
    node.loop = !!loop;
    node.playbackRate = Math.max(0.5, Math.min(4, Number(rate) || 1));

    // Effective volume considers global + per-play volume; honor mute
    const effectiveVolume = this._muted ? 0 : this._volume * Math.max(0, Math.min(1, Number(volume) || 0));
    node.volume = effectiveVolume;

    // Track instance to allow stopping later
    const set = this._playing.get(key);
    set.add(node);

    const cleanup = () => {
      node.removeEventListener("ended", cleanup);
      node.removeEventListener("pause", onPauseCleanup);
      set.delete(node);
    };
    const onPauseCleanup = () => {
      if (!node.loop && node.currentTime > 0 && node.paused) cleanup();
    };

    node.addEventListener("ended", cleanup);
    node.addEventListener("pause", onPauseCleanup);

    // If not yet enabled (mobile), try to kick unlock; playback may still be blocked until user gesture
    if (!this._enabled) this.attachAutoUnlock();

    // Start playback (best-effort)
    try {
      const p = node.play();
      if (p && typeof p.then === "function") {
        p.catch((err) => {
          // Likely autoplay policy; keep instance, will play after user gesture if app retries
          if (import.meta.env.DEV) console.debug("[Sound] play blocked:", err?.name || err);
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug("[Sound] play error:", err?.name || err);
    }

    return node; // return the HTMLAudioElement in case caller wants to control it
  }

  // Stop all instances of a key
  stop(key) {
    const set = this._playing.get(key);
    if (!set) return;
    for (const node of Array.from(set)) {
      try { node.pause(); node.currentTime = 0; } catch {}
      set.delete(node);
    }
  }

  // Stop everything
  stopAll() {
    this._playing.forEach((set) => {
      for (const node of Array.from(set)) {
        try { node.pause(); node.currentTime = 0; } catch {}
        set.delete(node);
      }
    });
  }
}

// Export a shared singleton
const Sound = new SoundManager();
export default Sound;
