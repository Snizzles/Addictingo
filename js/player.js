// === PLAYER ===
class Player {
  constructor() {
    this.reset();
  }

  reset(keepPrestige = false) {
    const stars = keepPrestige ? this.stars || 0 : 0;
    const prestiges = keepPrestige ? this.prestiges || 0 : 0;
    const totalClicks = keepPrestige ? this.totalClicks || 0 : 0;
    const totalCrits = keepPrestige ? this.totalCrits || 0 : 0;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = CONFIG.XP_BASE;

    this.stars = stars;
    this.prestiges = prestiges;
    this.totalClicks = totalClicks;
    this.totalCrits = totalCrits;
    this.totalKills = keepPrestige ? (this.totalKills || 0) : 0;

    this._baseAttack = 1;
    this._baseCritChance = 5;     // %
    this._baseCritMult = 2.0;
    this._baseGoldMult = 1.0;

    // Per-level stat bonuses
    this.levelAttackBonus = 0;
  }

  get prestigeMult() {
    return 1 + this.stars * CONFIG.PRESTIGE_STAR_MULT;
  }

  get attack() {
    return (this._baseAttack + this.levelAttackBonus) * this.prestigeMult;
  }

  get critChance() {
    return clamp(this._baseCritChance, 0, 95);
  }

  get critMult() {
    return this._baseCritMult;
  }

  get goldMult() {
    return this._baseGoldMult * this.prestigeMult;
  }

  gainXP(amount) {
    // XP multiplier applied by caller (game.js) before passing amount in
    this.xp += Math.floor(amount);
    let leveledUp = false;
    while (this.xp >= this.xpToNext && this.level < CONFIG.MAX_LEVEL) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(CONFIG.XP_BASE * Math.pow(CONFIG.XP_SCALE, this.level - 1));
      this.levelAttackBonus += Math.ceil(this.level * 0.5);
      leveledUp = true;
    }
    return leveledUp;
  }

  getXPPercent() {
    return clamp((this.xp / this.xpToNext) * 100, 0, 100);
  }

  rollCrit() {
    return chance(this.critChance);
  }

  calcDamage() {
    const isCrit = this.rollCrit();
    const dmg = isCrit
      ? Math.floor(this.attack * this.critMult)
      : Math.floor(this.attack);
    if (isCrit) this.totalCrits++;
    return { damage: Math.max(1, dmg), isCrit };
  }

  serialize() {
    return {
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      stars: this.stars,
      prestiges: this.prestiges,
      totalClicks: this.totalClicks,
      totalCrits: this.totalCrits,
      totalKills: this.totalKills,
      _baseAttack: this._baseAttack,
      _baseCritChance: this._baseCritChance,
      _baseCritMult: this._baseCritMult,
      _baseGoldMult: this._baseGoldMult,
      levelAttackBonus: this.levelAttackBonus,
    };
  }

  deserialize(data) {
    Object.assign(this, data);
  }
}
