// Ranks and profile cosmetics.
//
// RANKS: rank rating (RR) climbs and falls with your results, 100 RR a division, three divisions a tier:
//   BRONZE 1-3 · SILVER 1-3 · GOLD 1-3 · PLATINUM 1-3 · DIAMOND 1-3 · MASTER 1-3 · LEGEND (no divisions, from 1800 RR)
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
  const DIV = 100, LEGEND_AT = 6 * 3 * DIV;               // 1800

  function of(rr) {
    rr = Math.max(0, Math.round(rr || 0));
    if (rr >= LEGEND_AT) return { tier: TIERS[6], t: 6, div: 0, name: 'LEGEND', inDiv: rr - LEGEND_AT, rr, idx: 18 };
    const idx = Math.floor(rr / DIV), t = Math.floor(idx / 3), div = (idx % 3) + 1;
    return { tier: TIERS[t], t, div, name: TIERS[t].name + ' ' + div, inDiv: rr % DIV, rr, idx };
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
    return `<span class="rank-chip" style="--rc:${r.tier.color}">${icon(rr, opts.px)}<b>${r.name}</b>${opts.rr ? `<small>${r.rr >= LEGEND_AT ? r.rr - LEGEND_AT + ' RR' : r.inDiv + ' / 100'}</small>` : ''}</span>`;
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

  return { TIERS, DIV, LEGEND_AT, of, skill, icon, chip, botRR, fightDelta };
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
    golden:   { name: 'GOLDEN GUN', earn: 'Reach GOLD', rr: 600, color: '#ffcc3a' },
    diamond:  { name: 'DIAMOND HANDS', earn: 'Reach DIAMOND', rr: 1200, color: '#8aa8ff' },
    legend:   { name: 'LIVING LEGEND', earn: 'Reach LEGEND', rr: 1800, color: '#ff4a4a' },
    hollow:   { name: 'GHOST OF THE JUNGLE', price: 500, color: '#4fe0d0' },
    boss:     { name: 'THE BOSS', price: 900, color: '#c46bff' },
  };
  const itemId = (kind, id) => kind + '_' + id;
  // what this account may equip: free ones, bought ones (shop item `banner_<id>` / `title_<id>`), earned ones
  function has(kind, id, prof) {
    const list = kind === 'banner' ? BANNERS : TITLES, x = list[id];
    if (!x) return false;
    if (x.free) return true;
    const p = prof || CG.Net.profile || CG.Profile.local();
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
    return out;
  }
  return { BANNERS, TITLES, has, bannerCss, titleName, titleColor, titleHtml, shopItems };
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
