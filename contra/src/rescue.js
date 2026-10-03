// Falling in the water (story mode) is no longer the end straight away.
//   Alone (one person in the game, bots or not): the GRAPPLING HOOK. A timing bar appears over you — tap JUMP while
//     the marker is in the green (two tries, the second one harder). It costs a heart and works once per life; the
//     hook flies to the nearest edge in reach (ground, ledge or rock top) and pulls you out.
//   With other people (co-op on one device or online): no hook. You sink slowly for 6 s with HELP! over you; a
//     teammate near you presses SKILL (it says ROPE) and plays the same timing bar — hit it and the rope pulls you
//     out next to them. Online the rescuer's game sends a `rope` message and the sinking player's own game pulls.
//   Bots: a bot that falls in hooks itself out (more often the better it is); bots throw the rope to anyone sinking.
//   Duels, free-for-all and horde: the water is death, as before.
// Art from hook.png (hook_open, hook_closed, rope_piece, rope_coil, fx_grab_1/2); a plain line stands in without it.
CG.Rescue = (() => {
  const T = () => CG.CONFIG.TILE;
  const SOLO_SINK = 4800, TEAM_SINK = 6000, REACH = 8, ROPE_RANGE = 340;
  const enabled = (sc) => !sc.pvp && !sc.horde;
  const solo = (sc) => sc.players.filter((p) => !p.bot).length <= 1;
  const gyOf = () => CG.DATA.level.groundRow * T();
  const has = (sc, k) => sc.textures.exists(k);

  // ---------------------------------------------------------------- into the water
  function enter(p) {
    const sc = p.scene, b = p.body;
    p.inWater = true; p.sinkAt = sc.time.now; p.sinkMs = solo(sc) ? SOLO_SINK : TEAM_SINK;
    b.setAllowGravity(false); b.setVelocity(0, 30);
    p.setProne(false);
    sc.splash(b.center.x);
    CG.Sfx.play('hit');
    if (p.remote) return;
    if (p.bot) {                                         // a bot tries its hook once, as well as it plays
      if (!p.hookUsed) sc.time.delayedCall(900, () => { if (p.inWater && !p.pull && Math.random() < 0.3 + 0.6 * (p.skill || 0)) hook(p); });
    } else if (solo(sc) && !p.hookUsed) startMini(p, 'hook');
  }

  // ---------------------------------------------------------------- the timing bar (over the player who plays it)
  function startMini(p, kind, target) {
    const sc = p.scene;
    p.mini = { kind, target, t: Math.random() * 2, tries: 2, zone: 0.26, speed: 1.15, flash: 0,
      g: sc.add.graphics().setDepth(45),
      txt: sc.add.text(0, 0, kind === 'hook' ? 'HOOK!  TAP JUMP IN THE GREEN' : 'ROPE!  TAP JUMP IN THE GREEN', { fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontStyle: '800', color: '#ffd23c' })
        .setOrigin(0.5, 1).setDepth(45).setShadow(0, 2, '#000', 3) };
  }
  function endMini(p) {
    if (!p.mini) return;
    p.mini.g.destroy(); p.mini.txt.destroy();
    p.mini = null;
  }
  function tickMini(p, dt, pressed) {
    const m = p.mini, sc = p.scene, b = p.body;
    m.t += dt; m.flash = Math.max(0, m.flash - dt);
    const pos = (Math.sin(m.t * m.speed * Math.PI) + 1) / 2;                 // 0..1, swinging
    const W = 240, H = 22, x = b.center.x - W / 2, y = (p.inWater ? Math.min(b.top, gyOf()) : b.top) - 78;
    const g = m.g;
    g.clear();
    g.fillStyle(0x000000, 0.75).fillRect(x - 4, y - 4, W + 8, H + 8);
    g.fillStyle(m.flash > 0 ? 0x7a1010 : 0x2a2f36, 1).fillRect(x, y, W, H);
    g.fillStyle(0x3ccf4e, 1).fillRect(x + W * (0.5 - m.zone / 2), y, W * m.zone, H);
    g.fillStyle(0xffffff, 1).fillRect(x + W * pos - 3, y - 6, 6, H + 12);
    for (let i = 0; i < m.tries; i++) g.fillStyle(0xffd23c, 1).fillCircle(x + W + 14 + i * 14, y + H / 2, 4);
    m.txt.setPosition(b.center.x, y - 8);
    if (!pressed) return;
    if (Math.abs(pos - 0.5) <= m.zone / 2) {                                   // hit
      CG.Sfx.play('pickup');
      const { kind, target } = m;
      endMini(p);
      if (kind === 'hook') hook(p); else throwRope(p, target);
    } else {                                                                    // miss: smaller, faster, one try fewer
      m.tries--; m.flash = 0.35; m.zone *= 0.75; m.speed *= 1.3;
      CG.Sfx.play('hit');
      if (m.tries <= 0) { endMini(p); sc.popText(b.center.x, b.top - 40, 'MISSED', '#ff6a5a'); }
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
    p.hp = Math.max(1, p.hp - 1);                                              // a rescue costs a heart
    pull(p, a.x, a.y, 'hook');
  }

  // ---------------------------------------------------------------- the rope (a teammate)
  function throwRope(rescuer, q) {
    const sc = rescuer.scene, b = rescuer.body;
    if (!q || !q.inWater) return;
    const x = b.center.x - rescuer.facing * 10, y = b.bottom;
    if (q.remote) {                                     // online: their own game pulls them; show the rope here
      if (sc.net) sc.net.shout('rope', { target: q.netId, x: Math.round(x), y: Math.round(y) });
      ropeFlash(sc, x, y - 20, q);
    } else pull(q, x, y, 'rope');
    sc.popText(b.center.x, b.top - 40, 'ROPE!', '#ffd23c');
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

  // ---------------------------------------------------------------- HELP! over someone sinking (co-op)
  function help(p, on) {
    const sc = p.scene;
    if (!on) { if (p.helpTxt) { p.helpTxt.destroy(); p.helpTxt = null; } return; }
    if (!p.helpTxt) p.helpTxt = sc.add.text(0, 0, 'HELP!', { fontFamily: 'Black Ops One, Impact, sans-serif', fontSize: '30px', color: '#ff5a4a' })
      .setOrigin(0.5, 1).setDepth(44).setShadow(0, 3, '#000', 0);
    p.helpTxt.setPosition(p.body.center.x, Math.min(p.body.top, gyOf()) - 30).setVisible(Math.floor(sc.time.now / 250) % 2 === 0);
  }
  // "SKILL = ROPE" over a player who could throw the rope right now
  function hint(p, on) {
    const sc = p.scene;
    if (!on) { if (p.ropeHint) { p.ropeHint.destroy(); p.ropeHint = null; } return; }
    if (!p.ropeHint) p.ropeHint = sc.add.text(0, 0, 'SKILL = ROPE', { fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontStyle: '800', color: '#ffd23c' })
      .setOrigin(0.5, 1).setDepth(44).setShadow(0, 2, '#000', 3);
    p.ropeHint.setPosition(p.body.center.x, p.body.top - 46);
  }
  // a teammate sinking near this player (the one a rope would reach)
  function sinkingNear(p) {
    const sc = p.scene;
    if (!p.alive || p.inWater || (!p.onGround && !p.bot)) return null;     // people throw standing; bots even mid-hop
    return sc.players.find((q) => q !== p && q.alive && q.inWater && !q.pull && Math.abs(q.body.center.x - p.body.center.x) < ROPE_RANGE) || null;
  }

  // ---------------------------------------------------------------- every frame, for each local player
  // returns true when this player's normal update should be skipped (sinking, pulled out, playing the rope bar)
  function update(p, dt, inp) {
    const sc = p.scene, b = p.body;
    if (!enabled(sc)) return false;
    const hideTag = () => { p.tag.setVisible(false); if (p.rankImg) p.rankImg.setVisible(false); p.bar.clear(); };
    if (p.pull) { tickPull(p, dt); p.sync(dt); hideTag(); return true; }
    if (p.inWater) {
      hideTag();
      b.setVelocity(0, 30);
      p.invT = Math.max(p.invT, 120);                    // helpless in the water: bullets miss you (you blink)
      p.visual.setTint(0x9cc8ff);
      if (p.mini) tickMini(p, dt, inp.jumpPressed);
      help(p, !solo(sc) && !p.pull);
      p.sync(dt);
      if (sc.time.now - p.sinkAt > p.sinkMs) {                                   // gone under
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
    hint(p, !!q && !p.bot);
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
    if (p.inWater && !was) p.scene.splash(p.body.center.x);
    help(p, p.inWater);
  }

  return { PH: 100, falls, update, reset, ropeFromNet, remote, enabled };
})();
