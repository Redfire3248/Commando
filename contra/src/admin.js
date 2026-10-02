// Admin panel — only for the owner's Google account (CG.Net.isAdmin; the database rules check the email as
// well for the shop and coins). F2 opens and closes it, or PAUSE → ADMIN PANEL.
//   Players / Enemies / Items / Stage   change the game being played (marks the run: no score or coins saved)
//   Shop                                 edit the shop's items and prices (saved to the database for everyone)
//   Accounts                             everyone's coins, best score and who is online; give or take coins
CG.Admin = (() => {
  const $ = (id) => document.getElementById(id);
  let tab = 'players', refresh = null, users = null;
  // The panel's markup is created the first time the owner opens it, so for everyone else it is not on the page at all.
  const MARKUP = `<div class="admin-head">
    <div class="admin-title"><b>ADMIN</b><small id="admin-who"></small></div>
    <button data-act="admin-close" class="btn small ghost">✕</button>
  </div>
  <div class="admin-tabs">
    <button data-tab="players" class="on">🎖<span>Players</span></button>
    <button data-tab="spawn">👾<span>Enemies</span></button>
    <button data-tab="items">✚<span>Items</span></button>
    <button data-tab="stage">🗺<span>Stage</span></button>
    <button data-tab="hacks">🎯<span>Hacks</span></button>
    <button data-tab="shop">🛒<span>Shop</span></button>
    <button data-tab="users">👥<span>Accounts</span></button>
  </div>
  <div id="admin-body"></div>
  <div class="admin-foot">Using the game tabs marks the run: no score or coins are saved. F2 opens and closes this panel.</div>`;
  function build() {
    if ($('admin')) return;
    const d = document.createElement('div');
    d.id = 'admin';
    d.className = 'hidden';
    d.innerHTML = MARKUP;
    document.body.appendChild(d);
  }

  const scene = () => {
    if (!CG.game) return null;
    const m = CG.game.scene;
    return m.isActive('Game') || m.isPaused('Game') ? m.getScene('Game') : null;
  };
  const isOpen = () => !!$('admin') && !$('admin').classList.contains('hidden');
  const esc = (t) => String(t === undefined ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // a small picture of a texture (or one frame of a sheet), for the buttons
  const thumbs = {};
  function thumb(key, frame) {
    const s = scene() || (CG.game && CG.game.scene.getScene('Backdrop')), id = key + ':' + (frame || 0);
    if (thumbs[id]) return thumbs[id];
    if (!s || !s.textures.exists(key)) return '';
    try { thumbs[id] = s.textures.getBase64(key, frame); } catch (e) { thumbs[id] = ''; }
    return thumbs[id];
  }
  const img = (src) => (src ? `<img src="${src}" alt="">` : '<span class="noimg">?</span>');
  const needGame = () => '<p class="admin-tip">Start a game to use this tab. (The Shop and Accounts tabs work from the menu.)</p>';

  // ---- tabs
  const TABS = {
    players(s) {
      if (!s) return needGame();
      if (s.isClient) return '<p class="admin-tip">Online, only the host can change the match.</p>';
      let h = `<div class="admin-row"><b>Squad lives: ${s.teamLives}</b>
        <button class="btn small" data-adm="lives" data-n="1">+1</button><button class="btn small" data-adm="lives" data-n="5">+5</button>
        <button class="btn small" data-adm="healall">HEAL ALL</button></div>`;
      s.players.forEach((p, i) => {
        h += `<div class="admin-card" style="--c:${p.color}">
          ${img(CG.PORTRAITS && CG.PORTRAITS[p.agent.id])}
          <div class="grow"><b>${esc(p.name)}</b> <small>${p.agent.name}${p.bot ? ' · bot' : ''}${p.remote ? ' · online' : ''}</small><br>
          ${p.out ? 'OUT' : p.dead ? 'down' : '♥ ' + p.hp + ' / ' + p.maxHp} · ability ${p.abilityCd > 0 ? Math.ceil(p.abilityCd / 1000) + 's' : 'ready'}</div>
          <div class="btns">
            <button class="btn" data-adm="heal" data-i="${i}">HEAL</button>
            <button class="btn ${p.god ? 'on' : ''}" data-adm="god" data-i="${i}">GOD MODE</button>
            <button class="btn ${p.freeAbility ? 'on' : ''}" data-adm="free" data-i="${i}">NO COOLDOWN</button>
            <button class="btn ${p.rapid ? 'on' : ''}" data-adm="rapid" data-i="${i}">RAPID</button>
            <button class="btn ${p.spread ? 'on' : ''}" data-adm="spread" data-i="${i}">SPREAD</button>
            <button class="btn" data-adm="shield" data-i="${i}">SHIELD</button>
            <button class="btn" data-adm="ability" data-i="${i}">USE ABILITY</button>
            ${p.out ? `<button class="btn" data-adm="revive" data-i="${i}">REVIVE</button>` : ''}
          </div></div>`;
      });
      return h;
    },
    spawn(s) {
      if (!s) return needGame();
      const T = CG.Enemy.TYPES;
      const list = ['runner', 'rifle', 'grenadier', 'turret', 'drone', 'flyer'];
      return '<p class="admin-tip">They appear at the right edge of the screen.</p><div class="admin-grid">' + list.map((t) => {
        const d = T[t], key = d.sheet && s.textures.exists(d.sheet) ? d.sheet : d.tex;
        return `<div class="tile btn">${img(thumb(key, d.frames || d.sheet ? 0 : undefined))}<span>${t}</span>
          <div class="row center-row"><button class="btn small" data-adm="spawn" data-t="${t}" data-n="1">×1</button><button class="btn small" data-adm="spawn" data-t="${t}" data-n="5">×5</button></div></div>`;
      }).join('') + '</div>';
    },
    items(s) {
      if (!s) return needGame();
      const list = [['heal', 'First aid'], ['heal_big', 'Squad medkit'], ['life', 'Squad life'], ['rapid', 'Rapid fire'], ['spread', 'Spread'], ['barrier', 'Shield'],
        ['pierce', 'Piercing'], ['blast', 'Explosive'], ['double', 'Double damage'], ['ice', 'Ice rounds'], ['fire', 'Fire rounds'],
        ['shock', 'Shock rounds'], ['magnet', 'Coin magnet'], ['boots', 'Jump boots'], ['autoaim', 'Auto aim'], ['armor', 'Armour +2'],
        ['dcoins', 'Double coins'], ['bigheal', 'Full heal']];
      const tile = ([k, n], extra) => {
        const key = s.textures.exists('pk_' + k) ? 'pk_' + k : 'pk_life';
        return `<button class="tile btn ${extra || ''}" data-adm="item" data-k="${k}">${img(thumb(key))}<span>${n}</span></button>`;
      };
      return '<div class="admin-sec">Admin only</div><p class="admin-tip">Never drops in the game: only this panel can give it out.</p>'
        + '<div class="admin-grid">' + tile(['overdrive', 'OVERDRIVE · 15 s untouchable, five-way piercing spray'], 'admin-only') + '</div>'
        + '<div class="admin-sec">Pick-ups</div><p class="admin-tip">Drop next to the first player.</p><div class="admin-grid">' + list.map((x) => tile(x)).join('') + '</div>';
    },
    stage(s) {
      if (!s) return needGame();
      return `<div class="admin-sec">This stage</div><div class="admin-grid wide">
        <button class="btn" data-adm="killall">KILL ALL ON SCREEN</button>
        <button class="btn" data-adm="boss">SKIP TO THE BOSS</button>
        <button class="btn" data-adm="clear">CLEAR THE STAGE</button>
        <button class="btn ${s.time.timeScale < 1 ? 'on' : ''}" data-adm="slow">SLOW MOTION</button>
      </div><div class="admin-sec">Go to stage</div><div class="admin-grid wide">
        ${[1, 2, 3, 4, 5, 6].map((n) => `<button class="btn" data-adm="goto" data-n="${n}">STAGE ${n} · ${CG.DATA.levels[(n - 1) % CG.DATA.levels.length].name}</button>`).join('')}
      </div>`;
    },
    hacks(s) {
      if (!s) return needGame();
      if (s.isClient) return '<p class="admin-tip">Online, only the host can use hacks.</p>';
      const HACKS = [['aim', '🎯 AUTO AIM', 'Shots lock on to the nearest target'], ['strafe', '↔ STRAFE', 'Keep facing forward while shooting and moving'],
        ['speed', '⚡ SPEED', 'Run 60% faster'], ['jump', '🦘 SUPER JUMP', 'Jump 45% higher'], ['oneshot', '💀 ONE SHOT', 'Every bullet kills'],
        ['dash', '» INFINITE DASH', 'Tac Dash has no cooldown']];
      let h = `<div class="admin-row"><b>Whole game</b><button class="btn small ${s.physics.world.gravity.y < CG.CONFIG.GRAVITY ? 'on' : ''}" data-adm="lowgrav">🌙 LOW GRAVITY</button></div>`;
      s.players.forEach((p, i) => {
        if (p.remote) return;
        h += `<div class="admin-card" style="--c:${p.color}"><div class="grow"><b>${esc(p.name)}</b> <small>${p.agent.name}${p.bot ? ' · bot' : ''}</small></div>
          <div class="btns">${HACKS.map(([k, n, t]) => `<button class="btn ${p.hack[k] ? 'on' : ''}" title="${t}" data-adm="hack" data-i="${i}" data-k="${k}">${n}</button>`).join('')}</div></div>`;
      });
      return h;
    },
    shop() {
      if (!CG.Net.online) return '<p class="admin-tip">Sign in first.</p>';
      const items = CG.Shop.allItems(), fromDb = CG.Shop.db && Object.keys(CG.Shop.db).length;
      let h = `<p class="admin-tip">${fromDb ? 'These are live: changes reach every player at once.' : 'The shop is using the built-in list. Save once to put it in the database so you can edit it.'}</p>
        <div class="admin-row"><button class="btn small" data-adm="shop-reset">${fromDb ? 'RESET TO DEFAULTS' : 'SAVE THE BUILT-IN LIST'}</button></div>`;
      for (const it of items) {
        if (it.kind === 'agent') {                      // agents: just the price and whether they are for sale
          h += `<div class="admin-shop" data-id="${esc(it.id)}">
            <input data-f="name" value="${esc(it.name)}"><input data-f="price" type="number" min="0" value="${esc(it.price)}">
            <span><button class="btn small ${it.off ? '' : 'on'}" data-adm="shop-toggle" data-id="${esc(it.id)}">${it.off ? 'HIDDEN' : 'ON SALE'}</button></span>
            <span class="admin-tip">agent</span><span></span>
            <span><button class="btn small" data-adm="shop-save" data-id="${esc(it.id)}">SAVE</button></span></div>`;
          continue;
        }
        h += `<div class="admin-shop" data-id="${esc(it.id)}">
          <input data-f="name" value="${esc(it.name)}" placeholder="Name"><input data-f="price" type="number" min="0" value="${esc(it.price)}">
          <span><button class="btn small ${it.off ? '' : 'on'}" data-adm="shop-toggle" data-id="${esc(it.id)}">${it.off ? 'HIDDEN' : 'ON SALE'}</button></span>
          <input data-f="icon" value="${esc(it.icon)}" placeholder="Icon">
          <select data-f="effect">${CG.Shop.EFFECTS.map((e) => `<option ${e === it.effect ? 'selected' : ''}>${e}</option>`).join('')}</select>
          <span><button class="btn small" data-adm="shop-save" data-id="${esc(it.id)}">SAVE</button> <button class="btn small" data-adm="shop-del" data-id="${esc(it.id)}">✕</button></span>
          <textarea data-f="desc" rows="2">${esc(it.desc)}</textarea></div>`;
      }
      h += `<div class="admin-sec">New item</div><div class="admin-row"><input id="adm-new-id" placeholder="id (e.g. armor)"><button class="btn small" data-adm="shop-add">ADD</button></div>`;
      return h;
    },
    users() {
      if (!CG.Net.online) return '<p class="admin-tip">Sign in first.</p>';
      if (!users) { CG.Net.adminUsers().then((u) => { users = u; render(); }).catch((e) => { users = {}; CG.UI.toast(e.message); }); return '<p class="admin-tip">Loading accounts…</p>'; }
      const ids = Object.keys(users).sort((a, b) => (users[b].online ? 1 : 0) - (users[a].online ? 1 : 0) || (users[b].best || 0) - (users[a].best || 0));
      return `<div class="admin-row"><b>${ids.length} accounts</b><button class="btn small" data-adm="users-reload">RELOAD</button></div>` + ids.map((uid) => {
        const u = users[uid];
        return `<div class="admin-card" style="--c:${u.online ? '#5cff8a' : '#55645a'}">
          <div class="grow"><b>${esc(u.username || u.name || '?')}</b> <small>${u.online ? 'online' : ''} · code ${esc(u.code || '')}</small><br>
          🪙 ${u.coins || 0} · best ${u.best || 0} · items ${Object.keys(u.owned || {}).length}</div>
          <div class="btns">${[100, 1000, -100].map((n) => `<button class="btn" data-adm="coins" data-uid="${uid}" data-n="${n}">${n > 0 ? '+' : ''}${n}</button>`).join('')}</div></div>`;
      }).join('');
    },
  };

  function render() {
    const s = scene();
    document.querySelectorAll('#admin .admin-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    const p = CG.Net.profile;
    $('admin-who').textContent = (CG.Net.user && CG.Net.user.email) || (p && p.username) || '';
    $('admin-body').innerHTML = TABS[tab](s);
  }

  const gameAct = {
    lives: (s, d) => { s.teamLives += +d.n; },
    healall: (s) => { s.players.forEach((p) => { if (p.alive && !p.remote) { p.hp = p.maxHp; s.plusFx(p.body.center.x, p.body.top); } }); },
    heal: (s, d) => { const p = s.players[d.i]; if (p.alive) { p.hp = p.maxHp; s.plusFx(p.body.center.x, p.body.top); } },
    god: (s, d) => { const p = s.players[d.i]; p.god = !p.god; },
    free: (s, d) => { const p = s.players[d.i]; p.freeAbility = !p.freeAbility; },
    rapid: (s, d) => { const p = s.players[d.i]; p.rapid = !p.rapid; },
    spread: (s, d) => { const p = s.players[d.i]; p.spread = !p.spread; },
    shield: (s, d) => { s.players[d.i].barrierT = CG.CONFIG.PLAYER.barrierMs; },
    ability: (s, d) => { const p = s.players[d.i]; if (!p.remote) { p.abilityCd = 0; p.useAbility(); } },
    revive: (s, d) => { const p = s.players[d.i]; if (p.out && !p.remote) p.respawn(); },
    spawn: (s, d) => {
      const T = CG.CONFIG.TILE, L = CG.DATA.level;
      for (let k = 0; k < +d.n; k++) {
        const x = s.camX + CG.CONFIG.W - 80 - k * 70;
        const y = d.t === 'drone' ? 4.5 * T : d.t === 'flyer' ? 4 * T : L.groundRow * T;
        const e = new CG.Enemy(s, d.t, x, y, d.t === 'flyer' ? ['rapid', 'spread', 'barrier', 'life'][k % 4] : undefined);
        e.netId = ++s.netSeq;
        s.enemies.add(e);
      }
    },
    item: (s, d) => {
      const p = s.players.find((q) => q.alive) || s.players[0];
      s.dropPickup(p.body.center.x + 120, p.body.top - 200, d.k);
    },
    killall: (s) => {
      const cam = s.cameras.main;
      s.enemies.getChildren().slice().forEach((e) => {
        if (e.active && !e.T.boss && e.x > cam.scrollX - 50 && e.x < cam.scrollX + CG.CONFIG.W + 50) s.killEnemy(e);
      });
    },
    boss: (s) => {
      s.camX = s.bossCamX;
      s.enemies.getChildren().slice().forEach((e) => { if (e.active && !e.T.boss) e.destroy(); });
      const T = CG.CONFIG.TILE;
      s.players.forEach((p, i) => { if (p.alive && !p.remote) p.body.reset(s.bossCamX + 300 + i * 70, CG.DATA.level.groundRow * T - 60); });
    },
    clear: (s) => { s.stageClear(); },
    hack: (s, d) => { const p = s.players[d.i]; p.hack[d.k] = !p.hack[d.k]; },
    lowgrav: (s) => { const g = s.physics.world.gravity; g.y = g.y < CG.CONFIG.GRAVITY ? CG.CONFIG.GRAVITY : CG.CONFIG.GRAVITY * 0.45; },
    slow: (s) => { const k = s.time.timeScale < 1 ? 1 : 0.4; s.time.timeScale = k; s.physics.world.timeScale = 1 / k; s.tweens.timeScale = k; },
    goto: (s, d) => { s.scene.restart(Object.assign({}, s.cfg, { stage: +d.n, adminUsed: true })); },
  };
  const shopRow = (id) => {
    const row = document.querySelector(`.admin-shop[data-id="${CSS.escape(id)}"]`), it = CG.Shop.allItems().find((x) => x.id === id) || {};
    const v = (f) => row.querySelector(`[data-f="${f}"]`).value;
    const price = Math.max(0, parseInt(v('price'), 10) || 0);
    if (it.kind === 'agent') return { name: v('name'), price, kind: 'agent', agent: it.agent, order: it.order || 20, off: !!it.off };
    return { name: v('name'), price, icon: v('icon'), effect: v('effect'), desc: v('desc'),
      kind: ['gold', 'star'].includes(v('effect')) ? 'cosmetic' : 'perk', order: it.order || 50, off: !!it.off };
  };
  // the shop tab writes a full list the first time (so later edits only change one item)
  const ensureDb = () => (CG.Shop.db && Object.keys(CG.Shop.db).length ? Promise.resolve() : CG.Net.adminResetShop());
  const netAct = {
    'shop-reset': () => CG.Net.adminResetShop(),
    'shop-save': (d) => ensureDb().then(() => CG.Net.adminSetItem(d.id, shopRow(d.id))),
    'shop-toggle': (d) => ensureDb().then(() => { const it = shopRow(d.id); it.off = !it.off; return CG.Net.adminSetItem(d.id, it); }),
    'shop-del': (d) => ensureDb().then(() => CG.Net.adminRemoveItem(d.id)),
    'shop-add': () => {
      const id = ($('adm-new-id').value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!id) return Promise.reject(new Error('Type an id'));
      return ensureDb().then(() => CG.Net.adminSetItem(id, { name: 'New item', desc: '', price: 500, kind: 'perk', effect: 'hp', icon: '★', order: 60 }));
    },
    coins: (d) => CG.Net.adminGiveCoins(d.uid, +d.n).then(() => { users = null; }),
    'users-reload': () => { users = null; return Promise.resolve(); },
  };

  function open() {
    if (!CG.Net.isAdmin) return;                          // not the owner's account: F2 does nothing
    build();
    $('admin').classList.remove('hidden');
    render();
    clearInterval(refresh);
    refresh = setInterval(() => { if (isOpen() && tab === 'players' && scene() && !document.querySelector('#admin:hover')) render(); }, 700);
  }
  function close() { if ($('admin')) $('admin').classList.add('hidden'); clearInterval(refresh); }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('#admin .admin-tabs button');
    if (t) { tab = t.dataset.tab; render(); return; }
    const b = e.target.closest('[data-adm]');
    if (!b || !CG.Net.isAdmin) return;
    const a = b.dataset.adm;
    if (gameAct[a]) {
      const s = scene();
      if (!s || s.isClient) return;
      gameAct[a](s, b.dataset);
      s.adminUsed = true;
      render();
    } else if (netAct[a]) {
      netAct[a](b.dataset).then(() => { CG.UI.toast('Saved'); setTimeout(render, 300); }).catch((err) => CG.UI.toast(err.message || String(err)));
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'F2') { e.preventDefault(); if (isOpen()) close(); else open(); }
  });

  return { open, close, isOpen };
})();
