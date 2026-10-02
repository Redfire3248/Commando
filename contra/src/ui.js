// Menus (plain HTML over the game canvas) and the flow between them:
//   sign in (Google, required) → choose a callsign (first time) → home
//   home = your squad standing together (Fortnite style): you in the middle, friends and bots either side.
//        PLAY: alone (+ bots) on this device, or the online match when friends are in the squad; FIND PLAYERS queues.
//        LOCKER: choose your agent once, it is used in every match · LOCAL CO-OP: 1-5 people on this device
//        SHOP · FRIENDS · SETTINGS · HOW TO PLAY
// Offline play is only offered when the online service is not set up or cannot be reached.
CG.UI = (() => {
  const $ = (id) => document.getElementById(id);
  const PANELS = ['login', 'username', 'starter', 'menu', 'lobby', 'select', 'versus', 'shop', 'settings', 'friends', 'leaderboard', 'pause', 'over'];
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
    return CG.AGENT[id] && CG.Shop.hasAgent(id) ? id : (CG.AGENTS.find((a) => CG.Shop.hasAgent(a.id)) || CG.AGENT.jax).id;
  };
  const priceOf = (id) => { const it = CG.Shop.agentItem(id); return it ? it.price : 0; };
  const coins = () => CG.Profile.coins();                  // the account's, or this device's for a guest
  // a bar out of 5 for the agent screens (health 4-8, speed 90-116%)
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const visible = (id) => !$(id).classList.contains('hidden');
  const portrait = (id) => (CG.PORTRAITS && CG.PORTRAITS[id]) || '';
  const body = (id) => (CG.BODIES && CG.BODIES[id]) || portrait(id);
  // the whole agent for the menus: their idle loop (idle.png) when it is in, else the standing frame
  const figure = (id) => {
    const I = CG.DATA.art && CG.DATA.art.idle && CG.DATA.art.idle[id];
    // sized by the body (bh): taller emote frames (a grenade in the air) rise above it instead of shrinking the agent
    if (I) return `<div class="idle" data-n="${I.n}" data-loop="${I.loop || I.n}" style="aspect-ratio:${I.fw} / ${I.fh};--ik:${((I.fh / (I.bh || I.fh))).toFixed(3)}"><img src="${I.path}" alt="" style="width:${I.n * 100}%"></div>`;
    return body(id) ? `<img src="${body(id)}" alt="">` : '';
  };
  // Plays every idle figure on screen: the breathing frames over and over, and every 7-13 s (different for each
  // figure) the special move once through, then back to breathing.
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('.idle').forEach((el) => {
      const n = +el.dataset.n, loop = +el.dataset.loop, img = el.firstElementChild;
      if (!img || !n) return;
      let f = +(el.dataset.f || 0), next = +(el.dataset.next || 0);
      if (!next) { next = now + 4000 + Math.random() * 7000; el.dataset.next = next; }
      if (f >= loop) f = f + 1 < n ? f + 1 : 0;                                         // in the special move
      else if (now > next && n > loop) { f = loop; el.dataset.next = now + 7000 + Math.random() * 6000; }
      else {                                                                           // breathing: a calm pace
        const k = +(el.dataset.k || 0) + 1;
        el.dataset.k = k;
        if (k % 2) return;
        f = (f + 1) % loop;
      }
      el.dataset.f = f;
      img.style.transform = 'translateX(' + (-100 * f / n) + '%)';
    });
  }, 170);
  // ui_icons.png everywhere a fixed icon shows: every coin, the pause button, best score, the mode card
  (() => {
    const U = CG.DATA.art && CG.DATA.art.ui;
    if (!U) return;
    document.documentElement.classList.add('ui-icons');
    if (U.coin) document.documentElement.style.setProperty('--coin-img', 'url("' + new URL(U.coin, document.baseURI).href + '")');
    if (U.pause) { const b = $('b-pause'); b.textContent = ''; b.style.setProperty('--ico', 'url("' + new URL(U.pause, document.baseURI).href + '")'); b.classList.add('ico-btn'); }
    if (U.trophy) $('menu-best').parentElement.insertAdjacentHTML('afterbegin', `<img class="ico" src="${U.trophy}" alt="">`);
  })();
  // an icon from ui_icons.png, or the fallback text
  const ico = (name, alt) => {
    const U = CG.DATA.art && CG.DATA.art.ui;
    return U && U[name] ? `<img class="ico" src="${U[name]}" alt="">` : (alt || '');
  };
  const abIcon = (id) => (CG.ABICONS && CG.ABICONS[id]) || '';
  const N = () => CG.Net;

  let enterT = null, shownAt = 0;
  function show(id) {
    shownAt = Date.now();
    const fresh = id && id !== current;
    current = id;
    $('profile').classList.add('hidden');                     // a new screen closes the profile card and member menu
    $('member-pop').classList.add('hidden'); if (fresh) $('invite-pop').classList.add('hidden');
    PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id));
    // a screen that just opened plays its entrance (figures rise in one after another, panels slide in)
    if (fresh) {
      const el = $(id);
      el.style.setProperty('--el', '0s');
      el.classList.remove('enter');
      void el.offsetWidth;
      el.classList.add('enter');
      clearTimeout(enterT);
      enterT = setTimeout(() => el.classList.remove('enter'), 1400);
    }
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
    if (offline) { if (!CG.Shop.hasStarter()) { openStarter(); return; } show('menu'); return; }   // a guest: this device only
    if (net.state === 'off') { offline = true; home(); return; }          // online service not set up
    if (!net.online) { show('login'); renderLogin(); return; }
    if (net.needsUsername) { show('username'); return; }
    if (!CG.Shop.hasStarter()) { openStarter(); return; }                      // a new account: one free agent
    show('menu');
  }
  function renderLogin() {
    const s = N().state;
    $('google-btn').disabled = s === 'loading';
    $('email-form').classList.toggle('hidden', s === 'off');
    $('offline-btn').classList.remove('hidden');
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
  // the mode (CG.Modes): story, duels 1v1-3v3 or custom; remembered on this device
  const MODE = 'commando.mode', CUSTOM = 'commando.custom';
  const loadJson = (k, d) => { try { return Object.assign({}, d, JSON.parse(store.get(k, '') || '{}')); } catch (e) { return Object.assign({}, d); } };
  let mode = loadJson(MODE, { kind: 'story' });
  let custom = loadJson(CUSTOM, CG.Modes.CUSTOM);
  const pvp = () => CG.Modes.isPvp(mode);
  let localBots = [];                        // bots in your squad while you are not in an online party (jax / duke)
  let botPick = -1;                          // the empty place showing the JAX / DUKE choice (99 = the roster panel)
  // the home screen's layout (Settings): a = LINEUP (squad on stage), b = CARDS, c = COMMAND (agent, roster)
  const LOBBY = 'commando.lobby', STORY = 'commando.story';
  let lobbyStyle = store.get(LOBBY, 'a');
  const storyCleared = () => parseInt(store.get(STORY, '0'), 10) || 0;
  function renderMenu() {
    const net = N(), prof = net.profile, on = net.online;
    $('menu-name').textContent = myName();
    $('menu-rank').innerHTML = CG.Ranks.icon(CG.Profile.rr(), 20);
    $('menu-coins').textContent = coins();
    $('menu-best').textContent = Math.max(localBest(), (prof && prof.best) || 0);
    $('menu-photo').classList.toggle('hidden', !(prof && prof.photo));
    if (prof && prof.photo) $('menu-photo').src = prof.photo;
    document.querySelectorAll('.online-only').forEach((b) => b.classList.toggle('hidden', !on));
    const inv = Object.keys(net.invites || {});
    $('menu-invites').innerHTML = inv.map((pid) => `<div class="invite"><span>🎖 <b>${esc(net.invites[pid].name)}</b> invited you to their squad</span>
      <button class="btn small primary" data-act="inv-accept" data-uid="${esc(pid)}">JOIN</button><button class="btn small" data-act="inv-decline" data-uid="${esc(pid)}">✕</button></div>`).join('');
    renderStage();
    if (!$('invite-pop').classList.contains('hidden')) renderInvites();
    // tab icons (ui_icons.png) once it is in
    const U = CG.DATA.art && CG.DATA.art.ui;
    if (U) document.querySelectorAll('.topnav button').forEach((b) => {
      const name = { locker: 'locker', shop: 'shop', friends: 'friends', menu: 'story', leaderboard: 'ranks' }[b.dataset.act];
      if (name && U[name] && !b.querySelector('.ico')) b.insertAdjacentHTML('afterbegin', ico(name));
    });
  }
  // everyone in the squad: online party members (in the order they came) and bots, or just you and your bots
  function squad() {
    const net = N(), p = net.party, list = [];
    if (p && p.members) {
      Object.keys(p.members).sort((a, b) => (+p.members[a].at || 0) - (+p.members[b].at || 0)).forEach((uid) => {
        const m = p.members[uid], me = uid === net.uid;
        list.push({ uid, me, name: me ? myName() : m.name, agent: me ? myAgent() : m.agent, leader: uid === p.leader, key: me ? 'me' : 'm:' + uid,
          rr: me ? CG.Profile.rr() : m.rr || 0, banner: me ? CG.Profile.banner() : m.banner, title: me ? CG.Profile.title() : m.title });
      });
      (p.bots || []).forEach((agent, i) => list.push({ bot: true, agent, name: 'BOT ' + (i + 1), i, key: 'bot:' + i, rr: CG.Ranks.botRR(i + 1, CG.Profile.rr()) }));
    } else {
      list.push({ me: true, name: myName(), agent: myAgent(), key: 'me', rr: CG.Profile.rr(), banner: CG.Profile.banner(), title: CG.Profile.title() });
      localBots.forEach((agent, i) => list.push({ bot: true, agent, name: 'BOT ' + (i + 1), i, key: 'bot:' + i, rr: CG.Ranks.botRR(i + 1, CG.Profile.rr()) }));
    }
    return list;
  }
  const humansIn = () => { const p = N().party; return p && p.members ? Object.keys(p.members).length : 1; };
  const isLead = () => !N().party || N().isLeader;
  let lastStage = '', lastExtra = '';
  function renderStage() {
    const net = N(), p = net.party, list = squad(), lead = isLead(), max = MAX;
    // you stand in the middle, the others alternate right and left of you
    const mid = Math.floor(max / 2), cols = new Array(max).fill(null);
    const me = list.find((x) => x.me), rest = list.filter((x) => !x.me);
    [me].concat(rest).slice(0, max).forEach((x, i) => { cols[i === 0 ? mid : mid + (i % 2 ? 1 : -1) * Math.ceil(i / 2)] = x; });
    // an empty place: INVITE / + BOT, or the JAX / DUKE choice after + BOT
    const emptyInner = (col) => (botPick === col
      ? `<small>BOT AGENT</small><div class="bot-pick">${CG.Modes.BOT_AGENTS.map((id) => `<button data-act="squad-bot-as" data-uid="${id}" style="--c:${CG.AGENT[id].color}">
          ${portrait(id) ? `<img src="${portrait(id)}" alt="">` : ''}<span>${CG.AGENT[id].name}</span></button>`).join('')}</div>
          <button class="btn small ghost" data-act="squad-bot-cancel">CANCEL</button>`
      : `${lead ? `<button class="plus" data-act="invite-open">${ico('invite', '＋')}</button><small>INVITE</small>` : ''}
          ${lead ? `<button class="btn small" data-act="squad-bot" data-uid="${col}">+ BOT</button>` : ''}`);
    const clickFig = (x) => (x.me ? 'data-act="locker"' : `data-act="member" data-uid="${x.key}"`);
    const removeBot = () => '';
    const crown = (x) => (x.leader && humansIn() > 1 ? ico('crown', '👑 ') : '');
    ['a', 'b', 'c'].forEach((k) => $('menu').classList.toggle('lobby-' + k, lobbyStyle === k));
    let changed = false;
    const setStage = (html) => { if (html !== lastStage) { changed = !!lastStage; lastStage = html; $('stage').innerHTML = html; } };
    if (lobbyStyle === 'b') {
      // CARDS: everyone in a tall card
      setStage(`<div class="cards">${cols.map((x, col) => {
          if (!x) return `<div class="cslot empty ${botPick === col ? 'picking' : ''}">${emptyInner(col)}</div>`;
          const a = CG.AGENT[x.agent] || CG.AGENTS[0];
          return `<div class="cslot ${x.me ? 'me' : ''}" style="--c:${a.color}">
            ${x.leader && humansIn() > 1 ? `<span class="crown">${ico('crown', '👑')}</span>` : ''}${removeBot(x)}
            <div class="cs-art" ${clickFig(x)}>${figure(a.id)}</div>
            <b data-act="member" data-uid="${x.key}">${CG.Ranks.icon(x.rr || 0, 20)}${esc(x.name)}</b>
            ${x.me ? `<button class="btn small" data-act="locker">${ico('locker')}LOCKER</button>` : ''}
          </div>`;
        }).join('')}</div>`);
    } else {
      // LINEUP and COMMAND: everyone standing together (COMMAND adds the roster panel in the dock)
      setStage(cols.map((x, col) => {
        if (!x) return `<div class="fig empty ${botPick === col ? 'picking' : ''}"><div class="slot-in">${emptyInner(col)}</div><div class="pad"></div></div>`;
        const a = CG.AGENT[x.agent] || CG.AGENTS[0];
        return `<div class="fig ${x.me ? 'me' : ''} ${x.bot ? 'bot' : ''}" style="--c:${a.color}">
          <div class="tag" data-act="member" data-uid="${x.key}">${crown(x)}${CG.Ranks.icon(x.rr || 0, x.me ? 26 : 20)}<b>${esc(x.name)}</b></div>
          <div class="body ${col > mid ? 'flip' : ''}" ${clickFig(x)}>${figure(a.id)}</div>
          ${x.me ? '<div class="pad ring" data-act="locker"><svg viewBox="0 0 100 30" preserveAspectRatio="none"><ellipse cx="50" cy="15" rx="48" ry="13"/></svg></div>' : '<div class="pad"></div>'}
        </div>`;
      }).join(''));
    }
    // COMMAND's roster panel (in the dock): who is in the squad, invite / + bot, friends online
    let extra = '';
    if (lobbyStyle === 'c') {
      const fr = Object.keys(net.friends || {}).filter((f) => net.friends[f].online && !((p && p.members) || {})[f]).slice(0, 4);
      extra = `<div class="roster"><div class="kick">SQUAD · ${list.length} / ${max}</div>
        ${list.map((x) => { const a = CG.AGENT[x.agent] || CG.AGENTS[0];
          return `<button class="row-m" data-act="member" data-uid="${x.key}">${x.bot ? ico('bot', '') : crown(x) || '<span class="ico"></span>'}${CG.Ranks.icon(x.rr, 18)}<span class="grow">${esc(x.name)}</span>
            <span style="color:${a.color}">${a.name}</span></button>`; }).join('')}
        ${botPick === 99 ? `<div class="slot-in">${emptyInner(99)}</div>` : list.length < max && lead ? `<div class="row-btns">
          <button class="btn small" data-act="invite-open">${ico('invite')}INVITE</button>
          <button class="btn small" data-act="squad-bot" data-uid="99">+ BOT</button></div>` : ''}
        ${fr.length ? `<div class="kick">FRIENDS ONLINE</div>${fr.map((uid) => `<div class="row-m"><span class="grow">${esc(net.friends[uid].username || net.friends[uid].name)}</span>
          <button class="btn small" data-act="party-invite" data-uid="${esc(uid)}">INVITE</button></div>`).join('')}` : ''}</div>`;
    }
    if (lastExtra !== extra) { lastExtra = extra; $('dock-extra').innerHTML = extra; }
    // a re-render during the entrance carries on from where it was (it used to start over each time)
    if (changed) $('menu').style.setProperty('--el', ((Date.now() - shownAt) / 1000).toFixed(3) + 's');
    // the dock: mode, PLAY, FIND PLAYERS
    const humans = humansIn(), queued = !!(p && p.state === 'queue'), tooMany = humans > CG.Modes.capacity(mode);
    $('mode-name').innerHTML = ico(CG.Modes.icon(mode)) + CG.Modes.label(mode);
    $('mode-sub').textContent = CG.Modes.sub(mode);
    $('mode-card').disabled = !lead;
    const play = $('play-main');
    play.disabled = !lead || queued || tooMany;
    play.textContent = !lead ? 'LEADER STARTS' : queued ? 'SEARCHING…' : tooMany ? 'TOO MANY PLAYERS' : humans > 1 ? 'START MATCH' : 'PLAY';
    $('leave-btn').classList.toggle('hidden', !(p && humans > 1));
    $('party-status').textContent = queued ? 'Looking for other players… (starts on its own after 30 s)'
      : humans > 1 ? (lead ? 'Squad of ' + humans + ' — start when ready' : 'Waiting for the leader to start')
        : pvp() ? 'Bots fill the empty places in both teams' : '';
  }
  // ---------------------------------------------------------------- messages: announcements, new version
  const notices = (() => {
    const SEEN = 'commando.seen';
    let queue = [], showing = null;
    function next() {
      if (showing || !queue.length) return;
      showing = queue.shift();
      $('notice-kind').textContent = showing.kind;
      $('notice-text').textContent = showing.text;
      $('notice-ok').textContent = showing.reload ? 'RELOAD NOW' : 'OK';
      $('notice').classList.remove('hidden');
    }
    return {
      // an announcement from the admin (CG.Net calls this); each one shows once per device
      announce(a) {
        if (!a || !a.text || String(a.at) === store.get(SEEN, '')) return;
        queue.push({ kind: 'MESSAGE FROM HQ', text: a.text, at: a.at });
        next();
      },
      update() { if (!queue.some((q) => q.reload) && !(showing && showing.reload)) { queue.unshift({ kind: 'UPDATE', text: 'A new version of COMMANDO is ready.', reload: true }); next(); } },
      ok() {
        const s = showing;
        showing = null;
        $('notice').classList.add('hidden');
        if (s && s.at) store.set(SEEN, String(s.at));
        if (s && s.reload) { location.reload(); return; }
        next();
      },
    };
  })();
  // a new version on the server: the game's own files changed since this page loaded (checked every 2 minutes)
  (() => {
    const files = ['../index.html', 'src/ui.js', 'src/scenes.js', 'src/entities.js', 'style.css'];
    const stamp = () => Promise.all(files.map((f) => fetch(f, { method: 'HEAD', cache: 'no-store' })
      .then((r) => r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length') || '').catch(() => null)))
      .then((v) => (v.includes(null) ? null : v.join('|')));
    let first = null;
    const check = () => stamp().then((v) => {
      if (!v) return;
      if (first === null) first = v;
      else if (v !== first) notices.update();
    });
    if (location.protocol.startsWith('http')) { check(); setInterval(check, 120000); document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); }); }
  })();

  // ---------------------------------------------------------------- a squad member's options, profile cards
  let clickAt = { x: 0, y: 0 };
  function memberOf(key) { return squad().find((x) => x.key === key); }
  function openMember(key) {
    const x = memberOf(key), net = N(), lead = isLead();
    if (!x) return;
    const isFriend = x.uid && net.friends && net.friends[x.uid];
    const opts = [`<button data-act="profile-open" data-uid="${x.key}">VIEW PROFILE</button>`];
    if (x.me) opts.push('<button data-act="locker">CHANGE AGENT</button>', '<button data-act="locker-look">CHANGE BANNER / TITLE</button>');
    if (x.bot && lead) opts.push(`<button class="danger" data-act="squad-unbot" data-uid="${x.i}">REMOVE BOT</button>`);
    if (x.uid && !x.me && net.online && !isFriend) opts.push(`<button data-act="add-friend" data-uid="${esc(x.uid)}">ADD FRIEND</button>`);
    if (x.uid && !x.me && lead) opts.push(`<button class="danger" data-act="kick" data-uid="${esc(x.uid)}">KICK FROM SQUAD</button>`);
    const pop = $('member-pop');
    pop.innerHTML = `<div class="mp-head" style="--bn:${CG.Cosmetics.bannerCss(x.banner || 'steel')}"><b>${esc(x.name)}</b>${CG.Cosmetics.titleHtml(x.title)}${CG.Ranks.chip(x.rr)}</div>${opts.join('')}`;
    pop.classList.remove('hidden');
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, clickAt.x - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(innerHeight - h - 8, clickAt.y + 12)) + 'px';
  }
  const closeMember = () => $('member-pop').classList.add('hidden');
  async function openProfile(key) {
    closeMember();
    const x = memberOf(key) || (key === 'me' ? { me: true, key: 'me', name: myName(), agent: myAgent() } : null);
    if (!x) return;
    let prof;
    if (x.me) prof = CG.Profile.get();
    else if (x.bot) prof = { rr: x.rr, banner: ['steel', 'jungle', 'carbon', 'arctic'][x.i % 4], title: 'recruit', stats: null };
    else { prof = { rr: x.rr, banner: x.banner, title: x.title }; try { prof = Object.assign(prof, await N().getProfile(x.uid)); } catch (e) { /* card without stats */ } }
    const a = CG.AGENT[x.agent] || CG.AGENTS[0], r = CG.Ranks.of(prof.rr || 0), st = prof.stats;
    const stat = (k, v) => `<div class="pf-stat"><b>${v}</b><small>${k}</small></div>`;
    $('profile-card').innerHTML = `
      <div class="pf-banner" style="--bn:${CG.Cosmetics.bannerCss(prof.banner || 'steel')}">
        <div class="pf-fig">${figure(a.id)}</div>
        <div class="pf-id"><div class="pf-name">${esc(x.name)}${x.bot ? ' <small>BOT</small>' : ''}</div>
          <div class="pf-title" style="color:${CG.Cosmetics.titleColor(prof.title)}">${esc(CG.Cosmetics.titleName(prof.title))}</div>
          <div class="pf-rank">${CG.Ranks.icon(r.rr, 46)}<div><b style="color:${r.tier.color}">${r.name}</b>
            <div class="pf-bar"><i style="width:${r.div ? r.inDiv : 100}%;background:${r.tier.color}"></i></div><small>${r.div ? r.inDiv + ' / 100 RR' : (r.rr - CG.Ranks.LEGEND_AT) + ' RR'}</small></div></div></div>
      </div>
      ${st ? `<div class="pf-stats">${stat('MATCHES', st.matches || 0)}${stat('WINS', st.wins || 0)}${stat('KILLS', st.kills || 0)}${stat('FLANKS', st.heads || 0)}${stat('STAGES', st.stages || 0)}${stat('BEST WAVE', st.wave || 0)}</div>`
        : `<p class="pf-note">${x.bot ? 'A computer player. Its rank sets how well it plays.' : 'No matches yet.'}</p>`}
      <div class="pf-btns">${x.me ? `<button class="btn" data-act="locker-look">CHANGE BANNER / TITLE</button><button class="btn" data-act="settings">SETTINGS</button>` : ''}
        <button class="btn primary" data-act="profile-close">CLOSE</button></div>`;
    $('profile').classList.remove('hidden');
  }
  document.addEventListener('pointerdown', (e) => {
    clickAt = { x: e.clientX, y: e.clientY };
    if (!e.target.closest('#member-pop') && !e.target.closest('[data-act="member"]')) closeMember();
  }, true);

  // ---------------------------------------------------------------- a new account's one free agent
  function openStarter() {
    $('starter-cards').innerHTML = CG.Shop.STARTERS.map((id) => {
      const a = CG.AGENT[id], ab = a.ability;
      return `<div class="starter-card" style="--c:${a.color}">
        <div class="st-fig">${figure(id)}</div>
        <div class="st-name">${a.name}</div><div class="st-role">${a.role.toUpperCase()}</div>
        <div class="passive"><small>PASSIVE</small><b>${a.passive.name}</b><span>${a.passive.desc}</span></div>
        <div class="st-ab">${abIcon(id) ? `<img src="${abIcon(id)}" alt="">` : ''}<div><b>${ab.name}</b><p>${ab.desc}</p></div></div>
        <button class="btn primary big-btn" data-act="starter-pick" data-uid="${id}">CHOOSE ${a.name}</button>
      </div>`;
    }).join('');
    show('starter');
  }
  async function renderLeaderboard() {
    const myR = CG.Ranks.of(CG.Profile.rr());
    $('lb-me').innerHTML = `<div class="lb-row me">${CG.Ranks.icon(myR.rr, 30)}<b>${esc(myName())}</b>${CG.Cosmetics.titleHtml(CG.Profile.title())}<span class="grow"></span><b style="color:${myR.tier.color}">${myR.name}</b><small>${myR.rr} RR</small></div>`;
    if (!N().online) { $('lb-list').innerHTML = '<p class="sub center">Sign in with Google to join the leaderboard. As a guest your rank stays on this device.</p>'; return; }
    $('lb-list').innerHTML = '<p class="sub center">Loading…</p>';
    let rows;
    try { rows = await N().leaderboard(); } catch (e) { $('lb-list').innerHTML = '<p class="sub center">Could not load the leaderboard (the database rules may need publishing).</p>'; return; }
    $('lb-list').innerHTML = rows.slice(0, 100).map((r, i) => {
      const rk = CG.Ranks.of(r.rr || 0);
      return `<div class="lb-row ${r.uid === N().uid ? 'me' : ''}" style="--bn:${CG.Cosmetics.bannerCss(r.banner || 'steel')}"><span class="pos">${i + 1}</span>${CG.Ranks.icon(rk.rr, 26)}
        <b>${esc(r.name || '?')}</b>${CG.Cosmetics.titleHtml(r.title)}<span class="grow"></span><b style="color:${rk.tier.color}">${rk.name}</b><small>${rk.rr} RR</small>
        ${N().isAdmin ? `<button class="btn small lb-x" data-act="lb-remove" data-uid="${esc(r.uid)}" data-name="${esc(r.name || '?')}">REMOVE</button>` : ''}</div>`;
    }).join('') || '<p class="sub center">Nobody ranked yet — play a duel!</p>';
  }

  // ---------------------------------------------------------------- the mode picker
  function renderModes() {
    const A = CG.DATA.arenas, M = CG.Modes, c = custom;
    const seg = (field, vals, show) => vals.map((v) => `<button class="${c[field] === v ? 'on' : ''}" data-act="cust" data-uid="${field}:${v}">${show ? show(v) : v}</button>`).join('');
    const sel = (k) => (k === M.key(mode) ? 'selected' : '');
    $('modes').innerHTML = `
      <div class="mode-tile story ${sel('squad')}" style="--bg:url(assets/atlas/bg15_1.png)">
        <div class="mt-art"></div>
        <div class="mt-body"><b>${ico('story')}STORY</b><p>The campaign: eight stages against the army, from the jungle to the alien lair. 1–5 players, bots help.</p>
          <button class="btn primary" data-act="mode-pick" data-uid="squad">${sel('squad') ? '✔ SELECTED' : 'SELECT'}</button></div>
      </div>
      <div class="mode-tile duels ${/^duel/.test(M.key(mode)) ? 'selected' : ''}" style="--bg:url(assets/atlas/bg15_5.png)">
        <div class="mt-art"></div>
        <div class="mt-body"><b>${ico('duels')}DUELS</b><p>Team against team in an arena. Wipe out the other team to take the round — then everyone is back at full health. First to ${CG.DUEL_KILLS}.</p>
          <div class="mt-sizes">${M.SIZES.map((n) => `<button class="btn ${sel('duel' + n) ? 'primary' : ''}" data-act="mode-pick" data-uid="duel${n}">${n}v${n}</button>`).join('')}</div></div>
      </div>
      <div class="mode-tile ffa ${/^ffa/.test(M.key(mode)) ? 'selected' : ''}" style="--bg:url(assets/atlas/bg15_12.png)">
        <div class="mt-art"></div>
        <div class="mt-body"><b>${ico('ffa', ico('duels'))}FREE-FOR-ALL</b><p>Everyone against everyone. Back in after a death. First to ${CG.Modes.FFA_KILLS} kills. Get behind them: shots in the back do double.</p>
          <div class="mt-sizes two">${[4, 6].map((n) => `<button class="btn ${sel('ffa' + n) ? 'primary' : ''}" data-act="mode-pick" data-uid="ffa${n}">${n} PLAYERS</button>`).join('')}</div></div>
      </div>
      <div class="mode-tile horde ${sel('horde')}" style="--bg:url(assets/atlas/bg15_11.png)">
        <div class="mt-art"></div>
        <div class="mt-body"><b>${ico('horde', ico('story'))}HORDE</b><p>Hold the arena together. Waves come from both sides, a giant every fifth wave. How far can your squad get?</p>
          <button class="btn primary" data-act="mode-pick" data-uid="horde">${sel('horde') ? '✔ SELECTED' : 'SELECT'}</button></div>
      </div>
      <div class="mode-tile custom ${sel('custom')}" style="--bg:url(assets/atlas/bg15_9.png)">
        <div class="mt-art"></div>
        <div class="mt-body"><b>${ico('custom')}CUSTOM</b>
          <div class="cust">
            <span>MAP</span><div class="seg">${A.map((a, i) => `<button class="${c.arena === i ? 'on' : ''}" data-act="cust" data-uid="arena:${i}">${a.name.replace('ARENA · ', '')}</button>`).join('')}</div>
            <span style="color:${M.TEAMS[0].color}">${M.TEAMS[0].name}</span><div class="seg">${seg('a', M.SIZES)}</div>
            <span style="color:${M.TEAMS[1].color}">${M.TEAMS[1].name}</span><div class="seg">${seg('b', M.SIZES)}</div>
            <span>FIRST TO</span><div class="seg">${seg('rounds', M.ROUNDS)}</div>
            <span>POWER-UPS</span><div class="seg">${seg('drops', [true, false], (v) => (v ? 'ON' : 'OFF'))}</div>
            <span>MY SQUAD</span><div class="seg">${seg('together', [true, false], (v) => (v ? 'SAME TEAM' : 'SPLIT UP'))}</div>
          </div>
          <button class="btn primary" data-act="mode-pick" data-uid="custom">${sel('custom') ? '✔ UPDATE' : 'SELECT'}</button></div>
      </div>
      <button class="btn mode-local" data-act="mode-local">${ico('coop', ico('friends'))}LOCAL CO-OP · 1–5 players on this device</button>`;
  }
  function pickMode(k) {
    mode = k === 'custom' ? Object.assign({}, custom) : CG.Modes.fromKey(k);
    store.set(MODE, JSON.stringify(mode));
    $('mode-pop').classList.add('hidden');
    CG.Sfx.play('pickup');
    if (visible('lobby')) renderLobby(); else renderStage();
  }
  function setCustom(v) {
    const [f, x] = v.split(':');
    custom[f] = x === 'true' ? true : x === 'false' ? false : +x;
    store.set(CUSTOM, JSON.stringify(custom));
    renderModes();
  }
  // the bots you set up alone go with you into a new online party
  function takeLocalBots() { const b = localBots.length ? localBots.slice() : null; localBots = []; return b; }
  // bots only play the two basic commandos: you choose which one when you add it
  function addSquadBot(agent) {
    const p = N().party, list = squad();
    botPick = -1;
    if (list.length >= MAX || !CG.Modes.BOT_AGENTS.includes(agent)) { renderStage(); return; }
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
    // alone: a game on this device with your bots (duels: bots fill both teams)
    const me = { device: { type: 'any' }, agent: myAgent(), name: myName(), rr: CG.Profile.rr(), title: CG.Profile.title() };
    const bots = (p ? p.bots || [] : localBots).slice();
    const bot = (agent, i) => ({ device: { type: 'bot' }, agent, name: 'BOT ' + (i + 1), bot: true, rr: CG.Ranks.botRR(i + 1, CG.Profile.rr()) });
    if (pvp()) openVersus(CG.Modes.teams(mode, [me], (n) => bot(bots[n] || CG.Modes.botAgent(CG.Ranks.botRR(n + 1, CG.Profile.rr())), n)), home);
    else play([me].concat(bots.map(bot)));
  }
  // ---------------------------------------------------------------- the VS screen (duels on this device)
  let vs = null;
  function openVersus(players, back) {
    vs = { players, settings: CG.Modes.settings(mode), back };
    renderVersus();
    show('versus');
    CG.Sfx.play('start');
  }
  function renderVersus() {
    const A = CG.DATA.arenas[vs.settings.arena] || CG.DATA.arenas[0];
    $('vs-top').innerHTML = ico(mode.kind === 'custom' ? 'custom' : 'duels') + CG.Modes.label(mode) + ' · ' + A.name.replace('ARENA · ', '') + ' · FIRST TO ' + vs.settings.rounds;
    const line = (t) => vs.players.filter((q) => q.team === t).map((q) => {
      const a = CG.AGENT[q.agent] || CG.AGENTS[0];
      return `<div class="vs-fig ${t ? 'flip' : ''}" style="--c:${a.color}"><div class="body">${figure(a.id)}</div><b>${esc(q.name)}</b>${CG.Cosmetics.titleHtml(q.title)}<small>${a.name} · ${q.bot ? 'BOT' : 'READY'}</small>${CG.Ranks.chip(q.rr || 0, { px: 18 })}</div>`;
    }).join('');
    $('vs-a').innerHTML = line(0);
    $('vs-b').innerHTML = line(1);
    const me = vs.players.find((q) => !q.bot);
    $('vs-switch').disabled = !(me && vs.players.some((q) => q.bot && q.team !== me.team));
  }
  // you change sides with a bot from the other team
  function vsSwitch() {
    const me = vs.players.find((q) => !q.bot), other = me && vs.players.find((q) => q.bot && q.team !== me.team);
    if (!other) return;
    [me.team, other.team] = [other.team, me.team];
    CG.Sfx.play('pickup');
    renderVersus();
  }
  async function findPlayers() {
    const net = N();
    if (net.party && net.party.state === 'queue') return CG.Queue.cancel();
    if (pvp()) localBots = [];
    await net.createParty();
    if (pvp() && net.party && net.party.bots) { await net.setBots([]); net.party.bots = null; }
    return CG.Queue.join(CG.Modes.key(mode));
  }
  const invited = {};                                   // friend uid -> when this device last invited them
  function renderInvites() {
    const net = N();
    if (!net.online) {
      $('party-friends').innerHTML = `<p class="sub">Playing with friends needs an account. Sign in with Google, add your friends in FRIENDS, then invite them here.</p>
        ${net.state === 'off' ? '' : '<button class="btn primary" data-act="guest-signin">SIGN IN WITH GOOGLE</button>'}`;
      return;
    }
    const p = net.party, inParty = (p && p.members) || {};
    const fr = Object.keys(net.friends).filter((f) => !inParty[f])
      .sort((a, b) => (net.friends[b].online ? 1 : 0) - (net.friends[a].online ? 1 : 0));
    $('party-friends').innerHTML = fr.length ? fr.map((uid) => {
      const f = net.friends[uid], sent = invited[uid] && Date.now() - invited[uid] < 60000;
      return `<div class="item"><span class="dot ${f.online ? 'on' : ''}"></span><span class="grow">${esc(f.username || f.name)}<small>${f.online ? 'ONLINE' : 'OFFLINE — sees it next time'}</small></span>
        <button class="btn small ${sent ? '' : 'primary'}" data-act="party-invite" data-uid="${esc(uid)}">${sent ? 'SENT ✔' : 'INVITE'}</button></div>`;
    }).join('') : `<p class="sub">No friends yet. Add them in the FRIENDS tab with their code or callsign.</p>
      <button class="btn" data-act="friends">OPEN FRIENDS</button>`;
  }

  const running = () => booted && CG.game.scene.isActive('Game');
  const paused = () => booted && CG.game.scene.isPaused('Game');

  // ---------------------------------------------------------------- playing
  function startScene(data) {
    document.body.classList.add('playing');        // menus over: the game canvas instead of the full-screen backdrop
    show(null);
    CG.Admin.close();
    CG.game.scene.stop('Backdrop');
    CG.game.scene.stop('Game');
    CG.game.scene.start('Game', data);
    const touch = data.players.some((p) => p.device.type === 'touch' || p.device.type === 'any');
    CG.Touch.show(touch);
    if (touch && CG.Touch.enabled && !document.fullscreenElement) landscape();
  }
  let lastCfg = null;
  function play(players, settings) {
    if (!booted) return;
    lastPlayers = players;
    lastCfg = pvp() ? { players, mode: 'pvp', pvp: settings || CG.Modes.settings(mode) }
      : mode.kind === 'horde' ? { players, mode: 'horde', arena: Math.floor(Math.random() * CG.DATA.arenas.length) } : { players, mode: 'squad' };
    startScene(lastCfg);
  }
  function playOnline(cfg) {
    if (!booted) return;
    lastPlayers = null;
    startScene(cfg);
  }
  function pause() {
    if (!running() || (scene && scene.over)) return;
    $('pause-admin').classList.toggle('hidden', !N().isAdmin || !!(scene && scene.isClient));
    const online = !!(scene && scene.net);
    $('pause-title').textContent = online ? 'MENU' : 'PAUSED';
    $('pause-note').classList.toggle('hidden', !online);
    if (online) { show('pause'); return; }                      // online: nobody can stop the match for everyone
    CG.game.scene.pause('Game');
    show('pause');
  }
  function resume() {
    show(null);
    if (paused()) CG.game.scene.resume('Game');
  }
  function toMenu() {
    document.body.classList.remove('playing');
    if (CG.Online.mid) CG.Online.leave();
    CG.Admin.close();
    CG.game.scene.stop('Game');
    if (!CG.game.scene.isActive('Backdrop')) CG.game.scene.start('Backdrop');
    CG.Touch.show(false);
    home();
  }
  function gameOver(score, stage, opts) {
    opts = opts || {};
    const best = localBest(), admin = false;          // admin games count like any other (the owner asked for it)
    if (!admin && score > best) store.set(BEST, String(score));
    if (!admin) N().submitScore(score);
    const coins = admin ? 0 : CG.Shop.coinsFor(score) + (opts.coins || 0);      // score coins + coins picked up
    if (coins && N().online) N().addCoins(coins).catch(() => {});
    else if (coins && !admin) CG.Profile.addCoinsLocal(coins);                  // guests: kept on this device
    // a duel with one person on this device: VICTORY / DEFEAT; two people on one device: who won
    const peopleHere = lastPlayers ? lastPlayers.filter((q) => !q.bot).length : 1;
    $('over-title').textContent = !opts.duel ? 'GAME OVER' : peopleHere === 1 ? (opts.won ? 'VICTORY' : 'DEFEAT') : opts.winner + ' WINS';
    $('over-score').parentElement.classList.toggle('hidden', !!opts.duel);
    $('over-score').textContent = score;
    $('over-coins').classList.toggle('hidden', !coins);
    $('over-coins').querySelector('b').textContent = coins;
    $('over-best').textContent = admin ? 'Admin panel used: nothing saved'
      : opts.kind === 'ffa' ? 'You placed #' + (opts.place || '?') + ' of ' + (opts.fighters || '?')
        : opts.kind === 'horde' ? 'You reached wave ' + (opts.wave || 0)
          : opts.duel ? 'Rounds won decide it' : opts.online ? 'Online match' : score > best ? 'New best!' : 'Best ' + best;
    $('over-retry').textContent = opts.duel ? 'REMATCH' : 'TRY AGAIN';
    // rank: duels and free-for-all by the result, story by stages cleared, horde by waves. Custom games, two or more
    // people on one device, and admin use do not count.
    const kind = opts.kind || (opts.duel ? 'duel' : 'story'), before = CG.Profile.rr();
    const ranked = !admin && kind !== 'custom' && (opts.humans || 1) <= 1;
    let delta = 0, won = false;
    if (kind === 'duel') { won = !!opts.won; delta = CG.Ranks.fightDelta(won, before, opts.foesRR); }
    else if (kind === 'ffa') {
      const n = opts.fighters || 4, place = opts.place || n;
      won = place === 1;
      delta = won ? CG.Ranks.fightDelta(true, before, opts.foesRR) : place <= n / 2 ? 6 : CG.Ranks.fightDelta(false, before, opts.foesRR);
    } else if (kind === 'story') delta = 4 * Math.max(0, stage - 1);
    else if (kind === 'horde') delta = 2 * Math.max(0, (opts.wave || 0) - 2);
    if (!ranked) delta = 0;
    if (!admin) CG.Profile.record({ rr: delta, won, kills: opts.kills || 0, heads: opts.heads || 0, stages: kind === 'story' ? stage - 1 : 0, wave: kind === 'horde' ? opts.wave || 0 : 0 }).catch(() => {});
    const after = Math.max(0, before + delta), rb = CG.Ranks.of(before), ra = CG.Ranks.of(after);
    $('over-rank').classList.toggle('hidden', admin);
    $('over-rank').innerHTML = ranked
      ? `${CG.Ranks.chip(after, { rr: true, px: 34 })}<b class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta} RR</b>
         ${ra.idx > rb.idx ? '<div class="promo">RANK UP!</div>' : ra.idx < rb.idx ? '<div class="demo">RANK DOWN</div>' : ''}
         ${kind === 'horde' ? `<small>Wave ${opts.wave || 0}</small>` : ''}${opts.heads ? `<small>${opts.heads} flanks</small>` : ''}`
      : `<small>Unranked ${kind === 'custom' ? '(custom game)' : '(more than one player on this device)'}</small>`;
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

  // what a person on this device may play: the account holder their own agents; friends playing along on the same
  // device also the two basic commandos
  const canUse = (id, owner) => CG.Shop.hasAgent(id) || (!owner && CG.Shop.STARTERS.includes(id));
  const humanAgents = (except) => joined.filter((d) => d !== except && d.type !== 'bot').map((d) => d.agent);
  function join(id, type, index) {
    if (joined.length >= MAX || joined.some((d) => d.id === id)) return;
    const d = { id, type, index };
    if (type === 'bot') d.agent = CG.Modes.botAgent();
    else {
      // the first person keeps the locker agent; the others get the next agent nobody has
      const first = !joined.some((q) => q.type !== 'bot');
      d.agent = first ? myAgent() : (CG.AGENTS.find((a) => canUse(a.id, false) && !humanAgents().includes(a.id)) || CG.AGENT[CG.Shop.STARTERS[humanAgents().length % 2]]).id;
    }
    joined.push(d);
    renderLobby();
  }
  // left / right: the next agent this person owns that no other person has (bots give way at the start)
  function cycle(d, dir) {
    if (!d) return;
    if (d.type === 'bot') return;                              // a bot keeps the agent it came with
    const taken = humanAgents(d), n = CG.AGENTS.length;
    let i = CG.AGENTS.findIndex((a) => a.id === d.agent);
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      const a = CG.AGENTS[i];
      if (canUse(a.id, joined.find((q) => q.type !== 'bot') === d) && !taken.includes(a.id)) break;
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
            <div class="body">${figure(a.id)}</div>
            <div class="lname">${d.type === 'bot' ? '🤖 ' : ''}${a.name}</div>
            ${d.type === 'bot' ? '<div class="arrows"></div>' : `<div class="arrows"><button class="btn small" data-act="lob-prev" data-uid="${esc(d.id)}">◀</button><button class="btn small" data-act="lob-next" data-uid="${esc(d.id)}">▶</button></div>`}
            <small>${esc(d.type === 'pad' ? LABEL.pad(d.index) : LABEL[d.type])}</small></div>`
        : `<div class="lfig empty"><b>P${i + 1}</b><span>Press FIRE to join</span></div>`;
    }
    $('lobby-slots').innerHTML = html;
    const humans = joined.filter((d) => d.type !== 'bot').length;
    $('lobby-mode-name').textContent = CG.Modes.label(mode);
    $('lobby-sub').textContent = pvp() ? 'People take turns between the two teams · bots fill the empty places'
      : 'Everyone press their FIRE button to join · B adds a bot (JAX or DUKE)';
    const tooMany = humans > CG.Modes.capacity(mode);
    $('lobby-start').disabled = humans === 0 || tooMany;
    $('lobby-start').textContent = tooMany ? 'TOO MANY FOR ' + CG.Modes.label(mode) : humans ? 'START ▸' : 'WAITING FOR PLAYERS';
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
    const humans = joined.filter((d) => d.type !== 'bot');
    if (!humans.length || humans.length > CG.Modes.capacity(mode)) return;
    // a lone keyboard player gets both key layouts and the mouse
    const kb = joined.filter((d) => d.type === 'kbA' || d.type === 'kbB');
    const person = (d, i) => ({ device: { type: kb.length === 1 && kb[0] === d ? 'kbAll' : d.type, index: d.index }, agent: d.agent, name: i === 0 ? myName() : 'P' + (i + 1) });
    const bots = joined.filter((d) => d.type === 'bot');
    const bot = (n) => ({ device: { type: 'bot' }, agent: (bots[n] && bots[n].agent) || CG.Modes.botAgent(CG.Ranks.botRR(n + 1, CG.Profile.rr())), name: 'BOT ' + (n + 1), bot: true, rr: CG.Ranks.botRR(n + 1, CG.Profile.rr()) });
    if (pvp()) openVersus(CG.Modes.teams(mode, humans.map(person), bot), () => show('lobby'));
    else play(humans.map(person).concat(bots.map((d, n) => bot(n))));
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
  let lookAt = 0, lockerTab = 'agents';
  function setLockerTab(t) {
    lockerTab = t;
    $('select').classList.toggle('looks', t !== 'agents');          // banners / titles: preview with the tiles right under it
    document.querySelectorAll('[data-act="locker-tab"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === t));
    renderLocker();
  }
  // banners and titles this account has, with the one in use first
  function renderLooks() {
    const kind = lockerTab, list = kind === 'banner' ? CG.Cosmetics.BANNERS : CG.Cosmetics.TITLES;
    const cur = kind === 'banner' ? CG.Profile.banner() : CG.Profile.title();
    const ids = Object.keys(list).filter((id) => CG.Cosmetics.has(kind, id));
    const a = CG.AGENT[myAgent()] || CG.AGENTS[0];
    $('sel-main').innerHTML = `<div class="look-preview">
      <div class="pf-banner" style="--bn:${CG.Cosmetics.bannerCss(CG.Profile.banner())}"><div class="pf-fig">${figure(a.id)}</div>
        <div class="pf-id"><div class="pf-name">${esc(myName())}</div><div class="pf-title" style="color:${CG.Cosmetics.titleColor(CG.Profile.title())}">${esc(CG.Cosmetics.titleName(CG.Profile.title()))}</div>
        <div class="pf-rank">${CG.Ranks.chip(CG.Profile.rr(), { rr: true, px: 30 })}</div></div></div>
      <p class="sel-note">Your banner and title show on your profile (VIEW PROFILE) and on the leaderboard. More in the SHOP — some are earned.</p></div>`;
    $('agent-cards').innerHTML = ids.map((id) => kind === 'banner'
      ? `<button class="tile look-tile ${id === cur ? 'look' : ''}" data-act="equip-look" data-uid="${id}"><span class="swatch" style="--bn:${CG.Cosmetics.bannerCss(id)}"></span><b>${list[id].name}</b><span class="marks">${id === cur ? '<i style="background:var(--acc)">✔</i>' : ''}</span></button>`
      : `<button class="tile look-tile title-tile ${id === cur ? 'look' : ''}" data-act="equip-look" data-uid="${id}"><b style="color:${list[id].color}">${list[id].name}</b><span class="marks">${id === cur ? '<i style="background:var(--acc)">✔</i>' : ''}</span></button>`).join('');
    $('select-slots').innerHTML = '';
  }
  function openLocker() {
    lookAt = Math.max(0, CG.AGENTS.findIndex((a) => a.id === myAgent()));
    setLockerTab('agents');
    show('select');
  }
  function renderLocker() {
    if (lockerTab !== 'agents') { renderLooks(); return; }
    const looking = CG.AGENTS[lookAt], ab = looking.ability, own = CG.Shop.hasAgent(looking.id), mine = looking.id === myAgent();
    let action;
    if (!own) action = `<button class="btn primary big-btn" data-act="buy-agent" data-uid="${looking.id}" ${coins() < priceOf(looking.id) ? 'disabled' : ''}>🔒 UNLOCK FOR <span class="coin"></span> ${priceOf(looking.id)}</button>
      <div class="sel-note">${coins() < priceOf(looking.id) ? 'You have ' + coins() + ' coins — keep playing to earn more' : 'Buy once, play forever'}</div>`;
    else if (mine) action = '<button class="btn primary big-btn" disabled>✔ EQUIPPED</button><div class="sel-note">You play as ' + looking.name + ' in every match</div>';
    else action = `<button class="btn primary big-btn" data-act="lock">EQUIP ${looking.name}</button><div class="sel-note">You keep it for every match</div>`;
    $('sel-main').innerHTML = `
      <div class="sel-hero ${own ? '' : 'locked'}" style="--c:${looking.color}">
        ${figure(looking.id)}
        ${own ? '' : '<div class="lock-badge">🔒</div>'}
      </div>
      <div class="sel-info" style="--c:${looking.color}">
        <div class="sel-name">${looking.name}</div>
        <div class="sel-role">${looking.role}</div>
        <div class="passive"><small>PASSIVE</small><b>${looking.passive.name}</b><span>${looking.passive.desc}</span></div>
        <div class="sel-ab">${abIcon(looking.id) ? `<img src="${abIcon(looking.id)}" alt="">` : ''}<div><small>ABILITY</small><b>${ab.name}</b><p>${ab.desc}</p></div></div>
        ${action}
      </div>`;
    // only the agents this account owns (the rest are in the SHOP)
    $('agent-cards').innerHTML = CG.AGENTS.filter((a) => CG.Shop.hasAgent(a.id)).map((a) => {
      const has = true;
      return `<button class="tile ${looking === a ? 'look' : ''} ${has ? '' : 'locked'}" data-act="pick" data-uid="${a.id}" style="--c:${a.color}">
        ${portrait(a.id) ? `<img src="${portrait(a.id)}" alt="">` : ''}
        <b>${a.name}</b>
        ${has ? '' : `<span class="price"><span class="coin"></span>${priceOf(a.id)}</span>`}
        <span class="marks">${a.id === myAgent() ? '<i style="background:var(--acc)">✔</i>' : ''}</span>
      </button>`;
    }).join('');
    $('select-slots').innerHTML = '';
  }
  // left / right through the agents you own
  function look(d) {
    const own = CG.AGENTS.map((a, i) => i).filter((i) => CG.Shop.hasAgent(CG.AGENTS[i].id));
    const k = own.indexOf(lookAt);
    lookAt = own[((k < 0 ? 0 : k) + d + own.length) % own.length];
    renderLocker();
  }
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
            <div class="passive"><small>PASSIVE</small><b>${a.passive.name}</b><span>${a.passive.desc}</span></div>
            <div class="ac-ab">${abIcon(a.id) ? `<img src="${abIcon(a.id)}" alt="">` : ''}<span><b>${ab.name}</b> — ${ab.desc}</span></div>
            ${has ? `<div class="owned-tag">${CG.Profile.get().starter === a.id ? '✔ YOUR STARTER' : '✔ UNLOCKED'}</div>`
              : `<div class="row"><span class="price"><span class="coin"></span>${price}</span>
                 <button class="btn small primary" data-act="buy-agent" data-uid="${a.id}" ${c < price ? 'disabled' : ''}>UNLOCK</button></div>`}
          </div></div>`;
      }).join('');
      return;
    }
    $('shop-items').className = 'shop-grid';
    const cosmetic = (k) => ['cosmetic', 'banner', 'title'].includes(k);
    $('shop-items').innerHTML = CG.Shop.items().filter((it) => it.kind !== 'agent' && (shopTab === 'perks' ? !cosmetic(it.kind) : cosmetic(it.kind))).map((it) => {
      const own = CG.Shop.owned(it.id);
      if (it.kind === 'banner' || it.kind === 'title') {
        return `<div class="shop-item look-item ${own ? 'owned' : ''}" style="--c:#c878ff">
          ${it.kind === 'banner' ? `<div class="swatch big" style="--bn:${CG.Cosmetics.bannerCss(it.look)}"></div>` : `<div class="title-preview">${esc(CG.Cosmetics.titleName(it.look))}</div>`}
          <div class="top"><div><b>${esc(it.name)}</b><div class="kind">${it.kind}</div></div></div>
          ${own ? '<div class="owned-tag">✔ OWNED · equip in the LOCKER</div>' : `<div class="row"><span class="price"><span class="coin"></span>${it.price}</span>
            <button class="btn small primary" data-act="buy" data-uid="${esc(it.id)}" ${c < it.price ? 'disabled' : ''}>BUY</button></div>`}</div>`;
      }
      return `<div class="shop-item ${own ? 'owned' : ''}" style="--c:${it.kind === 'cosmetic' ? '#c878ff' : '#ff9a3c'}">
        <div class="top"><div class="icon">${esc(it.icon || '★')}</div><div><b>${esc(it.name)}</b><div class="kind">${esc(it.kind || 'perk')}</div></div></div>
        <p>${esc(it.desc || '')}</p>
        ${own ? '<div class="owned-tag">✔ OWNED</div>' : `<div class="row"><span class="price"><span class="coin"></span>${it.price}</span>
          <button class="btn small primary" data-act="buy" data-uid="${esc(it.id)}" ${c < it.price ? 'disabled' : ''}>BUY</button></div>`}
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------- settings
  let rebinding = null;                 // the action waiting for its new key
  function renderSettings() {
    $('set-name').textContent = myName();
    $('keys-list').innerHTML = CG.Keys.ACTIONS.map(([a, label]) => `<div class="set-row key-row"><span>${label}</span>
      <button class="btn small ${rebinding === a ? 'on' : ''}" data-act="rebind" data-uid="${a}">${rebinding === a ? 'PRESS A KEY…' : esc(CG.Keys.label(a))}</button></div>`).join('');
    let fov = '1';
    try { fov = localStorage.getItem('commando.fov') || '1'; } catch (e) { /* */ }
    document.querySelectorAll('[data-act="fov"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === fov));
    $('guest-signin').classList.toggle('hidden', N().online || N().state === 'off');
    document.querySelectorAll('[data-act="lobby-style"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === lobbyStyle));
    $('sound-btn').textContent = CG.Sfx.on ? 'ON' : 'OFF';
    const o = CG.Touch.opts;
    document.querySelectorAll('[data-act="touch-style"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === o.style));
    document.querySelectorAll('[data-act="touch-size"]').forEach((b) => b.classList.toggle('on', +b.dataset.uid === +o.size));
    $('touch-auto').textContent = o.autofire ? 'ON' : 'OFF';
    $('touch-auto').classList.toggle('on', !!o.autofire);
    document.querySelectorAll('#settings .online-only').forEach((b) => b.classList.toggle('hidden', !N().online));
    $('shake-btn').textContent = shakeOn() ? 'ON' : 'OFF';
    [$('sound-btn'), $('shake-btn'), $('touch-auto')].forEach((b) => b.classList.toggle('on', b.textContent === 'ON'));
    const u = N().user;
    $('set-account').textContent = N().online ? 'Signed in' + (u && u.email ? ' as ' + u.email : '') + ' — progress saved to your account' : 'Guest — saved on this device only';
    document.querySelectorAll('[data-act="set-tab"]').forEach((b) => b.classList.toggle('on', b.dataset.uid === setTab));
    document.querySelectorAll('#settings .set-page').forEach((pg) => pg.classList.toggle('hidden', pg.dataset.page !== setTab));
  }
  // which settings page is open (touch screens start on TOUCH)
  let setTab = CG.Touch.enabled ? 'touch' : 'general';
  const shakeOn = () => store.get('commando.shake', '1') !== '0';

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
    'email-in': () => run(() => N().signInEmail($('em-email').value, $('em-pass').value), '', 'login-msg'),
    'email-up': () => run(() => N().signUpEmail($('em-email').value, $('em-pass').value), '', 'login-msg'),
    'email-reset': () => run(() => N().resetPassword($('em-email').value), 'Check your inbox for a link to set a new password.', 'login-msg'),
    offline: () => { offline = true; home(); },
    signout: () => run(() => N().signOut().then(() => { offline = false; home(); }), 'Signed out'),
    'un-save': () => run(() => N().claimUsername($('un-input').value).then(() => { toast('Callsign saved'); home(); }), '', 'un-msg'),
    'un-change': () => { $('un-cancel').classList.remove('hidden'); show('username'); },
    'un-cancel': () => show('settings'),
    lobby: openLobby,
    locker: openLocker,
    'play-main': playMain,
    find: () => run(findPlayers, '', 'party-msg'),
    'squad-bot': (col) => { botPick = +col; renderStage(); },
    'squad-bot-as': (id) => addSquadBot(id),
    'squad-bot-cancel': () => { botPick = -1; renderStage(); },
    'squad-unbot': (i) => { closeMember(); removeSquadBot(i); },
    'mode-open': () => { renderModes(); $('mode-pop').classList.remove('hidden'); },
    'mode-close': () => $('mode-pop').classList.add('hidden'),
    'mode-pick': pickMode,
    'lb-remove': (uid) => {
      const el = document.querySelector('[data-act="lb-remove"][data-uid="' + CSS.escape(uid) + '"]');
      const name = (el && el.dataset.name) || 'this player';
      if (!confirm('Remove ' + name + ' from the leaderboard? They stay off it.')) return;
      run(() => N().adminRemoveRank(uid).then(renderLeaderboard), name + ' removed from the leaderboard');
    },
    'starter-pick': (id) => run(() => CG.Profile.chooseStarter(id).then(() => {
      store.set(AGENT, id); N().setAgent(id);
      CG.Sfx.play('ability');
      toast(CG.AGENT[id].name + ' is yours!');
      show('menu');
    }), ''),
    leaderboard: () => { show('leaderboard'); renderLeaderboard(); },
    rebind: (a) => { rebinding = rebinding === a ? null : a; renderSettings(); },
    'keys-reset': () => { CG.Keys.reset(); rebinding = null; renderSettings(); toast('Keys reset'); },
    fov: (v) => { try { localStorage.setItem('commando.fov', v); } catch (e) { /* */ } renderSettings(); },
    'touch-edit': () => { show(null); CG.Touch.edit(true); },
    'touch-edit-done': () => { CG.Touch.edit(false); CG.Touch.show(false); show('settings'); },
    'touch-edit-reset': () => { CG.Touch.opts.pos = {}; CG.Touch.save(); },
    'guest-signin': () => { $('invite-pop').classList.add('hidden'); offline = false; home(); },
    member: (key) => openMember(key),
    'profile-open': (key) => openProfile(key),
    'profile-me': () => openProfile('me'),
    'profile-close': () => $('profile').classList.add('hidden'),
    'locker-look': () => { closeMember(); $('profile').classList.add('hidden'); openLocker(); setLockerTab('banner'); },
    'locker-tab': (t) => setLockerTab(t),
    'equip-look': (id) => run(() => CG.Profile.setLook(lockerTab, id).then(() => { CG.Sfx.play('pickup'); renderLocker(); }), ''),
    'add-friend': (uid) => { closeMember(); run(() => N().sendRequest(memberOf('m:' + uid) ? memberOf('m:' + uid).name : uid), 'Friend request sent'); },
    kick: (uid) => { closeMember(); run(() => N().kick(uid), 'Kicked from the squad'); },
    'mode-local': () => { $('mode-pop').classList.add('hidden'); openLobby(); },
    'notice-ok': () => notices.ok(),
    'lobby-style': (v) => { lobbyStyle = v; store.set(LOBBY, v); renderSettings(); },
    'vs-switch': vsSwitch,
    'vs-ready': () => { if (vs) play(vs.players, vs.settings); },
    'vs-leave': () => { if (vs && vs.back) vs.back(); else home(); },
    cust: setCustom,
    'invite-open': () => { say('invite-msg', ''); renderInvites(); $('invite-pop').classList.remove('hidden'); },
    'invite-close': () => $('invite-pop').classList.add('hidden'),
    'lob-prev': (id) => cycle(joined.find((d) => d.id === id), -1),
    'lob-next': (id) => cycle(joined.find((d) => d.id === id), 1),
    shop: () => show('shop'),
    settings: () => show('settings'),
    buy: (id) => {
      const it = CG.Shop.items().find((x) => x.id === id);
      if (it) run(() => (N().online ? N().buy(it) : CG.Profile.buyLocal(it)).then(() => { CG.Sfx.play('pickup'); renderShop(); }), it.name + ' bought!', 'shop-msg');
    },
    sound: () => { CG.Sfx.toggle(); renderSettings(); },
    shake: () => { store.set('commando.shake', shakeOn() ? '0' : '1'); renderSettings(); },
    'set-tab': (t) => { setTab = t; renderSettings(); },
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
      run(() => (N().online ? N().buy(it) : CG.Profile.buyLocal(it)).then(() => {
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
    menu: () => (running() || paused() ? toMenu() : home()),
    resume, quit: toMenu,
    admin: () => { resume(); CG.Admin.open(); },
    'admin-close': () => CG.Admin.close(),
    retry: () => (lastCfg ? startScene(Object.assign({}, lastCfg, { players: lastCfg.players.map((q) => Object.assign({}, q)) })) : toMenu()),
    'inv-accept': (pid) => run(() => N().acceptInvite(pid).then(() => home()), ''),
    'inv-decline': (pid) => run(() => N().declineInvite(pid), ''),
    'party-invite': (uid) => {
      const where = !$('invite-pop').classList.contains('hidden') ? 'invite-msg' : visible('menu') ? 'party-msg' : 'fr-msg';
      const f = N().friends[uid], who = f ? f.username || f.name : 'your friend';
      run(() => N().invite(uid).then(() => { invited[uid] = Date.now(); renderInvites(); toast('Invite sent to ' + who); }), 'Invite sent to ' + who, where);
    },
    'party-leave': () => run(() => N().leaveParty().then(() => home()), ''),
    'fr-copy': () => run(() => navigator.clipboard.writeText(N().profile.code), 'Code copied', 'fr-msg'),
    'fr-send': () => run(() => N().sendRequest($('fr-add').value).then(() => { $('fr-add').value = ''; }), 'Request sent', 'fr-msg'),
    'fr-accept': (uid) => run(() => N().accept(uid), 'Friend added', 'fr-msg'),
    'fr-decline': (uid) => run(() => N().decline(uid), '', 'fr-msg'),
    'fr-remove': (uid) => run(() => N().unfriend(uid), 'Friend removed', 'fr-msg'),
  };

  document.addEventListener('dragstart', (e) => e.preventDefault());       // clicking a picture never drags it
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
    if (rebinding && visible('settings')) {                    // Settings → Keyboard: this key now does that action
      e.preventDefault();
      if (e.code !== 'Escape') CG.Keys.set(rebinding, e.keyCode, (e.key === ' ' ? 'SPACE' : e.key.length === 1 ? e.key.toUpperCase() : e.key.replace('Arrow', '').toUpperCase()));
      rebinding = null;
      renderSettings();
      return;
    }
    if (e.target.tagName === 'INPUT') { if (e.code === 'Enter' && visible('username')) ACTIONS['un-save'](); return; }
    if (visible('lobby')) { lobbyKey(e); return; }
    if (visible('select')) { selectKey(e); return; }
    if (visible('versus')) { if (e.code === 'Enter') ACTIONS['vs-ready'](); if (e.code === 'Escape') ACTIONS['vs-leave'](); return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (visible('pause')) resume(); else if (running()) pause();
    }
  });
  $('b-pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden && !(scene && scene.net)) pause(); });

  // ---------------------------------------------------------------- the loading screen
  // art first (0-85 %), then waiting for the sign-in check so the login card never flashes up for signed-in players
  const TIPS = ['Flank: shots in an enemy\'s back do double damage — jump over them and turn round.', 'KITE dashes in any direction — hold W and dash to go straight up.',
    'Your squad shares one pool of lives.', 'Cover stops every bullet — and breaks after five hits.',
    'Coins up high are worth 5 each.', 'Pick your agent once in the LOCKER: it is used in every match.',
    'Bots play at your rank.', 'Water is instant death. Mind the gaps.'];
  const loader = { shown: 0, start: Date.now(), done: false };
  $('ld-tip').textContent = 'TIP · ' + TIPS[Math.floor(Math.random() * TIPS.length)];
  function loading(v, text) {
    if (loader.done) return;
    loader.shown = Math.max(loader.shown, v);
    $('ld-fill').style.width = Math.round(loader.shown * 100) + '%';
    $('ld-text').textContent = text || 'LOADING ' + Math.round(loader.shown * 100) + '%';
  }
  function finishLoading() {
    if (loader.done) return;
    loader.done = true;
    $('ld-fill').style.width = '100%';
    const el = $('loading');
    el.classList.add('out');
    setTimeout(() => el.remove(), 600);
  }
  // signed in or not decided yet? (at most 8 s, then the login screen shows with whatever the server said)
  function waitForSignIn() {
    const net = N();
    if (net.state !== 'loading' || Date.now() - loader.start > 8000) { home(); finishLoading(); return; }
    loading(0.92, 'SIGNING IN');
    setTimeout(waitForSignIn, 120);
  }

  return {
    ready() {
      booted = true;
      loading(0.9, 'GETTING READY');
      waitForSignIn();
    },
    loading,
    onGameStart(s) { scene = s; },
    localDevice() { return { type: 'any' }; },
    storyCleared(n) { if (n > storyCleared()) store.set(STORY, String(n)); },
    announce: (a) => notices.announce(a),
    shakeOn,
    gameOver, matchEnded, refreshFriends, netChanged, loginMessage, localBest, localName, myAgent, myName, show, toast, play, playOnline, takeLocalBots,
  };
})();
