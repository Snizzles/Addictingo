// === PARTICLE SYSTEM ===
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.damageNumbers = [];
  }

  burst(x, y, color, count = 12, isBoss = false) {
    const mult = isBoss ? 2.5 : 1;
    for (let i = 0; i < count * mult; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(2, 10) * mult;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randFloat(1, 5),
        radius: randFloat(3, 8) * (isBoss ? 1.8 : 1),
        color,
        alpha: 1,
        life: 1,
        decay: randFloat(0.02, 0.055),
        gravity: 0.18,
        type: 'circle',
      });
    }
  }

  sparks(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = randFloat(-Math.PI * 0.8, -Math.PI * 0.2);
      const speed = randFloat(3, 12);
      this.particles.push({
        x, y, prevX: x, prevY: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: randFloat(1.5, 3.5),
        color,
        alpha: 1,
        life: 1,
        decay: randFloat(0.04, 0.09),
        gravity: 0.22,
        type: 'line',
      });
    }
  }

  coins(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = randFloat(-Math.PI * 0.9, -Math.PI * 0.1);
      const speed = randFloat(3, 9);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 6,
        color: '#fbbf24',
        alpha: 1,
        life: 1,
        decay: randFloat(0.012, 0.025),
        gravity: 0.2,
        type: 'coin',
        rotation: randFloat(0, Math.PI * 2),
        rotSpeed: randFloat(-0.35, 0.35),
      });
    }
  }

  ring(x, y, color, maxRadius = 70) {
    this.particles.push({
      x, y, vx: 0, vy: 0,
      radius: 10,
      maxRadius,
      color,
      alpha: 0.9,
      life: 1,
      decay: 0.03,
      gravity: 0,
      type: 'ring',
    });
  }

  // Attacker hit impact
  impact(x, y, color) {
    for (let i = 0; i < 4; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(1, 4);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: randFloat(1, 3),
        color,
        alpha: 0.8,
        life: 1,
        decay: randFloat(0.07, 0.14),
        gravity: 0.1,
        type: 'circle',
      });
    }
  }

  // ── Damage Numbers ──────────────────────────────────────────────────────────
  addDamageNumber(x, y, value, isCrit = false, isAuto = false) {
    this.damageNumbers.push({
      x: x + randFloat(-18, 18),
      y: y - randFloat(10, 25),
      vy: isCrit ? -3.5 : -2.2,
      value,
      isCrit,
      isAuto,
      alpha: 1,
      life: 1,
      decay: isCrit ? 0.014 : isAuto ? 0.022 : 0.02,
      scale: isCrit ? 2.2 : isAuto ? 1.1 : 1.3,
    });
  }

  // Kill reward labels: "+Xg  +Xxp"
  addKillReward(x, y, gold, xp) {
    this.damageNumbers.push({
      x, y: y - 30,
      vy: -1.8,
      goldText: `+${formatNum(gold)}g`,
      xpText: `+${formatNum(xp)}xp`,
      alpha: 1,
      life: 1,
      decay: 0.012,
      scale: 1,
      isReward: true,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'ring') {
        p.radius = lerp(p.radius, p.maxRadius, 0.13);
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);
      } else {
        p.prevX = p.x; p.prevY = p.y;
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.96;
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);
        if (p.rotation !== undefined) p.rotation += p.rotSpeed;
      }
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += d.vy;
      d.vy *= 0.91;
      d.scale = lerp(d.scale, 1, 0.12);
      d.life -= d.decay;
      d.alpha = Math.max(0, d.life);
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

      } else if (p.type === 'line') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

      } else if (p.type === 'coin') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const coinW = p.radius * Math.abs(Math.cos(p.rotation)) + 1;
        const coinGrad = ctx.createRadialGradient(0, -2, 0, 0, 0, coinW + 2);
        coinGrad.addColorStop(0, '#fde68a');
        coinGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = coinGrad;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, coinW, p.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(-1, -2, coinW * 0.4, p.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Damage numbers
    for (const d of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.translate(d.x, d.y);
      ctx.scale(d.scale, d.scale);

      if (d.isReward) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Gold
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.fillText(d.goldText, -20, 0);
        // XP
        ctx.fillStyle = '#a78bfa';
        ctx.shadowColor = '#a78bfa';
        ctx.fillText(d.xpText, 22, 0);

      } else if (d.isCrit) {
        // BIG crit number
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Outer stroke for readability
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.strokeText(`${formatNum(d.value)}!`, 0, 0);
        // Gold fill
        const grad = ctx.createLinearGradient(0, -14, 0, 14);
        grad.addColorStop(0, '#fde68a');
        grad.addColorStop(0.5, '#fbbf24');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.fillText(`${formatNum(d.value)}!`, 0, 0);
        // White shine
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.shadowBlur = 0;
        ctx.fillText('CRIT', 0, -20);

      } else if (d.isAuto) {
        // Small auto-attack numbers
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(200,220,255,0.85)';
        ctx.shadowColor = 'rgba(100,150,255,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(formatNum(d.value), 0, 0);

      } else {
        // Normal click hit — bigger than before
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeText(formatNum(d.value), 0, 0);
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 6;
        ctx.fillText(formatNum(d.value), 0, 0);
      }

      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
    this.damageNumbers = [];
  }
}
