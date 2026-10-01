// Menus (plain HTML over the game canvas) and the flow between them:
//   login (Google) → menu → PLAY: who is playing (+ bots) → choose agents → game
//                         → PLAY ONLINE: party (invite friends, pick agent, start or find players) → game
CG.UI = (() => {
  const $ = (id) => document.getElementById(id);
  const PANELS = ['login', 'menu', 'lobby', 'select', 'party', 'how', 'friends', 'pause', 'over'];
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
  const myName = () => (CG.Net.profile ? CG.Net.profile.name : localName());
  const myAgent = () => (CG.AGENT[store.get(AGENT, '')] ? store.get(AGENT, '') : 'razor');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const visible = (id) => !$(id).classList.contains('hidden');
  const art = (key) => (CG.DATA.art && CG.DATA.art.images && CG.DATA.art.images[key]) || '';
  const portrait = (id, off) => art('portrait_' + id + (off ? '_off' : '')) || art('portrait_' + id);

  function show(id) {
    current = id;
    PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id));
    if (id === 'menu') renderMenu();
    if (id === 'friends') refreshFriends();
    if (id === 'party') renderParty();
    const first = id && id !== 'lobby' && id !== 'select' && $(id).querySelector('button:not(.hidden)');
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

  // ---------------------------------------------------------------- sign in / menu
  function home() {
    const N = CG.Net;
    if (!offline && N.state === 'signedout') show('login');
    else show('menu');
  }
  function renderMenu() {
    const N = CG.Net, prof = N.profile, on = N.online;
    $('menu-name').textContent = myName();
    $('menu-best').textContent = Math.max(localBest(), (prof && prof.best) || 0);
    $('menu-photo').classList.toggle('hidden', !(prof && prof.photo));
    if (prof && prof.photo) $('menu-photo').src = prof.photo;
    document.querySelectorAll('#menu .online-only').forEach((b) => b.classList.toggle('hidden', !on));
    $('signin-btn').classList.toggle('hidden', on || N.state !== 'signedout');
    const inv = Object.keys(N.invites || {});
    $('menu-invites').innerHTML = inv.map((pid) => `<div class="item invite"><span class="grow">🎖 <b>${esc(N.invites[pid].name)}</b> invited you to a party</span>
      <button data-act="inv-accept" data-uid="${esc(pid)}">JOIN</button><button data-act="inv-decline" data-uid="${esc(pid)}">NO</button></div>`).join('');
  }
  function loginMessage(m) { $('login-msg').textContent = m || ''; }

  let loginPrompted = false;
  function netChanged() {
    const N = CG.Net;
    if (!booted) return;
    // first time we learn nobody is signed in: ask once (after that, SIGN IN is on the menu)
    if (!loginPrompted && N.state === 'signedout' && !offline && current === 'menu') { loginPrompted = true; show('login'); return; }
    if (current === 'login' && N.online) show('menu');
    else if (current === 'menu') renderMenu();
    else if (current === 'friends') refreshFriends();
    else if (current === 'party') renderParty();
    if (current === 'login' && N.state === 'error') loginMessage('Could not reach the server: ' + N.error);
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
    if (scene && scene.net) { show('pause'); $('pause-admin').classList.toggle('hidden', !scene.net.host); return; }   // online: the match keeps going
    CG.game.scene.pause('Game');
    $('pause-admin').classList.remove('hidden');
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
    if (CG.Net.partyId) show('party'); else show('menu');
  }
  function gameOver(score, stage, noSave) {
    const best = localBest();
    if (!noSave && score > best) store.set(BEST, String(score));
    if (!noSave) CG.Net.submitScore(score);
    $('over-score').textContent = score;
    $('over-best').textContent = noSave ? (scene && scene.adminUsed ? 'Admin panel used: score not saved' : 'Online match') : score > best ? 'New best!' : 'Best ' + best;
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
        ? `<div class="slot" style="--c:${CG.PLAYER_COLORS[i]}"><b>P${i + 1}</b><span class="grow">${d.type === 'bot' ? '🤖 ' : ''}${esc(d.type === 'pad' ? LABEL.pad(d.index) : LABEL[d.type])}</span><button data-act="leave" data-uid="${esc(d.id)}">✕</button></div>`
        : `<div class="slot empty"><b>P${i + 1}</b><span class="grow">Press FIRE to join</span></div>`;
    }
    $('lobby-slots').innerHTML = html;
    const humans = joined.filter((d) => d.type !== 'bot').length;
    $('lobby-start').disabled = humans === 0;
    $('lobby-start').textContent = humans ? 'CHOOSE AGENTS  (' + joined.length + (joined.length === 1 ? ' player)' : ' players)') : 'WAITING FOR PLAYERS';
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
    let devices = joined.map((d) => ({ id: d.id, type: d.type, index: d.index }));
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
    if (e.code === 'Escape') { toMenu(); return; }
    if (e.code === 'KeyB') { addBot(); return; }
    let seat = KEY_JOIN[e.code];
    if (!seat && KEY_ANY.includes(e.code)) seat = joined.some((d) => d.id === 'kbA') ? 'kbB' : 'kbA';
    if (seat) { join(seat, seat); e.preventDefault(); }
  }
  function addBot() { if (joined.length < MAX) { botN++; join('bot' + botN, 'bot'); } }

  // ---------------------------------------------------------------- choose agents (Valorant style: each agent once)
  let picks = [];
  function openSelect(devices) {
    let human = 0;
    picks = devices.map((d, i) => ({
      device: { type: d.type, index: d.index }, bot: d.type === 'bot', locked: false, agent: null,
      cursor: d.type === 'bot' ? 0 : (human++ === 0 ? CG.AGENTS.findIndex((a) => a.id === myAgent()) : human % CG.AGENTS.length),
      name: d.type === 'bot' ? 'BOT ' + (i + 1) : i === 0 ? myName() : 'P' + (i + 1),
    }));
    renderSelect();
    show('select');
  }
  const taken = (id, except) => picks.some((p) => p !== except && p.locked && p.agent === id);
  function renderSelect() {
    const focus = picks.find((p) => !p.bot && !p.locked) || picks[0];
    const looking = CG.AGENTS[focus.cursor];
    $('agent-cards').innerHTML = CG.AGENTS.map((a, i) => {
      const who = picks.filter((p) => !p.bot && (p.locked ? p.agent === a.id : p.cursor === i));
      const isTaken = taken(a.id);
      return `<button class="card ${isTaken ? 'taken' : ''} ${looking === a ? 'look' : ''}" data-act="pick" data-uid="${a.id}" style="--c:${a.color}">
        ${portrait(a.id, isTaken) ? `<img src="${portrait(a.id, isTaken)}" alt="">` : ''}
        <b>${a.name}</b><small>${a.role}</small>
        <span class="marks">${who.map((p) => `<i style="background:${CG.PLAYER_COLORS[picks.indexOf(p)]}" title="${esc(p.name)}">${p.locked ? '✔' : ''}</i>`).join('')}</span>
      </button>`;
    }).join('');
    const ab = looking.ability;
    $('agent-info').innerHTML = `${art('ab_' + looking.id) ? `<img src="${art('ab_' + looking.id)}" alt="">` : ''}
      <div><b style="color:${looking.color}">${looking.name}</b> · ${looking.role} · ${'♥'.repeat(looking.hp)} · speed ${Math.round(looking.speed * 100)}%<br>
      <span class="ab">${ab.name}</span> — ${ab.desc}</div>`;
    $('select-slots').innerHTML = picks.map((p, i) => `<div class="pick" style="--c:${CG.PLAYER_COLORS[i]}">
      <b>${esc(p.name)}</b> ${p.locked ? CG.AGENT[p.agent].name + ' ✔' : p.bot ? 'picks last' : 'choosing…'}</div>`).join('');
  }
  function moveCursor(p, d) {
    if (!p || p.locked) return;
    p.cursor = (p.cursor + d + CG.AGENTS.length) % CG.AGENTS.length;
    renderSelect();
  }
  function lockIn(p, id) {
    if (!p || p.locked) return;
    id = id || CG.AGENTS[p.cursor].id;
    if (taken(id, p)) { toast(CG.AGENT[id].name + ' is already taken'); return; }
    p.agent = id; p.locked = true;
    p.cursor = CG.AGENTS.findIndex((a) => a.id === id);
    if (picks.indexOf(p) === 0) store.set(AGENT, id);
    CG.Sfx.play('pickup');
    renderSelect();
    if (picks.every((q) => q.bot || q.locked)) {
      // bots take what is left
      picks.filter((q) => q.bot).forEach((q) => {
        const free = CG.AGENTS.filter((a) => !taken(a.id, q));
        q.agent = (free[Math.floor(Math.random() * free.length)] || CG.AGENTS[0]).id;
        q.locked = true;
      });
      renderSelect();
      setTimeout(() => {
        if (!visible('select')) return;
        play(picks.map((q) => ({ device: q.device, agent: q.agent, name: q.name, bot: q.bot })));
      }, 700);
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

  // gamepads: in the lobby A or X joins, B leaves, Start begins; in agent select left/right, A locks, B unlocks
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

  // ---------------------------------------------------------------- online party
  async function openParty() {
    const N = CG.Net;
    if (!N.online) { toast('Sign in with Google to play online'); return; }
    show('party');
    try { await N.createParty(); } catch (e) { $('party-msg').textContent = e.message; }
    renderParty();
  }
  function renderParty() {
    const N = CG.Net, p = N.party;
    if (!p) { $('party-members').innerHTML = '<i>Making a party…</i>'; return; }
    const lead = N.isLeader, members = Object.keys(p.members || {}).sort((a, b) => (p.members[a].at || 0) - (p.members[b].at || 0));
    let html = members.map((uid, i) => {
      const m = p.members[uid], ag = CG.AGENT[m.agent] || CG.AGENTS[0];
      return `<div class="slot" style="--c:${CG.PLAYER_COLORS[i % 5]}">
        ${portrait(ag.id) ? `<img class="face" src="${portrait(ag.id)}" alt="">` : ''}
        <span class="grow">${uid === p.leader ? '👑 ' : ''}<b class="nm">${esc(m.name)}</b> · ${ag.name}${uid === N.uid ? ' (you)' : ''}</span></div>`;
    }).join('');
    (p.bots || []).forEach((agent, i) => {
      html += `<div class="slot" style="--c:#8a998a"><span class="grow">🤖 BOT · ${(CG.AGENT[agent] || CG.AGENTS[0]).name}</span>
        ${lead ? `<button data-act="party-unbot" data-uid="${i}">✕</button>` : ''}</div>`;
    });
    if (lead && N.partySize() < N.MAX) html += '<button data-act="party-bot">+ ADD BOT</button>';
    $('party-members').innerHTML = html;
    const mine = (p.members[N.uid] && p.members[N.uid].agent) || myAgent();
    $('party-agents').innerHTML = CG.AGENTS.map((a) => `<button class="mini ${a.id === mine ? 'on' : ''}" data-act="party-agent" data-uid="${a.id}" style="--c:${a.color}" title="${a.ability.name}: ${esc(a.ability.desc)}">
      ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}<span>${a.name}</span></button>`).join('');
    const queued = p.state === 'queue';
    $('party-start').classList.toggle('hidden', !lead || queued);
    $('party-queue').classList.toggle('hidden', !lead);
    $('party-queue').textContent = queued ? 'CANCEL SEARCH' : 'FIND PLAYERS';
    $('party-status').textContent = queued ? 'Looking for other players… (starts on its own after 30 s)'
      : lead ? 'Invite friends, then start — or find other players to team up with' : 'Waiting for the leader to start';
    const fr = Object.keys(N.friends).filter((f) => !(p.members || {})[f])
      .sort((a, b) => (N.friends[b].online ? 1 : 0) - (N.friends[a].online ? 1 : 0));
    $('party-friends').innerHTML = fr.length ? fr.map((uid) => {
      const f = N.friends[uid];
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.name)}</span>
        <button data-act="party-invite" data-uid="${esc(uid)}" ${f.online ? '' : 'disabled'}>INVITE</button></div>`;
    }).join('') : '<i>Add friends first (FRIENDS on the menu)</i>';
  }

  // ---------------------------------------------------------------- friends screen
  function say(id, msg) { $(id).textContent = msg || ''; }
  function refreshFriends() {
    const N = CG.Net, off = !N.online;
    $('fr-setup').classList.toggle('hidden', !off);
    $('fr-body').classList.toggle('hidden', off);
    if (off) {
      $('fr-setup').textContent = N.state === 'loading' ? 'Connecting…' : N.state === 'error' ? 'Could not connect: ' + N.error : 'Sign in with Google to add friends.';
      return;
    }
    if (document.activeElement !== $('fr-name')) $('fr-name').value = N.profile.name;
    $('fr-code').textContent = N.profile.code;
    const reqs = Object.keys(N.requests);
    $('fr-requests').innerHTML = reqs.length ? reqs.map((uid) => `
      <div class="item"><span class="grow">${esc(N.requests[uid].name || 'Someone')}</span>
        <button data-act="fr-accept" data-uid="${esc(uid)}">ACCEPT</button>
        <button data-act="fr-decline" data-uid="${esc(uid)}">DECLINE</button></div>`).join('') : '<i>None</i>';
    const fr = Object.keys(N.friends).sort((a, b) => (N.friends[b].online ? 1 : 0) - (N.friends[a].online ? 1 : 0) || (N.friends[b].best || 0) - (N.friends[a].best || 0));
    $('fr-list').innerHTML = fr.length ? fr.map((uid) => {
      const f = N.friends[uid];
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.name)}</span>
        <span class="best">Best ${f.best || 0}</span>
        <button data-act="party-invite" data-uid="${esc(uid)}" ${f.online ? '' : 'disabled'}>INVITE</button>
        <button data-act="fr-remove" data-uid="${esc(uid)}">REMOVE</button></div>`;
    }).join('') : '<i>No friends yet — share your code</i>';
  }
  // run an online action and show what happened
  function run(fn, okMsg, where) {
    const out = (m) => (where ? say(where, m) : m && toast(m));
    try { Promise.resolve(fn()).then(() => out(okMsg)).catch((e) => out(e.message || String(e))); }
    catch (e) { out(e.message || String(e)); }
  }

  const ACTIONS = {
    google: () => run(() => CG.Net.signInGoogle().then(() => { offline = false; }), '', 'login-msg'),
    signin: () => run(() => CG.Net.signInGoogle(), ''),
    offline: () => { offline = true; show('menu'); },
    signout: () => run(() => CG.Net.signOut().then(() => { offline = false; home(); }), 'Signed out'),
    lobby: openLobby,
    party: openParty,
    sound: () => { $('sound-btn').textContent = 'SOUND: ' + (CG.Sfx.toggle() ? 'ON' : 'OFF'); },
    landscape,
    start: toSelect,
    leave: (id) => leave(id),
    'add-bot': addBot,
    'join-touch': () => join('touch', 'touch'),
    pick: (id) => {
      const p = picks.find((q) => !q.bot && !q.locked && (q.device.type === 'touch' || q.device.type === 'kbAll'))
        || picks.find((q) => !q.bot && !q.locked);
      lockIn(p, id);
    },
    friends: () => show('friends'),
    how: () => show('how'),
    menu: () => (visible('party') || visible('select') || visible('lobby') ? show('menu') : toMenu()),
    resume, quit: toMenu,
    admin: () => { resume(); CG.Admin.open(); },
    'admin-close': () => CG.Admin.close(),
    retry: () => (lastPlayers ? play(lastPlayers) : toMenu()),
    'inv-accept': (pid) => run(() => CG.Net.acceptInvite(pid).then(() => show('party')), ''),
    'inv-decline': (pid) => run(() => CG.Net.declineInvite(pid), ''),
    'party-agent': (id) => { store.set(AGENT, id); CG.Net.setAgent(id); renderParty(); },
    'party-invite': (uid) => run(() => CG.Net.invite(uid), 'Invite sent', visible('party') ? 'party-msg' : 'fr-msg'),
    'party-start': () => run(() => CG.Net.startMatch(), '', 'party-msg'),
    'party-queue': () => run(() => (CG.Net.party && CG.Net.party.state === 'queue' ? CG.Queue.cancel() : CG.Queue.join()), '', 'party-msg'),
    'party-leave': () => run(() => CG.Net.leaveParty().then(() => show('menu')), ''),
    'party-bot': () => {
      const p = CG.Net.party, bots = (p.bots || []).slice(), used = Object.values(p.members).map((m) => m.agent).concat(bots);
      const free = CG.AGENTS.filter((a) => !used.includes(a.id));
      bots.push((free[0] || CG.AGENTS[bots.length % 5]).id);
      run(() => CG.Net.setBots(bots), '', 'party-msg');
    },
    'party-unbot': (i) => { const bots = (CG.Net.party.bots || []).slice(); bots.splice(+i, 1); run(() => CG.Net.setBots(bots), '', 'party-msg'); },
    'fr-save': () => run(() => CG.Net.setName($('fr-name').value).then((n) => store.set(NAME, n)), 'Name saved', 'fr-msg'),
    'fr-copy': () => run(() => navigator.clipboard.writeText(CG.Net.profile.code), 'Code copied', 'fr-msg'),
    'fr-send': () => run(() => CG.Net.sendRequest($('fr-add').value).then(() => { $('fr-add').value = ''; }), 'Request sent', 'fr-msg'),
    'fr-accept': (uid) => run(() => CG.Net.accept(uid), 'Friend added', 'fr-msg'),
    'fr-decline': (uid) => run(() => CG.Net.decline(uid), '', 'fr-msg'),
    'fr-remove': (uid) => run(() => CG.Net.unfriend(uid), 'Friend removed', 'fr-msg'),
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled && ACTIONS[b.dataset.act]) ACTIONS[b.dataset.act](b.dataset.uid);
  });
  document.addEventListener('mouseover', (e) => {          // hovering a card shows that agent's details
    const c = e.target.closest('#agent-cards .card');
    if (!c) return;
    const p = picks.find((q) => !q.bot && !q.locked);
    if (p) { const i = CG.AGENTS.findIndex((a) => a.id === c.dataset.uid); if (i !== p.cursor) { p.cursor = i; renderSelect(); } }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (visible('lobby')) { lobbyKey(e); return; }
    if (visible('select')) { selectKey(e); return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (visible('pause')) resume(); else if (running()) pause();
    }
  });
  $('b-pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden && !(scene && scene.net)) pause(); });

  return {
    ready() {
      booted = true;
      $('sound-btn').textContent = 'SOUND: ' + (CG.Sfx.on ? 'ON' : 'OFF');
      // still checking who is signed in: the menu shows now, the sign-in screen follows if nobody is
      show('menu');
      netChanged();
    },
    onGameStart(s) { scene = s; },
    localDevice() { return { type: 'any' }; },
    gameOver, matchEnded, refreshFriends, netChanged, loginMessage, localBest, localName, myAgent, show, toast, play, playOnline,
  };
})();
