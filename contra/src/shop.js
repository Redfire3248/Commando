// The shop: things bought with coins (earned by playing: one coin per 40 points). The list lives in the database
// (shop/items) so the admin can change names and prices from the admin panel; until it is set up the
// defaults below are used. What a player owns is users/{uid}/owned/{item id}.
// There are NO perks: nothing you buy changes how strong you are — only agents and looks (the old perk items —
// Iron Heart, Quick Recharge, Light Boots, Spare Dog Tag, Drop Shield — are gone, also from a saved database list).
CG.Shop = {
  DEFAULTS: {},
  // Agents: a new account picks ONE starter, JAX or DUKE (STARTERS); every other agent — the other starter too — is
  // bought here (kind 'agent'). Bots may use any agent.
  FREE_AGENTS: [],
  STARTERS: ['jax', 'duke'],
  AGENT_ITEMS: {
    agent_jax:   { name: 'JAX', kind: 'agent', agent: 'jax', price: 800, order: 8 },
    agent_duke:  { name: 'DUKE', kind: 'agent', agent: 'duke', price: 800, order: 9 },
    agent_razor: { name: 'RAZOR', kind: 'agent', agent: 'razor', price: 1000, order: 10 },
    agent_hammer: { name: 'HAMMER', kind: 'agent', agent: 'hammer', price: 1500, order: 15 },
    agent_viper:  { name: 'VIPER', kind: 'agent', agent: 'viper', price: 1600, order: 16 },
    agent_ghost:  { name: 'GHOST', kind: 'agent', agent: 'ghost', price: 1800, order: 17 },
    agent_atlas:  { name: 'ATLAS', kind: 'agent', agent: 'atlas', price: 2200, order: 18 },
    agent_kite:  { name: 'KITE', kind: 'agent', agent: 'kite', price: 1200, order: 11 },
    agent_nova:  { name: 'NOVA', kind: 'agent', agent: 'nova', price: 1500, order: 12 },
    agent_brick: { name: 'BRICK', kind: 'agent', agent: 'brick', price: 1500, order: 13 },
    agent_volt:  { name: 'VOLT', kind: 'agent', agent: 'volt', price: 2000, order: 14 },
  },
  PERK_EFFECTS: ['hp', 'cd', 'speed', 'life', 'shield'],
  db: null,                       // shop/items from the database (null = not loaded / empty)

  // the list: the database's (when the admin has saved one) over the built-in one; agents are always there
  source() {
    const src = this.db && Object.keys(this.db).length ? this.db : this.DEFAULTS;
    return Object.assign({}, this.AGENT_ITEMS, CG.Cosmetics.shopItems(), src);
  },
  // (the old Golden Rounds / Elite Tag items — effect gold / star — became bullet and name colours: hidden here)
  items() { return this.allItems().filter((it) => it.off !== true && it.effect !== 'gold' && it.effect !== 'star'); },
  allItems() {
    const src = this.source();
    return Object.keys(src).map((id) => Object.assign({ id }, src[id]))
      .filter((it) => it.kind !== 'perk' && !this.PERK_EFFECTS.includes(it.effect))
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  },
  agentItem(id) { return this.allItems().find((it) => it.kind === 'agent' && it.agent === id); },
  // can this device's player use this agent? (free, bought, or no accounts at all)
  hasAgent(id) {
    if (this.FREE_AGENTS.includes(id)) return true;
    const it = this.agentItem(id);
    return !it || this.owned(it.id);           // an agent with no shop item is free
  },
  owned(id) { const p = CG.Profile.get(); return !!(p && p.owned && p.owned[id]); },
  // has this account picked its starter yet? (older accounts that already own an agent count as done)
  hasStarter() {
    const p = CG.Profile.get();
    return !!(p.starter || (p.owned && Object.keys(p.owned).some((k) => k.indexOf('agent_') === 0)));
  },
  coinsFor(score) { return Math.floor(score / 40); },
};
