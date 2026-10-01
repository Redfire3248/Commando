// Sound effects made in code (Web Audio): no sound files. CG.Sfx.play('shoot') etc.
// Browsers only allow sound after the player has tapped or pressed something, so the audio
// engine is created on first use.
CG.Sfx = (() => {
  const KEY = 'commando.sound';
  let ctx = null, master = null, noiseBuf = null;
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* storage unavailable */ }
  const last = {};

  function ready() {
    if (!on) return false;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.state === 'running';
  }

  // a tone that slides from f0 to f1
  function tone(type, f0, f1, dur, vol, delay = 0) {
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  // a burst of filtered noise (explosions, hits)
  function noise(dur, vol, f0, f1) {
    const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    shoot: () => tone('square', 900, 260, 0.07, 0.35),
    eshoot: () => tone('sawtooth', 420, 160, 0.09, 0.2),
    hit: () => noise(0.05, 0.4, 3000, 800),
    boom: () => { noise(0.35, 0.9, 1800, 90); tone('sine', 140, 40, 0.3, 0.6); },
    bigboom: () => { noise(0.8, 1, 2200, 50); tone('sine', 110, 30, 0.7, 0.8); },
    jump: () => tone('triangle', 320, 640, 0.12, 0.35),
    die: () => { tone('sawtooth', 620, 70, 0.55, 0.5); noise(0.25, 0.4, 1200, 200); },
    pickup: () => { tone('square', 660, 660, 0.08, 0.3); tone('square', 990, 990, 0.12, 0.3, 0.08); },
    ability: () => { tone('sawtooth', 220, 880, 0.18, 0.28); tone('square', 880, 1320, 0.14, 0.2, 0.1); },
    ready: () => { tone('triangle', 1320, 1320, 0.06, 0.18); tone('triangle', 1760, 1760, 0.08, 0.18, 0.06); },
    clear: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone('square', f, f, 0.16, 0.3, i * 0.13)),
    over: () => [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, f, 0.28, 0.4, i * 0.24)),
    start: () => { tone('square', 440, 440, 0.08, 0.3); tone('square', 660, 660, 0.14, 0.3, 0.09); },
  };
  const GAP = { shoot: 45, eshoot: 60, hit: 40, boom: 50 };        // don't stack the same sound too tightly (ms)

  return {
    get on() { return on; },
    toggle() {
      on = !on;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* storage unavailable */ }
      if (on) this.play('pickup');
      return on;
    },
    play(name) {
      try {
        if (!SOUNDS[name] || !ready()) return;
        const now = performance.now();
        if (GAP[name] && now - (last[name] || 0) < GAP[name]) return;
        last[name] = now;
        SOUNDS[name]();
      } catch (e) { /* sound is never worth breaking the game for */ }
    },
  };
})();
