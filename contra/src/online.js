// Online co-op match over the Firebase Realtime Database.
//
// One player (the party leader who started the match) is the HOST: their game runs the stage — enemies, enemy
// shots, pick-ups, score, the team's lives. Every player's own game moves their own soldier (so it feels instant)
// and reports where it is; the host's bots are moved by the host. The host sends everyone a snapshot of the stage
// about ten times a second, and the other games draw it.
//   matches/{mid}/info      { host, players: [{ id, owner, name, agent, bot }], ended }
//   matches/{mid}/p/{id}    a player's state (JSON), written by whoever moves that player
//   matches/{mid}/s         the host's snapshot of the stage (JSON)
//   matches/{mid}/ev        events for the host: an enemy was hit, a player died, a pick-up was taken
//   matches/{mid}/bc        messages for everyone: a heal, a lightning arc
// Hits work like this: you see your own bullet hit an enemy, your game tells the host, the host takes the
// enemy's health. Enemy bullets that reach you hurt you in your own game.
CG.Online = {
  mid: null, info: null, scene: null, host: false,

  // a match was started for my party: load who is in it and start the game
  async join(mid) {
    const N = CG.Net;
    if (this.mid === mid && this.scene) return;
    const info = (await N.db.ref('matches/' + mid + '/info').get()).val();
    if (!info || info.ended || !info.players.some((p) => p.owner === N.uid)) return;
    this.mid = mid; this.info = info; this.host = info.host === N.uid;
    const local = CG.UI.localDevice();
    const players = info.players.map((p) => ({
      id: p.id, owner: p.owner, name: p.name, agent: p.agent, bot: !!p.bot,
      device: p.owner !== N.uid ? { type: 'remote' } : p.bot ? { type: 'bot' } : local,
    }));
    CG.UI.playOnline({ players, online: { mid, host: this.host } });
  },

  // called by the Game scene when it starts (also after each stage)
  attach(scene) {
    const N = CG.Net;
    this.scene = scene;
    this.base = N.db.ref('matches/' + this.mid);
    this.ps = {}; this.snap = null; this.snapNew = false; this.sendT = 0; this.snapT = 0; this.seq = 0;
    this.offs = [];
    const on = (ref, ev, fn) => { ref.on(ev, fn); this.offs.push(() => ref.off(ev, fn)); };
    on(this.base.child('p'), 'value', (s) => { this.ps = s.val() || {}; });
    on(this.base.child('bc').limitToLast(20), 'child_added', (s) => this.broadcast(s.val()));
    on(this.base.child('info/ended'), 'value', (s) => { if (s.val() && !this.host) this.ended(s.val()); });
    if (this.host) {
      on(this.base.child('ev'), 'child_added', (s) => { this.event(s.val()); s.ref.remove(); });
      this.base.child('info/ended').onDisconnect().set('host-left');
    } else {
      on(this.base.child('s'), 'value', (s) => { if (s.val()) { this.snap = JSON.parse(s.val()); this.snapNew = true; this.snapAt = Date.now(); } });
      this.snapAt = Date.now();
    }
    for (const p of scene.players) if (p.owner === N.uid) this.base.child('p/' + p.netId).onDisconnect().remove();
    this.puppets = {}; this.pickups = {};
    scene.events.once('shutdown', () => this.detach());
    return this;
  },

  detach() {
    (this.offs || []).forEach((f) => f());
    this.offs = [];
    this.scene = null;
  },

  // leave the match (quit to menu, or the game ended)
  leave() {
    const N = CG.Net;
    if (!this.mid) return;
    if (this.host) this.base.child('info/ended').set('done').catch(() => {});
    else if (this.scene) for (const p of this.scene.players) if (p.owner === N.uid) this.base.child('p/' + p.netId).remove().catch(() => {});
    this.detach();
    this.mid = null; this.info = null;
    if (N.isLeader) N.backToLobby();
  },

  ended(why) {
    if (!this.mid) return;
    const msg = why === 'host-left' ? 'The host left the match' : 'The match is over';
    this.mid = null;
    this.detach();
    CG.UI.matchEnded(msg);
  },

  send(type, data) {
    if (!this.mid) return;
    this.base.child('ev').push(Object.assign({ t: type, from: CG.Net.uid }, data)).catch(() => {});
  },
  shout(type, data) {
    if (!this.mid) return;
    this.base.child('bc').push(Object.assign({ t: type, from: CG.Net.uid, at: Date.now() }, data)).catch(() => {});
  },

  // ---------------------------------------------------------------- every frame
  tick(dt) {
    const sc = this.scene, N = CG.Net;
    if (!sc) return;
    this.sendT -= dt * 1000; this.snapT -= dt * 1000;
    if (this.sendT <= 0) {
      this.sendT = 70;
      const up = {};
      for (const p of sc.players) if (p.owner === N.uid) up['p/' + p.netId] = JSON.stringify(this.playerState(p));
      this.base.update(up).catch(() => {});
    }
    if (this.host && this.snapT <= 0) {
      this.snapT = 100;
      this.base.child('s').set(JSON.stringify(this.snapshot())).catch(() => {});
    }
    if (!this.host && this.snapNew) { this.snapNew = false; this.applySnapshot(); }
    // nothing from the host for 12 seconds: they are gone
    if (!this.host && Date.now() - this.snapAt > 12000) { this.ended('host-left'); return; }
    if (!this.host) this.movePuppets(dt);
  },

  // ---------------------------------------------------------------- players
  playerState(p) {
    const b = p.body, r = Math.round;
    return {
      x: r(b.center.x), y: r(b.bottom), vx: r(b.velocity.x), vy: r(b.velocity.y), f: p.facing, ax: +p.aimX.toFixed(2), ay: +p.aimY.toFixed(2),
      pr: p.prone ? 1 : 0, g: p.onGround ? 1 : 0, hp: p.hp, mx: p.maxHp, d: p.dead ? 1 : 0, o: p.out ? 1 : 0,
      sh: p.shots || 0, sp: (p.spread || p.stormT > 0) ? 1 : 0, st: p.stormT > 0 ? 1 : 0, dm: p.domeT > 0 ? 1 : 0, ds: p.dashT > 0 ? 1 : 0,
    };
  },

  // move a teammate whose game is on another device to where it says they are
  applyPlayer(p, dt) {
    const raw = this.ps[p.netId];
    if (!raw) { p.visual.setVisible(false); p.tag.setVisible(false); p.bar.clear(); return; }
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw, sc = this.scene, b = p.body;
    p.netSeen = true;
    p.facing = s.f; p.aimX = s.ax; p.aimY = s.ay; p.onGround = !!s.g; p.hp = s.hp; p.maxHp = s.mx;
    p.setProne(!!s.pr);
    if (s.o && !p.out) { p.out = true; p.visual.setVisible(false); if (this.host) sc.checkOver(); }
    if (!s.o) p.out = false;
    if (s.d && !p.dead) p.netDie();
    else if (!s.d && p.dead && !s.o) p.netRespawn();
    if (s.dm && !(p.domeT > 0)) { p.domeT = 5000; sc.domeFx(p); }
    if (!s.dm) p.domeT = 0;
    if (s.ds && !p.wasDash) sc.dashFx(p);
    p.wasDash = !!s.ds;
    p.stormT = s.st ? 1000 : 0;
    // ease toward the reported position (plus a little of its velocity, as the report is already a moment old)
    const tx = s.x + s.vx * 0.05, ty = s.y + s.vy * 0.05;
    const k = 1 - Math.exp(-14 * dt);
    const cx = b.center.x + (tx - b.center.x) * k, bottom = b.bottom + (ty - b.bottom) * k;
    if (!p.dead && !p.out) {
      b.reset(Math.abs(tx - b.center.x) > 400 ? tx : cx, (Math.abs(ty - b.bottom) > 400 ? ty : bottom) - p.phys.height / 2);
      b.velocity.set(s.vx, s.vy);
      p.visual.setVisible(true);
      p.sync(dt);
    }
    // their shots, drawn here (they only hurt enemies in their own game)
    if (p.lastShots === undefined) p.lastShots = s.sh;
    const n = Math.min(3, s.sh - p.lastShots);
    p.lastShots = s.sh;
    for (let i = 0; i < n && !p.dead; i++) {
      const m = p.muzzle(), a = Math.atan2(p.aimY, p.aimX);
      for (const off of s.sp ? [-0.2, 0, 0.2] : [0]) sc.fire(p, m.x, m.y, a + off, true);
    }
  },

  // ---------------------------------------------------------------- host: the stage, ten times a second
  snapshot() {
    const sc = this.scene, r = Math.round, e = [], b = [], m = [], k = [];
    for (const en of sc.enemies.getChildren()) {
      if (!en.active) continue;
      e.push([en.netId, en.type, r(en.x), r(en.y), en.frame ? en.frame.name : 0, en.flipX ? 1 : 0, en.hp, en.barrel ? +en.barrel.rotation.toFixed(2) : 0, en.texture.key, en.extra || 0]);
    }
    sc.ebullets.children.iterate((x) => { if (x && x.active) b.push([r(x.x), r(x.y), r(x.body.velocity.x), r(x.body.velocity.y)]); });
    sc.ebombs.children.iterate((x) => { if (x && x.active) m.push([r(x.x), r(x.y), r(x.body.velocity.x), r(x.body.velocity.y)]); });
    sc.pickups.children.iterate((x) => { if (x && x.active) k.push([x.netId, x.kind, r(x.x), r(x.y)]); });
    return { st: sc.cfg.stage, sc: sc.score, lv: sc.teamLives, cx: r(sc.camX), bo: sc.bossOn ? 1 : 0, cl: sc.cleared ? 1 : 0, ov: sc.over ? 1 : 0, e, b, m, k };
  },

  // events from the other players' games
  event(ev) {
    const sc = this.scene;
    if (!sc || !ev) return;
    if (ev.t === 'hit') {
      const e = sc.enemies.getChildren().find((x) => x.active && x.netId === ev.id);
      if (e) e.damage(ev.n || 1);
    } else if (ev.t === 'die') {
      if (sc.teamLives > 0) sc.teamLives--;
    } else if (ev.t === 'pick') {
      sc.pickups.children.iterate((x) => {
        if (!x || !x.active || x.netId !== ev.id) return;
        if (x.kind === 'life') { sc.teamLives++; sc.say('TEAM LIFE +1', 900); }
        x.disableBody(true, true);
        sc.time.delayedCall(0, () => x.destroy());
      });
    }
  },

  // messages everyone acts on
  broadcast(m) {
    const sc = this.scene, N = CG.Net;
    if (!sc || !m || m.from === N.uid || Date.now() - (m.at || 0) > 8000) return;
    if (m.t === 'heal') {
      for (const p of sc.players) {
        if (p.owner !== N.uid || !(m.all || Math.abs(p.body.center.x - m.x) < m.range)) continue;
        if (p.out && m.revive) p.respawn();
        else if (p.alive) { p.heal(m.n); if (m.revive) p.invT = Math.max(p.invT, 1500); }
      }
      if (!m.all) sc.fxSprite('fx_mend', m.x, m.y + 10, 1.4, { origin: [0.5, 1], depth: 6 });
    } else if (m.t === 'arc') {
      for (let i = 1; i < m.pts.length; i++) sc.bolt({ x: m.pts[i - 1][0], y: m.pts[i - 1][1] }, { x: m.pts[i][0], y: m.pts[i][1] });
    }
  },

  // ---------------------------------------------------------------- everyone else: draw the host's stage
  applySnapshot() {
    const sc = this.scene, s = this.snap;
    if (!sc || !s) return;
    if (s.st !== sc.cfg.stage) {                       // the host moved on to the next stage
      sc.scene.restart(Object.assign({}, sc.cfg, { stage: s.st, score: s.sc, teamLives: s.lv }));
      return;
    }
    sc.score = s.sc;
    sc.teamLives = s.lv;
    sc.netCamX = s.cx;
    if (s.bo && !sc.bossOn) { sc.bossOn = true; sc.say(CG.DATA.level.boss.say, 1800); }
    if (s.cl && !sc.cleared) { sc.cleared = true; sc.say('STAGE CLEAR', 2400); CG.Sfx.play('clear'); }
    if (s.ov && !sc.over) { sc.over = true; sc.say('GAME OVER', 5000); CG.Sfx.play('over'); sc.time.delayedCall(1400, () => CG.UI.gameOver(sc.score, sc.cfg.stage, { online: true })); }

    // enemies: create the new ones, move the rest, blow up the ones that are gone
    const seen = new Set();
    for (const [id, type, x, y, frame, flip, hp, rot, tex, extra] of s.e) {
      seen.add(id);
      let e = this.puppets[id];
      if (!e) {
        e = new CG.Enemy(sc, type, x, y, extra || undefined);
        e.puppet = true; e.netId = id;
        e.body.allowGravity = false; e.body.moves = false;
        sc.enemies.add(e);
        this.puppets[id] = e;
      }
      e.tx = x; e.ty = y; e.hp = hp;
      if (tex && e.texture.key !== tex && sc.textures.exists(tex)) e.setTexture(tex);
      if (frame !== undefined && e.texture.has(frame)) e.setFrame(frame);
      e.setFlipX(!!flip);
      if (e.barrel) e.barrelRot = rot;
    }
    for (const id in this.puppets) {
      if (seen.has(+id)) continue;
      const e = this.puppets[id];
      delete this.puppets[id];
      if (e.active) sc.puppetGone(e);
    }

    // enemy shots and bombs: replaced by the host's list each time (they fly on by themselves in between)
    sc.ebullets.children.iterate((x) => { if (x && x.active) sc.kill(x); });
    for (const [x, y, vx, vy] of s.b) sc.shot(sc.ebullets, 'ebullet', x, y, Math.atan2(vy, vx), Math.hypot(vx, vy), 16);
    sc.ebombs.children.iterate((x) => { if (x && x.active) sc.kill(x); });
    for (const [x, y, vx, vy] of s.m) sc.ebomb(x, y, vx, vy);

    // pick-ups
    const ks = new Set();
    for (const [id, kind, x, y] of s.k) {
      ks.add(id);
      let k = this.pickups[id];
      if (!k) { k = sc.dropPickup(x, y, kind); k.netId = id; k.body.allowGravity = false; k.body.moves = false; this.pickups[id] = k; }
      if (k.active) k.setPosition(x, y);
    }
    for (const id in this.pickups) {
      if (ks.has(+id)) continue;
      const k = this.pickups[id];
      delete this.pickups[id];
      if (k.active) k.destroy();
    }
  },

  // smooth movement between snapshots
  movePuppets(dt) {
    const k = 1 - Math.exp(-12 * dt);
    for (const id in this.puppets) {
      const e = this.puppets[id];
      if (!e.active) continue;
      e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k;
      if (e.body) e.body.reset(e.x, e.y);
      if (e.barrel) {
        e.barrel.rotation = e.barrelRot;
        const pv = e.pivot();
        e.barrel.setPosition(pv.x, pv.y);
      }
    }
  },
};
