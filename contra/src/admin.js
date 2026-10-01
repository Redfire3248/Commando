// Admin panel: a side panel with tabs and picture buttons for testing and messing about.
// Allowed in local games, and online only for the host. Anything done here marks the run (scene.adminUsed),
// so its score is never saved as a best or sent to friends.
CG.Admin = (() => {
  const $ = (id) => document.getElementById(id);
  let tab = 'players', refresh = null;

  const scene = () => {
    if (!CG.game) return null;
    const m = CG.game.scene;
    return m.isActive('Game') || m.isPaused('Game') ? m.getScene('Game') : null;
  };
  const allowed = () => { const s = scene(); return !!s && !s.isClient; };
  const isOpen = () => !$('admin').classList.contains('hidden');
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // a small picture of a texture (or one frame of a sheet), for the buttons
  const thumbs = {};
  function thumb(key, frame) {
    const s = scene(), id = key + ':' + (frame || 0);
    if (thumbs[id]) return thumbs[id];
    if (!s || !s.textures.exists(key)) return '';
    try { thumbs[id] = s.textures.getBase64(key, frame); } catch (e) { thumbs[id] = ''; }
    return thumbs[id];
  }
  const img = (src) => (src ? `<img src="${src}" alt="">` : '<span class="noimg">?</span>');

  function mark() {
    const s = scene();
    if (s) s.adminUsed = true;
  }

  // ---- tabs
  const TABS = {
    players(s) {
      let h = `<div class="admin-row"><b>Team lives: ${s.teamLives}</b>
        <button data-adm="lives" data-n="1">+1</button><button data-adm="lives" data-n="5">+5</button></div>`;
      s.players.forEach((p, i) => {
        h += `<div class="admin-card" style="--c:${p.color}">
          ${img(CG.DATA.art && CG.DATA.art.images['portrait_' + p.agent.id] ? 'assets/atlas/portrait_' + p.agent.id + '.png' : '')}
          <div class="grow"><b>${esc(p.name)}</b> <small>${p.agent.name}${p.bot ? ' · bot' : ''}${p.remote ? ' · online' : ''}</small><br>
          ${p.out ? 'OUT' : p.dead ? 'down' : '♥ ' + p.hp + ' / ' + p.maxHp}</div>
          <div class="btns">
            <button data-adm="heal" data-i="${i}">HEAL</button>
            <button data-adm="god" data-i="${i}" class="${p.god ? 'on' : ''}">GOD</button>
            <button data-adm="free" data-i="${i}" class="${p.freeAbility ? 'on' : ''}">NO COOLDOWN</button>
            <button data-adm="rapid" data-i="${i}" class="${p.rapid ? 'on' : ''}">RAPID</button>
            <button data-adm="spread" data-i="${i}" class="${p.spread ? 'on' : ''}">SPREAD</button>
            <button data-adm="shield" data-i="${i}">SHIELD</button>
            ${p.out ? `<button data-adm="revive" data-i="${i}">REVIVE</button>` : ''}
          </div></div>`;
      });
      return h;
    },
    spawn() {
      const T = CG.Enemy.TYPES;
      const list = ['runner', 'rifle', 'grenadier', 'turret', 'drone', 'flyer'];
      return '<p class="admin-tip">Appears at the right edge of the screen.</p><div class="admin-grid">' + list.map((t) => {
        const d = T[t], key = d.sheet && scene().textures.exists(d.sheet) ? d.sheet : d.tex;
        return `<button class="tile" data-adm="spawn" data-t="${t}">${img(thumb(key, d.frames || d.sheet ? 0 : undefined))}<span>${t}</span></button>`;
      }).join('') + '</div>';
    },
    items() {
      const list = [['heal', 'First aid'], ['heal_big', 'Team medkit'], ['life', 'Team life'], ['rapid', 'Rapid fire'], ['spread', 'Spread'], ['barrier', 'Shield']];
      return '<p class="admin-tip">Drops above the first player.</p><div class="admin-grid">' + list.map(([k, n]) => {
        const key = scene().textures.exists('pk_' + k) ? 'pk_' + k : 'pk_life';
        return `<button class="tile" data-adm="item" data-k="${k}">${img(thumb(key))}<span>${n}</span></button>`;
      }).join('') + '</div>';
    },
    stage(s) {
      return `<div class="admin-grid wide">
        <button data-adm="killall">KILL EVERY ENEMY ON SCREEN</button>
        <button data-adm="boss">SKIP TO THE BOSS</button>
        <button data-adm="clear">CLEAR THIS STAGE</button>
        <button data-adm="slow" class="${s.time.timeScale < 1 ? 'on' : ''}">SLOW MOTION</button>
        ${CG.DATA.levels.map((L, i) => `<button data-adm="goto" data-n="${i + 1}">STAGE ${i + 1} · ${L.name}</button>`).join('')}
      </div>`;
    },
  };

  function render() {
    const s = scene();
    document.querySelectorAll('#admin .tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $('admin-body').innerHTML = s ? TABS[tab](s) : '<p class="admin-tip">Start a game first.</p>';
  }

  const ACT = {
    lives: (s, d) => { s.teamLives += +d.n; },
    heal: (s, d) => { const p = s.players[d.i]; if (p.alive) { p.hp = p.maxHp; s.plusFx(p.body.center.x, p.body.top); } },
    god: (s, d) => { const p = s.players[d.i]; p.god = !p.god; },
    free: (s, d) => { const p = s.players[d.i]; p.freeAbility = !p.freeAbility; },
    rapid: (s, d) => { const p = s.players[d.i]; p.rapid = !p.rapid; },
    spread: (s, d) => { const p = s.players[d.i]; p.spread = !p.spread; },
    shield: (s, d) => { s.players[d.i].barrierT = CG.CONFIG.PLAYER.barrierMs; },
    revive: (s, d) => { const p = s.players[d.i]; if (p.out && !p.remote) p.respawn(); },
    spawn: (s, d) => {
      const T = CG.CONFIG.TILE, x = s.camX + CG.CONFIG.W - 80, L = CG.DATA.level;
      const y = d.t === 'drone' ? 4.5 * T : d.t === 'flyer' ? 4 * T : L.groundRow * T;
      const e = new CG.Enemy(s, d.t, x, y, d.t === 'flyer' ? ['rapid', 'spread', 'barrier', 'life'][Math.floor(Math.random() * 4)] : undefined);
      e.netId = ++s.netSeq;
      s.enemies.add(e);
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
    slow: (s) => { const k = s.time.timeScale < 1 ? 1 : 0.4; s.time.timeScale = k; s.physics.world.timeScale = 1 / k; s.tweens.timeScale = k; },
    goto: (s, d) => { s.scene.restart(Object.assign({}, s.cfg, { stage: +d.n, adminUsed: true })); },
  };

  function open() {
    if (!allowed()) { CG.UI.toast(scene() ? 'Only the host can use the admin panel online' : 'Start a game first'); return; }
    $('admin').classList.remove('hidden');
    render();
    clearInterval(refresh);
    refresh = setInterval(() => { if (isOpen() && tab === 'players' && !document.querySelector('#admin:hover')) render(); }, 700);
  }
  function close() { $('admin').classList.add('hidden'); clearInterval(refresh); }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('#admin .tabs button');
    if (t) { tab = t.dataset.tab; render(); return; }
    const b = e.target.closest('[data-adm]');
    if (!b) return;
    const s = scene();
    if (!s || !allowed()) return;
    ACT[b.dataset.adm](s, b.dataset);
    mark();
    render();
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'F9' || e.code === 'Backquote') { e.preventDefault(); if (isOpen()) close(); else open(); }
  });

  return { open, close, isOpen };
})();
