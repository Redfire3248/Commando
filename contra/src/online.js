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
//   matches/{mid}/ready/<stage>/{uid}   this person's game has loaded the stage; .../go = the host's start signal
// Nobody plays until everyone has loaded: each game says it is ready, the host waits for every person in the
// match (15 s at most, for someone who never makes it) and then sends GO; every game starts on it together.
// Hits work like this: you see your own bullet hit an enemy, your game tells the host, the host takes the
// enemy's health. Enemy bullets that reach you hurt you in your own game.
// Someone leaving does not end the match: a player whose game stops reporting for 3 s is taken out (in a duel the
// other side wins when a whole side is gone); if the HOST goes, the next person still here (lowest uid) takes over —
// their game turns the enemy puppets into real enemies and carries on from where the host left it.
// ONE host at a time: everyone follows info/host. A host that was only away (a phone app switch, a dropped connection)
// finds someone else in info/host when it comes back and steps down — its own enemies go, the new host's come back
// as puppets — and snapshots written by anyone but info/host are ignored. (Two games each running their own enemies
// is what made a kill on one screen not count on the other.)
// Quitting tells everyone (`quit`): that person's soldier and bots disappear at once with "<NAME> HAS QUIT".
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
      id: p.id, owner: p.owner, name: p.name, agent: p.agent, bot: !!p.bot, team: p.team, rr: p.rr || 0, bullet: p.bullet, namec: p.namec,
      device: p.owner !== N.uid ? { type: 'remote' } : p.bot ? { type: 'bot' } : local,
    }));
    CG.UI.playOnline({ players, online: { mid, host: this.host }, mode: info.mode || 'squad', pvp: info.pvp || null, arena: info.arena });
  },

  // called by the Game scene when it starts (also after each stage)
  attach(scene) {
    const N = CG.Net;
    this.scene = scene;
    this.base = N.db.ref('matches/' + this.mid);
    this.ps = {}; this.snap = null; this.snapNew = false; this.sendT = 0; this.snapT = 0; this.seq = 0;
    this.offs = []; this.tickAt = Date.now(); this.hostLeftAt = 0; this.evOff = null;
    const on = (ref, ev, fn) => { ref.on(ev, fn); const off = () => ref.off(ev, fn); this.offs.push(off); return off; };
    on(this.base.child('p'), 'value', (s) => { this.ps = s.val() || {}; });
    on(this.base.child('bc').limitToLast(20), 'child_added', (s) => this.broadcast(s.val()));
    on(this.base.child('info/ended'), 'value', (s) => {
      const v = s.val();
      if (!v) { this.hostLeftAt = 0; return; }
      if (v === 'host-left') {
        // the host's connection dropped (or it quit): a host that is still here clears it; everyone else waits a
        // moment for its snapshots — only when they stop too does someone take over (a blip is not a leave)
        if (this.host) { if (this.scene && !this.scene.over) { this.base.child('info/ended').set(null).catch(() => {}); this.armHost(); } }
        else this.hostLeftAt = Date.now();
        return;
      }
      if (!this.host) this.ended(v);
    });
    on(this.base.child('info/host'), 'value', (s) => this.hostIs(s.val()));
    this.on = on;
    if (this.host) this.listenEvents();
    // everyone hears the snapshots (a host that steps down needs them at once); only the real host's count
    on(this.base.child('s'), 'value', (s) => {
      if (!s.val() || this.host) return;
      const snap = JSON.parse(s.val());
      if (snap.h && this.info && snap.h !== this.info.host) return;       // an old host that has not noticed yet
      this.snap = snap; this.snapNew = true; this.snapAt = Date.now();
      this.goneHost = null;                                               // the host is alive: a later silence is a new one
    });
    this.snapAt = Date.now();
    for (const p of scene.players) if (p.owner === N.uid) this.base.child('p/' + p.netId).onDisconnect().remove();
    this.puppets = {}; this.pickups = {};
    // the ready check: frozen until GO
    const people = [...new Set(this.info.players.filter((q) => !q.bot).map((q) => q.owner))];
    const rref = this.base.child('ready/s' + (scene.cfg.stage || 1));
    // a duel: everyone sees the VS screen and presses READY; co-op: ready as soon as the game has loaded
    const manual = !!scene.pvp;
    scene.netWait = { people, ready: 0, since: Date.now(), manual };
    scene.physics.pause();
    if (manual) CG.UI.netVersus(scene, () => rref.child(N.uid).set(true).catch(() => {}));
    else rref.child(N.uid).set(true).catch(() => {});
    on(rref, 'value', (s) => {
      const v = s.val() || {};
      if (!scene.netWait) return;
      scene.netWait.ready = people.filter((u) => v[u]).length;
      if (manual) CG.UI.netVersusReady(v);
      if (v.go) { this.go(scene); return; }
      if (this.host && scene.netWait.ready >= people.length) rref.child('go').set(Date.now()).catch(() => {});
    });
    this.readyRef = rref;
    scene.events.once('shutdown', () => this.detach());
    return this;
  },

  // everyone is in (or the host stopped waiting): start the stage on every screen at once
  go(scene) {
    if (!scene.netWait) return;
    const manual = scene.netWait.manual;
    scene.netWait = null;
    scene.physics.resume();
    if (manual) CG.UI.netVersusGo();
    this.snapAt = Date.now();
    scene.netGo();
  },
  // the host gives up on someone who never loads after 15 s
  waitTick(scene) {
    const w = scene.netWait;
    const limit = w && w.manual ? 30000 : 15000;                                   // a duel gives READY 30 s
    if (this.host && w && Date.now() - w.since > limit && this.readyRef) this.readyRef.child('go').set(Date.now()).catch(() => {});
    if (!this.host && w && Date.now() - w.since > limit + 10000) this.ended('host-left');      // the host never started it
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
    // tell everyone first: my soldier and my bots vanish from their screens straight away
    if (this.scene && !this.scene.over) {
      const mine = this.scene.players.filter((p) => p.owner === N.uid);
      this.shout('quit', { ids: mine.map((p) => p.netId), name: (mine.find((p) => !p.bot) || {}).name || '' });
    }
    if (this.host) this.base.child('info/ended').set(this.scene && !this.scene.over ? 'host-left' : 'done').catch(() => {});
    if (this.scene) for (const p of this.scene.players) if (p.owner === N.uid) this.base.child('p/' + p.netId).remove().catch(() => {});
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
    // this game was asleep (phone app switch, hidden tab): nobody else is "gone" just because this game stopped
    // looking — give the snapshots a moment to arrive, and a host checks it is still the host before writing
    const now = Date.now();
    if (now - this.tickAt > 2000) {
      this.snapAt = now; this.hostLeftAt = 0;
      for (const p of sc.players) p.goneAt = 0;
      if (this.host) {
        this.verifying = true;
        this.base.child('info/host').get().then((s) => { this.verifying = false; this.hostIs(s.val(), true); }).catch(() => { this.verifying = false; });
      }
    }
    this.tickAt = now;
    this.sendT -= dt * 1000; this.snapT -= dt * 1000;
    if (this.sendT <= 0) {
      this.sendT = 70;
      const up = {};
      for (const p of sc.players) if (p.owner === N.uid) up['p/' + p.netId] = JSON.stringify(this.playerState(p));
      this.base.update(up).catch(() => {});
    }
    if (this.host && this.snapT <= 0 && !this.verifying) {
      this.snapT = 100;
      this.base.child('s').set(JSON.stringify(this.snapshot())).catch(() => {});
    }
    if (!this.host && this.snapNew) { this.snapNew = false; this.applySnapshot(); }
    // the host is gone: its connection closed and no snapshot for 2 s, or nothing at all from it for 6 s — someone takes over
    const quiet = now - this.snapAt;
    if (!this.host && ((this.hostLeftAt && quiet > 2000) || quiet > 6000)) { this.migrate(); return; }
    if (!this.host) this.movePuppets(dt);
    this.leftCheck();
  },

  // ---------------------------------------------------------------- someone left
  // host: a person whose soldier stopped reporting for 3 s has left — out of the match (a duel side that is gone loses)
  // every game: a soldier whose game stopped reporting for 3 s is gone from this screen too; one that was only away
  // (it reports again) comes back — unless that person QUIT
  leftCheck() {
    const sc = this.scene, now = Date.now();
    for (const p of sc.players) {
      if (!p.remote) continue;
      const raw = this.ps[p.netId];
      if (p.left) { if (!p.quit && raw && raw !== p.leftRaw) this.rejoin(p); continue; }
      if (raw) { p.goneAt = 0; continue; }
      if (!p.netSeen) continue;
      if (!p.goneAt) p.goneAt = now;
      else if (now - p.goneAt > 3000) this.dropPlayer(p);
    }
  },
  hidePlayer(p) {
    p.visual.setVisible(false); p.tag.setVisible(false); if (p.rankImg) p.rankImg.setVisible(false); p.bar.clear();
    if (p.shield) p.shield.setVisible(false);
  },
  dropPlayer(p, quit) {
    const sc = this.scene;
    if (p.left) return;
    const c = p.body ? { x: p.body.center.x, y: p.body.center.y } : null;
    p.left = true; p.out = true; p.leftRaw = this.ps[p.netId];
    if (quit) p.quit = true;
    CG.Rescue.reset(p);
    if (c && p.visual.visible) sc.sparks.explode(16, c.x, c.y);          // a puff where they stood
    this.hidePlayer(p);
    if (p.body) p.body.enable = false;
    if (!p.bot) sc.notice(p.name + (quit ? ' HAS QUIT' : ' LOST CONNECTION'), quit ? '#ff6a5a' : '#ffd23c');
    if (sc.pvp && !sc.ffa && !sc.over && this.host) {                         // a duel: a side with nobody left loses
      for (const t of [0, 1]) {
        if (sc.players.some((q) => q.team === t && !q.left)) continue;
        sc.duelWinner = 1 - t; sc.duelOver(1 - t);
        return;
      }
    }
    if (this.host && !sc.pvp) sc.checkOver();
  },
  // a soldier that was only away is back
  rejoin(p) {
    const sc = this.scene;
    p.left = false; p.out = false; p.goneAt = 0; p.leftRaw = undefined;
    if (p.body) p.body.enable = true;
    if (!p.bot) sc.notice(p.name + ' IS BACK', '#7cff8a');
  },
  // the host is gone: the person still here with the lowest uid becomes the host, everyone else follows them
  migrate() {
    const sc = this.scene, N = CG.Net;
    if (!sc || sc.over || !this.info) { this.ended('host-left'); return; }
    const old = this.info.host;
    if (this.goneHost === old) return;                   // already handled (the ended flag and the silence both say so)
    this.goneHost = old;
    const here = [...new Set(this.info.players.filter((q) => !q.bot && q.owner !== old && (q.owner === N.uid || this.ps[q.id])).map((q) => q.owner))].sort();
    if (!here.length) { this.ended('host-left'); return; }
    this.info.host = here[0];
    for (const p of sc.players) if (p.owner === old && !p.left) this.dropPlayer(p);       // the old host's soldier and bots go
    const who = (this.info.players.find((q) => q.owner === here[0] && !q.bot) || {}).name || 'A PLAYER';
    sc.notice('HOST LEFT — ' + who + ' TAKES OVER', '#ffd23c');
    this.snapAt = Date.now(); this.hostLeftAt = 0;
    if (here[0] === N.uid) this.becomeHost();
  },
  // info/host changed (or was read again): follow it
  hostIs(uid, fromRead) {
    const sc = this.scene, N = CG.Net;
    if (!uid || !sc || !this.info) return;
    if (fromRead && this.host && uid !== N.uid && Date.now() - (this.claimedAt || 0) < 5000) return;     // a read older than my own take-over
    const was = this.info.host;
    this.info.host = uid;
    if (uid === N.uid) { if (!this.host) this.becomeHost(); return; }
    if (this.host) this.stepDown();
    else if (was !== uid) { this.goneHost = was; this.snapAt = Date.now(); this.hostLeftAt = 0; }
  },
  // this game thought it was the host but someone else is: hand over — its own enemies and pick-ups go (the real
  // host's snapshot brings the real ones back as puppets) and its hits are sent to the host again
  stepDown() {
    const sc = this.scene;
    this.host = false; sc.isClient = true;
    if (this.evOff) { this.evOff(); this.evOff = null; }
    const od = this.base.child('info/ended').onDisconnect();
    if (od.cancel) od.cancel().catch(() => {});
    for (const e of sc.enemies.getChildren().slice()) e.destroy();
    sc.pickups.children.iterate((k) => { if (k) sc.time.delayedCall(0, () => k.destroy()); });
    sc.ebullets.children.iterate((x) => { if (x && x.active) sc.kill(x); });
    this.puppets = {}; this.pickups = {};
    this.snap = null; this.snapNew = false; this.snapAt = Date.now();
  },
  listenEvents() {
    if (this.evOff) return;
    this.evOff = this.on(this.base.child('ev'), 'child_added', (s) => { this.event(s.val()); s.ref.remove(); });
    this.armHost();
  },
  armHost() { this.base.child('info/ended').onDisconnect().set('host-left'); },
  becomeHost() {
    const sc = this.scene, N = CG.Net, W = CG.CONFIG.W;
    this.host = true; sc.isClient = false; this.hostLeftAt = 0; this.claimedAt = Date.now();
    this.info.host = N.uid;
    this.base.child('info/host').set(N.uid).catch(() => {});
    this.base.child('info/ended').set(null).catch(() => {});
    this.listenEvents();
    // new enemies and pick-ups get ids after the ones already out there
    let top = sc.netSeq || 0;
    sc.enemies.getChildren().forEach((e) => { top = Math.max(top, e.netId || 0); });
    sc.pickups.children.iterate((k) => { if (k) top = Math.max(top, k.netId || 0); });
    sc.netSeq = top + 1000;
    // the enemies on screen become real ones (they were puppets the old host moved)
    for (const id in this.puppets) {
      const e = this.puppets[id];
      if (!e.active) continue;
      e.puppet = false;
      if (!e.T.fixed) { e.body.moves = true; e.body.allowGravity = !e.T.fly; }
    }
    this.puppets = {};
    for (const id in this.pickups) { const k = this.pickups[id]; if (k.active) k.body.moves = true; }
    this.pickups = {};
    // spawning picks up after what is already on screen (nothing behind the camera comes back)
    sc.spawnI = sc.spawns ? sc.spawns.findIndex((x) => x.x > sc.camX + W + 100) : 0;
    if (sc.spawnI < 0) sc.spawnI = sc.spawns.length;
    this.leftCheck();
  },

  // ---------------------------------------------------------------- players
  playerState(p) {
    const b = p.body, r = Math.round;
    return {
      x: r(b.center.x), y: r(b.bottom), vx: r(b.velocity.x), vy: r(b.velocity.y), f: p.facing, ax: +p.aimX.toFixed(2), ay: +p.aimY.toFixed(2),
      pr: p.prone ? 1 : 0, g: p.onGround ? 1 : 0, hp: p.hp, mx: p.maxHp, d: p.dead ? 1 : 0, o: p.out ? 1 : 0,
      sh: p.shots || 0, sp: (p.spread || p.stormT > 0) ? 1 : 0, st: p.stormT > 0 ? 1 : 0, dm: p.domeT > 0 ? 1 : 0, ds: p.dashT > 0 ? 1 : 0,
      ck: p.cloakT > 0 ? 1 : 0, wt: p.inWater ? 1 : 0,
      q: ++this.seq,                                     // always new: a soldier standing still still shows it is here
    };
  },

  // move a teammate whose game is on another device to where it says they are
  applyPlayer(p, dt) {
    const raw = this.ps[p.netId];
    if (!raw || p.left) { this.hidePlayer(p); return; }
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
    p.cloakT = s.ck ? 1000 : 0;
    if (CG.Rescue.enabled(sc)) CG.Rescue.remote(p, s.wt);              // sinking in their game: HELP! here, ROPE for me
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
    // t: always new, so the database sees a change even when nothing on screen moved (an unchanged value fires no
    // update, and a client hearing nothing for 6 s would think the host had gone)
    return { h: CG.Net.uid, t: Date.now(), st: sc.cfg.stage, sc: sc.score, lv: sc.teamLives, cx: r(sc.camX), bo: sc.bossOn ? 1 : 0, cl: sc.cleared ? 1 : 0, ov: sc.over ? 1 : 0, e, b, m, k,
      cb: [...sc.brokenCovers], kd: sc.kills || null, rd: sc.round || 0, win: sc.duelWinner === undefined ? null : sc.duelWinner, wv: sc.wave || 0 };
  },

  // events from the other players' games
  event(ev) {
    const sc = this.scene;
    if (!sc || !ev || !this.host) return;
    if (ev.t === 'hit') {
      const e = sc.enemies.getChildren().find((x) => x.active && x.netId === ev.id);
      if (e) e.damage(ev.n || 1);
    } else if (ev.t === 'kill') {
      if (sc.pvp) sc.downed(ev.victim, ev.killer);
    } else if (ev.t === 'cover') {
      const cv = sc.coverList && sc.coverList[ev.id];
      if (cv) sc.hitCover(cv, ev.n || 1, true);
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
    if (m.t === 'quit') {                                // someone quit: their soldier and bots vanish now
      for (const id of m.ids || []) { const p = sc.players.find((q) => q.netId === id && q.remote); if (p) this.dropPlayer(p, true); }
      if (this.info && m.from === this.info.host && !this.host) this.migrate();
      return;
    }
    if (m.t === 'flankfx') {                             // my shot flanked someone in their game: the impact frame here too
      const v = sc.players.find((q) => q.netId === m.id);
      sc.impactFrame(m.x, m.y, v && v.visual.visible ? v.visual : null);
      if (sc.players.some((q) => q.netId === m.by && q.owner === N.uid && !q.bot)) sc.heads++;
      return;
    }
    if (m.t === 'rope') { CG.Rescue.ropeFromNet(sc, m); return; }     // a teammate threw me the rope
    if (m.t === 'phit') {                                // a duel: someone's ability hit my soldier
      const p = sc.players.find((q) => q.netId === m.id && q.owner === N.uid);
      if (p && p.alive) { p.lastHitBy = sc.players.find((q) => q.netId === m.by) || null; p.hit(m.n || 1); }
      return;
    }
    if (m.t === 'blast') { sc.launchPlayers(m.x, m.y, m.r); return; }       // a teammate's grenade threw me
    if (m.t === 'feed') { if (sc.feedLine) sc.feedLine(m.msg); return; }     // a duel: who got whom
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
      sc.scene.restart(Object.assign({}, sc.cfg, { stage: s.st, score: s.sc, teamLives: s.lv, coinsEarned: sc.coinsEarned }));
      return;
    }
    sc.score = s.sc;
    if (sc.pvp && s.kd) {
      sc.kills = s.kd;
      if (s.rd && s.rd !== sc.round) { sc.round = s.rd; sc.resetRound(); }      // the host started a new round
      if (s.win !== null && s.win !== undefined && !sc.over) sc.duelOver(s.win);
      return this.applyDuelBits(s);
    }
    sc.teamLives = s.lv;
    sc.netCamX = s.cx;
    if (sc.horde && s.wv && s.wv !== sc.wave) { sc.wave = s.wv; sc.say('WAVE ' + s.wv, 1400); sc.stageText.setText('HORDE  ·  WAVE ' + s.wv); }
    if (s.bo && !sc.bossOn) { sc.bossOn = true; sc.say(CG.DATA.level.boss.say, 1800); }
    if (s.cl && !sc.cleared) { sc.cleared = true; sc.say('STAGE CLEAR', 2400); CG.Sfx.play('clear'); }
    if (s.ov && !sc.over) { sc.over = true; sc.say('GAME OVER', 5000); CG.Sfx.play('over'); sc.time.delayedCall(1400, () => CG.UI.gameOver(sc.score, sc.cfg.stage, Object.assign(sc.resultOpts(), { online: true, coins: sc.coinsEarned }))); }

    // cover the host says is broken
    for (const id of s.cb || []) { const cv = sc.coverList[id]; if (cv && !cv.broken) sc.breakCover(cv); }

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

  // a duel snapshot only needs the pick-ups and enemy-free bits
  applyDuelBits(s) {
    const sc = this.scene, ks = new Set();
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
