// === UTILITIES ===

function formatNum(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

function formatFloat(n, dec = 1) {
  return parseFloat(n.toFixed(dec));
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function chance(pct) {
  return Math.random() * 100 < pct;
}

// Easing functions
const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outElastic: t => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  outBounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1/d1) return n1 * t * t;
    else if (t < 2/d1) return n1 * (t -= 1.5/d1) * t + 0.75;
    else if (t < 2.5/d1) return n1 * (t -= 2.25/d1) * t + 0.9375;
    else return n1 * (t -= 2.625/d1) * t + 0.984375;
  }
};
