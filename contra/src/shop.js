// The shop: things bought with coins (earned by playing: one coin per 40 points). The list lives in the database
// (shop/items) so the admin can change names and prices from the admin panel; until it is set up the
// defaults below are used. What a player owns is users/{uid}/owned/{item id}.
//   effect  what the item does in game (see apply())
CG.Shop = {
  DEFAULTS: {
    heart:  { name: 'Iron Heart', desc: '+1 heart for every agent.', price: 600, kind: 'perk', effect: 'hp', icon: '❤', order: 1 },
    recharge: { name: 'Quick Recharge', desc: 'Abilities recharge 20% faster.', price: 800, kind: 'perk', effect: 'cd', icon: '⚡', order: 2 },
    boots:  { name: 'Light Boots', desc: 'Run 8% faster.', price: 500, kind: 'perk', effect: 'speed', icon: '👟', order: 3 },
    tags:   { name: 'Spare Dog Tag', desc: 'Your squad starts every game with one more life.', price: 900, kind: 'perk', effect: 'life', icon: '🏷', order: 4 },
    drop:   { name: 'Drop Shield', desc: 'Start every stage with a 6 second shield.', price: 700, kind: 'perk', effect: 'shield', icon: '🛡', order: 5 },
    gold:   { name: 'Golden Rounds', desc: 'Your bullets glow gold.', price: 300, kind: 'cosmetic', effect: 'gold', icon: '✨', order: 6 },
    elite:  { name: 'Elite Tag', desc: 'A gold star next to your name in game.', price: 250, kind: 'cosmetic', effect: 'star', icon: '★', order: 7 },
  },
  EFFECTS: ['hp', 'cd', 'speed', 'life', 'shield', 'gold', 'star'],
  db: null,                       // shop/items from the database (null = not loaded / empty)

  items() {
    const src = this.db && Object.keys(this.db).length ? this.db : this.DEFAULTS;
    return Object.keys(src).map((id) => Object.assign({ id }, src[id])).filter((it) => it.off !== true)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  },
  allItems() {
    const src = this.db && Object.keys(this.db).length ? this.db : this.DEFAULTS;
    return Object.keys(src).map((id) => Object.assign({ id }, src[id])).sort((a, b) => (a.order || 99) - (b.order || 99));
  },
  owned(id) { const p = CG.Net.profile; return !!(p && p.owned && p.owned[id]); },
  // the effects this player has paid for
  effects() {
    const out = {};
    for (const it of this.allItems()) if (this.owned(it.id)) out[it.effect] = true;
    return out;
  },
  coinsFor(score) { return Math.floor(score / 40); },

  // give a local, human player their perks (called when the game makes the player)
  apply(p, fx) {
    if (fx.hp) { p.maxHp += 1; p.hp = p.maxHp; }
    if (fx.cd) p.perkCd = 0.8;
    if (fx.speed) p.perkSpeed = 1.08;
    if (fx.shield) p.barrierT = 6000;
    if (fx.gold) p.perkGold = true;
    if (fx.star) { p.tag.setText('★ ' + p.name); p.tag.setColor('#ffd23c'); }
  },
};
