// === ENEMY SYSTEM ===
class Enemy {
  constructor(zone, killCount) {
    this.zone = zone;
    const isBoss = (killCount % CONFIG.ENEMIES_PER_ZONE === CONFIG.ENEMIES_PER_ZONE - 1);
    this.isBoss = isBoss;

    const type = getEnemyType(zone);
    this.type = type;
    this.name = isBoss ? `BOSS ${type.name}` : type.name;

    // Scale HP with zone
    const baseHp = Math.floor(CONFIG.ENEMY_HP_BASE * Math.pow(CONFIG.ENEMY_HP_SCALE, zone - 1));
    this.maxHp = isBoss ? baseHp * CONFIG.BOSS_HP_MULT : baseHp;
    this.hp = this.maxHp;

    // Rewards
    const baseGold = Math.floor(CONFIG.ENEMY_GOLD_BASE * Math.pow(CONFIG.ENEMY_GOLD_SCALE, zone - 1));
    this.goldReward = Math.floor(isBoss ? baseGold * CONFIG.BOSS_GOLD_MULT : baseGold);

    const baseXp = Math.floor(CONFIG.ENEMY_XP_BASE * Math.pow(CONFIG.ENEMY_XP_SCALE, zone - 1));
    this.xpReward = Math.floor(isBoss ? baseXp * CONFIG.BOSS_XP_MULT : baseXp);

    // Visual state
    this.x = 0;
    this.y = 0;
    this.radius = isBoss ? 55 : 40;
    this.wobble = 0;
    this.wobbleSpeed = randFloat(0.02, 0.04);
    this.hurtFlash = 0;
    this.deathAnim = 0;
    this.alive = true;
    this.entryAnim = 1.0; // starts at 0 scale, grows to 1
    this.entryT = 0;
  }

  get hpPercent() {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.hurtFlash = 1.0;
    if (this.hp <= 0) {
      this.alive = false;
    }
    return !this.alive;
  }

  update(dt) {
    this.wobble += this.wobbleSpeed;
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - 0.1);
    if (this.entryT < 1) this.entryT = Math.min(1, this.entryT + 0.06);
  }

  draw(ctx, cx, cy) {
    this.x = cx;
    this.y = cy;

    const scale = ease.outElastic(this.entryT);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Boss has extra aura
    if (this.isBoss) {
      this._drawAura(ctx);
    }

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.85, this.radius * 0.9, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Body wobble
    const wobbleX = Math.sin(this.wobble) * 3;
    const wobbleY = Math.cos(this.wobble * 1.3) * 2;
    const squishX = 1 + Math.sin(this.wobble * 2) * 0.04;
    const squishY = 1 - Math.sin(this.wobble * 2) * 0.04;

    ctx.save();
    ctx.translate(wobbleX, wobbleY);
    ctx.scale(squishX, squishY);

    // Glow
    const glowColor = this.type.glowColor;
    const glowIntensity = this.isBoss ? 35 : 20;
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = glowIntensity + Math.sin(this.wobble) * 5;

    // Hurt flash (white overlay)
    const drawColor = this.hurtFlash > 0
      ? lerpColor(this.type.color, '#ffffff', this.hurtFlash * 0.7)
      : this.type.color;

    // Main body
    const r = this.radius;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    gradient.addColorStop(0, lightenColor(drawColor, 40));
    gradient.addColorStop(0.5, drawColor);
    gradient.addColorStop(1, darkenColor(drawColor, 40));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = lightenColor(this.type.color, 30);
    ctx.lineWidth = this.isBoss ? 3 : 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Eyes
    this._drawEyes(ctx, r);

    ctx.restore(); // wobble
    ctx.restore(); // scale/translate
  }

  _drawAura(ctx) {
    const t = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const angle = t * (0.5 + i * 0.3) + (i * Math.PI * 2 / 3);
      const orbitR = this.radius * 1.5;
      const ox = Math.cos(angle) * orbitR;
      const oy = Math.sin(angle) * orbitR;
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.type.color;
      ctx.shadowColor = this.type.color;
      ctx.shadowBlur = 15;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.type.color;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _drawEyes(ctx, r) {
    const eyeOffY = -r * 0.15;
    const eyeOffX = r * 0.28;
    const eyeR = this.isBoss ? r * 0.16 : r * 0.13;

    for (let side = -1; side <= 1; side += 2) {
      const ex = eyeOffX * side;
      const ey = eyeOffY;

      // White of eye
      ctx.beginPath();
      ctx.ellipse(ex, ey, eyeR, eyeR * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.hurtFlash > 0.5 ? '#ff4444' : '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fill();

      // Pupil
      ctx.beginPath();
      ctx.arc(ex + 1, ey + 1, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1a0a2e';
      ctx.fill();

      // Eye shine
      ctx.beginPath();
      ctx.arc(ex - 1, ey - 2, eyeR * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
    }

    // Boss angry brows
    if (this.isBoss) {
      ctx.strokeStyle = '#1a0a2e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let side = -1; side <= 1; side += 2) {
        const bx = eyeOffX * side;
        ctx.beginPath();
        ctx.moveTo(bx - eyeR * 1.2 * side * -1, eyeOffY - eyeR * 1.5);
        ctx.lineTo(bx + eyeR * 0.4 * side * -1, eyeOffY - eyeR * 0.8);
        ctx.stroke();
      }
    }
  }

  isHit(mx, my) {
    const dx = mx - this.x;
    const dy = my - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius * 1.3;
  }
}

// Color helpers for drawing
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(lerp(ar, br, t));
  const rg = Math.round(lerp(ag, bg, t));
  const rb = Math.round(lerp(ab, bb, t));
  return `rgb(${rr},${rg},${rb})`;
}

function lightenColor(color, amount) {
  try {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  } catch(e) { return color; }
}

function darkenColor(color, amount) {
  try {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  } catch(e) { return color; }
}
