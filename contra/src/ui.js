// Menus (plain HTML over the game canvas) and the flow between them.
CG.UI = (() => {
  const $ = (id) => document.getElementById(id);
  const PANELS = ['menu', 'lobby', 'how', 'friends', 'pause', 'over'];
  const BEST = 'commando.best', NAME = 'commando.name';
  let lastDevices = [{ type: 'kbAll' }], scene = null, booted = false;

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
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const visible = (id) => !$(id).classList.contains('hidden');

  function show(id) {
    PANELS.forEach((p) => $(p).classList.toggle('hidden', p !== id));
    if (id === 'menu') {
      const prof = CG.Net.profile;
      $('menu-name').textContent = prof ? prof.name : localName();
      $('menu-best').textContent = Math.max(localBest(), (prof && prof.best) || 0);
    }
    if (id === 'friends') refreshFriends();
    const first = id && id !== 'lobby' && $(id).querySelector('button');
    if (first && !CG.Touch.enabled) first.focus();
  }

  const running = () => booted && CG.game.scene.isActive('Game');
  const paused = () => booted && CG.game.scene.isPaused('Game');

  function play(devices) {
    if (!booted) return;
    lastDevices = devices;
    show(null);
    CG.game.scene.stop('Backdrop');
    CG.game.scene.stop('Game');
    CG.game.scene.start('Game', { devices });
    CG.Touch.show(devices.some((d) => d.type === 'touch'));
  }
  function pause() {
    if (!running() || (scene && scene.over)) return;
    CG.game.scene.pause('Game');
    show('pause');
  }
  function resume() {
    if (!paused()) return;
    show(null);
    CG.game.scene.resume('Game');
  }
  function toMenu() {
    CG.game.scene.stop('Game');
    if (!CG.game.scene.isActive('Backdrop')) CG.game.scene.start('Backdrop');
    CG.Touch.show(false);
    show('menu');
  }
  function gameOver(score) {
    const best = localBest();
    if (score > best) store.set(BEST, String(score));
    CG.Net.submitScore(score);
    $('over-score').textContent = score;
    $('over-best').textContent = score > best ? 'New best!' : 'Best ' + best;
    CG.Touch.show(false);
    show('over');
  }

  // ---- join screen: up to five players, each on their own keys, gamepad or the touch screen ----
  const MAX = CG.CONFIG.MAX_PLAYERS;
  const LABEL = {
    kbA: 'Keyboard · W A S D · F shoot · G jump',
    kbB: 'Keyboard · Arrows · K shoot · L jump',
    touch: 'This touch screen',
    pad: (i) => 'Gamepad ' + (i + 1) + ' · A jump · X shoot',
  };
  let joined = [], padPrev = {};

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
        ? `<div class="slot" style="--c:${CG.PLAYER_COLORS[i]}"><b>P${i + 1}</b><span class="grow">${esc(d.type === 'pad' ? LABEL.pad(d.index) : LABEL[d.type])}</span><button data-act="leave" data-uid="${esc(d.id)}">✕</button></div>`
        : `<div class="slot empty"><b>P${i + 1}</b><span class="grow">Press FIRE to join</span></div>`;
    }
    $('lobby-slots').innerHTML = html;
    $('lobby-start').disabled = joined.length === 0;
    $('lobby-start').textContent = joined.length ? 'START  (' + joined.length + (joined.length === 1 ? ' player)' : ' players)') : 'WAITING FOR PLAYERS';
    $('lobby-touch').classList.toggle('hidden', !CG.Touch.enabled || joined.some((d) => d.id === 'touch'));
  }
  function openLobby() {
    joined = []; padPrev = {};
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
  function startGame() {
    if (!joined.length) return;
    let devices = joined.map((d) => ({ type: d.type, index: d.index }));
    // a lone keyboard player gets both key layouts and the mouse
    if (devices.length === 1 && (devices[0].type === 'kbA' || devices[0].type === 'kbB')) devices = [{ type: 'kbAll' }];
    if (devices.some((d) => d.type === 'touch') && !document.fullscreenElement) landscape();
    play(devices);
  }
  const KEY_JOIN = {
    KeyF: 'kbA', KeyG: 'kbA', KeyW: 'kbA', KeyA: 'kbA', KeyS: 'kbA', KeyD: 'kbA',
    KeyK: 'kbB', KeyL: 'kbB', ArrowLeft: 'kbB', ArrowRight: 'kbB', ArrowUp: 'kbB', ArrowDown: 'kbB',
  };
  const KEY_ANY = ['KeyX', 'KeyZ', 'KeyJ', 'Space'];          // single-player keys: take the first free keyboard seat
  function lobbyKey(e) {
    if (e.code === 'Enter') { startGame(); return; }
    if (e.code === 'Escape') { toMenu(); return; }
    let seat = KEY_JOIN[e.code];
    if (!seat && KEY_ANY.includes(e.code)) seat = joined.some((d) => d.id === 'kbA') ? 'kbB' : 'kbA';
    if (seat) { join(seat, seat); e.preventDefault(); }
  }
  // gamepads: A or X joins, B leaves, Start begins
  setInterval(() => {
    if (!visible('lobby') || !navigator.getGamepads) return;
    for (const gp of navigator.getGamepads()) {
      if (!gp) continue;
      const now = gp.buttons.map((b) => b.pressed), was = padPrev[gp.index] || [];
      const hit = (i) => now[i] && !was[i];
      if (hit(0) || hit(2)) join('pad' + gp.index, 'pad', gp.index);
      if (hit(1)) leave('pad' + gp.index);
      if (hit(9)) startGame();
      padPrev[gp.index] = now;
    }
  }, 50);

  // ---- friends screen ----
  function say(msg) { $('fr-msg').textContent = msg || ''; }
  function refreshFriends() {
    const N = CG.Net, off = N.state !== 'ready';
    $('fr-setup').classList.toggle('hidden', !off);
    $('fr-body').classList.toggle('hidden', off);
    if (off) {
      if (N.state === 'loading') $('fr-setup').textContent = 'Connecting…';
      if (N.state === 'error') $('fr-setup').textContent = 'Could not connect: ' + N.error;
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
        <button data-act="fr-remove" data-uid="${esc(uid)}">REMOVE</button></div>`;
    }).join('') : '<i>No friends yet — share your code</i>';
    if (visible('menu')) show('menu');
  }
  // run an online action and show what happened under the form
  function run(fn, okMsg) {
    try { Promise.resolve(fn()).then(() => say(okMsg)).catch((e) => say(e.message || String(e))); }
    catch (e) { say(e.message || String(e)); }
  }

  const ACTIONS = {
    lobby: openLobby,
    landscape,
    start: startGame,
    leave: (id) => leave(id),
    'join-touch': () => join('touch', 'touch'),
    friends: () => show('friends'),
    how: () => show('how'),
    menu: () => toMenu(),
    resume, quit: toMenu,
    retry: () => play(lastDevices),
    'fr-save': () => run(() => CG.Net.setName($('fr-name').value).then((n) => store.set(NAME, n)), 'Name saved'),
    'fr-copy': () => run(() => navigator.clipboard.writeText(CG.Net.profile.code), 'Code copied'),
    'fr-send': () => run(() => CG.Net.sendRequest($('fr-add').value).then(() => { $('fr-add').value = ''; }), 'Request sent'),
    'fr-accept': (uid) => run(() => CG.Net.accept(uid), 'Friend added'),
    'fr-decline': (uid) => run(() => CG.Net.decline(uid), ''),
    'fr-remove': (uid) => run(() => CG.Net.unfriend(uid), 'Friend removed'),
    'fr-google': () => run(() => CG.Net.linkGoogle(), 'Account linked to Google'),
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (b && !b.disabled && ACTIONS[b.dataset.act]) ACTIONS[b.dataset.act](b.dataset.uid);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (visible('lobby')) { lobbyKey(e); return; }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (paused()) resume(); else if (running()) pause();
    }
  });
  $('b-pause').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  return {
    ready() { booted = true; show('menu'); },
    onGameStart(s) { scene = s; },
    gameOver, refreshFriends, localBest, localName, show,
  };
})();
