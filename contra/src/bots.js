// Computer-controlled teammates. CG.Bot.think() returns the same input state a keyboard or gamepad would,
// so a bot plays through exactly the same Player code as a person.
// How well a bot plays comes from its rank (p.skill, CG.Ranks.skill): a Bronze bot hesitates, sprays and wanders; from
// about Platinum (skill ≥ 0.5) a bot moves like a good player in a fight with other players — it never stands still,
// hops and double-jumps all the time, CROSSES UP (runs at you shooting your front, jumps over your head, turns and
// shoots your back: a flank), reads incoming shots and ducks under or jumps over them, and uses its ability when it pays.
CG.Bot = (() => {
  const T = () => CG.CONFIG.TILE;
  const skillOf = (p) => (p.skill == null ? 0.6 : p.skill);

  // the enemy a bot should shoot: closest one on screen
  function target(sc, p) {
    const cam = sc.cameras.main, c = p.body.center;
    let best = null, bd = Infinity;
    if (sc.pvp) {                                      // a duel: the nearest player on the other team
      for (const q of sc.players) {
        if (!sc.isFoe(p, q) || !q.alive || q.left) continue;
        const d = Math.hypot(q.body.center.x - c.x, q.body.center.y - c.y);
        if (d < bd) { bd = d; best = { body: q.body, T: { ai: 'player' }, player: q }; }
      }
      return best ? { e: best, d: bd } : null;
    }
    for (const e of sc.enemies.getChildren()) {
      if (!e.active || e.T.ai === 'flyer' && !e.extra) continue;
      if (e.x < cam.scrollX - 20 || e.x > cam.scrollX + CG.CONFIG.W + 20) continue;
      const d = Math.hypot(e.body.center.x - c.x, e.body.center.y - c.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best ? { e: best, d: bd } : null;
  }

  // a shot or bomb that will reach the bot within ~0.45 s (in a duel: the other team's bullets too).
  // duck = it flies high enough to pass over a soldier lying down
  function incoming(sc, p) {
    const c = p.body.center;
    let hit = null;
    const check = (b) => {
      if (!b || !b.active || hit || !b.body) return;
      if (b.isBullet && (!sc.pvp || !b.shooter || !sc.isFoe(b.shooter, p))) return;
      const vx = b.body.velocity.x, vy = b.body.velocity.y, dx = c.x - b.x, dy = c.y - b.y, v2 = vx * vx + vy * vy;
      if (!v2 || dx * vx + dy * vy <= 0) return;                 // standing still or flying away
      const tt = (dx * vx + dy * vy) / v2;                        // seconds to its closest pass
      if (tt > 0.45) return;
      const mx = b.x + vx * tt - c.x, my = b.y + vy * tt - c.y;
      if (Math.abs(mx) < 50 && Math.abs(my) < 75) hit = { tt, duck: b.y < p.body.bottom - 62 && Math.abs(vy) < 200 };
    };
    if (sc.pvp) sc.bullets.children.iterate(check);
    sc.ebullets.children.iterate(check);
    sc.ebombs.children.iterate(check);
    return hit;
  }

  // a bot plays as well as its rank: low ranks hesitate before shooting, waste shots, slip on their aim and rarely
  // use their dash or ability; high ranks are sharp
  function skilled(p, mem, s) {
    const k = skillOf(p);
    if (s.shoot) {
      if (mem.seen === undefined) mem.seen = mem.t;
      if (mem.t - mem.seen < (1 - k) * 90) s.shoot = false;                    // reaction time
      else if (Math.random() > 0.2 + 0.8 * k) s.shoot = false;                 // trigger discipline
    } else mem.seen = undefined;
    if (Math.random() < (1 - k) * 0.35) { s.up = !s.up; s.down = Math.random() < 0.3; }   // aim slips
    // a weak bot freezes up now and then (stands still for a moment) and wanders the wrong way
    if (mem.freeze > mem.t) { s.left = s.right = false; s.jump = false; }
    else if (Math.random() < (1 - k) * 0.02) mem.freeze = mem.t + 20 + Math.random() * 40 * (1 - k);
    if (Math.random() < (1 - k) * 0.08) { const l = s.left; s.left = s.right; s.right = l; }
    if (k < 0.4) s.dash = false;
    if (s.ability && Math.random() > 0.1 + 0.9 * k) s.ability = false;
    return s;
  }
  function think(sc, p, mem) {
    return skilled(p, mem, decide(sc, p, mem));
  }

  // 8-way aim at a point dx, dy away; returns the direction to move (turning to face it when standing)
  // (runDown: diagonal-down shots on the ground too, by running — the story; in a duel down on the ground means prone)
  function aim(s, p, dx, dy, dir, runDown, keepMove) {
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct === -2) { s.up = true; return keepMove ? dir : 0; }                   // straight up: stand still (a good bot keeps moving)
    if (oct === 2 && !p.onGround) { s.down = true; return dir; }
    const face = Math.abs(oct) <= 1 ? 1 : -1;
    if (oct === -1 || oct === -3) s.up = true;
    if ((oct === 1 || oct === 3) && (runDown || !p.onGround)) s.down = true;
    if ((s.up || s.down) && !dir) dir = face;
    if (!dir && face !== p.facing) dir = face;                                    // turn to face it
    return dir;
  }

  // when the agent's ability pays off (pvp: against the other player; story: against the army)
  function wantsAbility(sc, p, foeD, foe, inc) {
    const id = p.agent.id;
    switch (id) {
      case 'nova': return p.hp <= p.maxHp - 2 || sc.players.some((q) => q !== p && q.alive && !sc.isFoe(p, q) && q.hp <= q.maxHp - 3);
      case 'brick': return !!inc || p.hp <= p.maxHp / 2;
      case 'kite': return !!inc || (foeD > 260 && foeD < 520);
      case 'ghost': return foeD < 560;
      case 'hammer': return foeD < 280;
      case 'volt': return foeD < 540;
      case 'razor': case 'duke': return foeD < 620;
      case 'viper': return foeD < 460;
      case 'jax': return foeD > 160 && foeD < 520;
      case 'atlas': return foeD < 900;
      default: return foeD < 520;
    }
  }

  function decide(sc, p, mem) {
    const s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false, dash: false };
    if (!p.alive) return s;
    const c = p.body.center, cam = sc.cameras.main, k = skillOf(p);
    mem.t = (mem.t || 0) + 1;

    if (sc.pvp) return duel(sc, p, mem, s);
    // where to be: a little behind the furthest-ahead person (or pushing on if nobody else is alive)
    const people = sc.players.filter((q) => q.alive && !q.bot);
    const lead = people.length ? Math.max(...people.map((q) => q.body.center.x)) : cam.scrollX + CG.CONFIG.W * 0.75;
    let goal = lead - 140 - p.idx * 55;
    if (!people.length) goal = cam.scrollX + CG.CONFIG.W * 0.6;
    goal = Phaser.Math.Clamp(goal, cam.scrollX + 120, cam.scrollX + CG.CONFIG.W - 160);

    const t = target(sc, p);
    let dir = Math.abs(goal - c.x) > 60 ? Math.sign(goal - c.x) : 0;
    if (t) {
      const ec = t.e.body.center, dx = ec.x - c.x, dy = ec.y - c.y;
      s.shoot = true;
      dir = aim(s, p, dx, dy, dir, true);
      if (t.d < 170 && t.e.T.ai === 'runner') s.jump = mem.t % 30 === 0;            // hop over a charging runner
    }
    if (dir > 0) s.right = true;
    if (dir < 0) s.left = true;

    // gaps: jump from the very edge (the longest jump), walls: jump over them
    if (p.onGround && dir) {
      const edge = !sc.isSurface(c.x + dir * 30, p.body.bottom + 10);
      const wall = dir > 0 ? p.body.blocked.right : p.body.blocked.left;
      if (edge || wall) s.jump = true;
      if (edge) { s.left = dir < 0; s.right = dir > 0; }      // keep running through the jump
    }
    // over a gap: use the double jump at the top of the first one
    if (!p.onGround && dir && p.body.velocity.y > -80 && !sc.isSurface(c.x + dir * 60, CG.DATA.level.groundRow * T() + 10)) s.jump = mem.t % 2 === 0;
    // fell short into a pit anyway: one big recovery jump toward where it was heading (bots only)
    const groundY = CG.DATA.level.groundRow * T();
    if (!p.onGround && p.body.bottom > groundY + 20 && p.body.velocity.y > 0 && !mem.rescued) {
      mem.rescued = true;
      p.body.velocity.y = -1250;
      p.facing = dir || p.facing;
    }
    if (p.onGround) mem.rescued = false;
    if (mem.rescued && !p.onGround) { s.left = p.facing < 0; s.right = p.facing > 0; s.down = false; }
    const inc = incoming(sc, p);
    if (inc && Math.random() < 0.15 + 0.8 * k) { if (p.onGround) s.jump = true; else if (p.mdashCd <= 0 && mem.t % 4 === 0) s.dash = true; }

    // abilities
    const enemiesNear = sc.enemies.getChildren().filter((e) => e.active && Math.abs(e.x - c.x) < 700).length;
    if (p.abilityCd <= 0) {
      const ab = p.agent.id;
      if (ab === 'nova') s.ability = sc.players.some((q) => q.alive && q.hp <= q.maxHp - 3 && Math.abs(q.body.center.x - c.x) < 600);
      else if (ab === 'brick') s.ability = (p.hp <= p.maxHp / 2 && enemiesNear > 0) || (!!inc && k > 0.6);
      else if (ab === 'kite') s.ability = t && t.d < 380 && Math.abs(t.e.body.center.y - c.y) < 60;
      else s.ability = enemiesNear >= (k > 0.6 ? 2 : 3) || (t && t.e.T.boss);
    }
    return s;
  }

  // the way a good player moves in a fight with other players (see the top of this file)
  function proMove(sc, p, mem, s, foe, dx, dy, k) {
    const adx = Math.abs(dx), now = mem.t, onG = p.onGround, vy = p.body.velocity.y;
    if (!mem.mode || now > mem.modeUntil) {
      const r = Math.random(), low = p.hp <= 2;
      mem.mode = low && r < 0.55 ? 'kite' : r < 0.3 + 0.4 * k ? 'cross' : 'strafe';
      mem.modeUntil = now + 70 + Math.random() * 120;
      mem.crossing = 0;
    }
    let dir = 0;
    if (mem.mode === 'cross') {
      // run at them shooting their front, go over their head, turn round and shoot their back
      if (mem.crossing) {
        dir = mem.crossing;
        if (Math.sign(dx) === -mem.crossing && adx > 130 + Math.random() * 90) { mem.crossing = 0; mem.crossed = now; }
        if (onG && adx < 300 && Math.sign(dx) === mem.crossing) s.jump = true;            // take off before them
        // over their head: the next jump at the top keeps it high, out of their line of fire
        if (!onG && vy > -160 && adx < 180) s.jump = now % 2 === 0;
      } else {
        // a flank only counts after hitting their FRONT first: fire into their face for a moment, then go over
        const facing = foe && foe.facing === -Math.sign(dx) && Math.abs(dy) < 90;
        mem.faceShot = facing ? (mem.faceShot || 0) + 1 : Math.max(0, (mem.faceShot || 0) - 1);
        dir = now - (mem.crossed || -99) < 45 ? 0 : adx > 330 ? Math.sign(dx) : 0;      // just landed behind: shoot
        if (adx < 360 && mem.faceShot > 22 && (!foe || !foe.prone)) { mem.crossing = Math.sign(dx) || 1; mem.faceShot = 0; }
        else if (!facing && adx < 360 && now - (mem.crossed || -99) > 45) mem.crossing = 0;   // their back is already to us: just shoot
        if (onG && Math.random() < 0.04) s.jump = true;
      }
    } else if (mem.mode === 'strafe') {
      // mid range, stop-and-go: step in, stand and fire, hop back — never a sitting target
      const want = 320 + 110 * Math.sin(now / 41 + p.idx * 2), ph = (now + p.idx * 17) % 54;
      if (adx > want + 100) dir = Math.sign(dx);
      else if (adx < want - 120) dir = -Math.sign(dx);
      else dir = ph < 18 ? Math.sign(dx) : ph < 42 ? 0 : -Math.sign(dx);
      if (onG && Math.random() < 0.05 + 0.1 * k) s.jump = true;
      if (!onG && vy > -60 && Math.random() < 0.12 * k) s.jump = now % 2 === 0;           // a double jump at the top
    } else {
      // low on health: back off and stay in the air, turning to fire whenever there is room
      dir = adx < 560 && (now % 40) < 26 ? -Math.sign(dx) : 0;
      if (onG && Math.random() < 0.18) s.jump = true;
      if (!onG && vy > -60) s.jump = now % 2 === 0;
    }
    // walls and arena edges: hop over / turn back
    if (dir && onG && (dir > 0 ? p.body.blocked.right : p.body.blocked.left)) s.jump = true;
    return dir;
  }

  // a fight with other players: shoot, keep moving, dodge
  function duel(sc, p, mem, s) {
    const t = target(sc, p), c = p.body.center, k = skillOf(p);
    if (!t) return s;
    const foe = t.e.player, ec = t.e.body.center, dx = ec.x - c.x, dy = ec.y - c.y, adx = Math.abs(dx);
    const pro = k >= 0.5;
    let dir;
    if (pro) dir = proMove(sc, p, mem, s, foe, dx, dy, k);
    else {
      const want = 380 + Math.sin(mem.t / 50 + p.idx) * 150;
      dir = adx > want + 60 ? Math.sign(dx) : adx < want - 120 ? -Math.sign(dx) : 0;
    }
    // they are up on a ledge (ledges are solid underneath): get out from under it, then jump up beside them
    if (pro && dy < -120 && foe && foe.onGround) {
      if (p.onGround) { if (adx < 240) dir = -Math.sign(dx) || 1; else { s.jump = true; dir = Math.sign(dx); } }
      else { dir = Math.sign(dx); if (p.body.velocity.y > -150) s.jump = mem.t % 2 === 0; }
      mem.crossing = 0;
    }
    s.shoot = true;
    dir = aim(s, p, dx, dy, dir, false, pro);
    if (dir > 0) s.right = true;
    if (dir < 0) s.left = true;
    if (!pro) {
      if (p.onGround && (dy < -120 || mem.t % 90 === 0 || (dir > 0 ? p.body.blocked.right : dir < 0 ? p.body.blocked.left : false))) s.jump = true;
      else if (!p.onGround && p.body.velocity.y > 0 && dy < -60 && mem.t % 20 === 0) s.jump = true;       // double jump up after them
    }

    // read the other side's shots: duck under a high one, jump over the rest, dash out with the KITE dash
    const inc = incoming(sc, p);
    if (inc && Math.random() < (pro ? 0.25 + 0.7 * k : 0.2 * k)) {
      if (p.onGround && inc.duck && Math.random() < 0.55) mem.duckUntil = mem.t + 10 + Math.random() * 12;
      else if (p.onGround) s.jump = true;
      else if (p.body.velocity.y > -220) s.jump = mem.t % 2 === 0;
    }
    if (mem.duckUntil > mem.t && p.onGround) {
      const face = Math.sign(dx) || p.facing;
      s.left = s.right = false; s.jump = false; s.up = false;
      if (face !== p.facing) { if (face > 0) s.right = true; else s.left = true; } else s.down = true;
    }
    if (p.abilityCd <= 0) s.ability = pro ? wantsAbility(sc, p, t.d, foe, inc) : t.d < 520 || (p.agent.id === 'nova' && p.hp < p.maxHp - 1);
    if (pro && p.agent.dashAbility && s.ability) s.up = !p.onGround && Math.random() < 0.3;        // KITE: sometimes dash up and over

    // the other player lies down on the same level to shoot under the bot's fire: turn to them, get down too and
    // fire low — or, now and then, jump in and shoot down at them from above
    if (foe && foe.prone && foe.onGround && Math.abs(dy) < 90 && !(mem.crossing && pro)) {
      const face = Math.sign(dx) || p.facing;
      s.up = false; s.jump = false; s.left = s.right = false;
      if (face !== p.facing) { if (face > 0) s.right = true; else s.left = true; }     // turn first
      else if (mem.t % 240 < (pro ? 150 : 200) || !p.onGround) {
        if (p.onGround) s.down = true;                                                  // prone: shots stay low
        else { s.down = true; if (face > 0) s.right = true; else s.left = true; }     // in the air: aim down at them
      } else if (adx < 420) s.jump = true;
    }
    return s;
  }

  return { think };
})();
