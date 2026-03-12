# ADDICTINGO 🎮

A hyper-addictive browser-based clicker RPG with deep progression mechanics.

## 🎯 How to Play

1. **Click the enemy** to attack it (or press `SPACE`)
2. **Earn gold** from kills — spend it on upgrades
3. **Level up** by gaining XP — each level boosts your attack
4. **Clear zones** (10 enemies per zone) to face harder enemies and earn more rewards
5. **Defeat bosses** every 10 kills for massive rewards
6. **Prestige** at Zone 50 to earn permanent Stars and start fresh with multiplied power

## ⚔️ Game Features

- **15 Upgrades** across 5 categories: Attack, Crit, Auto, Gold, XP
- **Prestige System** — Gain Stars for permanent multipliers, unlock deeper upgrades
- **17 Achievements** — Milestones that reward your progress
- **7 Enemy Types** — Slimes → Goblins → Skeletons → Demons → Dragons → Void Lords → Gods
- **Boss Battles** — Every 10th kill is a powerful boss with 8× HP and 6× rewards
- **Auto Attack** — Upgrade to deal DPS passively while you click manually
- **Battle Cry** — Temporary damage boost triggered on every kill
- **Multi Strike** — Chance to deal double hits per click
- **Berserker** — Damage scales with total kills
- **Particle Effects** — Satisfying hit particles, coin sprays, death explosions
- **Sound Effects** — Web Audio API sounds for every action
- **Auto-save** — Progress saves every 10 seconds to localStorage

## 🏗️ Tech Stack

- Pure HTML5 / CSS3 / JavaScript (no dependencies)
- Canvas 2D API for rendering
- Web Audio API for procedurally generated sound effects
- localStorage for persistent saves

## 🚀 Running the Game

Just open `index.html` in any modern browser. No build step required.

For the best experience, serve locally:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .
```

Then visit `http://localhost:8080`

## 📁 Project Structure

```
addictingo/
├── index.html          # Game layout & HTML structure
├── css/
│   └── style.css       # Dark space theme, animations, layout
└── js/
    ├── config.js       # Game constants & enemy type definitions
    ├── utils.js        # Math helpers, number formatting
    ├── audio.js        # Web Audio API sound system
    ├── particles.js    # Particle system (hits, coins, rings)
    ├── player.js       # Player stats, leveling, serialization
    ├── enemy.js        # Enemy generation & canvas rendering
    ├── upgrades.js     # 15 upgrade definitions & purchase system
    ├── achievements.js # 17 achievement definitions & tracking
    ├── ui.js           # DOM UI updates, toasts, combat log
    └── game.js         # Main game loop, combat, save/load
```

## 🎮 Keyboard Shortcuts

| Key   | Action            |
|-------|-------------------|
| SPACE | Attack enemy      |

## 💡 Strategy Tips

- Prioritize **Sharp Blade** + **Battle Rage** early for fast kills
- **Auto Attack** enables passive farming — great for idle sessions
- **Gold Rush** compounds over time, making upgrades snowball
- **Prestige** as soon as Zone 50 — the Star multiplier dramatically accelerates future runs
- **Berserker** becomes powerful after thousands of kills — great for prestige runs
- Watch for **Battle Cry** (gold border) — it triggers on every kill!

---

Built with ❤️ — no frameworks, just raw browser APIs.
