// Menus (plain HTML over the game canvas) and the flow between them:
//   sign in (Google, required) → choose a callsign (first time) → home
//   home = your squad standing together (Fortnite style): you in the middle, friends and bots either side.
//        PLAY: alone (+ bots) on this device, or the online match when friends are in the squad; FIND PLAYERS queues.
//        LOCKER: choose your agent once, it is used in every match · LOCAL CO-OP: 1-5 people on this device
//        SHOP · FRIENDS · SETTINGS · HOW TO PLAY
// Offline play is only offered when the online service is not set up or cannot be reached.
CG.UI = (() => {
  const $ = (id) => document.getElementById(id);
  const PANELS = ['login', 'username', 'menu', 'lobby', 'select', 'shop', 'settings', 'how', 'friends', 'pause', 'over'];
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
  const body = (id) => (CG.BODIES && CG.BODIES[id]) || portrait(id);
  const abIcon = (id) => (CG.ABICONS && CG.ABICONS[id]) || '';
  const N = () => CG.Net;

  function show(id) {
    current = id;
    PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id));
    if (id === 'menu') renderMenu();
    if (id === 'friends') refreshFriends();
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
    if (!net.online && !offline && ['menu', 'shop', 'friends', 'settings', 'username'].includes(current)) { home(); return; }
    if (current === 'menu' && net.needsUsername) { show('username'); return; }
    if (current === 'menu') renderMenu();
    else if (current === 'friends') refreshFriends();
    else if (current === 'shop') renderShop();
    else if (current === 'settings') renderSettings();
  }

  // ---------------------------------------------------------------- home: the squad on stage
  let mode = 'squad';                        // 'squad' (co-op against the army) or 'duel' (1v1)
  let localBots = [];                        // bots in your squad while you are not in an online party
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
    renderStage();
    if (!$('invite-pop').classList.contains('hidden')) renderInvites();
  }
  // everyone in the squad: online party members (in the order they came) and bots, or just you and your bots
  function squad() {
    const net = N(), p = net.party, list = [];
    if (p && p.members) {
      Object.keys(p.members).sort((a, b) => (+p.members[a].at || 0) - (+p.members[b].at || 0)).forEach((uid) => {
        const m = p.members[uid], me = uid === net.uid;
        list.push({ uid, me, name: me ? myName() : m.name, agent: me ? myAgent() : m.agent, leader: uid === p.leader });
      });
      (p.bots || []).forEach((agent, i) => list.push({ bot: true, agent, name: 'BOT ' + (i + 1), i }));
    } else {
      list.push({ me: true, name: myName(), agent: myAgent() });
      localBots.forEach((agent, i) => list.push({ bot: true, agent, name: 'BOT ' + (i + 1), i }));
    }
    return list;
  }
  const humansIn = () => { const p = N().party; return p && p.members ? Object.keys(p.members).length : 1; };
  const isLead = () => !N().party || N().isLeader;
  function renderStage() {
    const net = N(), p = net.party, list = squad(), lead = isLead(), max = MAX;
    // you stand in the middle, the others alternate right and left of you
    const mid = Math.floor(max / 2), cols = new Array(max).fill(null);
    const me = list.find((x) => x.me), rest = list.filter((x) => !x.me);
    [me].concat(rest).slice(0, max).forEach((x, i) => { cols[i === 0 ? mid : mid + (i % 2 ? 1 : -1) * Math.ceil(i / 2)] = x; });
    $('stage').innerHTML = cols.map((x, col) => {
      if (!x) {
        return `<div class="fig empty"><div class="slot-in">
          ${net.online && lead ? '<button class="plus" data-act="invite-open" title="Invite a friend">＋</button><small>INVITE</small>' : ''}
          ${lead ? '<button class="btn small" data-act="squad-bot">+ BOT</button>' : ''}
        </div><div class="pad"></div></div>`;
      }
      const a = CG.AGENT[x.agent] || CG.AGENTS[0];
      return `<div class="fig ${x.me ? 'me' : ''} ${x.bot ? 'bot' : ''}" style="--c:${a.color}">
        <div class="tag">${x.leader && humansIn() > 1 ? '👑 ' : ''}<b>${esc(x.name)}</b><small>${x.bot ? '🤖 ' : ''}${a.name}</small>
          ${x.bot && lead ? `<button class="x" data-act="squad-unbot" data-uid="${x.i}" title="Remove bot">✕</button>` : ''}</div>
        <div class="body ${col > mid ? 'flip' : ''}" ${x.me ? 'data-act="locker" title="Change agent"' : ''}>${body(a.id) ? `<img src="${body(a.id)}" alt="">` : ''}</div>
        <div class="pad"></div>
        ${x.me ? '<button class="btn small change" data-act="locker">CHANGE AGENT</button>' : ''}
      </div>`;
    }).join('');
    // the dock: mode, PLAY, FIND PLAYERS
    const humans = humansIn(), queued = !!(p && p.state === 'queue');
    document.querySelectorAll('[data-act="mode"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === mode));
    $('home-mode').classList.toggle('hidden', !lead);
    const play = $('play-main');
    play.disabled = !lead || queued || (mode === 'duel' && humans > 2);
    play.textContent = !lead ? 'LEADER STARTS' : queued ? 'SEARCHING…' : mode === 'duel' && humans > 2 ? 'DUEL IS 1v1' : humans > 1 ? 'START MATCH' : 'PLAY';
    const find = $('find-btn');
    find.classList.toggle('hidden', !net.online || !lead || (mode === 'duel' && humans > 1));
    find.textContent = queued ? 'CANCEL SEARCH' : mode === 'duel' ? 'FIND A DUEL' : 'FIND PLAYERS';
    $('leave-btn').classList.toggle('hidden', !(p && humans > 1));
    $('party-status').textContent = queued ? 'Looking for other players… (starts on its own after 30 s)'
      : humans > 1 ? (lead ? 'Squad of ' + humans + ' — start when ready' : 'Waiting for the leader to start')
        : mode === 'duel' ? 'Alone you fight a bot · find a duel to fight a real player' : 'Add bots, invite friends or find players';
  }
  // the bots you set up alone go with you into a new online party
  function takeLocalBots() { const b = localBots.length ? localBots.slice() : null; localBots = []; return b; }
  function freeAgent(used) {
    const free = CG.AGENTS.filter((a) => !used.includes(a.id));
    return (free.length ? free[Math.floor(Math.random() * free.length)] : CG.AGENTS[Math.floor(Math.random() * CG.AGENTS.length)]).id;
  }
  function addSquadBot() {
    const p = N().party, list = squad();
    if (list.length >= MAX) return;
    const agent = freeAgent(list.map((x) => x.agent));
    if (p) run(() => N().setBots((p.bots || []).concat([agent])), '', 'party-msg');
    else { localBots.push(agent); renderStage(); }
  }
  function removeSquadBot(i) {
    const p = N().party;
    if (p) { const bots = (p.bots || []).slice(); bots.splice(+i, 1); run(() => N().setBots(bots), '', 'party-msg'); }
    else { localBots.splice(+i, 1); renderStage(); }
  }
  function playMain() {
    const net = N(), p = net.party;
    if (!isLead()) return;
    if (humansIn() > 1) { run(() => net.startMatch(null, mode), '', 'party-msg'); return; }
    // alone: a game on this device with your bots (a duel: against a bot)
    const me = { device: { type: 'any' }, agent: myAgent(), name: myName() };
    const bots = (p ? p.bots || [] : localBots).slice();
    const bot = (agent, i) => ({ device: { type: 'bot' }, agent, name: 'BOT ' + (i + 1), bot: true });
    play(mode === 'duel' ? [me, bot(bots[0] || freeAgent([me.agent]), 0)] : [me].concat(bots.map(bot)));
  }
  async function findPlayers() {
    const net = N();
    if (net.party && net.party.state === 'queue') return CG.Queue.cancel();
    if (mode === 'duel') localBots = [];
    await net.createParty();
    if (mode === 'duel' && net.party && net.party.bots) { await net.setBots([]); net.party.bots = null; }
    return CG.Queue.join(mode);
  }
  function renderInvites() {
    const net = N(), p = net.party, inParty = (p && p.members) || {};
    const fr = Object.keys(net.friends).filter((f) => !inParty[f])
      .sort((a, b) => (net.friends[b].online ? 1 : 0) - (net.friends[a].online ? 1 : 0));
    $('party-friends').innerHTML = fr.length ? fr.map((uid) => {
      const f = net.friends[uid];
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.username || f.name)}</span>
        <button class="btn small" data-act="party-invite" data-uid="${esc(uid)}" ${f.online ? '' : 'disabled'}>INVITE</button></div>`;
    }).join('') : '<i>Add friends first (FRIENDS on the left)</i>';
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
    startScene({ players, mode });
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
    home();
  }
  function gameOver(score, stage, opts) {
    opts = opts || {};
    const best = localBest(), admin = !!opts.admin;
    if (!admin && score > best) store.set(BEST, String(score));
    if (!admin) N().submitScore(score);
    const coins = admin ? 0 : CG.Shop.coinsFor(score) + (opts.coins || 0);      // score coins + coins picked up
    if (coins && N().online) N().addCoins(coins).catch(() => {});
    // a duel with one person on this device: VICTORY / DEFEAT; two people on one device: who won
    const peopleHere = lastPlayers ? lastPlayers.filter((q) => !q.bot).length : 1;
    $('over-title').textContent = !opts.duel ? 'GAME OVER' : peopleHere === 1 ? (opts.won ? 'VICTORY' : 'DEFEAT') : opts.winner + ' WINS';
    $('over-score').parentElement.classList.toggle('hidden', !!opts.duel);
    $('over-score').textContent = score;
    $('over-coins').classList.toggle('hidden', !coins || !N().online);
    $('over-coins').querySelector('b').textContent = coins;
    $('over-best').textContent = admin ? 'Admin panel used: nothing saved' : opts.duel ? 'First to ' + CG.DUEL_KILLS + ' kills' : opts.online ? 'Online match' : score > best ? 'New best!' : 'Best ' + best;
    $('over-retry').textContent = opts.duel ? 'REMATCH' : 'TRY AGAIN';
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

  const humanAgents = (except) => joined.filter((d) => d !== except && d.type !== 'bot').map((d) => d.agent);
  function join(id, type, index) {
    if (joined.length >= MAX || joined.some((d) => d.id === id)) return;
    const d = { id, type, index };
    if (type === 'bot') d.agent = freeAgent(joined.map((q) => q.agent));
    else {
      // the first person keeps the locker agent; the others get the next agent nobody has
      const first = !joined.some((q) => q.type !== 'bot');
      d.agent = first ? myAgent() : (CG.AGENTS.find((a) => CG.Shop.hasAgent(a.id) && !humanAgents().includes(a.id)) || CG.AGENTS[0]).id;
    }
    joined.push(d);
    renderLobby();
  }
  // left / right: the next agent this person owns that no other person has (bots give way at the start)
  function cycle(d, dir) {
    if (!d || d.type === 'bot') return;
    const taken = humanAgents(d), n = CG.AGENTS.length;
    let i = CG.AGENTS.findIndex((a) => a.id === d.agent);
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      const a = CG.AGENTS[i];
      if (CG.Shop.hasAgent(a.id) && !taken.includes(a.id)) break;
    }
    d.agent = CG.AGENTS[i].id;
    if (joined.find((q) => q.type !== 'bot') === d) { store.set(AGENT, d.agent); N().setAgent(d.agent); }
    CG.Sfx.play('pickup');
    renderLobby();
  }
  function leave(id) { joined = joined.filter((d) => d.id !== id); renderLobby(); }
  function renderLobby() {
    let html = '';
    for (let i = 0; i < MAX; i++) {
      const d = joined[i];
      const a = d && CG.AGENT[d.agent];
      html += d
        ? `<div class="lfig" style="--c:${CG.PLAYER_COLORS[i]};--ac:${a.color}">
            <div class="lhead"><b>P${i + 1}</b><button class="btn small x" data-act="leave" data-uid="${esc(d.id)}" title="Leave">✕</button></div>
            <div class="body">${body(a.id) ? `<img src="${body(a.id)}" alt="">` : ''}</div>
            <div class="lname">${d.type === 'bot' ? '🤖 ' : ''}${a.name}</div>
            ${d.type === 'bot' ? '<div class="arrows"></div>' : `<div class="arrows"><button class="btn small" data-act="lob-prev" data-uid="${esc(d.id)}">◀</button><button class="btn small" data-act="lob-next" data-uid="${esc(d.id)}">▶</button></div>`}
            <small>${esc(d.type === 'pad' ? LABEL.pad(d.index) : LABEL[d.type])}</small></div>`
        : `<div class="lfig empty"><b>P${i + 1}</b><span>Press FIRE to join</span></div>`;
    }
    $('lobby-slots').innerHTML = html;
    const humans = joined.filter((d) => d.type !== 'bot').length;
    document.querySelectorAll('[data-act="mode"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === mode));
    $('lobby-sub').textContent = mode === 'duel' ? 'Two players fight each other: first to ' + CG.DUEL_KILLS + ' kills. Alone? You get a bot to fight.'
      : 'Everyone press their FIRE button to join · B adds a bot';
    const tooMany = mode === 'duel' && joined.length > 2;
    $('lobby-start').disabled = humans === 0 || tooMany;
    $('lobby-start').textContent = tooMany ? 'A DUEL IS TWO PLAYERS' : humans ? 'START ▸' : 'WAITING FOR PLAYERS';
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
  function startLocal() {
    if (!joined.some((d) => d.type !== 'bot')) return;
    if (mode === 'duel') {
      if (joined.length > 2) return;
      if (joined.length === 1) addBot();                                                 // alone: fight a bot
    }
    // bots never take an agent a person has
    joined.filter((d) => d.type === 'bot' && humanAgents().includes(d.agent)).forEach((d) => { d.agent = freeAgent(joined.map((q) => q.agent)); });
    // a lone keyboard player gets both key layouts and the mouse
    const kb = joined.filter((d) => d.type === 'kbA' || d.type === 'kbB');
    let human = 0;
    play(joined.map((d, i) => {
      const bot = d.type === 'bot';
      return { device: { type: kb.length === 1 && kb[0] === d ? 'kbAll' : d.type, index: d.index }, agent: d.agent, bot,
        name: bot ? 'BOT ' + (i + 1) : human++ === 0 ? myName() : 'P' + (i + 1) };
    }));
  }
  const KEY_JOIN = {
    KeyF: 'kbA', KeyG: 'kbA', KeyW: 'kbA', KeyA: 'kbA', KeyS: 'kbA', KeyD: 'kbA',
    KeyK: 'kbB', KeyL: 'kbB', ArrowLeft: 'kbB', ArrowRight: 'kbB', ArrowUp: 'kbB', ArrowDown: 'kbB',
  };
  const KEY_ANY = ['KeyX', 'KeyZ', 'KeyJ', 'Space'];          // single-player keys: take the first free keyboard seat
  const CYCLE = { KeyA: ['kbA', -1], KeyD: ['kbA', 1], ArrowLeft: ['kbB', -1], ArrowRight: ['kbB', 1] };
  function lobbyKey(e) {
    if (e.code === 'Enter') { startLocal(); return; }
    if (e.code === 'Escape') { home(); return; }
    if (e.code === 'KeyB') { addBot(); return; }
    const cy = CYCLE[e.code], who = cy && joined.find((d) => d.id === cy[0]);
    if (who) { cycle(who, cy[1]); e.preventDefault(); return; }
    let seat = KEY_JOIN[e.code];
    if (!seat && KEY_ANY.includes(e.code)) seat = joined.some((d) => d.id === 'kbA') ? 'kbB' : 'kbA';
    if (seat) { join(seat, seat); e.preventDefault(); }
  }
  function addBot() { if (joined.length < MAX) { botN++; join('bot' + botN, 'bot'); } }

  // ---------------------------------------------------------------- the locker: choose your agent once, used in every match
  let lookAt = 0;
  function openLocker() {
    lookAt = Math.max(0, CG.AGENTS.findIndex((a) => a.id === myAgent()));
    renderLocker();
    show('select');
  }
  function renderLocker() {
    const looking = CG.AGENTS[lookAt], ab = looking.ability, own = CG.Shop.hasAgent(looking.id), mine = looking.id === myAgent();
    let action;
    if (!own) action = `<button class="btn primary big-btn" data-act="buy-agent" data-uid="${looking.id}" ${coins() < priceOf(looking.id) ? 'disabled' : ''}>🔒 UNLOCK FOR <span class="coin"></span> ${priceOf(looking.id)}</button>
      <div class="sel-note">${coins() < priceOf(looking.id) ? 'You have ' + coins() + ' coins — keep playing to earn more' : 'Buy once, play forever'}</div>`;
    else if (mine) action = '<button class="btn primary big-btn" disabled>✔ EQUIPPED</button><div class="sel-note">You play as ' + looking.name + ' in every match</div>';
    else action = `<button class="btn primary big-btn" data-act="lock">EQUIP ${looking.name}</button><div class="sel-note">You keep it for every match</div>`;
    $('sel-main').innerHTML = `
      <div class="sel-hero ${own ? '' : 'locked'}" style="--c:${looking.color}">
        ${body(looking.id) ? `<img src="${body(looking.id)}" alt="">` : ''}
        ${own ? '' : '<div class="lock-badge">🔒</div>'}
      </div>
      <div class="sel-info" style="--c:${looking.color}">
        <div class="sel-name">${looking.name}</div>
        <div class="sel-role">${looking.role}</div>
        <div class="stat-rows"><span>HEALTH</span>${bar(looking.hp / 8)}<b>${looking.hp}</b><span>SPEED</span>${bar((looking.speed - 0.8) / 0.4)}<b>${Math.round(looking.speed * 100)}%</b></div>
        <div class="sel-ab">${abIcon(looking.id) ? `<img src="${abIcon(looking.id)}" alt="">` : ''}<div><small>ABILITY</small><b>${ab.name}</b><p>${ab.desc}</p></div></div>
        ${action}
      </div>`;
    $('agent-cards').innerHTML = CG.AGENTS.map((a) => {
      const has = CG.Shop.hasAgent(a.id);
      return `<button class="tile ${looking === a ? 'look' : ''} ${has ? '' : 'locked'}" data-act="pick" data-uid="${a.id}" style="--c:${a.color}">
        ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}
        <b>${a.name}</b>
        ${has ? '' : `<span class="price"><span class="coin"></span>${priceOf(a.id)}</span>`}
        <span class="marks">${a.id === myAgent() ? '<i style="background:var(--acc)">✔</i>' : ''}</span>
      </button>`;
    }).join('');
    $('select-slots').innerHTML = '';
  }
  function look(d) { lookAt = (lookAt + d + CG.AGENTS.length) % CG.AGENTS.length; renderLocker(); }
  function equip(id) {
    id = id || CG.AGENTS[lookAt].id;
    if (!CG.Shop.hasAgent(id)) { toast(CG.AGENT[id].name + ' is locked — unlock it first'); return; }
    store.set(AGENT, id);
    N().setAgent(id);
    CG.Sfx.play('pickup');
    toast(CG.AGENT[id].name + ' equipped');
    show('menu');
  }
  function selectKey(e) {
    const c = e.code;
    if (c === 'Escape' || c === 'Backspace') { home(); return; }
    if (c === 'ArrowLeft' || c === 'KeyA') { look(-1); return; }
    if (c === 'ArrowRight' || c === 'KeyD') { look(1); return; }
    if (['Enter', 'Space', 'KeyF', 'KeyX', 'KeyJ', 'KeyZ'].includes(c)) { equip(); e.preventDefault(); }
  }

  // gamepads: in the lobby A or X joins, B leaves, Y adds a bot, left/right change agent, Start begins;
  // in the locker left/right look, A equips, B goes back
  setInterval(() => {
    if (!navigator.getGamepads || !(visible('lobby') || visible('select'))) return;
    for (const gp of navigator.getGamepads()) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0;
      const now = gp.buttons.map((b) => b.pressed).concat([ax < -0.5, ax > 0.5]), was = padPrev[gp.index] || [];
      const hit = (i) => now[i] && !was[i];
      const L = gp.buttons.length;
      if (visible('lobby')) {
        const d = joined.find((q) => q.id === 'pad' + gp.index);
        if (hit(0) || hit(2)) join('pad' + gp.index, 'pad', gp.index);
        if (hit(1)) leave('pad' + gp.index);
        if (hit(3)) addBot();
        if (hit(14) || hit(L)) cycle(d, -1);
        if (hit(15) || hit(L + 1)) cycle(d, 1);
        if (hit(9)) startLocal();
      } else {
        if (hit(14) || hit(L)) look(-1);
        if (hit(15) || hit(L + 1)) look(1);
        if (hit(0)) equip();
        if (hit(1)) home();
      }
      padPrev[gp.index] = now;
    }
  }, 50);

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
    locker: openLocker,
    'play-main': playMain,
    find: () => run(findPlayers, '', 'party-msg'),
    'squad-bot': addSquadBot,
    'squad-unbot': removeSquadBot,
    'invite-open': () => { renderInvites(); $('invite-pop').classList.remove('hidden'); },
    'invite-close': () => $('invite-pop').classList.add('hidden'),
    'lob-prev': (id) => cycle(joined.find((d) => d.id === id), -1),
    'lob-next': (id) => cycle(joined.find((d) => d.id === id), 1),
    shop: () => show('shop'),
    settings: () => show('settings'),
    buy: (id) => { const it = CG.Shop.items().find((x) => x.id === id); if (it) run(() => N().buy(it).then(() => { CG.Sfx.play('pickup'); renderShop(); }), it.name + ' bought!', 'shop-msg'); },
    sound: () => { CG.Sfx.toggle(); renderSettings(); },
    'touch-style': (v) => { CG.Touch.opts.style = v; CG.Touch.save(); renderSettings(); },
    'touch-size': (v) => { CG.Touch.opts.size = +v; CG.Touch.save(); renderSettings(); },
    'touch-auto': () => { CG.Touch.opts.autofire = !CG.Touch.opts.autofire; CG.Touch.save(); CG.Touch.syncButtons(); renderSettings(); },
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
        if (visible('select')) renderLocker();
        if (visible('shop')) renderShop();
        if (visible('menu')) renderMenu();
      }), '', where);
    },
    lock: () => equip(),
    landscape,
    start: startLocal,
    leave: (id) => leave(id),
    'add-bot': addBot,
    'join-touch': () => join('touch', 'touch'),
    // tapping a tile looks at that agent; the big button equips it (tap the same tile again to equip too)
    pick: (id) => {
      const i = CG.AGENTS.findIndex((a) => a.id === id);
      if (lookAt === i && CG.Shop.hasAgent(id)) { equip(id); return; }
      lookAt = i;
      renderLocker();
    },
    friends: () => show('friends'),
    how: () => show('how'),
    menu: () => (running() || paused() ? toMenu() : home()),
    resume, quit: toMenu,
    admin: () => { resume(); CG.Admin.open(); },
    'admin-close': () => CG.Admin.close(),
    retry: () => (lastPlayers ? play(lastPlayers) : toMenu()),
    'inv-accept': (pid) => run(() => N().acceptInvite(pid).then(() => home()), ''),
    'inv-decline': (pid) => run(() => N().declineInvite(pid), ''),
    'party-invite': (uid) => run(() => N().invite(uid), 'Invite sent', visible('menu') ? 'party-msg' : 'fr-msg'),
    mode: (m) => { mode = m; if (visible('lobby')) renderLobby(); else renderStage(); },
    'party-leave': () => run(() => N().leaveParty().then(() => home()), ''),
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
    if (!c || CG.Touch.enabled) return;
    const i = CG.AGENTS.findIndex((a) => a.id === c.dataset.uid);
    if (i !== lookAt) { lookAt = i; renderLocker(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') { if (e.code === 'Enter' && visible('username')) ACTIONS['un-save'](); return; }
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
      home();
    },
    onGameStart(s) { scene = s; },
    localDevice() { return { type: 'any' }; },
    gameOver, matchEnded, refreshFriends, netChanged, loginMessage, localBest, localName, myAgent, myName, show, toast, play, playOnline, takeLocalBots,
  };
})();
