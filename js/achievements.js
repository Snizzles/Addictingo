// === ACHIEVEMENT SYSTEM ===
const ACHIEVEMENT_DEFS = [
  {
    id: 'firstBlood',
    name: 'First Blood',
    icon: '🩸',
    desc: 'Kill your first enemy',
    check: (g) => g.player.totalKills >= 1
  },
  {
    id: 'levelUp',
    name: 'Rising Star',
    icon: '⬆️',
    desc: 'Reach Level 5',
    check: (g) => g.player.level >= 5
  },
  {
    id: 'clickFrenzy',
    name: 'Click Frenzy',
    icon: '🖱️',
    desc: 'Click 100 times',
    check: (g) => g.player.totalClicks >= 100
  },
  {
    id: 'critMaster',
    name: 'Crit Master',
    icon: '🎯',
    desc: 'Land 50 critical hits',
    check: (g) => g.player.totalCrits >= 50
  },
  {
    id: 'zoneRunner',
    name: 'Zone Runner',
    icon: '🏃',
    desc: 'Reach Zone 5',
    check: (g) => g.zone >= 5
  },
  {
    id: 'bossSlayer',
    name: 'Boss Slayer',
    icon: '🗡️',
    desc: 'Defeat your first boss',
    check: (g) => g.stats.bossKills >= 1
  },
  {
    id: 'richAdventurer',
    name: 'Rich Adventurer',
    icon: '💎',
    desc: 'Earn 10,000 total gold',
    check: (g) => g.stats.totalGoldEarned >= 10000
  },
  {
    id: 'autoPilot',
    name: 'Auto Pilot',
    icon: '🤖',
    desc: 'Unlock Auto Attack',
    check: (g) => g.upgrades.getLevel('phantom') >= 1
  },
  {
    id: 'speedDemon',
    name: 'Speed Demon',
    icon: '⚡',
    desc: 'Click 500 times',
    check: (g) => g.player.totalClicks >= 500
  },
  {
    id: 'veteran',
    name: 'Veteran',
    icon: '🎖️',
    desc: 'Reach Zone 25',
    check: (g) => g.zone >= 25
  },
  {
    id: 'killStreak',
    name: 'Kill Streak',
    icon: '🔥',
    desc: 'Kill 500 enemies',
    check: (g) => g.player.totalKills >= 500
  },
  {
    id: 'legend',
    name: 'Legend',
    icon: '🏆',
    desc: 'Reach Zone 50',
    check: (g) => g.zone >= 50
  },
  {
    id: 'prestige',
    name: 'Reborn',
    icon: '✦',
    desc: 'Complete your first Prestige',
    check: (g) => g.player.prestiges >= 1
  },
  {
    id: 'veteran2',
    name: 'Ascended',
    icon: '🌟',
    desc: 'Prestige 3 times',
    check: (g) => g.player.prestiges >= 3
  },
  {
    id: 'clickGod',
    name: 'Click God',
    icon: '👆',
    desc: 'Click 2000 times total',
    check: (g) => g.player.totalClicks >= 2000
  },
  {
    id: 'goldHoarder',
    name: 'Gold Hoarder',
    icon: '💰',
    desc: 'Earn 1,000,000 total gold',
    check: (g) => g.stats.totalGoldEarned >= 1000000
  },
  {
    id: 'zone100',
    name: 'World Ender',
    icon: '🌌',
    desc: 'Reach Zone 100',
    check: (g) => g.zone >= 100
  },
];

class AchievementSystem {
  constructor() {
    this.unlocked = new Set();
    this.queue = [];
  }

  check(game) {
    const newlyUnlocked = [];
    for (const def of ACHIEVEMENT_DEFS) {
      if (!this.unlocked.has(def.id) && def.check(game)) {
        this.unlocked.add(def.id);
        newlyUnlocked.push(def);
        this.queue.push(def);
      }
    }
    return newlyUnlocked;
  }

  dequeue() {
    return this.queue.shift() || null;
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }

  serialize() {
    return { unlocked: [...this.unlocked] };
  }

  deserialize(data) {
    if (data && data.unlocked) {
      this.unlocked = new Set(data.unlocked);
    }
  }
}
