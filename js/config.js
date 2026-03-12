// === GAME CONFIGURATION ===
const CONFIG = {
  // Enemy settings
  ENEMIES_PER_ZONE: 10,
  MAX_ZONE: 100,
  PRESTIGE_ZONE: 50,

  // Scaling — tuned for faster, snappier progression
  ENEMY_HP_BASE: 8,
  ENEMY_HP_SCALE: 1.15,     // was 1.25 — enemies die faster
  ENEMY_GOLD_BASE: 5,
  ENEMY_GOLD_SCALE: 1.18,
  ENEMY_XP_BASE: 20,
  ENEMY_XP_SCALE: 1.12,

  // Boss multipliers
  BOSS_HP_MULT: 6,
  BOSS_GOLD_MULT: 8,
  BOSS_XP_MULT: 5,

  // Player leveling
  XP_BASE: 80,             // was 100 — levels feel faster
  XP_SCALE: 1.28,          // was 1.35
  MAX_LEVEL: 100,

  // Prestige
  PRESTIGE_STAR_MULT: 0.15, // each star = +15% to all damage and gold

  // Save key (v2 resets old saves after redesign)
  SAVE_KEY: 'addictingo_save_v2',
};

// Enemy types by zone range
const ENEMY_TYPES = [
  { name: 'Slime',      emoji: '🟢', color: '#22c55e', glowColor: 'rgba(34,197,94,',   minZone: 1  },
  { name: 'Goblin',     emoji: '🟠', color: '#f97316', glowColor: 'rgba(249,115,22,',  minZone: 6  },
  { name: 'Skeleton',   emoji: '⬜', color: '#cbd5e1', glowColor: 'rgba(203,213,225,', minZone: 16 },
  { name: 'Demon',      emoji: '🔴', color: '#ef4444', glowColor: 'rgba(239,68,68,',   minZone: 26 },
  { name: 'Dragon',     emoji: '🔵', color: '#3b82f6', glowColor: 'rgba(59,130,246,',  minZone: 41 },
  { name: 'Void Lord',  emoji: '🟣', color: '#a855f7', glowColor: 'rgba(168,85,247,',  minZone: 61 },
  { name: 'God',        emoji: '🟡', color: '#fbbf24', glowColor: 'rgba(251,191,36,',  minZone: 81 },
];

function getEnemyType(zone) {
  let type = ENEMY_TYPES[0];
  for (const t of ENEMY_TYPES) {
    if (zone >= t.minZone) type = t;
  }
  return type;
}
