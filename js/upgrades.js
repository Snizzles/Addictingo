// === UPGRADE SYSTEM ===
const UPGRADE_DEFS = [
  {
    id: 'sharpBlade',
    name: 'Sharp Blade',
    icon: '⚔️',
    desc: '+{val} flat attack damage',
    maxLevel: 50,
    baseCost: 15,
    costScale: 1.45,
    baseVal: 2,
    valScale: 1.15,
    apply(player, level) {
      player._baseAttack += this.baseVal * Math.pow(this.valScale, level - 1);
    },
    category: 'attack',
    getDesc(level) { return `+${formatFloat(this.baseVal * Math.pow(this.valScale, level))} flat attack`; }
  },
  {
    id: 'battleRage',
    name: 'Battle Rage',
    icon: '🔥',
    desc: '+{val}% attack multiplier',
    maxLevel: 30,
    baseCost: 50,
    costScale: 1.6,
    baseVal: 15,
    valScale: 1.0,
    apply(player, level) {
      player._baseAttack *= 1 + (this.baseVal / 100);
    },
    category: 'attack',
    getDesc(level) { return `+${this.baseVal}% attack per level`; }
  },
  {
    id: 'criticalEye',
    name: 'Critical Eye',
    icon: '👁️',
    desc: '+{val}% crit chance',
    maxLevel: 20,
    baseCost: 40,
    costScale: 1.55,
    baseVal: 3,
    valScale: 1.0,
    apply(player, level) {
      player._baseCritChance += this.baseVal;
    },
    category: 'crit',
    getDesc(level) { return `+${this.baseVal}% crit chance per level`; }
  },
  {
    id: 'killingBlow',
    name: 'Killing Blow',
    icon: '💥',
    desc: '+{val}× crit damage',
    maxLevel: 20,
    baseCost: 60,
    costScale: 1.7,
    baseVal: 0.25,
    valScale: 1.0,
    apply(player, level) {
      player._baseCritMult += this.baseVal;
    },
    category: 'crit',
    getDesc(level) { return `+${this.baseVal}× crit multiplier per level`; }
  },
  {
    id: 'autoAttack',
    name: 'Auto Attack',
    icon: '⚡',
    desc: 'Auto-attacks every second',
    maxLevel: 40,
    baseCost: 100,
    costScale: 1.5,
    baseVal: 0.5,
    valScale: 1.2,
    apply(player, level) {/* handled by game loop */},
    category: 'auto',
    getDesc(level) { return `+${formatFloat(this.baseVal * Math.pow(this.valScale, level))}× auto DPS`; }
  },
  {
    id: 'multiStrike',
    name: 'Multi Strike',
    icon: '🌀',
    desc: '+{val}% chance for double hit',
    maxLevel: 20,
    baseCost: 80,
    costScale: 1.6,
    baseVal: 5,
    valScale: 1.0,
    apply(player, level) {/* handled in combat */},
    category: 'attack',
    getDesc(level) { return `+${this.baseVal}% double hit chance`; }
  },
  {
    id: 'goldRush',
    name: 'Gold Rush',
    icon: '💰',
    desc: '+{val}% gold from kills',
    maxLevel: 30,
    baseCost: 35,
    costScale: 1.5,
    baseVal: 20,
    valScale: 1.0,
    apply(player, level) {
      player._baseGoldMult *= 1 + (this.baseVal / 100);
    },
    category: 'gold',
    getDesc(level) { return `+${this.baseVal}% gold per level`; }
  },
  {
    id: 'treasureHunter',
    name: 'Treasure Hunter',
    icon: '🗺️',
    desc: '+{val}% bonus from bosses',
    maxLevel: 20,
    baseCost: 120,
    costScale: 1.6,
    baseVal: 30,
    valScale: 1.0,
    apply(player, level) {/* handled in boss kill */},
    category: 'gold',
    getDesc(level) { return `+${this.baseVal}% boss gold`; }
  },
  {
    id: 'soulHarvest',
    name: 'Soul Harvest',
    icon: '✨',
    desc: '+{val}% XP gain',
    maxLevel: 20,
    baseCost: 45,
    costScale: 1.5,
    baseVal: 25,
    valScale: 1.0,
    apply(player, level) {/* handled in xp gain */},
    category: 'xp',
    getDesc(level) { return `+${this.baseVal}% XP gain per level`; }
  },
  {
    id: 'battleCry',
    name: 'Battle Cry',
    icon: '📢',
    desc: '+{val}% attack for 10s (on kill)',
    maxLevel: 15,
    baseCost: 200,
    costScale: 1.8,
    baseVal: 50,
    valScale: 1.1,
    apply(player, level) {/* handled in kill */},
    category: 'attack',
    getDesc(level) { return `+${Math.floor(this.baseVal * Math.pow(this.valScale, level))}% temp boost`; }
  },
  {
    id: 'swiftStrike',
    name: 'Swift Strike',
    icon: '⏩',
    desc: '+{val}× damage multiplier',
    maxLevel: 25,
    baseCost: 150,
    costScale: 1.65,
    baseVal: 0.1,
    valScale: 1.0,
    apply(player, level) {
      player._baseAttack *= 1 + this.baseVal;
    },
    category: 'attack',
    getDesc(level) { return `+${this.baseVal * 100}% total damage`; }
  },
  {
    id: 'cosmicPower',
    name: 'Cosmic Power',
    icon: '🌌',
    desc: 'Massive power multiplier',
    maxLevel: 10,
    baseCost: 1000,
    costScale: 3.0,
    baseVal: 2,
    valScale: 1.0,
    apply(player, level) {
      player._baseAttack *= this.baseVal;
    },
    category: 'attack',
    getDesc(level) { return `×${this.baseVal} total attack`; }
  },
  {
    id: 'goldMagnet',
    name: 'Gold Magnet',
    icon: '🧲',
    desc: 'Flat gold per kill bonus',
    maxLevel: 30,
    baseCost: 200,
    costScale: 1.55,
    baseVal: 10,
    valScale: 1.3,
    apply(player, level) {/* handled in kill */},
    category: 'gold',
    getDesc(level) { return `+${Math.floor(this.baseVal * Math.pow(this.valScale, level))} flat gold`; }
  },
  {
    id: 'berserker',
    name: 'Berserker',
    icon: '💢',
    desc: 'Damage scales with kills',
    maxLevel: 20,
    baseCost: 500,
    costScale: 2.0,
    baseVal: 0.01,
    valScale: 1.0,
    apply(player, level) {/* handled in damage calc */},
    category: 'attack',
    getDesc(level) { return `+${this.baseVal * 100}% dmg per 100 kills`; }
  },
  {
    id: 'prestigeBoost',
    name: 'Prestige Boost',
    icon: '⭐',
    desc: '+{val}% bonus per Star',
    maxLevel: 10,
    baseCost: 2000,
    costScale: 3.0,
    baseVal: 5,
    valScale: 1.0,
    hidden: true, // only shows after first prestige
    apply(player, level) {/* handled in prestige mult */},
    category: 'prestige',
    getDesc(level) { return `+${this.baseVal}% per Star`; }
  },
];

class UpgradeSystem {
  constructor() {
    this.levels = {};
    UPGRADE_DEFS.forEach(u => this.levels[u.id] = 0);
    this.battleCryTimer = 0;
    this.battleCryActive = false;
  }

  getLevel(id) {
    return this.levels[id] || 0;
  }

  getCost(id) {
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def) return Infinity;
    const level = this.getLevel(id);
    if (level >= def.maxLevel) return Infinity;
    return Math.floor(def.baseCost * Math.pow(def.costScale, level));
  }

  canAfford(id, gold) {
    return gold >= this.getCost(id);
  }

  purchase(id, player, gold) {
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def) return { success: false };

    const cost = this.getCost(id);
    if (gold < cost || this.levels[id] >= def.maxLevel) {
      return { success: false };
    }

    this.levels[id]++;
    def.apply(player, this.levels[id]);

    return { success: true, cost };
  }

  // Get bonus multipliers for various stats
  getBonus(type) {
    switch (type) {
      case 'autoAttack': {
        const def = UPGRADE_DEFS.find(u => u.id === 'autoAttack');
        const level = this.getLevel('autoAttack');
        if (level === 0) return 0;
        let dps = 0;
        for (let i = 1; i <= level; i++) {
          dps += def.baseVal * Math.pow(def.valScale, i - 1);
        }
        return dps;
      }
      case 'multiStrike': {
        return this.getLevel('multiStrike') * 5; // % chance
      }
      case 'treasureHunter': {
        return 1 + this.getLevel('treasureHunter') * 0.3;
      }
      case 'xpMult': {
        return 1 + this.getLevel('soulHarvest') * 0.25;
      }
      case 'battleCry': {
        const def = UPGRADE_DEFS.find(u => u.id === 'battleCry');
        const level = this.getLevel('battleCry');
        if (level === 0) return 1;
        return 1 + (def.baseVal * Math.pow(def.valScale, level - 1)) / 100;
      }
      case 'goldMagnet': {
        const def = UPGRADE_DEFS.find(u => u.id === 'goldMagnet');
        const level = this.getLevel('goldMagnet');
        if (level === 0) return 0;
        return Math.floor(def.baseVal * Math.pow(def.valScale, level - 1));
      }
      case 'berserker': {
        return 1 + (this.getLevel('berserker') * 0.01 * Math.floor(window.game ? game.player.totalKills / 100 : 0));
      }
      case 'prestigeBoost': {
        return 1 + this.getLevel('prestigeBoost') * 0.05 * (window.game ? game.player.stars : 0);
      }
      default: return 1;
    }
  }

  triggerBattleCry() {
    if (this.getLevel('battleCry') > 0) {
      this.battleCryActive = true;
      this.battleCryTimer = 10000;
    }
  }

  updateBattleCry(dt) {
    if (this.battleCryActive) {
      this.battleCryTimer -= dt;
      if (this.battleCryTimer <= 0) {
        this.battleCryActive = false;
        this.battleCryTimer = 0;
      }
    }
  }

  getBattleCryMult() {
    if (!this.battleCryActive) return 1;
    return this.getBonus('battleCry');
  }

  getVisibleUpgrades(prestigeCount) {
    return UPGRADE_DEFS.filter(u => {
      if (u.id === 'prestigeBoost') return prestigeCount > 0;
      return true;
    });
  }

  serialize() {
    return { levels: { ...this.levels } };
  }

  deserialize(data) {
    if (data && data.levels) {
      Object.assign(this.levels, data.levels);
    }
  }
}
