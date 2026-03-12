// === WEB AUDIO SOUND SYSTEM ===
const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function playTone(freq, type, duration, vol, startFreq, attack = 0.005, decay = 0.1) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = type;
      if (startFreq) {
        osc.frequency.setValueAtTime(startFreq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + duration * 0.3);
      } else {
        osc.frequency.setValueAtTime(freq, c.currentTime);
      }

      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch(e) {}
  }

  function noise(duration, vol = 0.05) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    try {
      const bufferSize = c.sampleRate * duration;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

      const source = c.createBufferSource();
      source.buffer = buffer;

      const gain = c.createGain();
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      source.connect(gain);
      gain.connect(c.destination);
      source.start(c.currentTime);
    } catch(e) {}
  }

  return {
    resume,
    toggle() { enabled = !enabled; return enabled; },

    hit() {
      playTone(200, 'square', 0.08, 0.12, 400);
      noise(0.05, 0.04);
    },

    crit() {
      playTone(600, 'sawtooth', 0.12, 0.15, 300);
      playTone(900, 'sine', 0.1, 0.08);
    },

    kill() {
      playTone(400, 'sine', 0.15, 0.1, 200);
      playTone(600, 'sine', 0.1, 0.08, 400);
      noise(0.1, 0.06);
    },

    bossKill() {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => playTone(200 + i * 150, 'sine', 0.2, 0.12), i * 80);
      }
      noise(0.3, 0.1);
    },

    levelUp() {
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.25, 0.12), i * 80));
    },

    purchase() {
      playTone(440, 'sine', 0.1, 0.1);
      playTone(660, 'sine', 0.1, 0.08);
    },

    prestige() {
      const freqs = [262, 330, 392, 523, 659, 784, 1047];
      freqs.forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.3, 0.1), i * 60));
    },

    zoneComplete() {
      playTone(523, 'sine', 0.2, 0.1);
      playTone(659, 'sine', 0.2, 0.1);
      setTimeout(() => playTone(784, 'sine', 0.3, 0.15), 100);
    },

    boss() {
      playTone(80, 'sawtooth', 0.4, 0.15);
      noise(0.3, 0.08);
    }
  };
})();
