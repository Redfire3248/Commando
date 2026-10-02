// Computer-controlled teammates. CG.Bot.think() returns the same input state a keyboard or gamepad would,
// so a bot plays through exactly the same Player code as a person.
CG.Bot = (() => {
  const T = () => CG.CONFIG.TILE;

  // the enemy a bot should shoot: closest one on screen
  function target(sc, p) {
    const cam = sc.cameras.main, c = p.body.center;
    let best = null, bd = Infinity;
    for (const e of sc.enemies.getChildren()) {
      if (!e.active || e.T.ai === 'flyer' && !e.extra) continue;
      if (e.x < cam.scrollX - 20 || e.x > cam.scrollX + CG.CONFIG.W + 20) continue;
      const d = Math.hypot(e.body.center.x - c.x, e.body.center.y - c.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best ? { e: best, d: bd } : null;
  }

  // an enemy shot or bomb about to reach the bot
  function danger(sc, p) {
    const c = p.body.center;
    let hit = false;
    const check = (b) => {
      if (!b || !b.active || hit) return;
      const dx = c.x - b.x, dy = c.y - b.y, vx = b.body.velocity.x, vy = b.body.velocity.y;
      if (Math.hypot(dx, dy) < 220 && dx * vx + dy * vy > 0 && Math.abs(dy) < 70) hit = true;
    };
    sc.ebullets.children.iterate(check);
    sc.ebombs.children.iterate(check);
    return hit;
  }

  function think(sc, p, mem) {
    const s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false, dash: false };
    if (!p.alive) return s;
    const c = p.body.center, cam = sc.cameras.main;
    mem.t = (mem.t || 0) + 1;

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
      const ang = Math.atan2(dy, dx), oct = Math.round(ang / (Math.PI / 4));       // 8-way aim
      s.shoot = true;
      if (oct === -2) { s.up = true; dir = 0; }                                    // straight up: stand still
      else if (oct === 2 && !p.onGround) s.down = true;
      else {
        const face = Math.abs(oct) <= 1 ? 1 : -1;
        if (oct === -1 || oct === -3) s.up = true;
        if (oct === 1 || oct === 3) { s.down = true; if (!dir) dir = face; }       // diagonal down needs a direction
        if (s.up && !dir) dir = face;
        if (!dir && face !== p.facing) dir = face;                                 // turn to face it
      }
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
    // fell short into a pit anyway: one big recovery jump toward where it was heading (bots only)
    const groundY = CG.DATA.level.groundRow * T();
    if (!p.onGround && p.body.bottom > groundY + 20 && p.body.velocity.y > 0 && !mem.rescued) {
      mem.rescued = true;
      p.body.velocity.y = -1250;
      p.facing = dir || p.facing;
    }
    if (p.onGround) mem.rescued = false;
    if (mem.rescued && !p.onGround) { s.left = p.facing < 0; s.right = p.facing > 0; s.down = false; }
    if (danger(sc, p)) { if (p.onGround) s.jump = true; else if (p.mdashCd <= 0 && mem.t % 4 === 0) s.dash = true; }

    // abilities
    const ab = p.agent.id, enemiesNear = sc.enemies.getChildren().filter((e) => e.active && Math.abs(e.x - c.x) < 700).length;
    if (p.abilityCd <= 0) {
      if (ab === 'nova') s.ability = sc.players.some((q) => q.alive && q.hp <= q.maxHp - 3 && Math.abs(q.body.center.x - c.x) < 600);
      else if (ab === 'brick') s.ability = p.hp <= p.maxHp / 2 && enemiesNear > 0;
      else if (ab === 'kite') s.ability = t && t.d < 380 && Math.abs(t.e.body.center.y - c.y) < 60;
      else s.ability = enemiesNear >= 3 || (t && t.e.T.boss);
    }
    return s;
  }

  return { think };
})();
