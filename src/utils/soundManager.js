// src/utils/soundManager.js
// Gestor de som , à escala da app, para Vite + React
// - Usa HTMLAudioElement (sem dependências externas)
// - Lida com assets com cache-busting via Vite
// - Suporta reprodução simultânea (clonando)
// - Mute/volume globais, opções por reprodução, stop por chave
// - Desbloqueio seguro no primeiro gesto do utilizador (políticas mobile)

// Usar imports RELATIVOS para evitar conflitos de alias
// Estrutura de pastas:
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
    this._enabled = false; //  desbloqueado no primeiro gesto do utilizador
    this._muted = false;
    this._volume = 1.0; // volume global 0..1

    // objetos Audio base (um por chave) mantidos em pausa; clonamos para sobreposições
    this._bases = new Map();
    // instâncias em reprodução por chave -> Set<HTMLAudioElement>
    this._playing = new Map();

    this._autoUnlockAttached = false;

    // Pré-cria elementos base para arrancar mais rápido na 1.ª vez
    Object.entries(manifest).forEach(([key, url]) => {
      const a = new Audio(url);
      a.preload = "auto";
      this._bases.set(key, a);
      this._playing.set(key, new Set());
    });
  }

  // Anexa listener único que desbloqueia áudio no primeiro gesto
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

  // Tenta satisfazer políticas de autoplay mobile com um play/pause mínimo
  unlock() {
    if (this._enabled) return;
    this._enabled = true;
    // Tenta reproduzir e pausar de imediato um segmento silencioso por base
    this._bases.forEach((base) => {
      try {
        base.volume = 0; // empurrão silencioso
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

  // Carrega todos os elementos base (útil para prefetch no load da app)
  preload() {
    this._bases.forEach((a) => { try { a.load(); } catch {} });
  }

  // Global controls
  setMuted(muted) { this._muted = !!muted; }
  toggleMute() { this._muted = !this._muted; }
  isMuted() { return this._muted; }

  setVolume(v) { this._volume = Math.max(0, Math.min(1, Number(v) || 0)); }
  getVolume() { return this._volume; }

  // Toca um som por chave
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
      interrupt = false, // interrompe outras instâncias da mesma chave antes de tocar
    } = options;

    if (interrupt) this.stop(key);

    // Clone para permitir sobreposições
    const node = base.cloneNode(true);
    node.loop = !!loop;
    node.playbackRate = Math.max(0.5, Math.min(4, Number(rate) || 1));

    // Volume efetivo considera volume global + por reprodução; respeita mute
    const effectiveVolume = this._muted ? 0 : this._volume * Math.max(0, Math.min(1, Number(volume) || 0));
    node.volume = effectiveVolume;

    // Guarda instância para permitir parar depois
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

    // Se ainda não estiver ativo (mobile), tenta desbloquear; pode continuar bloqueado até gesto do utilizador
    if (!this._enabled) this.attachAutoUnlock();

    // Inicia reprodução (best-effort)
    try {
      const p = node.play();
      if (p && typeof p.then === "function") {
        p.catch((err) => {
          // Provável bloqueio de autoplay; mantém instância, toca após gesto se a app voltar a tentar
          if (import.meta.env.DEV) console.debug("[Sound] play blocked:", err?.name || err);
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug("[Sound] play error:", err?.name || err);
    }

    return node; // devolve o HTMLAudioElement caso o chamador queira controlá-lo
  }

  // Pára todas as instâncias de uma chave
  stop(key) {
    const set = this._playing.get(key);
    if (!set) return;
    for (const node of Array.from(set)) {
      try { node.pause(); node.currentTime = 0; } catch {}
      set.delete(node);
    }
  }

  // Pára tudo
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
