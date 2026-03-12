// === UPGRADE SYSTEM — REDESIGNED ===

// How many visual attackers spawn per upgrade level
function getAttackerCount(level) {
  if (level <= 0) return 0;
  if (level <= 4)  return 1;
  if (level <= 9)  return 2;
  if (level <= 14) return 3;
  return 4;
}

const UPGRADE_DEFS = [
  // ── CLICK POWER ──────────────────────────────────────────────────────────
  {
    id: 'clickDamage',
    category: 'damage',
    name: 'Click Power',
    icon: '⚔️',
    maxLevel: 100,
    baseCost: 10,
    costScale: 1.28,
    getNextBonus(level) {
      const add = Math.floor(2 * Math.pow(1.08, level));
      return `+${add} attack damage`;
    },
    apply(player, level) {
      player._baseAttack += Math.floor(2 * Math.pow(1.08, level - 1));
    },
  },
  {
    id: 'critStrike',
    category: 'damage',
    name: 'Critical Strike',
    icon: '💥',
    maxLevel: 40,
    baseCost: 45,
    costScale: 1.42,
    getNextBonus(level) {
      const chance = Math.min(5 + (level + 1) * 3, 75);
      const mult = formatFloat(2.0 + (level + 1) * 0.18, 2);
      return `${chance}% crit chance · ${mult}× crit dmg`;
    },
    apply(player, level) {
      // Set absolutely — always correct regardless of order
      player._baseCritChance = Math.min(5 + level * 3, 75);
      player._baseCritMult   = 2.0 + level * 0.18;
    },
  },
  {
    id: 'powerSurge',
    category: 'damage',
    name: 'Power Surge',
    icon: '⚡',
    maxLevel: 25,
    baseCost: 250,
    costScale: 1.6,
    getNextBonus(level) {
      return `×1.3 all damage (total: ×${formatFloat(Math.pow(1.3, level + 1), 1)})`;
    },
    apply(player, level) {
      player._baseAttack *= 1.3;
    },
  },

  // ── AUTO ATTACKERS ───────────────────────────────────────────────────────
  {
    id: 'phantom',
    category: 'auto',
    name: 'Phantom',
    icon: '👻',
    color: '#06b6d4',
    maxLevel: 20,
    baseCost: 80,
    costScale: 1.45,
    isAuto: true,
    getNextBonus(level) {
      const cur = getAttackerCount(level);
      const next = getAttackerCount(level + 1);
      if (next > cur) return `⬆ ${next} Phantoms orbiting!`;
      return `Faster fire rate · more damage`;
    },
    apply(player, level) {},
  },
  {
    id: 'specter',
    category: 'auto',
    name: 'Specter',
    icon: '🔮',
    color: '#a855f7',
    maxLevel: 20,
    baseCost: 500,
    costScale: 1.55,
    isAuto: true,
    unlockReq: { id: 'phantom', level: 3 },
    getNextBonus(level) {
      const cur = getAttackerCount(level);
      const next = getAttackerCount(level + 1);
      if (next > cur) return `⬆ ${next} Specters orbiting!`;
      return `Faster fire rate · more damage`;
    },
    apply(player, level) {},
  },
  {
    id: 'obliterator',
    category: 'auto',
    name: 'Obliterator',
    icon: '🔥',
    color: '#ef4444',
    maxLevel: 20,
    baseCost: 2500,
    costScale: 1.65,
    isAuto: true,
    unlockReq: { id: 'specter', level: 3 },
    getNextBonus(level) {
      const cur = getAttackerCount(level);
      const next = getAttackerCount(level + 1);
      if (next > cur) return `⬆ ${next} Obliterators orbiting!`;
      return `Faster fire rate · more damage`;
    },
    apply(player, level) {},
  },
  {
    id: 'annihilator',
    category: 'auto',
    name: 'Annihilator',
    icon: '☄️',
    color: '#fbbf24',
    maxLevel: 15,
    baseCost: 15000,
    costScale: 2.0,
    isAuto: true,
    unlockReq: { id: 'obliterator', level: 3 },
    getNextBonus(level) {
      const cur = getAttackerCount(level);
      const next = getAttackerCount(level + 1);
      if (next > cur) return `⬆ ${next} Annihilators orbiting!`;
      return `Faster fire rate · more damage`;
    },
    apply(player, level) {},
  },

  // ── ECONOMY ──────────────────────────────────────────────────────────────
  {
    id: 'goldGreed',
    category: 'economy',
    name: 'Gold Greed',
    icon: '💰',
    maxLevel: 50,
    baseCost: 25,
    costScale: 1.38,
    getNextBonus(level) {
      return `+20% gold → ${formatFloat(Math.pow(1.2, level + 1), 2)}× total`;
    },
    apply(player, level) {
      player._baseGoldMult *= 1.2;
    },
  },
  {
    id: 'soulWisdom',
    category: 'economy',
    name: 'Soul Wisdom',
    icon: '✨',
    maxLevel: 30,
    baseCost: 35,
    costScale: 1.4,
    getNextBonus(level) {
      return `+30% XP → ${formatFloat(Math.pow(1.3, level + 1), 2)}× total`;
    },
    apply(player, level) {},
  },
  {
    id: 'bossHunter',
    category: 'economy',
    name: 'Boss Hunter',
    icon: '🗡️',
    maxLevel: 20,
    baseCost: 150,
    costScale: 1.5,
    getNextBonus(level) {
      return `+35% boss loot → ${formatFloat(Math.pow(1.35, level + 1), 2)}× boss gold`;
    },
    apply(player, level) {},
  },
  {
    id: 'prestigeBoost',
    category: 'economy',
    name: 'Star Power',
    icon: '⭐',
    hidden: true,   // shows only after first prestige
    maxLevel: 10,
    baseCost: 8000,
    costScale: 3.0,
    getNextBonus(level) {
      return `+10% damage & gold per Star`;
    },
    apply(player, level) {},
  },
];

class UpgradeSystem {
  constructor() {
    this.levels = {};
    UPGRADE_DEFS.forEach(u => this.levels[u.id] = 0);
  }

  getLevel(id) { return this.levels[id] || 0; }

  getCost(id) {
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def) return Infinity;
    const level = this.getLevel(id);
    if (level >= def.maxLevel) return Infinity;
    return Math.floor(def.baseCost * Math.pow(def.costScale, level));
  }

  isLocked(id, game) {
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def || !def.unlockReq) return false;
    if (def.unlockReq.id && this.getLevel(def.unlockReq.id) < def.unlockReq.level) return true;
    return false;
  }

  purchase(id, player, gold, game) {
    if (this.isLocked(id, game)) return { success: false };
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def) return { success: false };
    const cost = this.getCost(id);
    if (gold < cost || this.levels[id] >= def.maxLevel) return { success: false };

    this.levels[id]++;
    def.apply(player, this.levels[id]);
    return { success: true, cost };
  }

  // Bonus getters used by game systems
  getBonus(type, game) {
    switch (type) {
      case 'xpMult':
        return 1 + this.getLevel('soulWisdom') * 0.3;
      case 'bossGoldMult':
        return Math.pow(1.35, this.getLevel('bossHunter'));
      case 'prestigeBoost':
        return 1 + this.getLevel('prestigeBoost') * 0.1 * (game?.player.stars || 0);
      default: return 1;
    }
  }

  getVisibleUpgrades(prestigeCount) {
    return UPGRADE_DEFS.filter(u => {
      if (u.id === 'prestigeBoost') return prestigeCount > 0;
      return true;
    });
  }

  serialize() { return { levels: { ...this.levels } }; }

  deserialize(data) {
    if (data?.levels) Object.assign(this.levels, data.levels);
  }
}
