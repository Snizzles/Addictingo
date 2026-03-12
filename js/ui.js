// === UI MANAGER ===
const UPGRADE_CATEGORIES = [
  { id: 'damage',  label: '⚔️ CLICK POWER',    color: '#ef4444' },
  { id: 'auto',    label: '🤖 AUTO ATTACKERS',  color: '#06b6d4' },
  { id: 'economy', label: '💰 ECONOMY',         color: '#fbbf24' },
];

class UI {
  constructor() {
    this.els = {};
    this._cacheElements();
    this._achToastTimer = 0;
    this._achToastQueue = [];
    this._logEntries = [];
    this.maxLogEntries = 60;
    this._upgradesBuilt = false;
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
    const bossEl = this.els['boss-indicator'];
    if (bossEl) bossEl.classList.toggle('hidden', !game.currentEnemy?.isBoss);
  }

  updatePlayer(game) {
    const p = game.player;
    this.setText('player-level', p.level);
    this.setWidth('xp-bar', p.getXPPercent());
    this.setText('xp-text', `${formatNum(p.xp)} / ${formatNum(p.xpToNext)} XP`);
    this.setText('stat-attack', formatNum(Math.floor(p.attack)));
    this.setText('stat-crit', `${formatFloat(p.critChance, 0)}%`);
    this.setText('stat-critx', `${formatFloat(p.critMult, 2)}×`);

    const autoDps = game.attackerManager.getTotalDPS(p);
    this.setText('stat-dps', formatNum(autoDps));
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

    const bar = this.els['hp-bar'];
    if (bar) {
      if (pct < 25)      bar.style.background = 'linear-gradient(90deg, #7f1d1d, #dc2626)';
      else if (pct < 50) bar.style.background = 'linear-gradient(90deg, #b45309, #f59e0b)';
      else               bar.style.background = 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)';
    }
  }

  updateZone(game) {
    const pct = (game.killsInZone / CONFIG.ENEMIES_PER_ZONE) * 100;
    this.setText('zone-num', game.zone);
    this.setText('zone-next', game.zone + 1);
    this.setWidth('zone-bar', pct);
    this.setText('zone-bar-text', `${game.killsInZone} / ${CONFIG.ENEMIES_PER_ZONE}`);
  }

  updatePrestige(game) {
    const canPrestige = game.zone >= CONFIG.PRESTIGE_ZONE;
    this.els['prestige-btn']?.classList.toggle('hidden', !canPrestige);
    this.els['prestige-info']?.classList.toggle('hidden', canPrestige);
    if (canPrestige) {
      const stars = game.calcPrestigeStars();
      this.setText('prestige-reward-text', `Gain ${stars} Star${stars !== 1 ? 's' : ''} (have ${game.player.stars})`);
    }
  }

  updateUpgrades(game) {
    const container = this.els['upgrades-list'];
    if (!container) return;

    const visible = game.upgrades.getVisibleUpgrades(game.player.prestiges);

    // ── Build DOM structure exactly once ───────────────────────────────────
    // innerHTML is NEVER replaced after build — only textContent of stable
    // leaf nodes is mutated. This prevents the mousedown/mouseup split that
    // swallows clicks when the DOM is rebuilt mid-click.
    if (!this._upgradesBuilt || container.children.length === 0) {
      container.innerHTML = '';
      let currentCat = null;

      for (const def of visible) {
        // Category header
        if (def.category !== currentCat) {
          currentCat = def.category;
          const catDef = UPGRADE_CATEGORIES.find(c => c.id === currentCat);
          if (catDef) {
            const h = document.createElement('div');
            h.className = 'upgrade-cat-header';
            h.style.color = catDef.color;
            h.style.borderColor = catDef.color + '44';
            h.textContent = catDef.label;
            container.appendChild(h);
          }
        }

        // Button skeleton — stable structure, never recreated
        const btn = document.createElement('button');
        btn.id = `upgrade-${def.id}`;
        btn.className = 'upgrade-btn';
        btn.addEventListener('click', () => game.buyUpgrade(def.id));

        const iconEl = document.createElement('span');
        iconEl.className = 'upgrade-icon';
        iconEl.textContent = def.icon;

        const infoEl = document.createElement('span');
        infoEl.className = 'upgrade-info';

        const nameEl = document.createElement('span');
        nameEl.className = 'upgrade-name';
        nameEl.textContent = def.name + ' ';
        const levelEl = document.createElement('span');
        levelEl.className = 'upgrade-level u-level';
        nameEl.appendChild(levelEl);

        const descEl = document.createElement('span');
        descEl.className = 'upgrade-desc u-desc';

        infoEl.appendChild(nameEl);
        infoEl.appendChild(descEl);

        if (def.isAuto) {
          const dotsEl = document.createElement('div');
          dotsEl.className = 'attacker-dots u-dots';
          infoEl.appendChild(dotsEl);
        }

        const costEl = document.createElement('span');
        costEl.className = 'upgrade-cost u-cost';

        btn.appendChild(iconEl);
        btn.appendChild(infoEl);
        btn.appendChild(costEl);
        container.appendChild(btn);
      }
      this._upgradesBuilt = true;
    }

    // ── Update only text/class on stable nodes — no DOM recreation ─────────
    for (const def of visible) {
      const btn = document.getElementById(`upgrade-${def.id}`);
      if (!btn) continue;

      const level  = game.upgrades.getLevel(def.id);
      const maxed  = level >= def.maxLevel;
      const locked = game.upgrades.isLocked(def.id, game);
      const cost   = game.upgrades.getCost(def.id);
      const afford = !maxed && !locked && game.gold >= cost;

      btn.className = 'upgrade-btn'
        + (maxed  ? ' maxed'      : '')
        + (locked ? ' locked'     : '')
        + (afford ? ' affordable' : '');
      btn.disabled = maxed || locked;

      const levelEl = btn.querySelector('.u-level');
      const descEl  = btn.querySelector('.u-desc');
      const costEl  = btn.querySelector('.u-cost');
      const dotsEl  = btn.querySelector('.u-dots');

      if (levelEl) levelEl.textContent = `${level}/${def.maxLevel}`;

      if (descEl) {
        let newDesc;
        if (locked && def.unlockReq) {
          const reqDef = UPGRADE_DEFS.find(u => u.id === def.unlockReq.id);
          newDesc = `🔒 Need ${reqDef?.name || def.unlockReq.id} Lv ${def.unlockReq.level}`;
          descEl.style.color = '';
        } else if (maxed) {
          newDesc = 'MAXED OUT';
          descEl.style.color = '#22c55e';
        } else {
          newDesc = def.getNextBonus(level);
          descEl.style.color = '';
        }
        if (descEl.textContent !== newDesc) descEl.textContent = newDesc;
      }

      if (costEl) {
        const newCost = maxed ? '✓' : locked ? '—' : `💰${formatNum(cost)}`;
        if (costEl.textContent !== newCost) costEl.textContent = newCost;
      }

      if (dotsEl && def.isAuto) {
        const count = getAttackerCount(level);
        const prevCount = parseInt(dotsEl.dataset.count ?? '-1');
        if (prevCount !== count) {
          dotsEl.dataset.count = count;
          const color = def.color || '#06b6d4';
          dotsEl.innerHTML = [1, 2, 3, 4].map(n =>
            `<span style="color:${n <= count ? color : '#334155'}">${n <= count ? '●' : '○'}</span>`
          ).join(' ');
        }
      }
    }
  }

  updateAchievements(game) {
    const container = this.els['achievements-list'];
    if (!container) return;

    if (container.children.length === ACHIEVEMENT_DEFS.length) {
      ACHIEVEMENT_DEFS.forEach(def => {
        const el = document.getElementById(`ach-${def.id}`);
        if (!el) return;
        const unlocked = game.achievements.isUnlocked(def.id);
        el.className = `achievement-item${unlocked ? ' unlocked' : ''}`;
        const icon = el.querySelector('.achievement-icon');
        if (icon) icon.className = `achievement-icon${unlocked ? '' : ' ach-locked'}`;
      });
      return;
    }

    container.innerHTML = '';
    ACHIEVEMENT_DEFS.forEach(def => {
      const unlocked = game.achievements.isUnlocked(def.id);
      const el = document.createElement('div');
      el.id = `ach-${def.id}`;
      el.className = `achievement-item${unlocked ? ' unlocked' : ''}`;
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

  // ── Toast / Notifications ───────────────────────────────────────────────────

  showAchievementToast(def) {
    this._achToastQueue.push(def);
    if (this._achToastTimer <= 0) this._showNextToast();
  }

  _showNextToast() {
    if (!this._achToastQueue.length) return;
    const def = this._achToastQueue.shift();
    const toast = this.els['achievement-toast'];
    const name  = this.els['toast-name'];
    if (!toast || !name) return;
    name.textContent = `${def.icon} ${def.name}`;
    toast.classList.remove('hidden');
    toast.style.animation = 'none';
    void toast.offsetHeight;
    toast.style.animation = '';
    this._achToastTimer = 3200;
  }

  tickToast(dt) {
    if (this._achToastTimer <= 0) return;
    this._achToastTimer -= dt;
    if (this._achToastTimer <= 0) {
      const toast = this.els['achievement-toast'];
      if (toast) {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => {
          toast.classList.add('hidden');
          toast.style.animation = '';
          if (this._achToastQueue.length) setTimeout(() => this._showNextToast(), 300);
        }, 400);
      }
    }
  }

  // ── Combat Log ──────────────────────────────────────────────────────────────

  addLog(msg, type = '') {
    const container = this.els['combat-log'];
    if (!container) return;
    const el = document.createElement('div');
    el.className = `log-entry${type ? ' log-' + type : ''}`;
    el.textContent = msg;
    container.insertBefore(el, container.firstChild);
    this._logEntries.push(el);
    if (this._logEntries.length > this.maxLogEntries) this._logEntries.shift()?.remove();
  }

  screenShake() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    canvas.classList.add('screen-shake');
    setTimeout(() => canvas.classList.remove('screen-shake'), 280);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  setText(id, val)  { const el = this.els[id]; if (el) el.textContent = val; }
  setWidth(id, pct) { const el = this.els[id]; if (el) el.style.width = clamp(pct, 0, 100) + '%'; }
}
