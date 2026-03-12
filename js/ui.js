// === UI MANAGER ===
class UI {
  constructor() {
    this.els = {};
    this._cacheElements();
    this._achToastTimer = 0;
    this._achToastQueue = [];
    this._logEntries = [];
    this.maxLogEntries = 50;
  }

  _cacheElements() {
    const ids = [
      'zone-display', 'zone-num', 'zone-next', 'zone-bar', 'zone-bar-text',
      'gold-display', 'stars-display',
      'player-level', 'xp-bar', 'xp-text',
      'stat-attack', 'stat-crit', 'stat-critx', 'stat-dps', 'stat-goldmult', 'stat-clicks',
      'upgrades-list', 'achievements-list', 'combat-log',
      'enemy-name', 'hp-bar', 'hp-text',
      'prestige-btn', 'prestige-reward-text', 'prestige-info',
      'boss-indicator', 'click-hint',
      'achievement-toast', 'toast-name',
      'levelup-toast', 'levelup-num',
    ];
    ids.forEach(id => this.els[id] = document.getElementById(id));
  }

  updateAll(game) {
    this.updateHeader(game);
    this.updatePlayer(game);
    this.updateEnemy(game);
    this.updateZone(game);
    this.updatePrestige(game);
    this.updateUpgrades(game);
    this.updateAchievements(game);
  }

  updateHeader(game) {
    this.setText('gold-display', formatNum(game.gold));
    this.setText('stars-display', game.player.stars);
    this.setText('zone-display', game.zone);

    if (game.currentEnemy?.isBoss) {
      this.els['boss-indicator']?.classList.remove('hidden');
    } else {
      this.els['boss-indicator']?.classList.add('hidden');
    }
  }

  updatePlayer(game) {
    const p = game.player;
    this.setText('player-level', p.level);
    this.setWidth('xp-bar', p.getXPPercent());
    this.setText('xp-text', `${formatNum(p.xp)} / ${formatNum(p.xpToNext)} XP`);

    this.setText('stat-attack', formatNum(Math.floor(p.attack)));
    this.setText('stat-crit', `${formatFloat(p.critChance, 1)}%`);
    this.setText('stat-critx', `${formatFloat(p.critMult, 2)}×`);

    const autoDps = game.upgrades.getBonus('autoAttack') * p.attack;
    this.setText('stat-dps', formatNum(Math.floor(autoDps)));
    this.setText('stat-goldmult', `${formatFloat(p.goldMult, 2)}×`);
    this.setText('stat-clicks', formatNum(p.totalClicks));
  }

  updateEnemy(game) {
    const e = game.currentEnemy;
    if (!e) return;

    this.setText('enemy-name', e.name);
    const pct = e.hpPercent * 100;
    this.setWidth('hp-bar', pct);
    this.setText('hp-text', `${formatNum(e.hp)} / ${formatNum(e.maxHp)}`);

    // Color HP bar by health
    const bar = this.els['hp-bar'];
    if (bar) {
      if (pct < 25) bar.style.background = 'linear-gradient(90deg, #7f1d1d, #dc2626)';
      else if (pct < 50) bar.style.background = 'linear-gradient(90deg, #b45309, #f59e0b)';
      else bar.style.background = 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)';
    }
  }

  updateZone(game) {
    const kills = game.killsInZone;
    const total = CONFIG.ENEMIES_PER_ZONE;
    const pct = (kills / total) * 100;

    this.setText('zone-num', game.zone);
    this.setText('zone-next', game.zone + 1);
    this.setWidth('zone-bar', pct);
    this.setText('zone-bar-text', `${kills} / ${total}`);
  }

  updatePrestige(game) {
    const canPrestige = game.zone >= CONFIG.PRESTIGE_ZONE;
    const btn = this.els['prestige-btn'];
    const info = this.els['prestige-info'];

    if (canPrestige) {
      btn?.classList.remove('hidden');
      info?.classList.add('hidden');
      const stars = game.calcPrestigeStars();
      this.setText('prestige-reward-text', `Gain ${stars} Star${stars !== 1 ? 's' : ''} (have ${game.player.stars})`);
    } else {
      btn?.classList.add('hidden');
      info?.classList.remove('hidden');
    }
  }

  updateUpgrades(game) {
    const container = this.els['upgrades-list'];
    if (!container) return;

    const visible = game.upgrades.getVisibleUpgrades(game.player.prestiges);

    // Build or update upgrade buttons
    visible.forEach(def => {
      const level = game.upgrades.getLevel(def.id);
      const maxed = level >= def.maxLevel;
      const cost = game.upgrades.getCost(def.id);
      const affordable = !maxed && game.gold >= cost;

      let btn = document.getElementById(`upgrade-${def.id}`);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = `upgrade-${def.id}`;
        btn.className = 'upgrade-btn';
        btn.addEventListener('click', () => game.buyUpgrade(def.id));
        container.appendChild(btn);
      }

      // Update classes
      btn.className = 'upgrade-btn' + (maxed ? ' maxed' : '') + (affordable && !maxed ? ' affordable' : '');
      btn.disabled = maxed || !affordable;

      const nextDesc = !maxed ? def.getDesc(level) : '(MAXED)';
      btn.innerHTML = `
        <span class="upgrade-icon">${def.icon}</span>
        <span class="upgrade-info">
          <span class="upgrade-name">
            ${def.name}
            <span class="upgrade-level">${level}/${def.maxLevel}</span>
          </span>
          <span class="upgrade-desc">${nextDesc}</span>
        </span>
        <span class="upgrade-cost">${maxed ? '✓' : `💰${formatNum(cost)}`}</span>
      `;
    });
  }

  updateAchievements(game) {
    const container = this.els['achievements-list'];
    if (!container) return;

    if (container.children.length === ACHIEVEMENT_DEFS.length) {
      // Just update classes
      ACHIEVEMENT_DEFS.forEach(def => {
        const el = document.getElementById(`ach-${def.id}`);
        if (el) {
          const unlocked = game.achievements.isUnlocked(def.id);
          el.className = 'achievement-item' + (unlocked ? ' unlocked' : '');
          const icon = el.querySelector('.achievement-icon');
          if (icon) icon.className = 'achievement-icon' + (unlocked ? '' : ' ach-locked');
        }
      });
      return;
    }

    // Build achievement list
    container.innerHTML = '';
    ACHIEVEMENT_DEFS.forEach(def => {
      const unlocked = game.achievements.isUnlocked(def.id);
      const el = document.createElement('div');
      el.id = `ach-${def.id}`;
      el.className = 'achievement-item' + (unlocked ? ' unlocked' : '');
      el.innerHTML = `
        <span class="achievement-icon${unlocked ? '' : ' ach-locked'}">${def.icon}</span>
        <span class="achievement-info">
          <span class="ach-name">${def.name}</span>
          <span class="ach-desc">${def.desc}</span>
        </span>
      `;
      container.appendChild(el);
    });
  }

  showAchievementToast(def) {
    this._achToastQueue.push(def);
    if (this._achToastTimer <= 0) this._showNextToast();
  }

  _showNextToast() {
    if (this._achToastQueue.length === 0) return;
    const def = this._achToastQueue.shift();
    const toast = this.els['achievement-toast'];
    const name = this.els['toast-name'];
    if (!toast || !name) return;

    name.textContent = `${def.icon} ${def.name}`;
    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    toast.offsetHeight; // reflow
    toast.style.animation = '';

    this._achToastTimer = 3000;
  }

  tickToast(dt) {
    if (this._achToastTimer > 0) {
      this._achToastTimer -= dt;
      if (this._achToastTimer <= 0) {
        const toast = this.els['achievement-toast'];
        if (toast) {
          toast.style.animation = 'toastOut 0.4s ease forwards';
          setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.animation = '';
            if (this._achToastQueue.length > 0) {
              setTimeout(() => this._showNextToast(), 300);
            }
          }, 400);
        }
      }
    }
  }

  showLevelUp(level) {
    const toast = this.els['levelup-toast'];
    const num = this.els['levelup-num'];
    if (!toast || !num) return;

    num.textContent = level;
    toast.classList.remove('hidden');
    toast.className = 'levelup-toast animating';
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.className = 'levelup-toast hidden';
    }, 1200);
  }

  addLog(msg, type = '') {
    const container = this.els['combat-log'];
    if (!container) return;

    const el = document.createElement('div');
    el.className = `log-entry${type ? ' log-' + type : ''}`;
    el.textContent = msg;
    container.insertBefore(el, container.firstChild);

    this._logEntries.push(el);
    if (this._logEntries.length > this.maxLogEntries) {
      const old = this._logEntries.shift();
      old.remove();
    }
  }

  screenShake() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.classList.add('screen-shake');
    setTimeout(() => canvas.classList.remove('screen-shake'), 250);
  }

  // Helpers
  setText(id, val) {
    const el = this.els[id];
    if (el) el.textContent = val;
  }

  setWidth(id, pct) {
    const el = this.els[id];
    if (el) el.style.width = clamp(pct, 0, 100) + '%';
  }
}
