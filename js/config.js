// === GAME CONFIGURATION ===
const CONFIG = {
  // Enemy settings
  ENEMIES_PER_ZONE: 10,
  MAX_ZONE: 100,
  PRESTIGE_ZONE: 50,

  // Scaling
  ENEMY_HP_BASE: 10,
  ENEMY_HP_SCALE: 1.25,   // per zone
  ENEMY_GOLD_BASE: 2,
  ENEMY_GOLD_SCALE: 1.15,
  ENEMY_XP_BASE: 10,
  ENEMY_XP_SCALE: 1.2,

  // Boss multipliers
  BOSS_HP_MULT: 8,
  BOSS_GOLD_MULT: 6,
  BOSS_XP_MULT: 4,

  // Player leveling
  XP_BASE: 100,
  XP_SCALE: 1.35,
  MAX_LEVEL: 100,

  // Prestige
  PRESTIGE_STAR_MULT: 0.1,  // each star = +10% to all damage and gold

  // Auto-attack tick rate (ms)
  AUTO_ATTACK_INTERVAL: 1000,

  // Save key
  SAVE_KEY: 'addictingo_save_v1',
};

// Enemy types by zone range
const ENEMY_TYPES = [
  { name: 'Slime',      emoji: '🟢', color: '#22c55e', glowColor: 'rgba(34,197,94,',   minZone: 1,   boss: '👾' },
  { name: 'Goblin',     emoji: '🟠', color: '#f97316', glowColor: 'rgba(249,115,22,',  minZone: 6,   boss: '👿' },
  { name: 'Skeleton',   emoji: '⬜', color: '#cbd5e1', glowColor: 'rgba(203,213,225,', minZone: 16,  boss: '💀' },
  { name: 'Demon',      emoji: '🔴', color: '#ef4444', glowColor: 'rgba(239,68,68,',   minZone: 26,  boss: '😈' },
  { name: 'Dragon',     emoji: '🔵', color: '#3b82f6', glowColor: 'rgba(59,130,246,',  minZone: 41,  boss: '🐲' },
  { name: 'Void Lord',  emoji: '🟣', color: '#a855f7', glowColor: 'rgba(168,85,247,',  minZone: 61,  boss: '🌑' },
  { name: 'God',        emoji: '🟡', color: '#fbbf24', glowColor: 'rgba(251,191,36,',  minZone: 81,  boss: '⚡' },
];

function getEnemyType(zone) {
  let type = ENEMY_TYPES[0];
  for (const t of ENEMY_TYPES) {
    if (zone >= t.minZone) type = t;
  }
  return type;
}
