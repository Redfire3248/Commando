// Menus (plain HTML over the game canvas) and the flow between them:
//   sign in (Google, required) → choose a callsign (first time) → home
//   home → PLAY: who is playing (+ bots) → choose agents → game
//        → PLAY ONLINE: squad (invite friends, pick agent, start or find players) → game
//        → SHOP · FRIENDS · SETTINGS · HOW TO PLAY
// Offline play is only offered when the online service is not set up or cannot be reached.
CG.UI = (() => {
  const $ = (id) => document.getElementById(id);
  const PANELS = ['login', 'username', 'menu', 'lobby', 'select', 'party', 'shop', 'settings', 'how', 'friends', 'pause', 'over'];
  const BEST = 'commando.best', NAME = 'commando.name', AGENT = 'commando.agent';
  let lastPlayers = null, scene = null, booted = false, offline = false, current = null;

  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const localBest = () => parseInt(store.get(BEST, '0'), 10) || 0;
  function localName() {
    let n = store.get(NAME, '');
    if (!n) { n = 'Soldier' + Math.floor(100 + Math.random() * 900); store.set(NAME, n); }
    return n;
  }
  const myName = () => (CG.Net.profile ? CG.Net.profile.username || CG.Net.profile.name : localName());
  const myAgent = () => {
    const id = store.get(AGENT, '');
    return CG.AGENT[id] && CG.Shop.hasAgent(id) ? id : (CG.AGENTS.find((a) => CG.Shop.hasAgent(a.id)) || CG.AGENTS[0]).id;
  };
  const priceOf = (id) => { const it = CG.Shop.agentItem(id); return it ? it.price : 0; };
  const coins = () => (N().profile && N().profile.coins) || 0;
  // a bar out of 5 for the agent screens (health 4-8, speed 90-116%)
  const bar = (v) => `<span class="bar"><i style="width:${Math.round(Math.max(0.08, Math.min(1, v)) * 100)}%"></i></span>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const visible = (id) => !$(id).classList.contains('hidden');
  const portrait = (id) => (CG.PORTRAITS && CG.PORTRAITS[id]) || '';
  const abIcon = (id) => (CG.ABICONS && CG.ABICONS[id]) || '';
  const N = () => CG.Net;

  function show(id) {
    current = id;
    PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id));
    if (id === 'menu') renderMenu();
    if (id === 'friends') refreshFriends();
    if (id === 'party') renderParty();
    if (id === 'shop') renderShop();
    if (id === 'settings') renderSettings();
    if (id === 'username') { const i = $('un-input'); i.value = (N().profile && N().profile.username) || ''; setTimeout(() => i.focus(), 50); }
    const first = id && !['lobby', 'select', 'username'].includes(id) && $(id).querySelector('button:not(.hidden):not([disabled])');
    if (first && !CG.Touch.enabled) first.focus();
  }

  let toastT = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.add('hidden'), 3200);
  }

  // ---------------------------------------------------------------- where to go: sign in, callsign or home
  function canPlayOffline() { const s = N().state; return s === 'off' || s === 'error'; }
  function home() {
    const net = N();
    if (offline && canPlayOffline()) { show('menu'); return; }
    if (net.state === 'off') { offline = true; show('menu'); return; }          // online service not set up
    if (!net.online) { show('login'); renderLogin(); return; }
    if (net.needsUsername) { show('username'); return; }
    show('menu');
  }
  function renderLogin() {
    const s = N().state;
    $('google-btn').disabled = s === 'loading';
    $('offline-btn').classList.toggle('hidden', !canPlayOffline());
    $('login-msg').textContent = s === 'loading' ? 'Connecting…' : s === 'error' ? 'Could not reach the server: ' + N().error : $('login-msg').dataset.keep || '';
  }
  function loginMessage(m) { $('login-msg').dataset.keep = m || ''; $('login-msg').textContent = m || ''; }

  function netChanged() {
    if (!booted) return;
    const net = N();
    if (current === 'login') {
      if (net.online) home(); else renderLogin();
      return;
    }
    if (!net.online && !offline && ['menu', 'shop', 'party', 'friends', 'settings', 'username'].includes(current)) { home(); return; }
    if (current === 'menu' && net.needsUsername) { show('username'); return; }
    if (current === 'menu') renderMenu();
    else if (current === 'friends') refreshFriends();
    else if (current === 'party') renderParty();
    else if (current === 'shop') renderShop();
    else if (current === 'settings') renderSettings();
  }

  // ---------------------------------------------------------------- home
  let showIdx = -1;
  function renderMenu() {
    const net = N(), prof = net.profile, on = net.online;
    $('menu-name').textContent = myName();
    $('menu-coins').textContent = (prof && prof.coins) || 0;
    $('menu-coins').parentElement.classList.toggle('hidden', !on);
    $('menu-best').textContent = Math.max(localBest(), (prof && prof.best) || 0);
    $('menu-photo').classList.toggle('hidden', !(prof && prof.photo));
    if (prof && prof.photo) $('menu-photo').src = prof.photo;
    document.querySelectorAll('.online-only').forEach((b) => b.classList.toggle('hidden', !on));
    const inv = Object.keys(net.invites || {});
    $('menu-invites').innerHTML = inv.map((pid) => `<div class="invite"><span>🎖 <b>${esc(net.invites[pid].name)}</b> invited you to their squad</span>
      <button class="btn small primary" data-act="inv-accept" data-uid="${esc(pid)}">JOIN</button><button class="btn small" data-act="inv-decline" data-uid="${esc(pid)}">✕</button></div>`).join('');
    renderShowcase();
  }
  function renderShowcase() {
    if (showIdx < 0) showIdx = Math.max(0, CG.AGENTS.findIndex((a) => a.id === myAgent()));
    const a = CG.AGENTS[showIdx], ab = a.ability, own = CG.Shop.hasAgent(a.id), mine = a.id === myAgent();
    const action = !own
      ? `<button class="btn small primary" data-act="buy-agent" data-uid="${a.id}" ${coins() < priceOf(a.id) ? 'disabled' : ''}>🔒 UNLOCK · <span class="coin"></span> ${priceOf(a.id)}</button>`
      : `<button class="btn small ${mine ? 'on' : ''}" data-act="show-fav">${mine ? 'SELECTED' : 'MAKE MY AGENT'}</button>`;
    $('showcase').innerHTML = `
      <button class="btn arrow" data-act="show-prev">◀</button>
      <div class="hero ${own ? '' : 'locked'}" style="--c:${a.color}">
        ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}
        <div class="name">${a.name}</div><div class="role">${a.role}</div>
        <div class="fav">${mine ? '★ your agent' : own ? '' : '🔒 locked'}</div>
      </div>
      <div class="info" style="--c:${a.color}">
        <div class="stat-rows"><span>HEALTH</span>${bar(a.hp / 8)}<span>SPEED</span>${bar((a.speed - 0.8) / 0.4)}</div>
        <div class="ab">${abIcon(a.id) ? `<img src="${abIcon(a.id)}" alt="">` : ''}<div><b>${ab.name}</b><br>${ab.desc}</div></div>
        ${action}
      </div>
      <button class="btn arrow" data-act="show-next">▶</button>`;
  }

  const running = () => booted && CG.game.scene.isActive('Game');
  const paused = () => booted && CG.game.scene.isPaused('Game');

  // ---------------------------------------------------------------- playing
  function startScene(data) {
    show(null);
    CG.Admin.close();
    CG.game.scene.stop('Backdrop');
    CG.game.scene.stop('Game');
    CG.game.scene.start('Game', data);
    const touch = data.players.some((p) => p.device.type === 'touch' || p.device.type === 'any');
    CG.Touch.show(touch);
    if (touch && CG.Touch.enabled && !document.fullscreenElement) landscape();
  }
  function play(players) {
    if (!booted) return;
    lastPlayers = players;
    startScene({ players });
  }
  function playOnline(cfg) {
    if (!booted) return;
    lastPlayers = null;
    startScene(cfg);
  }
  function pause() {
    if (!running() || (scene && scene.over)) return;
    $('pause-admin').classList.toggle('hidden', !N().isAdmin || !!(scene && scene.isClient));
    if (scene && scene.net) { show('pause'); return; }          // online: the match keeps going
    CG.game.scene.pause('Game');
    show('pause');
  }
  function resume() {
    show(null);
    if (paused()) CG.game.scene.resume('Game');
  }
  function toMenu() {
    if (CG.Online.mid) CG.Online.leave();
    CG.Admin.close();
    CG.game.scene.stop('Game');
    if (!CG.game.scene.isActive('Backdrop')) CG.game.scene.start('Backdrop');
    CG.Touch.show(false);
    if (N().partyId) show('party'); else home();
  }
  function gameOver(score, stage, opts) {
    opts = opts || {};
    const best = localBest(), admin = !!opts.admin;
    if (!admin && score > best) store.set(BEST, String(score));
    if (!admin) N().submitScore(score);
    const coins = admin ? 0 : CG.Shop.coinsFor(score) + (opts.coins || 0);      // score coins + coins picked up
    if (coins && N().online) N().addCoins(coins).catch(() => {});
    $('over-score').textContent = score;
    $('over-coins').classList.toggle('hidden', !coins || !N().online);
    $('over-coins').querySelector('b').textContent = coins;
    $('over-best').textContent = admin ? 'Admin panel used: nothing saved' : opts.online ? 'Online match' : score > best ? 'New best!' : 'Best ' + best;
    $('over-retry').classList.toggle('hidden', !lastPlayers);
    CG.Touch.show(false);
    show('over');
  }
  function matchEnded(msg) {
    toast(msg);
    toMenu();
  }

  // ---------------------------------------------------------------- who is playing (this device)
  const MAX = CG.CONFIG.MAX_PLAYERS;
  const LABEL = {
    kbA: 'Keyboard · W A S D · F shoot · G jump · H ability',
    kbB: 'Keyboard · Arrows · K shoot · L jump · O ability',
    touch: 'This touch screen',
    bot: 'Computer teammate',
    pad: (i) => 'Gamepad ' + (i + 1) + ' · A jump · X shoot · Y ability',
  };
  let joined = [], padPrev = {}, botN = 0;

  function join(id, type, index) {
    if (joined.length >= MAX || joined.some((d) => d.id === id)) return;
    joined.push({ id, type, index });
    renderLobby();
  }
  function leave(id) { joined = joined.filter((d) => d.id !== id); renderLobby(); }
  function renderLobby() {
    let html = '';
    for (let i = 0; i < MAX; i++) {
      const d = joined[i];
      html += d
        ? `<div class="slot" style="--c:${CG.PLAYER_COLORS[i]}"><b>P${i + 1}</b><span class="grow">${d.type === 'bot' ? '🤖 ' : ''}${esc(d.type === 'pad' ? LABEL.pad(d.index) : LABEL[d.type])}</span><button class="btn small" data-act="leave" data-uid="${esc(d.id)}">✕</button></div>`
        : `<div class="slot empty"><b>P${i + 1}</b><span class="grow">Press FIRE to join</span></div>`;
    }
    $('lobby-slots').innerHTML = html;
    const humans = joined.filter((d) => d.type !== 'bot').length;
    $('lobby-start').disabled = humans === 0;
    $('lobby-start').textContent = humans ? 'CHOOSE AGENTS ▸' : 'WAITING FOR PLAYERS';
    $('lobby-touch').classList.toggle('hidden', !CG.Touch.enabled || joined.some((d) => d.id === 'touch'));
    $('lobby-bot').disabled = joined.length >= MAX;
  }
  function openLobby() {
    joined = []; padPrev = {}; botN = 0;
    if (CG.Touch.enabled) joined.push({ id: 'touch', type: 'touch' });       // on a phone you are in straight away
    $('lobby-hint').classList.toggle('hidden', CG.Touch.enabled);
    renderLobby();
    show('lobby');
  }
  // Phones: go full screen and lock the screen sideways. Browsers only allow this straight after a tap,
  // and iPhones do not allow it at all (there the player just turns the phone).
  function landscape() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
      Promise.resolve(req.call(el)).then(() => {
        if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape');
      }).catch(() => {});
    } catch (e) { /* not supported here */ }
  }
  function toSelect() {
    if (!joined.some((d) => d.type !== 'bot')) return;
    const devices = joined.map((d) => ({ id: d.id, type: d.type, index: d.index }));
    // a lone keyboard player gets both key layouts and the mouse
    const kb = devices.filter((d) => d.type === 'kbA' || d.type === 'kbB');
    if (kb.length === 1) kb[0].type = 'kbAll';
    openSelect(devices);
  }
  const KEY_JOIN = {
    KeyF: 'kbA', KeyG: 'kbA', KeyW: 'kbA', KeyA: 'kbA', KeyS: 'kbA', KeyD: 'kbA',
    KeyK: 'kbB', KeyL: 'kbB', ArrowLeft: 'kbB', ArrowRight: 'kbB', ArrowUp: 'kbB', ArrowDown: 'kbB',
  };
  const KEY_ANY = ['KeyX', 'KeyZ', 'KeyJ', 'Space'];          // single-player keys: take the first free keyboard seat
  function lobbyKey(e) {
    if (e.code === 'Enter') { toSelect(); return; }
    if (e.code === 'Escape') { home(); return; }
    if (e.code === 'KeyB') { addBot(); return; }
    let seat = KEY_JOIN[e.code];
    if (!seat && KEY_ANY.includes(e.code)) seat = joined.some((d) => d.id === 'kbA') ? 'kbB' : 'kbA';
    if (seat) { join(seat, seat); e.preventDefault(); }
  }
  function addBot() { if (joined.length < MAX) { botN++; join('bot' + botN, 'bot'); } }

  // ---------------------------------------------------------------- choose agents (each agent once)
  let picks = [];
  function openSelect(devices) {
    let human = 0;
    const firstFree = (from) => {
      for (let k = 0; k < CG.AGENTS.length; k++) {
        const i = (from + k) % CG.AGENTS.length;
        if (CG.Shop.hasAgent(CG.AGENTS[i].id)) return i;
      }
      return 0;
    };
    picks = devices.map((d, i) => ({
      device: { type: d.type, index: d.index }, bot: d.type === 'bot', locked: false, agent: null,
      cursor: d.type === 'bot' ? 0 : (human++ === 0 ? CG.AGENTS.findIndex((a) => a.id === myAgent()) : firstFree(human * 2)),
      name: d.type === 'bot' ? 'BOT ' + (i + 1) : i === 0 ? myName() : 'P' + (i + 1),
    }));
    renderSelect();
    show('select');
  }
  const taken = (id, except) => picks.some((p) => p !== except && p.locked && p.agent === id);
  const chooser = () => picks.find((p) => !p.bot && !p.locked);
  function renderSelect() {
    const focus = chooser() || picks[0], looking = CG.AGENTS[focus.cursor], ab = looking.ability;
    const own = CG.Shop.hasAgent(looking.id), isTaken = taken(looking.id, focus);
    let action;
    if (!chooser()) action = '<div class="sel-wait">ALL LOCKED IN — DEPLOYING…</div>';
    else if (!own) action = `<button class="btn primary big-btn" data-act="buy-agent" data-uid="${looking.id}" ${coins() < priceOf(looking.id) ? 'disabled' : ''}>🔒 UNLOCK FOR <span class="coin"></span> ${priceOf(looking.id)}</button>
      <div class="sel-note">${coins() < priceOf(looking.id) ? 'You have ' + coins() + ' coins — keep playing to earn more' : 'Buy once, play forever'}</div>`;
    else if (isTaken) action = `<button class="btn primary big-btn" disabled>TAKEN BY A TEAMMATE</button>`;
    else action = `<button class="btn primary big-btn" data-act="lock">LOCK IN ${looking.name}</button>
      <div class="sel-note">${esc(focus.name)} is choosing</div>`;
    $('sel-main').innerHTML = `
      <div class="sel-hero ${own ? '' : 'locked'}" style="--c:${looking.color}">
        ${portrait(looking.id) ? `<img src="${portrait(looking.id)}" alt="">` : ''}
        ${own ? '' : '<div class="lock-badge">🔒</div>'}
      </div>
      <div class="sel-info" style="--c:${looking.color}">
        <div class="sel-name">${looking.name}</div>
        <div class="sel-role">${looking.role}</div>
        <div class="stat-rows"><span>HEALTH</span>${bar(looking.hp / 8)}<b>${looking.hp}</b><span>SPEED</span>${bar((looking.speed - 0.8) / 0.4)}<b>${Math.round(looking.speed * 100)}%</b></div>
        <div class="sel-ab">${abIcon(looking.id) ? `<img src="${abIcon(looking.id)}" alt="">` : ''}<div><small>ABILITY</small><b>${ab.name}</b><p>${ab.desc}</p></div></div>
        ${action}
      </div>`;
    $('agent-cards').innerHTML = CG.AGENTS.map((a, i) => {
      const who = picks.filter((p) => !p.bot && (p.locked ? p.agent === a.id : p.cursor === i));
      const has = CG.Shop.hasAgent(a.id), gone = taken(a.id, focus);
      return `<button class="tile ${looking === a ? 'look' : ''} ${has ? '' : 'locked'} ${gone ? 'taken' : ''}" data-act="pick" data-uid="${a.id}" style="--c:${a.color}">
        ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}
        <b>${a.name}</b>
        ${has ? '' : `<span class="price"><span class="coin"></span>${priceOf(a.id)}</span>`}
        <span class="marks">${who.map((p) => `<i style="background:${CG.PLAYER_COLORS[picks.indexOf(p)]}" title="${esc(p.name)}">${p.locked ? '✔' : ''}</i>`).join('')}</span>
      </button>`;
    }).join('');
    $('select-slots').innerHTML = picks.map((p, i) => `<div class="pick ${p.locked ? 'done' : ''}" style="--c:${CG.PLAYER_COLORS[i]}">
      <b>${esc(p.name)}</b><span>${p.locked ? CG.AGENT[p.agent].name : p.bot ? 'bot' : '…'}</span></div>`).join('');
  }
  function moveCursor(p, d) {
    if (!p || p.locked) return;
    p.cursor = (p.cursor + d + CG.AGENTS.length) % CG.AGENTS.length;
    renderSelect();
  }
  function lockIn(p, id) {
    if (!p || p.locked) return;
    id = id || CG.AGENTS[p.cursor].id;
    if (!CG.Shop.hasAgent(id)) { toast(CG.AGENT[id].name + ' is locked — unlock it first'); return; }
    if (taken(id, p)) { toast(CG.AGENT[id].name + ' is already taken'); return; }
    p.agent = id; p.locked = true;
    p.cursor = CG.AGENTS.findIndex((a) => a.id === id);
    if (picks.indexOf(p) === 0) store.set(AGENT, id);
    CG.Sfx.play('pickup');
    renderSelect();
    if (picks.every((q) => q.bot || q.locked)) {
      picks.filter((q) => q.bot).forEach((q) => {                       // bots take what is left (any agent)
        const free = CG.AGENTS.filter((a) => !taken(a.id, q));
        q.agent = (free[Math.floor(Math.random() * free.length)] || CG.AGENTS[0]).id;
        q.locked = true;
      });
      renderSelect();
      setTimeout(() => {
        if (!visible('select')) return;
        play(picks.map((q) => ({ device: q.device, agent: q.agent, name: q.name, bot: q.bot })));
      }, 900);
    }
  }
  function unlock(p) { if (p && p.locked && !p.bot) { p.locked = false; renderSelect(); } }
  const pickFor = (types) => picks.find((p) => types.includes(p.device.type));
  function selectKey(e) {
    const c = e.code;
    if (c === 'Escape') { openLobby(); return; }
    const A = pickFor(['kbA']), B = pickFor(['kbB']), all = pickFor(['kbAll']);
    const left = { KeyA: A || all, ArrowLeft: B || all }, right = { KeyD: A || all, ArrowRight: B || all };
    if (left[c]) { moveCursor(left[c], -1); return; }
    if (right[c]) { moveCursor(right[c], 1); return; }
    const lock = { KeyF: A || all, KeyK: B || all, Enter: all || A || B, Space: all, KeyX: all, KeyJ: all, KeyZ: all };
    if (lock[c]) { lockIn(lock[c]); e.preventDefault(); return; }
    const back = { KeyG: A, KeyL: B, Backspace: all || A || B };
    if (back[c]) unlock(back[c]);
  }

  // gamepads: in the lobby A or X joins, B leaves, Y adds a bot, Start begins; in agent select left/right, A locks, B unlocks
  setInterval(() => {
    if (!navigator.getGamepads || !(visible('lobby') || visible('select'))) return;
    for (const gp of navigator.getGamepads()) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0;
      const now = gp.buttons.map((b) => b.pressed).concat([ax < -0.5, ax > 0.5]), was = padPrev[gp.index] || [];
      const hit = (i) => now[i] && !was[i];
      if (visible('lobby')) {
        if (hit(0) || hit(2)) join('pad' + gp.index, 'pad', gp.index);
        if (hit(1)) leave('pad' + gp.index);
        if (hit(3)) addBot();
        if (hit(9)) toSelect();
      } else {
        const p = picks.find((q) => q.device.type === 'pad' && q.device.index === gp.index);
        const L = gp.buttons.length;
        if (hit(14) || hit(L)) moveCursor(p, -1);
        if (hit(15) || hit(L + 1)) moveCursor(p, 1);
        if (hit(0)) lockIn(p);
        if (hit(1)) unlock(p);
      }
      padPrev[gp.index] = now;
    }
  }, 50);

  // ---------------------------------------------------------------- online squad
  async function openParty() {
    if (!N().online) { toast('Sign in to play online'); return; }
    show('party');
    try { await N().createParty(); } catch (e) { $('party-msg').textContent = e.message; }
    renderParty();
  }
  function renderParty() {
    const net = N(), p = net.party;
    if (!p) { $('party-members').innerHTML = '<i>Making a squad…</i>'; return; }
    const lead = net.isLeader, members = Object.keys(p.members || {}).sort((a, b) => (p.members[a].at || 0) - (p.members[b].at || 0));
    let html = members.map((uid, i) => {
      const m = p.members[uid], ag = CG.AGENT[m.agent] || CG.AGENTS[0];
      return `<div class="slot" style="--c:${CG.PLAYER_COLORS[i % 5]}">
        ${portrait(ag.id) ? `<img class="face" src="${portrait(ag.id)}" alt="">` : ''}
        <span class="grow">${uid === p.leader ? '👑 ' : ''}<b class="nm">${esc(m.name)}</b> · ${ag.name}${uid === net.uid ? ' (you)' : ''}</span></div>`;
    }).join('');
    (p.bots || []).forEach((agent, i) => {
      html += `<div class="slot" style="--c:#8a998a"><span class="grow">🤖 BOT · ${(CG.AGENT[agent] || CG.AGENTS[0]).name}</span>
        ${lead ? `<button class="btn small" data-act="party-unbot" data-uid="${i}">✕</button>` : ''}</div>`;
    });
    if (lead && net.partySize() < net.MAX) html += '<button class="btn small" data-act="party-bot">+ ADD BOT</button>';
    $('party-members').innerHTML = html;
    const mine = (p.members[net.uid] && p.members[net.uid].agent) || myAgent();
    $('party-agents').innerHTML = CG.AGENTS.map((a) => {
      const has = CG.Shop.hasAgent(a.id);
      return `<button class="mini ${a.id === mine ? 'on' : ''} ${has ? '' : 'locked'}" data-act="${has ? 'party-agent' : 'shop-agents'}" data-uid="${a.id}" style="--c:${a.color}" title="${has ? a.ability.name + ': ' + esc(a.ability.desc) : 'Locked — unlock it in the shop'}">
      ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}<span>${has ? a.name : '🔒 ' + a.name}</span></button>`;
    }).join('');
    const queued = p.state === 'queue';
    $('party-start').classList.toggle('hidden', !lead || queued);
    $('party-queue').classList.toggle('hidden', !lead);
    $('party-queue').textContent = queued ? 'CANCEL SEARCH' : 'FIND PLAYERS';
    $('party-status').textContent = queued ? 'Looking for other players… (starts on its own after 30 s)'
      : lead ? 'Invite friends, then start — or find other players to team up with' : 'Waiting for the leader to start';
    const fr = Object.keys(net.friends).filter((f) => !(p.members || {})[f])
      .sort((a, b) => (net.friends[b].online ? 1 : 0) - (net.friends[a].online ? 1 : 0));
    $('party-friends').innerHTML = fr.length ? fr.map((uid) => {
      const f = net.friends[uid];
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.username || f.name)}</span>
        <button class="btn small" data-act="party-invite" data-uid="${esc(uid)}" ${f.online ? '' : 'disabled'}>INVITE</button></div>`;
    }).join('') : '<i>Add friends first (FRIENDS on the home screen)</i>';
  }

  // ---------------------------------------------------------------- shop
  let shopTab = 'agents';
  function renderShop() {
    const c = coins();
    $('shop-coins').textContent = c;
    document.querySelectorAll('#shop .shop-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.uid === shopTab));
    if (shopTab === 'agents') {
      $('shop-items').className = 'shop-agents';
      $('shop-items').innerHTML = CG.AGENTS.map((a) => {
        const has = CG.Shop.hasAgent(a.id), free = CG.Shop.FREE_AGENTS.includes(a.id), price = priceOf(a.id), ab = a.ability;
        return `<div class="agent-card ${has ? 'owned' : ''}" style="--c:${a.color}">
          <div class="ac-art">${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}</div>
          <div class="ac-body">
            <div class="ac-name">${a.name}</div><div class="ac-role">${a.role}</div>
            <div class="stat-rows"><span>HEALTH</span>${bar(a.hp / 8)}<span>SPEED</span>${bar((a.speed - 0.8) / 0.4)}</div>
            <div class="ac-ab">${abIcon(a.id) ? `<img src="${abIcon(a.id)}" alt="">` : ''}<span><b>${ab.name}</b> — ${ab.desc}</span></div>
            ${has ? `<div class="owned-tag">${free ? '✔ FREE AGENT' : '✔ UNLOCKED'}</div>`
              : `<div class="row"><span class="price"><span class="coin"></span>${price}</span>
                 <button class="btn small primary" data-act="buy-agent" data-uid="${a.id}" ${c < price ? 'disabled' : ''}>UNLOCK</button></div>`}
          </div></div>`;
      }).join('');
      return;
    }
    $('shop-items').className = 'shop-grid';
    $('shop-items').innerHTML = CG.Shop.items().filter((it) => it.kind !== 'agent' && (shopTab === 'perks' ? it.kind !== 'cosmetic' : it.kind === 'cosmetic')).map((it) => {
      const own = CG.Shop.owned(it.id);
      return `<div class="shop-item ${own ? 'owned' : ''}" style="--c:${it.kind === 'cosmetic' ? '#c878ff' : '#ff9a3c'}">
        <div class="top"><div class="icon">${esc(it.icon || '★')}</div><div><b>${esc(it.name)}</b><div class="kind">${esc(it.kind || 'perk')}</div></div></div>
        <p>${esc(it.desc || '')}</p>
        ${own ? '<div class="owned-tag">✔ OWNED</div>' : `<div class="row"><span class="price"><span class="coin"></span>${it.price}</span>
          <button class="btn small primary" data-act="buy" data-uid="${esc(it.id)}" ${c < it.price ? 'disabled' : ''}>BUY</button></div>`}
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------- settings
  function renderSettings() {
    $('set-name').textContent = myName();
    $('sound-btn').textContent = CG.Sfx.on ? 'ON' : 'OFF';
    const o = CG.Touch.opts;
    document.querySelectorAll('[data-act="touch-style"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === o.style));
    document.querySelectorAll('[data-act="touch-size"]').forEach((b) => b.classList.toggle('on', +b.dataset.uid === +o.size));
    $('touch-auto').textContent = o.autofire ? 'ON' : 'OFF';
    $('touch-auto').classList.toggle('on', !!o.autofire);
    document.querySelectorAll('#settings .online-only').forEach((b) => b.classList.toggle('hidden', !N().online));
  }

  // ---------------------------------------------------------------- friends
  function say(id, msg) { $(id).textContent = msg || ''; }
  function refreshFriends() {
    const net = N(), off = !net.online;
    $('fr-setup').classList.toggle('hidden', !off);
    $('fr-body').classList.toggle('hidden', off);
    if (off) return;
    $('fr-code').textContent = net.profile.code;
    const reqs = Object.keys(net.requests);
    $('fr-requests').innerHTML = reqs.length ? reqs.map((uid) => `
      <div class="item"><span class="grow">${esc(net.requests[uid].name || 'Someone')}</span>
        <button class="btn small primary" data-act="fr-accept" data-uid="${esc(uid)}">ACCEPT</button>
        <button class="btn small" data-act="fr-decline" data-uid="${esc(uid)}">DECLINE</button></div>`).join('') : '<i>None</i>';
    const fr = Object.keys(net.friends).sort((a, b) => (net.friends[b].online ? 1 : 0) - (net.friends[a].online ? 1 : 0) || (net.friends[b].best || 0) - (net.friends[a].best || 0));
    $('fr-list').innerHTML = fr.length ? fr.map((uid) => {
      const f = net.friends[uid];
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.username || f.name)}</span>
        <span class="best">Best ${f.best || 0}</span>
        <button class="btn small" data-act="party-invite" data-uid="${esc(uid)}" ${f.online ? '' : 'disabled'}>INVITE</button>
        <button class="btn small" data-act="fr-remove" data-uid="${esc(uid)}">REMOVE</button></div>`;
    }).join('') : '<i>No friends yet — share your code or callsign</i>';
  }
  // run an online action and show what happened
  function run(fn, okMsg, where) {
    const out = (m) => (where ? say(where, m) : m && toast(m));
    // the database refusing a write almost always means the rules in FIREBASE.md have not been published yet
    const why = (e) => {
      const m = (e && (e.message || e.code)) || String(e);
      return /permission/i.test(m) ? 'The server refused this. The database rules need updating (see contra/FIREBASE.md, step 4).' : m;
    };
    try { Promise.resolve(fn()).then(() => out(okMsg)).catch((e) => out(why(e))); }
    catch (e) { out(why(e)); }
  }

  const ACTIONS = {
    google: () => run(() => N().signInGoogle(), '', 'login-msg'),
    offline: () => { offline = true; show('menu'); },
    signout: () => run(() => N().signOut().then(() => { offline = false; home(); }), 'Signed out'),
    'un-save': () => run(() => N().claimUsername($('un-input').value).then(() => { toast('Callsign saved'); home(); }), '', 'un-msg'),
    'un-change': () => { $('un-cancel').classList.remove('hidden'); show('username'); },
    'un-cancel': () => show('settings'),
    lobby: openLobby,
    party: openParty,
    shop: () => show('shop'),
    settings: () => show('settings'),
    buy: (id) => { const it = CG.Shop.items().find((x) => x.id === id); if (it) run(() => N().buy(it).then(() => { CG.Sfx.play('pickup'); renderShop(); }), it.name + ' bought!', 'shop-msg'); },
    sound: () => { CG.Sfx.toggle(); renderSettings(); },
    'touch-style': (v) => { CG.Touch.opts.style = v; CG.Touch.save(); renderSettings(); },
    'touch-size': (v) => { CG.Touch.opts.size = +v; CG.Touch.save(); renderSettings(); },
    'touch-auto': () => { CG.Touch.opts.autofire = !CG.Touch.opts.autofire; CG.Touch.save(); CG.Touch.syncButtons(); renderSettings(); },
    'show-prev': () => { showIdx = (showIdx + CG.AGENTS.length - 1) % CG.AGENTS.length; renderShowcase(); },
    'show-next': () => { showIdx = (showIdx + 1) % CG.AGENTS.length; renderShowcase(); },
    'show-fav': () => { const id = CG.AGENTS[showIdx].id; if (!CG.Shop.hasAgent(id)) return; store.set(AGENT, id); N().setAgent(id); renderShowcase(); },
    'shop-tab': (t) => { shopTab = t; renderShop(); },
    'shop-agents': () => { shopTab = 'agents'; show('shop'); },
    // unlock an agent from wherever its button is (home, agent select, shop)
    'buy-agent': (id) => {
      const it = CG.Shop.agentItem(id);
      if (!it) return;
      const where = visible('shop') ? 'shop-msg' : null;
      run(() => N().buy(it).then(() => {
        CG.Sfx.play('ability');
        toast(CG.AGENT[id].name + ' unlocked!');
        if (visible('select')) renderSelect();
        if (visible('shop')) renderShop();
        if (visible('menu')) renderShowcase();
      }), '', where);
    },
    lock: () => lockIn(chooser()),
    landscape,
    start: toSelect,
    leave: (id) => leave(id),
    'add-bot': addBot,
    'join-touch': () => join('touch', 'touch'),
    // tapping a tile looks at that agent; the big button locks it in (tap the same tile again to lock too)
    pick: (id) => {
      const p = picks.find((q) => !q.bot && !q.locked && (q.device.type === 'touch' || q.device.type === 'kbAll')) || chooser();
      if (!p) return;
      const i = CG.AGENTS.findIndex((a) => a.id === id);
      if (p.cursor === i && CG.Shop.hasAgent(id)) { lockIn(p, id); return; }
      p.cursor = i;
      renderSelect();
    },
    friends: () => show('friends'),
    how: () => show('how'),
    menu: () => (running() || paused() ? toMenu() : home()),
    resume, quit: toMenu,
    admin: () => { resume(); CG.Admin.open(); },
    'admin-close': () => CG.Admin.close(),
    retry: () => (lastPlayers ? play(lastPlayers) : toMenu()),
    'inv-accept': (pid) => run(() => N().acceptInvite(pid).then(() => show('party')), ''),
    'inv-decline': (pid) => run(() => N().declineInvite(pid), ''),
    'party-agent': (id) => { store.set(AGENT, id); N().setAgent(id); renderParty(); },
    'party-invite': (uid) => run(() => N().invite(uid), 'Invite sent', visible('party') ? 'party-msg' : 'fr-msg'),
    'party-start': () => run(() => N().startMatch(), '', 'party-msg'),
    'party-queue': () => run(() => (N().party && N().party.state === 'queue' ? CG.Queue.cancel() : CG.Queue.join()), '', 'party-msg'),
    'party-leave': () => run(() => N().leaveParty().then(() => home()), ''),
    'party-bot': () => {
      const p = N().party, bots = (p.bots || []).slice(), used = Object.values(p.members).map((m) => m.agent).concat(bots);
      const free = CG.AGENTS.filter((a) => !used.includes(a.id));
      bots.push((free[0] || CG.AGENTS[bots.length % CG.AGENTS.length]).id);
      run(() => N().setBots(bots), '', 'party-msg');
    },
    'party-unbot': (i) => { const bots = (N().party.bots || []).slice(); bots.splice(+i, 1); run(() => N().setBots(bots), '', 'party-msg'); },
    'fr-copy': () => run(() => navigator.clipboard.writeText(N().profile.code), 'Code copied', 'fr-msg'),
    'fr-send': () => run(() => N().sendRequest($('fr-add').value).then(() => { $('fr-add').value = ''; }), 'Request sent', 'fr-msg'),
    'fr-accept': (uid) => run(() => N().accept(uid), 'Friend added', 'fr-msg'),
    'fr-decline': (uid) => run(() => N().decline(uid), '', 'fr-msg'),
    'fr-remove': (uid) => run(() => N().unfriend(uid), 'Friend removed', 'fr-msg'),
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled && ACTIONS[b.dataset.act]) ACTIONS[b.dataset.act](b.dataset.uid);
  });
  document.addEventListener('mouseover', (e) => {          // hovering a card shows that agent's details
    const c = e.target.closest('#agent-cards .tile');
    if (!c) return;
    const p = picks.find((q) => !q.bot && !q.locked);
    if (p) { const i = CG.AGENTS.findIndex((a) => a.id === c.dataset.uid); if (i !== p.cursor) { p.cursor = i; renderSelect(); } }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') { if (e.code === 'Enter' && visible('username')) ACTIONS['un-save'](); return; }
    if (visible('lobby')) { lobbyKey(e); return; }
    if (visible('select')) { selectKey(e); return; }
    if (visible('menu') && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) { ACTIONS[e.code === 'ArrowLeft' ? 'show-prev' : 'show-next'](); return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (visible('pause')) resume(); else if (running()) pause();
    }
  });
  $('b-pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden && !(scene && scene.net)) pause(); });

  return {
    ready() {
      booted = true;
      home();
    },
    onGameStart(s) { scene = s; },
    localDevice() { return { type: 'any' }; },
    gameOver, matchEnded, refreshFriends, netChanged, loginMessage, localBest, localName, myAgent, myName, show, toast, play, playOnline,
  };
})();
