// === PARTICLE SYSTEM ===
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.damageNumbers = [];
  }

  // Burst of particles at canvas coordinates
  burst(x, y, color, count = 10, isBoss = false) {
    const mult = isBoss ? 2 : 1;
    for (let i = 0; i < count * mult; i++) {
      const angle = randFloat(0, Math.PI * 2);
      const speed = randFloat(2, 8) * mult;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randFloat(1, 4),
        radius: randFloat(2, 6) * (isBoss ? 1.5 : 1),
        color,
        alpha: 1,
        life: 1,
        decay: randFloat(0.025, 0.06),
        gravity: 0.15,
        type: 'circle'
      });
    }
  }

  // Spark trail particles
  sparks(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = randFloat(-Math.PI * 0.7, -Math.PI * 0.3);
      const speed = randFloat(3, 10);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: randFloat(1, 3),
        color,
        alpha: 1,
        life: 1,
        decay: randFloat(0.04, 0.1),
        gravity: 0.2,
        type: 'line',
        len: randFloat(8, 20),
        prevX: x,
        prevY: y
      });
    }
  }

  // Coin particles on kill
  coins(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = randFloat(-Math.PI * 0.9, -Math.PI * 0.1);
      const speed = randFloat(2, 7);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 5,
        color: '#fbbf24',
        alpha: 1,
        life: 1,
        decay: randFloat(0.015, 0.03),
        gravity: 0.15,
        type: 'coin',
        rotation: randFloat(0, Math.PI * 2),
        rotSpeed: randFloat(-0.3, 0.3)
      });
    }
  }

  // Ring shockwave on kill
  ring(x, y, color) {
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      radius: 10,
      maxRadius: 60,
      color,
      alpha: 0.8,
      life: 1,
      decay: 0.035,
      gravity: 0,
      type: 'ring'
    });
  }

  // Floating damage number
  addDamageNumber(x, y, value, isCrit = false) {
    this.damageNumbers.push({
      x: x + randFloat(-15, 15),
      y,
      vy: -2.5,
      value,
      isCrit,
      alpha: 1,
      life: 1,
      decay: isCrit ? 0.018 : 0.025,
      scale: isCrit ? 1.8 : 1,
      targetScale: 1
    });
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'ring') {
        p.radius = lerp(p.radius, p.maxRadius, 0.12);
        p.life -= p.decay;
        p.alpha = p.life;
      } else {
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.97;
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);
        if (p.rotation !== undefined) p.rotation += p.rotSpeed;
      }

      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += d.vy;
      d.vy *= 0.93;
      d.scale = lerp(d.scale, 1, 0.15);
      d.life -= d.decay;
      d.alpha = Math.max(0, d.life);

      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'line') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (p.type === 'coin') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * Math.abs(Math.cos(p.rotation)) + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.font = `bold ${p.radius * 1.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw damage numbers
    for (const d of this.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.translate(d.x, d.y);
      ctx.scale(d.scale, d.scale);

      if (d.isCrit) {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(`${formatNum(d.value)}!`, 0, 0);
        ctx.fillText(`${formatNum(d.value)}!`, 0, 0);
      } else {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#f1f5f9';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
