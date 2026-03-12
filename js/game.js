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

    this.gold = 0;
    this.zone = 1;
    this.killsInZone = 0;
    this.currentEnemy = null;

    this.stats = {
      bossKills: 0,
      totalGoldEarned: 0,
    };

    this._lastTime = 0;
    this._autoAttackAccum = 0;
    this._saveTimer = 0;
    this._uiUpdateTimer = 0;
    this._running = false;

    this._bgStars = this._generateBgStars();
    this._bgNebulas = this._generateNebulas();

    this._bindEvents();
    this._loadSave();

    this.spawnEnemy();
    this.ui.updateAll(this);
    this.ui.updateUpgrades(this);

    this._running = true;
    requestAnimationFrame(this._loop.bind(this));
  }

  _generateBgStars() {
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: randFloat(0, this.canvas.width),
        y: randFloat(0, this.canvas.height),
        r: randFloat(0.5, 2.5),
        alpha: randFloat(0.3, 1.0),
        twinkle: randFloat(0.01, 0.04),
        phase: randFloat(0, Math.PI * 2),
      });
    }
    return stars;
  }

  _generateNebulas() {
    const nebulas = [];
    for (let i = 0; i < 3; i++) {
      nebulas.push({
        x: randFloat(50, this.canvas.width - 50),
        y: randFloat(50, this.canvas.height - 50),
        r: randFloat(60, 120),
        color: ['rgba(124,58,237,', 'rgba(59,130,246,', 'rgba(6,182,212,'][i],
        alpha: randFloat(0.03, 0.07),
        drift: randFloat(-0.1, 0.1),
        driftY: randFloat(-0.05, 0.05),
      });
    }
    return nebulas;
  }

  _bindEvents() {
    this.canvas.addEventListener('click', this._handleClick.bind(this));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (touch.clientX - rect.left) * scaleX;
      const my = (touch.clientY - rect.top) * scaleY;
      this._attackAt(mx, my);
    }, { passive: false });

    // Keyboard shortcut: space to attack center
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        Audio.resume();
        this._attackAt(this.canvas.width / 2, this.canvas.height / 2);
      }
    });
  }

  _handleClick(e) {
    Audio.resume();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    this._attackAt(mx, my);
  }

  _attackAt(mx, my) {
    if (!this.currentEnemy || !this.currentEnemy.alive) return;

    this.player.totalClicks++;
    const { damage, isCrit } = this.player.calcDamage();

    // Apply various multipliers
    let finalDamage = damage;
    finalDamage *= this.upgrades.getBattleCryMult();
    finalDamage *= this.upgrades.getBonus('berserker');
    finalDamage *= this.upgrades.getBonus('prestigeBoost');
    finalDamage = Math.floor(finalDamage);

    this._dealDamage(finalDamage, isCrit, mx, my);

    // Multi-strike
    if (chance(this.upgrades.getBonus('multiStrike'))) {
      const { damage: d2, isCrit: c2 } = this.player.calcDamage();
      let fd2 = Math.floor(d2 * this.upgrades.getBattleCryMult() * this.upgrades.getBonus('berserker') * this.upgrades.getBonus('prestigeBoost'));
      this._dealDamage(fd2, c2, mx + randFloat(-20, 20), my + randFloat(-20, 20));
    }
  }

  _dealDamage(damage, isCrit, x, y) {
    const killed = this.currentEnemy.takeDamage(damage);

    // Particles
    const color = isCrit ? '#fbbf24' : this.currentEnemy.type.color;
    this.particles.sparks(x, y, color, isCrit ? 10 : 5);
    this.particles.addDamageNumber(x, y, damage, isCrit);

    // Sound
    if (isCrit) Audio.crit();
    else Audio.hit();

    // Log
    if (isCrit) {
      this.ui.addLog(`CRIT! ${formatNum(damage)} dmg!`, 'crit');
    }

    if (killed) {
      this._onEnemyKilled(x, y);
    }
  }

  _onEnemyKilled(x, y) {
    const e = this.currentEnemy;
    const isBoss = e.isBoss;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Big death burst
    this.particles.burst(cx, cy, e.type.color, isBoss ? 20 : 12, isBoss);
    this.particles.ring(cx, cy, e.type.color);
    this.particles.coins(cx, cy, isBoss ? 8 : 4);

    if (isBoss) {
      Audio.bossKill();
      this.ui.screenShake();
      this.ui.addLog(`BOSS SLAIN! ${e.name}`, 'boss');
      this.stats.bossKills++;
    } else {
      Audio.kill();
      this.ui.addLog(`Killed ${e.name}`, 'kill');
    }

    // Gold reward
    let goldEarned = Math.floor(e.goldReward * this.player.goldMult);
    if (isBoss) goldEarned = Math.floor(goldEarned * this.upgrades.getBonus('treasureHunter'));
    goldEarned += this.upgrades.getBonus('goldMagnet');

    this.gold += goldEarned;
    this.stats.totalGoldEarned += goldEarned;

    // XP reward
    const leveledUp = this.player.gainXP(e.xpReward);
    if (leveledUp) {
      Audio.levelUp();
      this.ui.showLevelUp(this.player.level);
      this.ui.addLog(`Level up! Now Level ${this.player.level}`, 'level');
    }

    this.player.totalKills++;

    // Battle cry on kill
    this.upgrades.triggerBattleCry();

    // Check achievements
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
      this.ui.addLog(`★ Entered Zone ${this.zone}!`, 'zone');
    }
    this.spawnEnemy();
  }

  spawnEnemy() {
    const killCountInZone = this.killsInZone;
    this.currentEnemy = new Enemy(this.zone, killCountInZone);
    if (this.currentEnemy.isBoss) {
      Audio.boss();
      this.ui.addLog(`⚠ BOSS INCOMING: ${this.currentEnemy.name}!`, 'boss');
    }
    this.ui.updateEnemy(this);
  }

  buyUpgrade(id) {
    const result = this.upgrades.purchase(id, this.player, this.gold);
    if (result.success) {
      this.gold -= result.cost;
      Audio.purchase();
      this.ui.addLog(`Upgraded: ${id}`, '');
      this._checkAchievements();
      this.ui.updateAll(this);
    }
  }

  prestige() {
    if (this.zone < CONFIG.PRESTIGE_ZONE) return;
    if (!confirm('Prestige? You will reset progress but gain Stars for permanent bonuses!')) return;

    const stars = this.calcPrestigeStars();
    this.player.stars += stars;
    this.player.prestiges++;

    Audio.prestige();
    this.ui.addLog(`✦ PRESTIGE! Gained ${stars} Stars. Total: ${this.player.stars}`, 'zone');

    // Reset
    this.gold = 0;
    this.zone = 1;
    this.killsInZone = 0;
    this.upgrades = new UpgradeSystem();
    this.player.reset(true); // keep prestige stats

    this._checkAchievements();
    this.spawnEnemy();
    this.ui.updateAll(this);

    // Rebuild upgrade buttons
    const upgradeList = document.getElementById('upgrades-list');
    if (upgradeList) upgradeList.innerHTML = '';
    this.ui.updateUpgrades(this);
  }

  calcPrestigeStars() {
    return Math.floor(1 + this.player.prestiges * 0.5 + (this.zone - CONFIG.PRESTIGE_ZONE) * 0.1);
  }

  _checkAchievements() {
    const newOnes = this.achievements.check(this);
    for (const ach of newOnes) {
      this.ui.showAchievementToast(ach);
    }
    this.ui.updateAchievements(this);
  }

  // ===== GAME LOOP =====
  _loop(timestamp) {
    if (!this._running) return;

    const dt = Math.min(timestamp - this._lastTime, 100); // cap at 100ms
    this._lastTime = timestamp;

    this._update(dt);
    this._draw();

    requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    this.upgrades.updateBattleCry(dt);
    this.ui.tickToast(dt);

    // Auto attack
    if (this.upgrades.getLevel('autoAttack') > 0 && this.currentEnemy?.alive) {
      this._autoAttackAccum += dt;
      if (this._autoAttackAccum >= CONFIG.AUTO_ATTACK_INTERVAL) {
        this._autoAttackAccum -= CONFIG.AUTO_ATTACK_INTERVAL;
        const autoDps = this.upgrades.getBonus('autoAttack');
        const dmg = Math.floor(
          this.player.attack * autoDps
          * this.upgrades.getBattleCryMult()
          * this.upgrades.getBonus('berserker')
          * this.upgrades.getBonus('prestigeBoost')
        );
        if (dmg > 0 && this.currentEnemy) {
          const killed = this.currentEnemy.takeDamage(dmg);
          this.particles.addDamageNumber(
            this.canvas.width / 2 + randFloat(-40, 40),
            this.canvas.height / 2 + randFloat(-40, 40),
            dmg, false
          );
          if (killed) this._onEnemyKilled(this.canvas.width / 2, this.canvas.height / 2);
        }
      }
    }

    // Enemy update
    if (this.currentEnemy) this.currentEnemy.update(dt);

    // Particles
    this.particles.update();

    // Background drift
    for (const n of this._bgNebulas) {
      n.x += n.drift * (dt / 1000);
      n.y += n.driftY * (dt / 1000);
    }

    // UI update (throttled)
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

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(7,7,26,0.95)';
    ctx.fillRect(0, 0, w, h);

    // Nebulas
    for (const n of this._bgNebulas) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, n.color + (n.alpha * 3) + ')');
      g.addColorStop(1, n.color + '0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars
    const t = Date.now() / 1000;
    for (const s of this._bgStars) {
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(t * s.twinkle * 10 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Enemy
    if (this.currentEnemy) {
      this.currentEnemy.draw(ctx, w / 2, h / 2);
    }

    // Particles
    this.particles.draw();

    // Battle cry indicator
    if (this.upgrades.battleCryActive) {
      ctx.save();
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(t * 5);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, w - 4, h - 4);
      ctx.restore();
    }
  }

  // ===== SAVE / LOAD =====
  _save() {
    try {
      const data = {
        gold: this.gold,
        zone: this.zone,
        killsInZone: this.killsInZone,
        stats: this.stats,
        player: this.player.serialize(),
        upgrades: this.upgrades.serialize(),
        achievements: this.achievements.serialize(),
      };
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
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
      if (data.player) this.player.deserialize(data.player);
      if (data.upgrades) this.upgrades.deserialize(data.upgrades);
      if (data.achievements) this.achievements.deserialize(data.achievements);

      console.log('Game loaded!');
    } catch(e) { console.warn('Load failed:', e); }
  }

  hardReset() {
    if (!confirm('HARD RESET: Delete ALL progress?')) return;
    localStorage.removeItem(CONFIG.SAVE_KEY);
    location.reload();
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
