/* ==========================================================================
   Anne OS Kids — sound.js
   SoundManager: sons do sistema e das músicas via Web Audio API
   ========================================================================== */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.6;
    this.enabled = true;
    this.notes = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.0, A: 440.0, B: 493.88, C2: 523.25 };
  }

  _ensureCtx() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(v) { this.masterVolume = Math.max(0, Math.min(1, v)); }
  setEnabled(v) { this.enabled = v; }

  tone(freq, duration = 0.25, type = 'sine', gain = 0.5) {
    if (!this.enabled) return;
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain * this.masterVolume;
      osc.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) { /* ignore */ }
  }

  playNote(name, duration = 0.35) {
    const freq = this.notes[name] || 440;
    this.tone(freq, duration, 'triangle', 0.6);
  }

  click() { this.tone(880, 0.06, 'square', 0.25); }
  hover() { this.tone(660, 0.04, 'sine', 0.12); }
  open() { this.tone(523, 0.08, 'sine', 0.3); setTimeout(() => this.tone(784, 0.12, 'sine', 0.3), 70); }
  close() { this.tone(392, 0.1, 'sine', 0.3); }
  minimize() { this.tone(330, 0.08, 'sine', 0.25); }
  success() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.4), i * 90)); }
  error() { this.tone(180, 0.25, 'sawtooth', 0.3); }
  starGain() { this.tone(1046, 0.12, 'sine', 0.35); setTimeout(() => this.tone(1318, 0.16, 'sine', 0.35), 90); }
  notification() { this.tone(988, 0.1, 'sine', 0.3); setTimeout(() => this.tone(1318, 0.14, 'sine', 0.3), 110); }
  boot() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.35), i * 160)); }
}

const soundManager = new SoundManager();
