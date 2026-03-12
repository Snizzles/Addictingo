// === VISUAL AUTO-ATTACKER SYSTEM ===

const ATTACKER_TIERS = [
  {
    id: 'phantom',
    name: 'Phantom',
    color: '#06b6d4',
    outerColor: '#67e8f9',
    orbitRadius: 108,
    orbitSpeed: 0.65,
    fireInterval: 1800,   // ms between shots
    dmgMult: 0.55,        // × player.attack per shot
    projectileSpeed: 420, // px/s
    size: 10,
    projectileSize: 5,
  },
  {
    id: 'specter',
    name: 'Specter',
    color: '#a855f7',
    outerColor: '#d8b4fe',
    orbitRadius: 135,
    orbitSpeed: 0.48,
    fireInterval: 1400,
    dmgMult: 1.7,
    projectileSpeed: 480,
    size: 13,
    projectileSize: 7,
  },
  {
    id: 'obliterator',
    name: 'Obliterator',
    color: '#ef4444',
    outerColor: '#fca5a5',
    orbitRadius: 162,
    orbitSpeed: 0.35,
    fireInterval: 1100,
    dmgMult: 5,
    projectileSpeed: 540,
    size: 16,
    projectileSize: 9,
  },
  {
    id: 'annihilator',
    name: 'Annihilator',
    color: '#fbbf24',
    outerColor: '#fde68a',
    orbitRadius: 189,
    orbitSpeed: 0.25,
    fireInterval: 800,
    dmgMult: 13,
    projectileSpeed: 620,
    size: 20,
    projectileSize: 12,
  },
];

// ─── Projectile ──────────────────────────────────────────────────────────────
class Projectile {
  constructor(sx, sy, tx, ty, tier, damage, isCrit) {
    this.x = sx;
    this.y = sy;
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.tier = tier;
    this.damage = damage;
    this.isCrit = isCrit;
    this.elapsed = 0;
    this.done = false;
    this.hit = false;

    const dx = tx - sx, dy = ty - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.duration = (dist / tier.projectileSpeed) * 1000;

    this.trail = [];
  }

  update(dt) {
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1);

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();

    this.x = lerp(this.sx, this.tx, ease.outCubic(progress));
    this.y = lerp(this.sy, this.ty, ease.outCubic(progress));

    if (progress >= 1 && !this.hit) {
      this.hit = true;
      this.done = true;
    }
  }

  draw(ctx) {
    const color = this.tier.color;
    const r = this.tier.projectileSize * (this.isCrit ? 1.5 : 1);

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * 0.5;
      const tr = r * (i / this.trail.length) * 0.7;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(1, tr), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Head
    ctx.save();
    ctx.fillStyle = this.isCrit ? '#ffffff' : this.tier.outerColor;
    ctx.shadowColor = this.isCrit ? '#fbbf24' : color;
    ctx.shadowBlur = this.isCrit ? 22 : 14;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Single Attacker Entity ───────────────────────────────────────────────────
class AttackerEntity {
  constructor(tier, slotIndex, slotCount, upgradeLevel) {
    this.tier = tier;
    this.slotIndex = slotIndex;
    this.slotCount = slotCount;
    this.upgradeLevel = upgradeLevel;

    // Orbit starts staggered so they don't bunch up
    this.angle = (slotIndex / slotCount) * Math.PI * 2 + (tier.orbitRadius * 0.02);
    this.x = 0;
    this.y = 0;

    // Stagger initial fire so they don't all shoot at once
    this.fireTimer = (slotIndex / slotCount) * this._fireInterval;

    this.pulsePhase = randFloat(0, Math.PI * 2);
    this.entryT = 0;
    this.projectiles = [];
    this._cx = 0;
    this._cy = 0;
  }

  get _fireInterval() {
    // Each upgrade level reduces interval by 3%, minimum 40% of base
    return this.tier.fireInterval * Math.max(0.4, Math.pow(0.97, this.upgradeLevel - 1));
  }

  get _dmgMult() {
    return this.tier.dmgMult * Math.pow(1.1, this.upgradeLevel - 1);
  }

  // Returns array of hit events {damage, isCrit, x, y}
  update(dt, cx, cy, enemy) {
    this._cx = cx;
    this._cy = cy;

    this.angle += this.tier.orbitSpeed * (dt / 1000);
    this.x = cx + Math.cos(this.angle) * this.tier.orbitRadius;
    this.y = cy + Math.sin(this.angle) * this.tier.orbitRadius;
    this.pulsePhase += 0.06;
    if (this.entryT < 1) this.entryT = Math.min(1, this.entryT + 0.05);

    // Fire
    this.fireTimer -= dt;
    const hits = [];

    if (this.fireTimer <= 0 && enemy?.alive) {
      this.fireTimer = this._fireInterval;

      const player = window.game?.player;
      const isCrit = player ? player.rollCrit() : false;
      let dmg = Math.floor((player?.attack || 1) * this._dmgMult);
      if (isCrit) {
        dmg = Math.floor(dmg * (player?.critMult || 2));
        if (player) player.totalCrits++;
      }

      this.projectiles.push(new Projectile(
        this.x, this.y,
        enemy.x + randFloat(-8, 8),
        enemy.y + randFloat(-8, 8),
        this.tier, dmg, isCrit
      ));
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.done) {
        if (p.hit) hits.push({ damage: p.damage, isCrit: p.isCrit, x: p.tx, y: p.ty });
        this.projectiles.splice(i, 1);
      }
    }

    return hits;
  }

  draw(ctx) {
    const scale = ease.outElastic(this.entryT);
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.18;
    const r = this.tier.size * pulse * scale;
    const color = this.tier.color;

    // Orbit ring — only draw for slot 0 to avoid duplicate rings
    if (this.slotIndex === 0) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 9]);
      ctx.beginPath();
      ctx.arc(this._cx, this._cy, this.tier.orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Outer glow
    ctx.save();
    ctx.globalAlpha = scale * 0.8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 + Math.sin(this.pulsePhase) * 6;

    // Body
    const gradient = ctx.createRadialGradient(
      this.x - r * 0.3, this.y - r * 0.3, 0,
      this.x, this.y, r
    );
    gradient.addColorStop(0, this.tier.outerColor);
    gradient.addColorStop(0.6, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.globalAlpha = scale * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Projectiles
    for (const p of this.projectiles) p.draw(ctx);
  }
}

// ─── Manager ─────────────────────────────────────────────────────────────────
class AttackerManager {
  constructor() {
    this.attackers = [];
    this._currentLevels = {};
    ATTACKER_TIERS.forEach(t => this._currentLevels[t.id] = 0);
  }

  // Called after any upgrade purchase to sync visual entities
  sync(upgradeLevels) {
    let changed = false;
    for (const tier of ATTACKER_TIERS) {
      const newLevel = upgradeLevels[tier.id] || 0;
      if (this._currentLevels[tier.id] !== newLevel) {
        this._currentLevels[tier.id] = newLevel;
        changed = true;
      }
    }
    if (changed) this._rebuild();
  }

  _rebuild() {
    // Preserve projectiles in-flight from existing entities
    const inFlightByTier = {};
    for (const a of this.attackers) {
      const id = a.tier.id;
      if (!inFlightByTier[id]) inFlightByTier[id] = [];
      inFlightByTier[id].push(...a.projectiles);
    }

    this.attackers = [];

    for (const tier of ATTACKER_TIERS) {
      const level = this._currentLevels[tier.id] || 0;
      const count = getAttackerCount(level);
      for (let i = 0; i < count; i++) {
        const entity = new AttackerEntity(tier, i, Math.max(count, 1), level);
        // Restore in-flight projectiles to first entity of each tier
        if (i === 0 && inFlightByTier[tier.id]) {
          entity.projectiles = inFlightByTier[tier.id];
        }
        this.attackers.push(entity);
      }
    }
  }

  update(dt, cx, cy, enemy) {
    const allHits = [];
    for (const a of this.attackers) {
      const hits = a.update(dt, cx, cy, enemy);
      allHits.push(...hits);
    }
    return allHits;
  }

  draw(ctx) {
    // Draw orbit rings first (behind everything)
    for (const a of this.attackers) {
      if (a.slotIndex === 0) {
        a.draw._orbitOnly?.(ctx);
      }
    }
    // Draw entities + projectiles
    for (const a of this.attackers) a.draw(ctx);
  }

  get totalCount() { return this.attackers.length; }

  getTotalDPS(player) {
    let dps = 0;
    for (const tier of ATTACKER_TIERS) {
      const level = this._currentLevels[tier.id] || 0;
      const count = getAttackerCount(level);
      if (count === 0) continue;
      const entity = new AttackerEntity(tier, 0, 1, level);
      const shotsPerSec = 1000 / entity._fireInterval;
      const avgDmg = Math.floor(player.attack * entity._dmgMult);
      dps += count * shotsPerSec * avgDmg;
    }
    return Math.floor(dps);
  }
}
