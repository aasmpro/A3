export const GAME_MUTED_KEY = "amiri-game-muted";

export function createGameAudio(initiallyMuted = false) {
  let context = null;
  let master = null;
  let muted = initiallyMuted;
  let closed = false;
  let lastShot = -Infinity;
  let lastHit = -Infinity;

  function unlock() {
    if (closed || muted || typeof window === "undefined") return Promise.resolve(false);
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return Promise.resolve(false);
        context = new AudioContext();
        master = context.createGain();
        master.connect(context.destination);
      }
      if (context.state === "running") return Promise.resolve(true);
      return context.resume().then(() => !closed && context.state === "running").catch(() => false);
    } catch {
      return Promise.resolve(false);
    }
  }

  function tone(wave, from, to, duration, volume, delay = 0) {
    if (closed || muted || !context || context.state !== "running") return false;
    try {
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.012, duration / 4));
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
      return true;
    } catch {
      // Audio failure never interrupts the game.
      return false;
    }
  }

  function play(name) {
    if (closed || muted || !context || context.state !== "running") return;
    const now = context.currentTime;
    if (name === "shot") {
      if (now - lastShot < 0.08) return;
      lastShot = now;
      tone("square", 620, 300, 0.075, 0.018);
    } else if (name === "hit") {
      if (now - lastHit < 0.06) return;
      lastHit = now;
      tone("sawtooth", 240, 75, 0.14, 0.03);
    } else if (name === "mega") {
      lastHit = now;
      tone("sawtooth", 270, 55, 0.22, 0.036);
      tone("triangle", 520, 120, 0.18, 0.018);
    } else if (name === "pickup") {
      tone("triangle", 390, 540, 0.1, 0.028);
      tone("triangle", 540, 760, 0.1, 0.028, 0.075);
      tone("triangle", 760, 980, 0.14, 0.024, 0.15);
    } else if (name === "gameOver") {
      tone("square", 270, 220, 0.17, 0.026);
      tone("square", 210, 155, 0.17, 0.026, 0.17);
      tone("square", 145, 65, 0.3, 0.028, 0.34);
    }
  }

  function close() {
    closed = true;
    const current = context;
    context = null;
    master = null;
    if (current && current.state !== "closed") void current.close().catch(() => undefined);
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (master && context) master.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
  }

  return { unlock, play, close, setMuted };
}
