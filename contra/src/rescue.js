// Falling in the water (story mode) is no longer the end straight away.
//   Alone (one person in the game, bots or not): the GRAPPLING HOOK. A timing bar appears over you — tap JUMP while
//     the marker is in the green (two tries, the second one harder). It is free (starting gear) and works once per life; the
//     hook flies to the nearest edge in reach (ground, ledge or rock top) and pulls you out.
//   With other people (co-op on one device or online): no hook. You sink slowly for up to 20 s with a SINKING! marker (ring countdown) over you; a
//     teammate near you presses SKILL (it says ROPE) and plays the same timing bar — hit it and the rope pulls you
//     out next to them. Online the rescuer's game sends a `rope` message and the sinking player's own game pulls.
//   Bots: a bot that falls in hooks itself out (more often the better it is); bots throw the rope to anyone sinking.
//   Duels, free-for-all and horde: the water is death, as before.
// Art from hook.png (hook_open, hook_closed, rope_piece, rope_coil, fx_grab_1/2); a plain line stands in without it.
CG.Rescue = (() => {
  const T = () => CG.CONFIG.TILE;
  const SOLO_SINK = 20000, TEAM_SINK = 20000, REACH = 8, ROPE_RANGE = 340;      // up to 20 s to be saved
  const enabled = (sc) => !sc.pvp && !sc.horde;
  const solo = (sc) => sc.players.filter((p) => !p.bot).length <= 1;
  const gyOf = () => CG.DATA.level.groundRow * T();
  const has = (sc, k) => sc.textures.exists(k);
  // the key this player presses for an action, as words on the screen ("PRESS C", "TAP SKILL", "PRESS Y")
  function keyFor(p, action) {
    const d = (p.device && p.device.type) || 'any';
    if (d === 'touch' || (d === 'any' && CG.Touch.enabled)) return 'TAP ' + (action === 'ability' ? 'SKILL' : 'JUMP');
    if (d === 'pad') return 'PRESS ' + (action === 'ability' ? 'Y' : 'A');
    if (d === 'kbA') return 'PRESS ' + (action === 'ability' ? 'H' : 'G');
    if (d === 'kbB') return 'PRESS ' + (action === 'ability' ? 'O' : 'L');
    const keys = CG.Keys.get()[action] || [];
    const k = keys.find((x) => x[1] === 'SPACE') || keys[0];
    return 'PRESS ' + (k ? k[1] : action.toUpperCase());
  }

  // ---------------------------------------------------------------- into the water
  function enter(p) {
    const sc = p.scene, b = p.body;
    // the water drains you: a heart every (20 s / max hearts), so full health lasts 20 s and fewer hearts less;
    // whoever is pulled out keeps what is left
    const full = solo(sc) ? SOLO_SINK : TEAM_SINK;
    p.inWater = true; p.sinkAt = sc.time.now; p.hpAtSink = Math.max(1, p.hp);
    p.drainMs = full / Math.max(1, p.maxHp);
    p.sinkMs = p.hpAtSink * p.drainMs;
    b.setAllowGravity(false); b.setVelocity(0, 30);
    p.setProne(false);
    sc.splash(b.center.x);
    CG.Sfx.play('hit');
    announce(p);
    if (p.remote) return;
    if (p.bot) {                                         // a bot tries its hook once, as well as it plays
      if (!p.hookUsed) sc.time.delayedCall(900, () => { if (p.inWater && !p.pull && Math.random() < 0.3 + 0.6 * (p.skill || 0)) hook(p); });
    } else if (solo(sc) && !p.hookUsed) startMini(p, 'hook');
  }

  // ---------------------------------------------------------------- shared look
  const FONT_HEAD = 'Black Ops One, Impact, sans-serif', FONT_UI = 'Rajdhani, sans-serif';
  // world UI scale: the game is drawn ~40 % of its size on a phone, so touch screens get it much bigger
  const UI = () => (CG.Touch.enabled ? 2.2 : 1.5);
  const KEYTXT = (p, action) => keyFor(p, action).replace(/^(PRESS|TAP) /, '');
  const touchy = (p) => { const d = (p.device && p.device.type) || 'any'; return d === 'touch' || (d === 'any' && CG.Touch.enabled); };
  // a keyboard key cap (or, on a touch screen, the button's picture) — what to press, drawn as a key
  function keycap(sc, p, action, icon) {
    const c = sc.add.container(0, 0).setDepth(46);
    const g = sc.add.graphics();
    g.fillStyle(0x0b0f13, 1).fillRoundedRect(-24, -22, 48, 48, 9);                    // shadow / side
    g.fillStyle(0xf1ece0, 1).fillRoundedRect(-24, -26, 48, 46, 9);                    // the key top
    g.lineStyle(2, 0x0b0f13, 1).strokeRoundedRect(-24, -26, 48, 46, 9);
    c.add(g);
    if (touchy(p) && icon && has(sc, 'ui_' + icon)) {
      const im = sc.add.image(0, -3, 'ui_' + icon); im.setScale(34 / Math.max(im.width, im.height)); c.add(im);
    } else {
      const label = touchy(p) ? (action === 'ability' ? 'SKILL' : 'JUMP') : KEYTXT(p, action);
      c.add(sc.add.text(0, -3, label, { fontFamily: FONT_UI, fontSize: label.length > 2 ? '15px' : '26px', fontStyle: '800', color: '#14181d' }).setOrigin(0.5));
    }
    return c;
  }

  // ---------------------------------------------------------------- the timing gauge (over the player who plays it)
  // a half-moon dial: the needle swings across, the GREEN arc is a hit, the GOLD middle is PERFECT
  function startMini(p, kind, target) {
    const sc = p.scene;
    const c = sc.add.container(0, 0).setDepth(46);
    const g = sc.add.graphics();
    const title = sc.add.text(0, -104, kind === 'hook' ? 'GRAPPLE!' : 'THROW THE ROPE!', { fontFamily: FONT_HEAD, fontSize: '26px', color: '#ffd23c' }).setOrigin(0.5).setShadow(0, 3, '#000', 0);
    const key = keycap(sc, p, 'jump', kind);
    key.setPosition(-44, 34);
    const hint = sc.add.text(-12, 34, 'IN THE GREEN', { fontFamily: FONT_UI, fontSize: '17px', fontStyle: '800', color: '#ffffff' }).setOrigin(0, 0.5).setShadow(0, 2, '#000', 2);
    c.add([g, title, key, hint]);
    const easy = touchy(p);                                                   // thumbs get a wider green zone and a slower needle
    p.mini = { kind, target, t: Math.random() * 2, tries: 2, zone: easy ? 0.38 : 0.28, speed: easy ? 0.75 : 0.95, flash: 0, ok: 0, c, g, title };
    sc.tweens.add({ targets: c, scale: { from: 0.4 * UI(), to: UI() }, duration: 220, ease: 'Back.out' });
  }
  function endMini(p) {
    if (!p.mini) return;
    p.mini.c.destroy();
    p.mini = null;
  }
  function drawGauge(m, pos) {
    const g = m.g, R = 64, A0 = Math.PI, span = Math.PI;                       // left → right across the top
    const ang = (f) => A0 + f * span;
    g.clear();
    g.fillStyle(0x0b0f13, 0.85).slice(0, 0, R + 16, Math.PI, 0, false).fillPath();
    g.lineStyle(16, m.flash > 0 ? 0x7a1414 : 0x2a313a, 1).beginPath().arc(0, 0, R, Math.PI, 0, false).strokePath();
    const z = m.zone, pz = z * 0.34;
    g.lineStyle(16, 0x3ccf4e, 1).beginPath().arc(0, 0, R, ang(0.5 - z / 2), ang(0.5 + z / 2), false).strokePath();
    g.lineStyle(16, 0xffd23c, 1).beginPath().arc(0, 0, R, ang(0.5 - pz / 2), ang(0.5 + pz / 2), false).strokePath();
    g.lineStyle(2, 0x0b0f13, 1).beginPath().arc(0, 0, R + 8, Math.PI, 0, false).strokePath();
    g.beginPath().arc(0, 0, R - 8, Math.PI, 0, false).strokePath();
    const a = ang(pos), col = m.ok > 0 ? 0x7cff8a : m.flash > 0 ? 0xff5a4a : 0xffffff;
    g.lineStyle(6, 0x0b0f13, 1).lineBetween(0, 0, Math.cos(a) * (R + 12), Math.sin(a) * (R + 12));
    g.lineStyle(3, col, 1).lineBetween(0, 0, Math.cos(a) * (R + 10), Math.sin(a) * (R + 10));
    g.fillStyle(0x0b0f13, 1).fillCircle(0, 0, 9);
    g.fillStyle(col, 1).fillCircle(0, 0, 5);
    for (let i = 0; i < 2; i++) {                                                    // tries left: two pips
      g.fillStyle(i < m.tries ? 0xffd23c : 0x3a3f46, 1).fillCircle(R + 26, -20 + i * 18, 6);
      g.lineStyle(2, 0x0b0f13, 1).strokeCircle(R + 26, -20 + i * 18, 6);
    }
  }
  function tickMini(p, dt, pressed) {
    const m = p.mini, sc = p.scene, b = p.body;
    m.t += dt; m.flash = Math.max(0, m.flash - dt);
    const pos = (Math.sin(m.t * m.speed * Math.PI) + 1) / 2;                 // 0..1, swinging
    const y = (p.inWater ? Math.min(b.top, gyOf()) : b.top) - 70 * UI();
    m.c.setPosition(b.center.x + (m.flash > 0 ? Math.sin(m.flash * 90) * 5 : 0), y);
    drawGauge(m, pos);
    if (!pressed) return;
    const off = Math.abs(pos - 0.5);
    if (off <= m.zone / 2) {                                                     // hit
      const perfect = off <= m.zone * 0.17;
      CG.Sfx.play('pickup');
      sc.popText(b.center.x, y - 130 * UI(), perfect ? 'PERFECT!' : 'NICE!', perfect ? '#ffd23c' : '#7cff8a');
      const kind = m.kind, target = m.target, c = m.c;
      m.ok = 1; drawGauge(m, pos);
      sc.tweens.add({ targets: c, scale: 1.2 * UI(), alpha: 0, duration: 200, onComplete: () => c.destroy() });
      p.mini = null;
      if (kind === 'hook') hook(p); else throwRope(p, target);
    } else {                                                                      // miss: smaller, faster, one try fewer
      m.tries--; m.flash = 0.35; m.zone *= 0.75; m.speed *= 1.3;
      CG.Sfx.play('hit');
      sc.cameras.main.shake(120, 0.004);
      if (m.tries <= 0) { endMini(p); sc.popText(b.center.x, y - 60, 'MISSED!', '#ff6a5a'); }
    }
  }

  // ---------------------------------------------------------------- the grappling hook (alone)
  // the nearest edge in reach: a point to land on, on the ground, a ledge or a rock top
  function anchor(p) {
    const L = CG.DATA.level, t = T(), gy = gyOf(), c = p.body.center;
    const pts = [];
    for (const [a, b2] of L.ground) { pts.push([a * t + 40, gy]); pts.push([b2 * t - 40, gy]); }
    for (const [col, row, w] of L.ledges) { pts.push([col * t + 30, row * t]); pts.push([(col + w) * t - 30, row * t]); }
    for (const [col, row, w] of L.blocks || []) { pts.push([col * t + 30, row * t]); pts.push([(col + w) * t - 30, row * t]); }
    let best = null, bd = Infinity;
    for (const [x, y] of pts) {
      const d = Math.hypot(x - c.x, y - c.y);
      if (Math.abs(x - c.x) <= REACH * t && y < c.y && d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  }
  function hook(p) {
    const sc = p.scene, a = anchor(p);
    p.hookUsed = true;
    if (!a) { sc.popText(p.body.center.x, p.body.top - 40, 'NOTHING IN REACH', '#ff6a5a'); return; }
    pull(p, a.x, a.y, 'hook');                                                 // free: everyone carries the hook
  }

  // ---------------------------------------------------------------- the rope (a teammate)
  function throwRope(rescuer, q) {
    const sc = rescuer.scene, b = rescuer.body;
    if (!q || !q.inWater) return;
    const x = b.center.x - rescuer.facing * 10, y = b.bottom;
    // the coil sails across to them, then the rope pulls tight
    coilFly(sc, b.center.x, b.top + 20, q.body.center.x, Math.min(q.body.top, gyOf()) + 10);
    if (q.remote) {                                     // online: their own game pulls them; show the rope here
      if (sc.net) sc.net.shout('rope', { target: q.netId, x: Math.round(x), y: Math.round(y) });
      sc.time.delayedCall(260, () => ropeFlash(sc, x, y - 20, q));
    } else sc.time.delayedCall(260, () => { if (q.inWater && !q.pull) pull(q, x, y, 'rope'); });
  }
  function coilFly(sc, x1, y1, x2, y2) {
    if (!has(sc, 'rope_coil')) return;
    const c = sc.add.image(x1, y1, 'rope_coil').setDepth(47).setScale((sc.artScale.rope_coil || 0.2) * 0.8);
    sc.tweens.add({ targets: c, x: x2, duration: 260, ease: 'Linear' });
    sc.tweens.add({ targets: c, y: Math.min(y1, y2) - 90, duration: 130, ease: 'Quad.out', onComplete: () => sc.tweens.add({ targets: c, y: y2, duration: 130, ease: 'Quad.in' }) });
    sc.tweens.add({ targets: c, angle: 540, duration: 260 });
    sc.time.delayedCall(270, () => c.destroy());
  }
  // a rope seen for a moment (online, while the other game does the pulling)
  function ropeFlash(sc, x, y, q) {
    const r = drawRope(sc, null, x, y, q.body.center.x, q.body.center.y);
    sc.time.delayedCall(600, () => r.destroy());
  }
  function drawRope(sc, old, x1, y1, x2, y2) {
    const len = Math.max(4, Math.hypot(x2 - x1, y2 - y1)), ang = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
    if (has(sc, 'rope_piece')) {
      const src = sc.textures.get('rope_piece').getSourceImage(), k = 14 / src.width;
      const r = old || sc.add.tileSprite(0, 0, 14, 4, 'rope_piece').setOrigin(0.5, 0).setDepth(12).setTileScale(k, k);
      return r.setPosition(x1, y1).setSize(14, len).setRotation(ang);
    }
    const g = old || sc.add.graphics().setDepth(12);
    g.clear().lineStyle(7, 0x2a1608, 1).lineBetween(x1, y1, x2, y2).lineStyle(4, 0xa8703a, 1).lineBetween(x1, y1, x2, y2);
    return g;
  }

  // ---------------------------------------------------------------- pulled out along the rope
  function pull(q, x, y, kind) {
    const sc = q.scene;
    if (q.pull) return;
    endMini(q);
    q.pull = { x, y, t: 0, from: { x: q.body.center.x, y: q.body.center.y }, kind, rope: null, hook: null };
    if (kind === 'hook') {
      const k = has(sc, 'hook_closed') ? 'hook_closed' : null;
      if (k) q.pull.hook = sc.add.image(x, y + 4, k).setOrigin(0.5, 0.2).setDepth(13).setScale((sc.artScale[k] || 1) * 0.9);
    }
    CG.Sfx.play('jump');
  }
  function tickPull(q, dt) {
    const sc = q.scene, P = q.pull, b = q.body;
    P.t += dt;
    const k = Math.min(1, P.t / 0.55), e = 1 - Math.pow(1 - k, 2);          // fast at first, easing in at the top
    const cx = P.from.x + (P.x - P.from.x) * e, cy = P.from.y + (P.y - 50 - P.from.y) * e;
    b.reset(cx, cy); b.setVelocity(0, 0);
    P.rope = drawRope(sc, P.rope, P.x, P.y, cx, cy - 20);
    if (k < 1) return;
    // out: standing on the edge, a moment untouchable
    if (P.rope) P.rope.destroy();
    if (P.hook) sc.tweens.add({ targets: P.hook, alpha: 0, duration: 300, onComplete: () => P.hook.destroy() });
    grabFx(sc, P.from.x);
    q.pull = null; q.inWater = false;
    b.setAllowGravity(true);
    b.reset(P.x, P.y - CG.Rescue.PH / 2 - 2);
    q.invT = Math.max(q.invT, 1500);
    q.visual.clearTint();
    sc.popText(P.x, P.y - 120, P.kind === 'hook' ? 'HOOKED OUT!' : 'SAVED!', '#7cff8a');
  }
  function grabFx(sc, x) {
    const y = gyOf() + 40;
    if (has(sc, 'fx_grab_1')) {
      const s = sc.add.image(x, y, 'fx_grab_1').setOrigin(0.5, 1).setDepth(14).setScale(sc.artScale.fx_grab_1 || 1);
      sc.time.delayedCall(150, () => s.active && s.setTexture('fx_grab_2').setScale(sc.artScale.fx_grab_2 || 1));
      sc.tweens.add({ targets: s, alpha: 0, delay: 250, duration: 250, onComplete: () => s.destroy() });
    } else sc.splash(x);
  }

  // ---------------------------------------------------------------- the sinking marker (over anyone in the water)
  // their portrait in a ring that drains as their time runs out, SINKING! and the seconds left, bubbles rising
  function help(p, on) {
    const sc = p.scene;
    if (!on) { if (p.helpUI) { p.helpUI.c.destroy(); p.helpUI = null; } return; }
    if (!p.helpUI) {
      const c = sc.add.container(0, 0).setDepth(45);
      const g = sc.add.graphics();
      const key = 'portrait_' + p.agent.id;
      const face = has(sc, key) ? sc.add.image(0, 0, key) : null;
      if (face) face.setScale(46 / Math.max(face.width, face.height));
      const lbl = sc.add.text(0, -54, 'SINKING!', { fontFamily: FONT_HEAD, fontSize: '22px', color: '#ff5a4a' }).setOrigin(0.5).setShadow(0, 3, '#000', 0);
      const sec = sc.add.text(0, 44, '', { fontFamily: FONT_UI, fontSize: '18px', fontStyle: '800', color: '#ffffff', backgroundColor: '#7a1414', padding: { x: 6, y: 1 } }).setOrigin(0.5);
      const name = sc.add.text(0, 66, p.name, { fontFamily: FONT_UI, fontSize: '15px', fontStyle: '800', color: '#ffd23c' }).setOrigin(0.5).setShadow(0, 2, '#000', 2);
      c.add(face ? [g, face, lbl, sec, name] : [g, lbl, sec, name]);
      p.helpUI = { c, g, lbl, sec, bubT: 0 };
      sc.tweens.add({ targets: c, scale: { from: 0.3 * UI(), to: UI() }, duration: 260, ease: 'Back.out' });
    }
    const U = p.helpUI, left = Math.max(0, p.sinkMs - (sc.time.now - p.sinkAt)), f = left / (p.sinkMs || 1);
    const x = p.body.center.x, y = gyOf() - 96 * UI();
    U.c.setPosition(x, y + Math.sin(sc.time.now / 260) * 3);
    const g = U.g, danger = f < 0.34;
    g.clear();
    g.fillStyle(0x0b1620, 0.92).fillCircle(0, 0, 31);
    g.lineStyle(7, 0x2a0e0e, 1).strokeCircle(0, 0, 33);
    g.lineStyle(7, danger ? 0xff3a2a : 0xff8a3c, 1).beginPath().arc(0, 0, 33, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2, false).strokePath();
    g.lineStyle(2, 0x0b0f13, 1).strokeCircle(0, 0, 37);
    U.lbl.setAlpha(danger ? (Math.floor(sc.time.now / 160) % 2 ? 1 : 0.35) : 1);
    U.sec.setText((left / 1000).toFixed(1) + 's');
    // bubbles from where they went under
    U.bubT -= sc.game.loop.delta;
    if (U.bubT <= 0) {
      U.bubT = 140;
      const bx = x + (Math.random() - 0.5) * 50, by = gyOf() + 60;
      const bub = sc.add.circle(bx, by, 3 + Math.random() * 4, 0xbfe8ff, 0.85).setStrokeStyle(1, 0xffffff, 0.9).setDepth(4);
      sc.tweens.add({ targets: bub, y: gyOf() + 30, alpha: 0, duration: 520 + Math.random() * 300, ease: 'Quad.out', onComplete: () => bub.destroy() });
    }
  }
  // over a player who could throw the rope right now: their key as a key cap, PULL UP, and a dotted rope to them
  function hint(p, on, q) {
    const sc = p.scene;
    if (!on) { if (p.ropeUI) { p.ropeUI.c.destroy(); p.ropeUI.line.destroy(); p.ropeUI = null; } return; }
    if (!p.ropeUI) {
      const c = sc.add.container(0, 0).setDepth(46);
      const key = keycap(sc, p, 'ability', 'rope');
      key.setPosition(-46, 0);
      const t1 = sc.add.text(-14, -10, 'PULL UP', { fontFamily: FONT_HEAD, fontSize: '22px', color: '#ffd23c' }).setOrigin(0, 0.5).setShadow(0, 3, '#000', 0);
      const t2 = sc.add.text(-14, 13, '', { fontFamily: FONT_UI, fontSize: '15px', fontStyle: '800', color: '#ffffff' }).setOrigin(0, 0.5).setShadow(0, 2, '#000', 2);
      c.add([key, t1, t2]);
      p.ropeUI = { c, t2, line: sc.add.graphics().setDepth(44) };
      sc.tweens.add({ targets: c, scale: { from: 0.4 * UI(), to: UI() }, duration: 200, ease: 'Back.out' });
    }
    const U = p.ropeUI, b = p.body;
    U.t2.setText(q ? q.name : '');
    U.c.setPosition(b.center.x + 10, b.top - 56 * UI() + Math.sin(sc.time.now / 180) * 3);
    // the dotted rope from your hands to them, marching toward them
    const x1 = b.center.x, y1 = b.top + 40, x2 = q.body.center.x, y2 = Math.min(q.body.top, gyOf()) + 10;
    const len = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(len / 16), ph = (sc.time.now / 60) % 16;
    const g = U.line;
    g.clear();
    for (let i = 0; i < n; i++) {
      const f = (i * 16 + ph) / len, px = x1 + (x2 - x1) * f, py = y1 + (y2 - y1) * f - Math.sin(f * Math.PI) * 30;
      g.fillStyle(0x0b0f13, 0.9).fillCircle(px, py, 5);
      g.fillStyle(0xffd23c, 1).fillCircle(px, py, 3);
    }
  }
  // the alert card at the top of the screen while a teammate is sinking (co-op): who, how long, what to do
  function alertCard(sc) {
    const people = sc.players.filter((q) => !q.bot && !q.remote);
    const sinking = sc.players.filter((q) => q.inWater && !q.pull && q.alive && !(people.length === 1 && q === people[0]));
    if (!sinking.length || solo(sc)) { if (sc.rescueCard) { sc.rescueCard.c.destroy(); sc.rescueCard = null; } return; }
    const leftOf = (x) => x.sinkMs - (sc.time.now - x.sinkAt);
    const q = sinking.reduce((a, x) => (leftOf(x) < leftOf(a) ? x : a));
    const W = CG.CONFIG.W, cw = 540, ch = 80;
    if (!sc.rescueCard) {
      const c = sc.add.container(W / 2, 170).setScrollFactor(0).setDepth(56).setScale(CG.Touch.enabled ? 1.75 : 1.35);
      const g = sc.add.graphics();
      const icon = has(sc, 'ui_rope') ? sc.add.image(-cw / 2 + 44, 0, 'ui_rope') : null;
      if (icon) icon.setScale(52 / Math.max(icon.width, icon.height));
      const t1 = sc.add.text(-cw / 2 + 84, -18, '', { fontFamily: FONT_HEAD, fontSize: '24px', color: '#ff6a5a' }).setOrigin(0, 0.5);
      const t2 = sc.add.text(-cw / 2 + 84, 10, '', { fontFamily: FONT_UI, fontSize: '18px', fontStyle: '800', color: '#ffd23c' }).setOrigin(0, 0.5);
      c.add(icon ? [g, icon, t1, t2] : [g, t1, t2]);
      sc.rescueCard = { c, g, t1, t2 };
      sc.tweens.add({ targets: c, y: { from: 100, to: 170 }, alpha: { from: 0, to: 1 }, duration: 240, ease: 'Back.out' });
      if (sc.syncCams) sc.syncCams();
    }
    const C = sc.rescueCard, left = Math.max(0, leftOf(q)), f = left / (q.sinkMs || 1);
    // someone on this screen in reach? then their key, else: run to the edge
    const inReach = people.find((r) => !r.inWater && r.alive && r.onGround && Math.abs(r.body.center.x - q.body.center.x) < ROPE_RANGE);
    C.t1.setText(q.name + ' IS SINKING');
    C.t2.setText(inReach ? keyFor(inReach, 'ability') + ' TO THROW THE ROPE' : "GET TO THE WATER'S EDGE \u2014 FAST");
    const g = C.g, pulse = 0.5 + 0.5 * Math.sin(sc.time.now / 140);
    g.clear();
    g.fillStyle(0x1a0606, 0.92).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    g.lineStyle(3, Phaser.Display.Color.GetColor(255, Math.round(70 + 80 * pulse), 58), 1).strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 10);
    g.fillStyle(0x3a1010, 1).fillRect(-cw / 2 + 84, ch / 2 - 14, cw - 104, 7);
    g.fillStyle(f < 0.34 ? 0xff3a2a : 0xff8a3c, 1).fillRect(-cw / 2 + 84, ch / 2 - 14, (cw - 104) * f, 7);
  }
  // when a teammate falls in (co-op) the alert card does the talking; just a sound here
  function announce(p) {
    if (solo(p.scene)) return;
    CG.Sfx.play('hit');
  }
  // a teammate sinking near this player (the one a rope would reach)
  function sinkingNear(p) {
    const sc = p.scene;
    if (!p.alive || p.inWater || (!p.onGround && !p.bot)) return null;     // people throw standing; bots even mid-hop
    return sc.players.find((q) => q !== p && q.alive && q.inWater && !q.pull && Math.abs(q.body.center.x - p.body.center.x) < ROPE_RANGE) || null;
  }

  // ---------------------------------------------------------------- every frame, for each local player
  // returns true when this player's normal update should be skipped (sinking, pulled out, playing the rope bar)
  // the touch buttons tell this device's player what to press: ROPE on SKILL, HOOK / ROPE on JUMP during the bar
  function buttons(p, q) {
    if (p !== p.scene.touchPlayer) return;
    const skill = q && !p.mini ? 'rope' : null, jump = p.mini ? p.mini.kind : null;
    if (p.btnSkill !== skill) { p.btnSkill = skill; CG.Touch.overlay('ability', skill); }
    if (p.btnJump !== jump) { p.btnJump = jump; CG.Touch.overlay('jump', jump); }
  }
  function update(p, dt, inp) {
    const sc = p.scene, b = p.body;
    if (!enabled(sc)) return false;
    if (p === sc.players.find((q) => !q.bot && !q.remote)) alertCard(sc);
    if (!p.bot && !p.remote) buttons(p, p.inWater || p.pull ? null : sinkingNear(p));
    const hideTag = () => { p.tag.setVisible(false); if (p.rankImg) p.rankImg.setVisible(false); p.bar.clear(); };
    if (p.pull) { help(p, false); tickPull(p, dt); p.sync(dt); hideTag(); return true; }
    if (p.inWater) {
      hideTag();
      b.setVelocity(0, 30);
      p.invT = Math.max(p.invT, 120);                    // helpless in the water: bullets miss you (you blink)
      p.visual.setTint(0x9cc8ff);
      if (p.mini) tickMini(p, dt, inp.jumpPressed);
      help(p, !p.pull);
      p.sync(dt);
      hideTag();
      // drowning: hearts drain away while you are under (the HUD hearts show it)
      const want = Math.max(0, p.hpAtSink - Math.floor((sc.time.now - p.sinkAt) / p.drainMs));
      if (p.hp > want) {
        p.hp = want;
        sc.popText(b.center.x, gyOf() - 20, '-1 \u2665', '#ff5a4a');
        CG.Sfx.play('hit');
      }
      if (p.hp <= 0 || sc.time.now - p.sinkAt > p.sinkMs) {                     // gone under
        endMini(p); help(p, false);
        p.inWater = false; p.visual.clearTint(); b.setAllowGravity(true);
        sc.splash(b.center.x);
        p.die();
      }
      return true;
    }
    help(p, false);
    // a teammate is sinking nearby: bots throw on their own, people press SKILL and play the bar
    const q = sinkingNear(p);
    if (p.mini) {                                                            // playing the rope bar: stay put
      if (!p.mini.target || !p.mini.target.inWater || p.mini.target.pull) endMini(p);
      else { b.setVelocity(0, b.velocity.y); tickMini(p, dt, inp.jumpPressed); p.sync(dt); return true; }
    }
    hint(p, !!q && !p.bot, q);
    if (q && p.bot) {
      if (!p.ropeAt) p.ropeAt = sc.time.now + 1300;
      else if (sc.time.now > p.ropeAt) { p.ropeAt = 0; if (Math.random() < 0.35 + 0.6 * (p.skill || 0)) throwRope(p, q); }
    } else if (!q) p.ropeAt = 0;
    if (q && !p.bot && inp.abilityPressed) { inp.abilityPressed = false; hint(p, false); startMini(p, 'rope', q); return true; }
    return false;
  }

  // a player who should sink instead of dying (called where the water used to kill)
  function falls(p) {
    if (!enabled(p.scene) || p.inWater || p.pull) return false;
    enter(p);
    return true;
  }
  // a new life: everything back
  function reset(p) {
    endMini(p); help(p, false); hint(p, false);
    if (p.scene && p === p.scene.touchPlayer) { p.btnSkill = p.btnJump = null; CG.Touch.overlay('ability', null); CG.Touch.overlay('jump', null); }
    if (p.pull) { if (p.pull.rope) p.pull.rope.destroy(); if (p.pull.hook) p.pull.hook.destroy(); p.pull = null; }
    p.inWater = false; p.hookUsed = false; p.ropeAt = 0;
    if (p.visual) p.visual.clearTint();
  }
  // online: a teammate's game threw me the rope
  function ropeFromNet(sc, m) {
    const p = sc.players.find((q) => q.netId === m.target && !q.remote);
    if (p && p.inWater) pull(p, m.x, m.y, 'rope');
  }
  // online: someone else sinking, drawn here (their own game runs it)
  function remote(p, inWater) {
    const was = p.inWater;
    p.inWater = !!inWater;
    if (p.inWater && !was) { p.sinkAt = p.scene.time.now; p.sinkMs = Math.max(1, p.hp) * TEAM_SINK / Math.max(1, p.maxHp); p.scene.splash(p.body.center.x); announce(p); }
    help(p, p.inWater);
  }

  return { PH: 100, falls, update, reset, ropeFromNet, remote, enabled };
})();
