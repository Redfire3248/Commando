// Ranks and profile cosmetics.
//
// RANKS: rank rating (RR) climbs and falls with your results, three divisions a tier, and every tier asks MORE RR a
// division than the one below it (SIZES): BRONZE 60 · SILVER 75 · GOLD 90 · PLATINUM 105 · DIAMOND 125 · MASTER 145
//   BRONZE 1-3 (0) · SILVER (180) · GOLD (405) · PLATINUM (675) · DIAMOND (990) · MASTER (1365) · LEGEND (1800, no divisions)
//   Duels and free-for-all: a win +18…28, a loss −12…20 (more when you beat someone ranked above you).
//   Story: +4 a stage cleared. Horde: +2 a wave from wave 3. Custom games, local co-op with friends, admin use: unranked.
// Bots get a rank close to yours (random, within about a division either side) and play as well as that rank.
// Rank icons are drawn in code (a shield in the tier's colour with one to three pips); art from ranks.png replaces
// them by key `rank_<tier>_<div>` (see PROMPTS.md).
//
// COSMETICS: a BANNER (the card behind your name on your profile and the squad screen) and a TITLE under your name.
// Some are free, some are in the shop, some are earned (a title for 10 duel wins, for reaching Gold, ...).
CG.Ranks = (() => {
  const TIERS = [
    { id: 'bronze', name: 'BRONZE', color: '#c47b3c', dark: '#5a3215' },
    { id: 'silver', name: 'SILVER', color: '#c7d0d9', dark: '#4d5866' },
    { id: 'gold', name: 'GOLD', color: '#ffcc3a', dark: '#6b4a08' },
    { id: 'platinum', name: 'PLATINUM', color: '#4fe0d0', dark: '#0f5a55' },
    { id: 'diamond', name: 'DIAMOND', color: '#8aa8ff', dark: '#22337a' },
    { id: 'master', name: 'MASTER', color: '#c46bff', dark: '#46157a' },
    { id: 'legend', name: 'LEGEND', color: '#ff5a5a', dark: '#6b0f14' },
  ];
  const SIZES = [60, 75, 90, 105, 125, 145];               // RR a division, tier by tier
  const STARTS = [];
  let LEGEND_AT = 0;
  SIZES.forEach((n, t) => { STARTS[t] = LEGEND_AT; LEGEND_AT += 3 * n; });   // 1800
  const DIV = SIZES[0];
  // where a division starts (t = tier index, div 1-3)
  const divStart = (t, div) => (t >= 6 ? LEGEND_AT : STARTS[t] + ((div || 1) - 1) * SIZES[t]);

  function of(rr) {
    rr = Math.max(0, Math.round(rr || 0));
    if (rr >= LEGEND_AT) return { tier: TIERS[6], t: 6, div: 0, name: 'LEGEND', inDiv: rr - LEGEND_AT, size: 0, rr, idx: 18 };
    let t = 5;
    while (t > 0 && rr < STARTS[t]) t--;
    const size = SIZES[t], d = Math.min(2, Math.floor((rr - STARTS[t]) / size));
    return { tier: TIERS[t], t, div: d + 1, name: TIERS[t].name + ' ' + (d + 1), inDiv: rr - STARTS[t] - d * size, size, rr, idx: t * 3 + d };
  }
  // how well a bot of this rating plays, 0.15 (new Bronze) … 1 (Legend)
  const skill = (rr) => Math.min(1, 0.02 + 0.98 * Math.pow(Math.min(Math.max(rr, 0), LEGEND_AT) / LEGEND_AT, 1.35));

  // the icon: painted art when it is in, else a shield in the tier's colour with its division as pips
  function icon(rr, px) {
    const r = of(rr), key = 'rank_' + r.tier.id + (r.div ? '_' + r.div : '');
    const art = CG.DATA.art && CG.DATA.art.images && CG.DATA.art.images[key];
    px = px || 22;
    if (art) return `<img class="rank-ico" src="${art}" alt="${r.name}" style="width:${px}px;height:${px}px">`;
    const c = r.tier.color, d = r.tier.dark;
    const pips = r.div ? Array.from({ length: r.div }, (_, i) => `<rect x="${12 - r.div * 3 + i * 6 + 1}" y="16" width="4" height="4" fill="${d}"/>`).join('')
      : '<path d="M12 6l2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="' + d + '"/>';
    return `<svg class="rank-ico" viewBox="0 0 24 24" width="${px}" height="${px}" aria-label="${r.name}" shape-rendering="crispEdges">
      <path d="M12 1 L22 5 L21 14 Q19 20 12 23 Q5 20 3 14 L2 5 Z" fill="${d}"/>
      <path d="M12 3 L20 6.2 L19.2 13.6 Q17.6 18.6 12 21 Q6.4 18.6 4.8 13.6 L4 6.2 Z" fill="${c}"/>
      <path d="M12 5 L17 7 L12 9 L7 7 Z" fill="#ffffff" opacity=".45"/>${pips}</svg>`;
  }
  // a chip: icon + name (+ the RR bar when asked)
  function chip(rr, opts) {
    opts = opts || {};
    const r = of(rr);
    return `<span class="rank-chip" style="--rc:${r.tier.color}">${icon(rr, opts.px)}<b>${r.name}</b>${opts.rr ? `<small>${r.rr >= LEGEND_AT ? r.rr - LEGEND_AT + ' RR' : r.inDiv + ' / ' + r.size}</small>` : ''}</span>`;
  }

  // bots: each bot slot gets a fixed offset for this session, so a bot keeps its rank while you look at it
  const offsets = [];
  function botRR(i, around) {
    if (offsets[i] === undefined) offsets[i] = Math.round((Math.random() * 2 - 1) * 130);
    return Math.max(0, Math.round((around || 0) + offsets[i]));
  }

  // RR for a ranked fight against opponents rated `them` (average)
  function fightDelta(won, me, them) {
    const gap = Math.max(-1, Math.min(1, ((them || me) - me) / 300));
    return won ? Math.round(23 + 5 * gap) : -Math.round(16 - 4 * gap);
  }

  return { TIERS, DIV, SIZES, STARTS, LEGEND_AT, divStart, of, skill, icon, chip, botRR, fightDelta };
})();

CG.Cosmetics = (() => {
  // banners are drawn with CSS (no art needed): a background for the profile card and the squad nameplates
  const BANNERS = {
    steel:    { name: 'Steel', free: true, css: 'linear-gradient(135deg,#2a3038 0%,#3d4651 45%,#1a1e24 100%)' },
    jungle:   { name: 'Jungle Camo', free: true, css: 'radial-gradient(circle at 20% 30%,#4e6b2e 0 18%,transparent 19%),radial-gradient(circle at 70% 65%,#2f4a1d 0 22%,transparent 23%),radial-gradient(circle at 85% 20%,#6b5a2e 0 12%,transparent 13%),linear-gradient(135deg,#3a5226,#253818)' },
    inferno:  { name: 'Inferno', price: 400, css: 'linear-gradient(160deg,#ffcf5a 0%,#ff7a2a 30%,#b3201c 70%,#2a0606 100%)' },
    arctic:   { name: 'Arctic', price: 400, css: 'linear-gradient(160deg,#e8fbff 0%,#8fd3f0 35%,#2f6ea0 75%,#0d2238 100%)' },
    neon:     { name: 'Neon Grid', price: 600, css: 'linear-gradient(transparent 92%,rgba(255,80,220,.5) 0) 0 0/22px 22px,linear-gradient(90deg,transparent 92%,rgba(80,220,255,.5) 0) 0 0/22px 22px,linear-gradient(160deg,#1a0838,#08162e)' },
    carbon:   { name: 'Carbon', price: 500, css: 'repeating-linear-gradient(45deg,#15181c 0 6px,#22262c 6px 12px)' },
    bloodmoon:{ name: 'Blood Moon', price: 700, css: 'radial-gradient(circle at 75% 35%,#ff5a4a 0 14%,#7a1010 15% 17%,transparent 18%),linear-gradient(180deg,#2a0608,#5a0f14 60%,#120204)' },
    gold:     { name: 'Gold Leaf', price: 1200, css: 'linear-gradient(120deg,#6b4a08 0%,#ffd86a 30%,#fff2c0 45%,#e2a91c 60%,#6b4a08 100%)' },
    legend:   { name: 'Legend', earn: 'Reach LEGEND rank', css: 'radial-gradient(circle at 50% 120%,#ff5a5a,transparent 60%),linear-gradient(160deg,#3a0610,#0a0204)' },
  };
  // every title has its own colour (shown under the name on the squad screen, the profile, the VS screen)
  const TITLES = {
    recruit:  { name: 'RECRUIT', free: true, color: '#b8c2bb' },
    gunner:   { name: 'RUN & GUN', free: true, color: '#ff9a3c' },
    breaker:  { name: 'WALL BREAKER', earn: 'Clear stage 1', check: (s) => (s.stages || 0) >= 1, color: '#7cff8a' },
    survivor: { name: 'SURVIVOR', earn: 'Reach wave 10 in Horde', check: (s) => (s.wave || 0) >= 10, color: '#ffd23c' },
    duelist:  { name: 'DUELIST', earn: 'Win 10 duels', check: (s) => (s.wins || 0) >= 10, color: '#ff5a4f' },
    hunter:   { name: 'SHARPSHOOTER', earn: '100 flanks', check: (s) => (s.heads || 0) >= 100, color: '#ff6ad5' },
    golden:   { name: 'GOLDEN GUN', earn: 'Reach GOLD', rr: CG.Ranks.divStart(2, 1), color: '#ffcc3a' },
    diamond:  { name: 'DIAMOND HANDS', earn: 'Reach DIAMOND', rr: CG.Ranks.divStart(4, 1), color: '#8aa8ff' },
    legend:   { name: 'LIVING LEGEND', earn: 'Reach LEGEND', rr: CG.Ranks.LEGEND_AT, color: '#ff4a4a' },
    hollow:   { name: 'GHOST OF THE JUNGLE', price: 500, color: '#4fe0d0' },
    boss:     { name: 'THE BOSS', price: 900, color: '#c46bff' },
  };
  // the colour of your shots (shown to everyone, online too) — 'rainbow' cycles through every colour. The fancy ones
  // (`fx`) also leave a trail as they fly: drawn in code, no art needed (TRAILS in scenes.js, .fx-<kind> in style.css)
  const BULLETS = {
    std:     { name: 'Standard', free: true, color: null },
    gold:    { name: 'Golden Rounds', price: 300, color: '#ffd23c', legacy: 'gold' },
    red:     { name: 'Tracer Red', price: 250, color: '#ff4a3a' },
    frost:   { name: 'Frost White', price: 350, color: '#eaf8ff' },
    plasma:  { name: 'Plasma Blue', price: 400, color: '#4ad8ff' },
    toxic:   { name: 'Toxic Green', price: 400, color: '#9dff4a' },
    void:    { name: 'Void Purple', price: 500, color: '#c060ff' },
    rainbow: { name: 'Rainbow', price: 900, color: 'rainbow' },
    comet:   { name: 'Comet', price: 1100, color: '#9af0ff', fx: 'trail' },
    sakura:  { name: 'Sakura', price: 1200, color: '#ffb0d8', fx: 'petals' },
    dragon:  { name: "Dragon's Breath", price: 1500, color: '#ffa02a', fx: 'flame' },
    thunder: { name: 'Thunder', price: 1500, color: '#fff27a', fx: 'zap' },
    galaxy:  { name: 'Galaxy', price: 1800, color: '#c08aff', fx: 'stars' },
    blackhole: { name: 'Black Hole', price: 2200, color: '#2a0a4a', fx: 'void' },
    legend:  { name: 'Legend Fire', earn: 'Reach LEGEND', rr: CG.Ranks.LEGEND_AT, color: '#ff3a1a', fx: 'ember' },
  };
  // the colour of your name over your agent (in story / horde / co-op; duels keep the team colours)
  const NAMES = {
    std:     { name: 'Standard', free: true, color: null },
    gold:    { name: 'Elite Gold', price: 250, color: '#ffd23c', legacy: 'elite' },
    crimson: { name: 'Crimson', price: 200, color: '#ff4a4a' },
    cyan:    { name: 'Cyan', price: 200, color: '#4ae0ff' },
    lime:    { name: 'Lime', price: 200, color: '#8cff4a' },
    violet:  { name: 'Violet', price: 300, color: '#c46bff' },
    rainbow: { name: 'Rainbow', price: 800, color: 'rainbow' },
  };
  const LISTS = { banner: BANNERS, title: TITLES, bullet: BULLETS, namec: NAMES };
  const itemId = (kind, id) => kind + '_' + id;
  // what this account may equip: free ones, bought ones (shop item `<kind>_<id>`), earned ones
  function has(kind, id, prof) {
    const list = LISTS[kind] || TITLES, x = list[id];
    if (!x) return false;
    if (x.free) return true;
    const p = prof || CG.Net.profile || CG.Profile.local();
    // the old shop's Golden Rounds / Elite Tag count as the new gold bullets / gold name
    if (x.legacy && p.owned && p.owned[x.legacy]) return true;
    if (x.price) return !!(p.owned && p.owned[itemId(kind, id)]);
    const stats = p.stats || {}, rr = p.rr || 0;
    if (x.rr) return rr >= x.rr;
    if (kind === 'banner' && id === 'legend') return rr >= CG.Ranks.LEGEND_AT;
    return x.check ? x.check(stats) : false;
  }
  // a painted banner from banners.png when it is in, else the CSS one
  const bannerCss = (id) => {
    const art = CG.DATA.art && CG.DATA.art.images && CG.DATA.art.images['banner_' + id];
    return art ? "url('" + art + "') center / cover no-repeat" : (BANNERS[id] || BANNERS.steel).css;
  };
  const titleName = (id) => (TITLES[id] || TITLES.recruit).name;
  const titleColor = (id) => (TITLES[id] || TITLES.recruit).color;
  const titleHtml = (id, cls) => (id ? `<i class="${cls || 'ttl'}" style="color:${titleColor(id)}">${titleName(id)}</i>` : '');
  // shop items for the banners and titles that are sold
  function shopItems() {
    const out = {};
    let o = 30;
    for (const id in BANNERS) if (BANNERS[id].price) out[itemId('banner', id)] = { name: BANNERS[id].name + ' banner', kind: 'banner', look: id, price: BANNERS[id].price, order: o++ };
    for (const id in TITLES) if (TITLES[id].price) out[itemId('title', id)] = { name: '“' + TITLES[id].name + '”', kind: 'title', look: id, price: TITLES[id].price, order: o++ };
    for (const id in BULLETS) if (BULLETS[id].price) out[itemId('bullet', id)] = { name: BULLETS[id].name, kind: 'bullet', look: id, price: BULLETS[id].price, order: o++ };
    for (const id in NAMES) if (NAMES[id].price) out[itemId('namec', id)] = { name: NAMES[id].name + ' name', kind: 'namec', look: id, price: NAMES[id].price, order: o++ };
    return out;
  }
  // a colour as CSS ('rainbow' becomes a moving gradient class)
  const lookColor = (kind, id) => ((LISTS[kind] || {})[id] || {}).color || null;
  const bulletFx = (id) => (BULLETS[id] && BULLETS[id].fx) || null;
  // a little row of three shots in this colour (shop, locker) — a fancy one is one shot with its trail
  const bulletHtml = (id) => {
    const c = lookColor('bullet', id), fx = bulletFx(id);
    if (fx) return `<span class="bullet-sample fx fx-${fx}" style="--bc:${c}"><i></i></span>`;
    return `<span class="bullet-sample ${c === 'rainbow' ? 'rainbow' : ''}" style="--bc:${c && c !== 'rainbow' ? c : '#ffe9a0'}"><i></i><i></i><i></i></span>`;
  };
  const nameHtml = (id, text) => {
    const c = lookColor('namec', id);
    return `<span class="name-sample ${c === 'rainbow' ? 'rainbow' : ''}" style="${c && c !== 'rainbow' ? 'color:' + c : ''}">${text}</span>`;
  };
  return { BANNERS, TITLES, BULLETS, NAMES, LISTS, has, bannerCss, titleName, titleColor, titleHtml, shopItems, lookColor, bulletFx, bulletHtml, nameHtml };
})();

// This account's rank, stats and look — the database profile when signed in, else kept on this device.
CG.Profile = {
  KEY: 'commando.profile',
  local() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  saveLocal(p) { try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch (e) { /* no storage */ } },
  get() { return (CG.Net.online && CG.Net.profile) || this.local(); },
  rr() { return this.get().rr || 0; },
  banner() { return this.get().banner || 'steel'; },
  title() { return this.get().title || 'recruit'; },
  bullet() { return this.get().bullet || 'std'; },
  namec() { return this.get().namec || 'std'; },
  // a finished match: RR change and stats added (signed in: to the database, else on this device)
  record(res) {
    const apply = (p) => {
      p = p || {};
      p.rr = Math.max(0, (p.rr || 0) + (res.rr || 0));
      const s = p.stats = p.stats || {};
      s.matches = (s.matches || 0) + 1;
      if (res.won) s.wins = (s.wins || 0) + 1;
      s.kills = (s.kills || 0) + (res.kills || 0);
      s.heads = (s.heads || 0) + (res.heads || 0);
      s.stages = Math.max(s.stages || 0, res.stages || 0);
      s.wave = Math.max(s.wave || 0, res.wave || 0);
      return p;
    };
    if (CG.Net.online) return CG.Net.recordResult(apply);
    this.saveLocal(apply(this.local()));
    return Promise.resolve();
  },
  // guests (and anyone offline) keep coins and what they bought on this device
  coins() { return this.get().coins || 0; },
  addCoinsLocal(n) { const p = this.local(); p.coins = Math.max(0, (p.coins || 0) + n); this.saveLocal(p); },
  buyLocal(item) {
    const p = this.local();
    p.owned = p.owned || {};
    if (p.owned[item.id]) return Promise.reject(new Error('You already have it'));
    if ((p.coins || 0) < item.price) return Promise.reject(new Error('Not enough coins'));
    p.coins -= item.price; p.owned[item.id] = true;
    this.saveLocal(p);
    return Promise.resolve();
  },
  // the one free agent of a new account
  chooseStarter(id) {
    if (CG.Net.online) return CG.Net.chooseStarter(id);
    const p = this.local();
    p.starter = id; p.owned = p.owned || {}; p.owned['agent_' + id] = true;
    this.saveLocal(p);
    return Promise.resolve();
  },
  setLook(kind, id) {
    if (CG.Net.online) return CG.Net.setLook(kind, id);
    const p = this.local(); p[kind] = id; this.saveLocal(p);
    return Promise.resolve();
  },
};
