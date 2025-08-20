// Lightweight SFX using Web Audio API (no assets). Designed for mobile-friendly short cues.
// Exposes playSfx('hit'|'miss'|'sunk'|'win'|'lose').

type SfxKind = 'hit' | 'miss' | 'sunk' | 'win' | 'lose';

let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      // Will resume on first user gesture; callers should be triggered by gestures
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.03, startAt?: number) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const t0 = startAt ?? ctx.currentTime;
  const t1 = t0 + durMs / 1000;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  // simple attack/decay envelope
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.6), t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t1);
}

export function playSfx(kind: SfxKind) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime + 0.001;
  switch (kind) {
    case 'hit': {
      // short bright ping
      tone(880, 90, 'square', 0.04, now);
      tone(660, 90, 'square', 0.025, now + 0.02);
      break;
    }
    case 'miss': {
      // soft click
      tone(240, 60, 'triangle', 0.025, now);
      break;
    }
    case 'sunk': {
      // little triumphant
      tone(523.25, 120, 'sine', 0.035, now);
      tone(659.25, 120, 'sine', 0.035, now + 0.08);
      tone(783.99, 160, 'sine', 0.04, now + 0.16);
      break;
    }
    case 'win': {
      // arpeggio up
      tone(440, 120, 'triangle', 0.04, now);
      tone(554.37, 120, 'triangle', 0.04, now + 0.12);
      tone(659.25, 180, 'triangle', 0.05, now + 0.24);
      break;
    }
    case 'lose': {
      // descending
      tone(392, 140, 'sawtooth', 0.03, now);
      tone(329.63, 140, 'sawtooth', 0.03, now + 0.14);
      tone(261.63, 160, 'sawtooth', 0.03, now + 0.28);
      break;
    }
  }
}

