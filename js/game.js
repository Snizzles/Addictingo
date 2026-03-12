// === MAIN GAME ===
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.player = new Player();
    this.upgrades = new UpgradeSystem();
    this.achievements = new AchievementSystem();
    this.ui = new UI();
    this.particles = new ParticleSystem(this.canvas);
    this.attackerManager = new AttackerManager();

    this.gold = 0;
    this.zone = 1;
    this.killsInZone = 0;
    this.currentEnemy = null;

    this.stats = {
      bossKills: 0,
      totalGoldEarned: 0,
    };

    this._lastTime = 0;
    this._saveTimer = 0;
    this._uiUpdateTimer = 0;
    this._running = false;

    // Canvas overlay effects: {type, timer, maxTimer, data}
    this._canvasEffects = [];

    this._bgStars = this._generateBgStars();
    this._bgNebulas = this._generateNebulas();

    this._bindEvents();
    this._loadSave();

    this.spawnEnemy();
    this.ui.updateAll(this);

    this._running = true;
    requestAnimationFrame(this._loop.bind(this));
  }

  get cx() { return this.canvas.width / 2; }
  get cy() { return this.canvas.height / 2; }

  _generateBgStars() {
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: randFloat(0, this.canvas.width),
        y: randFloat(0, this.canvas.height),
        r: randFloat(0.5, 2.5),
        alpha: randFloat(0.3, 1.0),
        twinkleSpeed: randFloat(0.8, 3.0),
        phase: randFloat(0, Math.PI * 2),
      });
    }
    return stars;
  }

  _generateNebulas() {
    return [
      { x: 120,  y: 100,  r: 90,  color: 'rgba(124,58,237,',  alpha: 0.06, dx: 0.08,  dy: 0.04  },
      { x: 360,  y: 310,  r: 110, color: 'rgba(59,130,246,',  alpha: 0.05, dx: -0.06, dy: 0.05  },
      { x: 240,  y: 200,  r: 70,  color: 'rgba(6,182,212,',   alpha: 0.04, dx: 0.05,  dy: -0.04 },
    ];
  }

  _bindEvents() {
    this.canvas.addEventListener('click', this._handleClick.bind(this));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      Audio.resume();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this._attackAt((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        Audio.resume();
        this._attackAt(this.cx, this.cy);
      }
    });
  }

  _handleClick(e) {
    Audio.resume();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this._attackAt((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  }

  // ── Combat ──────────────────────────────────────────────────────────────────

  _attackAt(mx, my) {
    if (!this.currentEnemy?.alive) return;
    this.player.totalClicks++;

    const { damage, isCrit } = this.player.calcDamage();
    let finalDmg = Math.floor(
      damage * this.upgrades.getBonus('prestigeBoost', this)
    );
    this._dealDamage(finalDmg, isCrit, mx, my, false);
  }

  _dealDamage(damage, isCrit, x, y, isAuto = false) {
    if (!this.currentEnemy?.alive) return;
    const killed = this.currentEnemy.takeDamage(damage);

    const color = isCrit ? '#fbbf24' : (isAuto ? '#a5f3fc' : this.currentEnemy.type.color);
    this.particles.sparks(x, y, color, isCrit ? 12 : isAuto ? 3 : 6);
    this.particles.addDamageNumber(x, y, damage, isCrit, isAuto);

    if (!isAuto) {
      if (isCrit) Audio.crit();
      else Audio.hit();
    }

    if (killed) this._onEnemyKilled(x, y);
  }

  _onEnemyKilled(x, y) {
    const e = this.currentEnemy;
    const isBoss = e.isBoss;
    const cx = this.cx, cy = this.cy;

    // Big death VFX
    this.particles.burst(cx, cy, e.type.color, isBoss ? 30 : 15, isBoss);
    this.particles.ring(cx, cy, e.type.color, isBoss ? 110 : 75);
    if (isBoss) {
      this.particles.ring(cx, cy, '#ffffff', 150);
      this.particles.ring(cx, cy, e.type.color, 190);
    }
    this.particles.coins(cx, cy, isBoss ? 12 : 5);

    // Canvas overlay effect
    if (isBoss) {
      Audio.bossKill();
      this.ui.screenShake();
      this._addCanvasEffect('bossKill', 1.2, { color: e.type.color, name: e.name });
      this.ui.addLog(`⚠ BOSS SLAIN: ${e.name}`, 'boss');
      this.stats.bossKills++;
    } else {
      Audio.kill();
    }

    // Gold
    let goldEarned = Math.floor(e.goldReward * this.player.goldMult);
    if (isBoss) goldEarned = Math.floor(goldEarned * this.upgrades.getBonus('bossGoldMult', this));
    goldEarned = Math.max(1, goldEarned);
    this.gold += goldEarned;
    this.stats.totalGoldEarned += goldEarned;

    // XP + level up
    const xpMult = this.upgrades.getBonus('xpMult', this);
    const xpGained = Math.floor(e.xpReward * xpMult);
    const leveledUp = this.player.gainXP(xpGained);

    // Kill reward floating text
    this.particles.addKillReward(cx + randFloat(-30, 30), cy, goldEarned, xpGained);

    if (leveledUp) {
      Audio.levelUp();
      this._addCanvasEffect('levelUp', 2.0, { level: this.player.level });
      this.ui.addLog(`★ LEVEL UP → ${this.player.level}`, 'level');
    }

    this.player.totalKills++;
    this._checkAchievements();

    // Next enemy
    this.killsInZone++;
    if (this.killsInZone >= CONFIG.ENEMIES_PER_ZONE) {
      this._advanceZone();
    } else {
      this.spawnEnemy();
    }
  }

  _advanceZone() {
    this.killsInZone = 0;
    if (this.zone < CONFIG.MAX_ZONE) {
      this.zone++;
      Audio.zoneComplete();
      this._addCanvasEffect('zone', 0.9, { zone: this.zone });
      this.ui.addLog(`★ Zone ${this.zone} — deeper…`, 'zone');
    }
    this.spawnEnemy();
    this.attackerManager.sync(this.upgrades.levels);
  }

  spawnEnemy() {
    this.currentEnemy = new Enemy(this.zone, this.killsInZone);
    if (this.currentEnemy.isBoss) {
      Audio.boss();
      this.ui.addLog(`⚠ BOSS INCOMING: ${this.currentEnemy.name}!`, 'boss');
    }
  }

  buyUpgrade(id) {
    const result = this.upgrades.purchase(id, this.player, this.gold, this);
    if (!result.success) return;
    this.gold -= result.cost;
    Audio.purchase();
    this.attackerManager.sync(this.upgrades.levels);
    this._checkAchievements();
    this.ui.updateAll(this);
  }

  prestige() {
    if (this.zone < CONFIG.PRESTIGE_ZONE) return;
    if (!confirm('PRESTIGE — Reset progress and gain permanent Stars?')) return;

    const stars = this.calcPrestigeStars();
    this.player.stars += stars;
    this.player.prestiges++;

    Audio.prestige();
    this._addCanvasEffect('prestige', 2.5, { stars });
    this.ui.addLog(`✦ PRESTIGE! Gained ${stars} Stars. Total: ${this.player.stars}`, 'zone');

    this.gold = 0;
    this.zone = 1;
    this.killsInZone = 0;
    this.upgrades = new UpgradeSystem();
    this.player.reset(true);
    this.attackerManager = new AttackerManager();

    this._checkAchievements();
    this.spawnEnemy();
    this.ui.updateAll(this);
    const upgradeList = document.getElementById('upgrades-list');
    if (upgradeList) upgradeList.innerHTML = '';
    this.ui.updateUpgrades(this);
  }

  calcPrestigeStars() {
    return Math.max(1, Math.floor(1 + this.player.prestiges * 0.5 + (this.zone - CONFIG.PRESTIGE_ZONE) * 0.1));
  }

  // ── Canvas Overlay Effects ──────────────────────────────────────────────────

  _addCanvasEffect(type, duration, data = {}) {
    this._canvasEffects.push({ type, timer: duration, maxTimer: duration, data });
  }

  _drawCanvasEffects(w, h) {
    const ctx = this.ctx;
    const t = Date.now() / 1000;

    for (let i = this._canvasEffects.length - 1; i >= 0; i--) {
      const eff = this._canvasEffects[i];
      if (eff.timer <= 0) { this._canvasEffects.splice(i, 1); continue; }
      const progress = 1 - eff.timer / eff.maxTimer; // 0→1 over effect lifetime

      if (eff.type === 'levelUp') {
        // Gold flash
        const flashAlpha = progress < 0.15 ? progress / 0.15 : Math.max(0, 1 - (progress - 0.15) / 0.5);
        ctx.save();
        ctx.fillStyle = `rgba(251,191,36,${flashAlpha * 0.35})`;
        ctx.fillRect(0, 0, w, h);

        // Big level text
        const textProgress = Math.min(progress * 5, 1);
        const textAlpha = progress > 0.7 ? Math.max(0, 1 - (progress - 0.7) / 0.3) : 1;
        const scale = ease.outElastic(textProgress);
        const floatY = -40 * (progress - 0.1);

        ctx.globalAlpha = textAlpha;
        ctx.translate(w / 2, h / 2 + floatY);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow/glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 40;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#fde68a';
        ctx.fillText('LEVEL UP!', 0, -42);

        ctx.font = `bold 72px sans-serif`;
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(eff.data.level, 0, 14);
        const numGrad = ctx.createLinearGradient(0, -30, 0, 44);
        numGrad.addColorStop(0, '#fef3c7');
        numGrad.addColorStop(0.4, '#fbbf24');
        numGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = numGrad;
        ctx.fillText(eff.data.level, 0, 14);

        ctx.restore();

      } else if (eff.type === 'bossKill') {
        const flashAlpha = progress < 0.1 ? progress / 0.1 : Math.max(0, 1 - (progress - 0.1) / 0.6);
        ctx.save();
        ctx.fillStyle = `rgba(239,68,68,${flashAlpha * 0.4})`;
        ctx.fillRect(0, 0, w, h);

        if (progress < 0.6) {
          const textAlpha = Math.max(0, 1 - progress * 2);
          const scale = ease.outElastic(Math.min(progress * 8, 1));
          ctx.globalAlpha = textAlpha;
          ctx.translate(w / 2, h / 2 - 30);
          ctx.scale(scale, scale);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillStyle = '#fef2f2';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 30;
          ctx.fillText('BOSS SLAIN!', 0, 0);
        }
        ctx.restore();

      } else if (eff.type === 'zone') {
        const flashAlpha = Math.max(0, 1 - progress * 3);
        ctx.save();
        ctx.fillStyle = `rgba(6,182,212,${flashAlpha * 0.25})`;
        ctx.fillRect(0, 0, w, h);

        if (progress < 0.5) {
          const textAlpha = Math.max(0, 1 - progress * 2.5);
          ctx.globalAlpha = textAlpha;
          ctx.translate(w / 2, 60);
          ctx.scale(1, 1);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillStyle = '#a5f3fc';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 20;
          ctx.fillText(`ZONE ${eff.data.zone}`, 0, 0);
        }
        ctx.restore();

      } else if (eff.type === 'prestige') {
        const flashAlpha = progress < 0.2 ? progress / 0.2 : Math.max(0, 1 - (progress - 0.2) / 0.6);
        ctx.save();
        ctx.fillStyle = `rgba(251,191,36,${flashAlpha * 0.55})`;
        ctx.fillRect(0, 0, w, h);

        if (progress < 0.7) {
          const textAlpha = Math.max(0, 1 - (progress - 0.15) / 0.55);
          const scale = ease.outElastic(Math.min(progress * 4, 1));
          ctx.globalAlpha = textAlpha;
          ctx.translate(w / 2, h / 2);
          ctx.scale(scale, scale);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillStyle = '#fef3c7';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 50;
          ctx.fillText(`✦ PRESTIGE ✦`, 0, -30);
          ctx.font = 'bold 22px sans-serif';
          ctx.fillStyle = '#fde68a';
          ctx.fillText(`+${eff.data.stars} Stars`, 0, 20);
        }
        ctx.restore();
      }
    }
  }

  // ── Achievements ────────────────────────────────────────────────────────────

  _checkAchievements() {
    const newOnes = this.achievements.check(this);
    for (const ach of newOnes) this.ui.showAchievementToast(ach);
    this.ui.updateAchievements(this);
  }

  // ── Game Loop ───────────────────────────────────────────────────────────────

  _loop(timestamp) {
    if (!this._running) return;
    const dt = Math.min(timestamp - this._lastTime, 100);
    this._lastTime = timestamp;
    this._update(dt);
    this._draw();
    requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    this.ui.tickToast(dt);

    // Update canvas effects timers
    for (const eff of this._canvasEffects) eff.timer -= dt / 1000;

    // Auto-attackers: update + collect hits
    if (this.currentEnemy?.alive) {
      const hits = this.attackerManager.update(dt, this.cx, this.cy, this.currentEnemy);
      for (const h of hits) {
        const prestige = this.upgrades.getBonus('prestigeBoost', this);
        const finalDmg = Math.floor(h.damage * prestige);
        this._dealDamage(finalDmg, h.isCrit, h.x, h.y, true);
      }
    }

    // Enemy
    if (this.currentEnemy) this.currentEnemy.update(dt);

    // Particles
    this.particles.update();

    // Background drift
    for (const n of this._bgNebulas) {
      n.x += n.dx * (dt / 1000);
      n.y += n.dy * (dt / 1000);
    }

    // UI update (throttled to 100ms)
    this._uiUpdateTimer += dt;
    if (this._uiUpdateTimer >= 100) {
      this._uiUpdateTimer = 0;
      this.ui.updateHeader(this);
      this.ui.updatePlayer(this);
      this.ui.updateEnemy(this);
      this.ui.updateZone(this);
      this.ui.updatePrestige(this);
      this.ui.updateUpgrades(this);
    }

    // Auto save every 10s
    this._saveTimer += dt;
    if (this._saveTimer >= 10000) {
      this._saveTimer = 0;
      this._save();
    }
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = Date.now() / 1000;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(7,7,26,0.97)';
    ctx.fillRect(0, 0, w, h);

    // Nebulas
    for (const n of this._bgNebulas) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, n.color + n.alpha * 4 + ')');
      g.addColorStop(1, n.color + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Twinkling stars
    for (const s of this._bgStars) {
      const alpha = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Attackers (behind enemy)
    this.attackerManager.draw(ctx);

    // Enemy
    if (this.currentEnemy) this.currentEnemy.draw(ctx, this.cx, this.cy);

    // Particles (on top of everything)
    this.particles.draw();

    // Canvas overlay effects (level up flash, boss kill, zone, prestige)
    this._drawCanvasEffects(w, h);
  }

  // ── Save / Load ─────────────────────────────────────────────────────────────

  _save() {
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify({
        gold: this.gold,
        zone: this.zone,
        killsInZone: this.killsInZone,
        stats: this.stats,
        player: this.player.serialize(),
        upgrades: this.upgrades.serialize(),
        achievements: this.achievements.serialize(),
      }));
    } catch(e) { console.warn('Save failed:', e); }
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.gold = data.gold || 0;
      this.zone = data.zone || 1;
      this.killsInZone = data.killsInZone || 0;
      this.stats = { ...this.stats, ...data.stats };
      if (data.player)       this.player.deserialize(data.player);
      if (data.upgrades)     this.upgrades.deserialize(data.upgrades);
      if (data.achievements) this.achievements.deserialize(data.achievements);
      this.attackerManager.sync(this.upgrades.levels);
    } catch(e) { console.warn('Load failed:', e); }
  }

  hardReset() {
    if (!confirm('HARD RESET: Delete ALL progress?')) return;
    localStorage.removeItem(CONFIG.SAVE_KEY);
    location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
