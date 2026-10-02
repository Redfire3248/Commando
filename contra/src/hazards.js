// The classic campaign's stage hazards and its extra bosses' pictures.
//   Art: code-drawn pixel art for every new key, so the game runs without image files; a painted sheet that uses
//   the same keys replaces them (see PROMPTS.md, prompt 16).
//   Hazards (CG.Hazards.update, every frame, on every screen — each game only hurts its own soldiers):
//     bridge   a ledge that blows up piece by piece once someone runs onto it (Jungle, Snow Field)
//     rocks    boulders tumbling down the falls (Waterfall)
//     flame    a fire column from the ceiling: off, a warning flicker, then on (Energy Zone)
//     crusher  a spiked block that slams down from the ceiling (Hangar)
//     gate     (an enemy) the electric field in front of a base wall's core switches on and off (Base 1, Base 2)
CG.Hazards = (() => {
  const lowres = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  function put(scene, key, c, s, frames) {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, c.width * s, c.height * s), o = t.getContext();
    o.imageSmoothingEnabled = false;
    o.drawImage(c, 0, 0, c.width * s, c.height * s);
    if (frames) { const fw = c.width / frames * s; for (let i = 0; i < frames; i++) t.add(i, 0, i * fw, 0, fw, c.height * s); }
    t.refresh();
  }
  const R = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function disc(g, cx, cy, r, col) {
    g.fillStyle = col;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
  function ell(g, cx, cy, rx, ry, col) {
    g.fillStyle = col;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.02) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }

  function makeArt(scene) {
    // base wall with its red sensor core (Base 1 / Base 2): 24 x 120 art px, drawn x4
    put(scene, 'e_gate', lowres(24, 120, (g) => {
      R(g, 0, 0, 24, 120, '#1c2228'); R(g, 2, 0, 20, 120, '#3a4652'); R(g, 4, 0, 16, 120, '#4f5d6b');
      for (let y = 6; y < 120; y += 14) { R(g, 2, y, 20, 2, '#2a333c'); R(g, 5, y + 4, 2, 2, '#8a98a6'); R(g, 17, y + 4, 2, 2, '#8a98a6'); }
      R(g, 3, 44, 18, 30, '#14181c'); disc(g, 12, 59, 8, '#5a0b0b'); disc(g, 12, 59, 6, '#d42a2a'); disc(g, 12, 59, 3, '#ff8a6a'); R(g, 10, 55, 2, 2, '#ffe0d0');
    }), 4);
    // alien mouth that hangs from the ceiling and spits bugs (Alien's Lair)
    put(scene, 'e_mouth', lowres(32, 26, (g) => {
      ell(g, 16, 11, 15, 11, '#5a1f3a'); ell(g, 16, 11, 13, 9, '#8c2f57'); ell(g, 16, 14, 9, 6, '#2a0612');
      for (let x = 9; x <= 23; x += 3) { R(g, x, 9, 2, 3, '#f2e6c8'); R(g, x + 1, 17, 2, 3, '#f2e6c8'); }
      ell(g, 16, 15, 4, 2, '#d94c7a'); R(g, 5, 2, 3, 2, '#c45584'); R(g, 24, 3, 3, 2, '#c45584');
    }), 4);
    // alien bug (2 frames)
    put(scene, 'e_bug', lowres(32, 12, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 16;
        ell(g, o + 8, 6, 6, 4, '#4f8a2e'); ell(g, o + 8, 5, 4, 2, '#7fc24a'); R(g, o + 12, 4, 2, 2, '#ff3030');
        const leg = f ? 1 : 0;
        R(g, o + 3, 9 + leg, 1, 3 - leg, '#2a4a18'); R(g, o + 7, 10 - leg, 1, 2 + leg, '#2a4a18'); R(g, o + 11, 9 + leg, 1, 3 - leg, '#2a4a18');
      }
    }), 4, 2);
    // the waterfall's stone alien statue
    put(scene, 'boss_statue', lowres(72, 84, (g) => {
      ell(g, 36, 40, 34, 38, '#4a4438'); ell(g, 36, 38, 31, 34, '#6e6656'); ell(g, 36, 34, 26, 26, '#857c69');
      ell(g, 22, 30, 7, 5, '#1a0f0a'); ell(g, 50, 30, 7, 5, '#1a0f0a'); disc(g, 22, 30, 3, '#ff5a1f'); disc(g, 50, 30, 3, '#ff5a1f');
      ell(g, 36, 56, 12, 9, '#1a0f0a'); for (let x = 27; x <= 45; x += 4) { R(g, x, 49, 2, 4, '#e0d6b8'); R(g, x + 1, 60, 2, 4, '#e0d6b8'); }
      R(g, 34, 8, 4, 12, '#5a5345'); R(g, 14, 12, 3, 8, '#5a5345'); R(g, 55, 12, 3, 8, '#5a5345');
      for (let i = 0; i < 14; i++) R(g, 6 + Math.round(Math.sin(i) * 3) + i * 4, 72 + (i % 3), 3, 2, '#3a3529');
    }), 4);
    put(scene, 'e_orb', lowres(20, 20, (g) => { disc(g, 10, 10, 9, '#3a2416'); disc(g, 10, 10, 7, '#b5502a'); disc(g, 10, 10, 4, '#ffb04a'); R(g, 7, 6, 2, 2, '#fff2c8'); }), 4);
    put(scene, 'fireball', lowres(10, 10, (g) => { disc(g, 5, 5, 4, '#ff5a1f'); disc(g, 5, 5, 2, '#ffd86a'); }), 3);
    put(scene, 'e_disc', lowres(16, 8, (g) => { ell(g, 8, 4, 7, 3, '#2a2f36'); ell(g, 8, 4, 6, 2, '#b8c4cc'); R(g, 7, 3, 2, 2, '#ff4a3a'); }), 4);
    put(scene, 'rock', lowres(16, 14, (g) => { ell(g, 8, 7, 7, 6, '#3d342b'); ell(g, 7, 6, 6, 5, '#6b5d4c'); R(g, 5, 4, 3, 2, '#8c7c66'); R(g, 10, 8, 2, 2, '#3d342b'); }), 4);
    // the Energy Zone giant: an armoured soldier three times your size (2 walk frames)
    put(scene, 'boss_giant', lowres(96, 84, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 48, st = f ? 3 : -3;
        R(g, o + 16 + st, 58, 7, 22, '#2a3038'); R(g, o + 26 - st, 58, 7, 22, '#363d47'); R(g, o + 14 + st, 78, 11, 6, '#121418'); R(g, o + 24 - st, 78, 11, 6, '#121418');
        R(g, o + 12, 26, 24, 34, '#4a5563'); R(g, o + 14, 28, 20, 14, '#6a7888'); R(g, o + 12, 46, 24, 4, '#2e353f'); R(g, o + 20, 30, 8, 8, '#c03a2a');
        R(g, o + 6, 26, 8, 24, '#3a4350'); R(g, o + 34, 26, 8, 24, '#3a4350'); R(g, o + 4, 48, 9, 8, '#2a3038'); R(g, o + 35, 48, 9, 8, '#2a3038');
        R(g, o + 15, 6, 18, 20, '#2e353f'); R(g, o + 17, 8, 14, 16, '#5a6676'); R(g, o + 18, 14, 12, 4, '#ff4a3a'); R(g, o + 22, 2, 4, 5, '#2e353f');
        R(g, o + 40, 36, 8, 4, '#15181c');
      }
    }), 4, 2);
    // the Alien Lair's heart (2 beat frames)
    put(scene, 'boss_heart', lowres(128, 60, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 64, k = f ? 1 : 0;
        ell(g, o + 32, 32, 26 + k * 2, 24 + k * 2, '#4a0f1f'); ell(g, o + 32, 31, 23 + k * 2, 21 + k * 2, '#9c1f3c'); ell(g, o + 28, 26, 12, 10, '#d23a5a');
        ell(g, o + 22, 22, 4, 3, '#ff8aa0');
        for (let i = 0; i < 6; i++) R(g, o + 10 + i * 8, 6 + (i % 2) * 3, 3, 10, '#5c1830');
        R(g, o + 30, 44, 4, 12, '#5c1830'); R(g, o + 18, 48, 3, 10, '#5c1830'); R(g, o + 42, 46, 3, 11, '#5c1830');
      }
    }), 4, 2);
    // a fire column piece (2 flicker frames; tiled down the screen)
    put(scene, 'hz_flame', lowres(32, 16, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 16;
        R(g, o + 2, 0, 12, 16, '#ff5a1f'); R(g, o + 4, 0, 8, 16, '#ffb04a'); R(g, o + 6, 0, 4, 16, '#fff2c8');
        for (let y = 0; y < 16; y += 4) R(g, o + (f ? 1 : 13) - (y % 8 ? 0 : 1), y, 2, 2, '#ff8a2a');
      }
    }), 3, 2);
    put(scene, 'hz_nozzle', lowres(16, 8, (g) => { R(g, 0, 0, 16, 5, '#2e353f'); R(g, 3, 5, 10, 3, '#4f5d6b'); R(g, 6, 7, 4, 1, '#ff5a1f'); }), 4);
    // the hangar's spiked crusher
    put(scene, 'hz_crusher', lowres(34, 26, (g) => {
      R(g, 0, 0, 34, 18, '#2a3038'); R(g, 2, 2, 30, 14, '#59636f'); R(g, 4, 4, 26, 4, '#7d8896');
      for (let x = 3; x < 31; x += 6) { R(g, x, 6, 2, 2, '#2a3038'); }
      R(g, 0, 15, 34, 3, '#c8a12a'); for (let x = 1; x < 34; x += 4) R(g, x, 15, 2, 3, '#1a1d22');
      for (let x = 0; x < 34; x += 6) { R(g, x + 1, 18, 4, 3, '#b8c4cc'); R(g, x + 2, 21, 2, 3, '#e8eef2'); R(g, x + 2, 24, 2, 2, '#ffffff'); }
    }), 4);
  }

  // ---------------------------------------------------------------- per stage
  function build(sc) {
    const L = CG.DATA.level, T = CG.CONFIG.TILE, gy = L.groundRow * T;
    sc.hz = [];
    sc.rocks = sc.physics.add.group({ maxSize: 30 });
    sc.physics.add.collider(sc.rocks, sc.solids);
    sc.physics.add.collider(sc.rocks, sc.ledges);
    sc.physics.add.collider(sc.rocks, sc.covers);
    sc.physics.add.overlap(sc.players.map((p) => p.phys), sc.rocks, (a, b) => {
      const [z, r] = a.owner ? [a, b] : [b, a];
      if (!r.active || z.owner.remote || !z.owner.alive) return;
      sc.boom(r.x, r.y, 10);
      r.disableBody(true, true);
      z.owner.hit(2);
    });
    (L.hazards || []).forEach(([type, col, col2], i) => {
      const x = (col + 0.5) * T, h = { type, x, x2: col2 ? (col2 + 0.5) * T : x, i, t: (i * 0.9) % 3 };
      if (type === 'flame') {
        h.nozzle = sc.add.image(x, 0, 'hz_nozzle').setOrigin(0.5, 0).setDepth(6).setScale(sc.artScale.hz_nozzle || 1);
        h.fire = sc.add.tileSprite(x, 30, 72, gy - 30, 'hz_flame', 0).setOrigin(0.5, 0).setDepth(13).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
        const ffw = sc.textures.getFrame('hz_flame', 0).width;              // built-in 48 px, or a painted frame
        h.fire.setTileScale(72 / ffw, 72 / ffw);
      } else if (type === 'crusher') {
        h.chain = sc.add.graphics().setDepth(5);
        h.img = sc.add.image(x, 60, 'hz_crusher').setOrigin(0.5, 1).setDepth(6).setScale(sc.artScale.hz_crusher || 1);
        h.y = 60; h.top = 60 + 104;                      // bottom edge while resting
      } else if (type === 'rocks') {
        h.cd = 1;
      }
      sc.hz.push(h);
    });
    sc.gateFx = sc.add.graphics().setDepth(12);
  }

  // things that hurt this game's own soldiers
  const mine = (sc) => sc.players.filter((p) => !p.remote && p.alive);

  function update(sc, dt) {
    if (!sc.hz) return;
    const off = !!sc.hzOff;                              // admin: hazards off
    const cam = sc.cameras.main, W = CG.CONFIG.W, T = CG.CONFIG.TILE, gy = CG.DATA.level.groundRow * T, near = (x) => x > cam.scrollX - 200 && x < cam.scrollX + W + 200;
    const clock = Date.now() / 1000;                     // the same on every screen online (each game's own timer is not)
    for (const h of sc.hz) {
      h.t = clock + h.i * 0.9;
      if (h.type === 'flame') {
        // 3.2 s: 1.6 off, 0.5 warning, 1.1 burning
        const ph = h.t % 3.2, on = ph > 2.1, warn = ph > 1.6 && !on;
        h.fire.setVisible(on).setFrame(Math.floor(h.t * 12) % 2);
        if (on) { h.fire.tilePositionY -= dt * 900; h.fire.setAlpha(0.85 + Math.random() * 0.15); }
        if (warn && near(h.x) && Math.random() < 0.5) sc.sparks.explode(1, h.x + Phaser.Math.Between(-12, 12), 34);
        if (on && near(h.x) && !off) for (const p of mine(sc)) if (Math.abs(p.body.center.x - h.x) < 40) p.hit(1);
        if (on && !h.wasOn && near(h.x)) CG.Sfx.play('boom');
        h.wasOn = on;
      } else if (h.type === 'crusher') {
        // 3 s: rest at the top, shake, slam down, stay, rise
        const ph = h.t % 3, low = gy - 4;
        let y = 60 + 104;
        if (ph < 1.2) y = 164;
        else if (ph < 1.6) y = 164 + Math.sin(h.t * 60) * 3;
        else if (ph < 1.75) y = 164 + (low - 164) * ((ph - 1.6) / 0.15);
        else if (ph < 2.3) y = low;
        else y = low - (low - 164) * ((ph - 2.3) / 0.7);
        if (ph >= 1.75 && h.ph < 1.75 && near(h.x)) { sc.cameras.main.shake(120, 0.006); CG.Sfx.play('boom'); sc.sparks.explode(10, h.x, low); }
        h.ph = ph;
        h.img.setY(y);
        h.chain.clear().fillStyle(0x1a1d22, 1).fillRect(h.x - 6, 0, 12, y - 100).fillStyle(0x59636f, 1);
        for (let cy = 0; cy < y - 104; cy += 18) h.chain.fillRect(h.x - 4, cy, 8, 10);
        if (ph >= 1.6 && ph < 2.3 && !off) for (const p of mine(sc)) if (Math.abs(p.body.center.x - h.x) < 66 && p.body.top < y) p.hit(2);
      } else if (h.type === 'rocks') {
        // boulders tumble down while the falls are on screen
        if (!near(h.x) && !near(h.x2)) continue;
        // a boulder in every time slot, at a place worked out from the slot number: the same rock on every screen
        const every = Math.max(0.7, 1.8 / (1 + 0.15 * (sc.crowd || 0))), slot = Math.floor(clock / every);
        if (slot !== h.slot && !off) {
          h.slot = slot;
          const rnd = (n) => { const v = Math.sin(slot * 127.1 + h.i * 311.7 + n * 74.7) * 43758.5453; return v - Math.floor(v); };
          const r = sc.rocks.get(h.x + (h.x2 - h.x) * rnd(1), -40, 'rock');
          if (r) {
            r.setActive(true).setVisible(true).setDepth(9);
            r.body.enable = true; r.body.reset(r.x, -40);
            r.setScale(sc.artScale.rock || 1);
            r.body.setCircle(r.width * 0.4, r.width * 0.1, r.height * 0.05).setBounce(0.45, 0.35).setVelocity((rnd(2) * 2 - 1) * 160, 0);
            r.life = 6;
          }
        }
      }
    }
    sc.rocks.children.iterate((r) => {
      if (!r || !r.active) return;
      r.rotation += r.body.velocity.x * dt * 0.02;
      r.life -= dt;
      if (r.life <= 0 || r.y > CG.CONFIG.H + 100) r.disableBody(true, true);
    });
    // bridges: once someone runs onto one it blows up, piece by piece, in the direction of travel
    for (const b of sc.bridges || []) {
      if (b.state) continue;
      const on = sc.players.some((p) => p.alive && p.body.center.x > b.x0 + 20 && p.body.center.x < b.x1 && Math.abs(p.body.bottom - b.top) < 30);
      if (!on) continue;
      b.state = 1;
      b.imgs.forEach((img, k) => sc.time.delayedCall(260 + k * 170, () => {
        sc.boom(img.x + T / 2, img.y + 10, 16);
        CG.Sfx.play('boom');
        img.setVisible(false);
        if (k === b.imgs.length - 1) b.zone.body.enable = false;
      }));
    }
    // base walls: the electric field in front of each core flickers on and off (1.4 s each)
    sc.gateFx.clear();
    for (const e of sc.enemies.getChildren()) {
      if (!e.active || e.type !== 'gate') continue;
      const on = (Date.now() / 1400 | 0) % 2 === 0, fx = e.x - 70, top = e.y - e.displayHeight;
      if (!on) continue;
      sc.gateFx.lineStyle(3, 0x9ad8ff, 0.9);
      for (let k = 0; k < 3; k++) {
        sc.gateFx.beginPath(); sc.gateFx.moveTo(fx + k * 8, top);
        for (let y = top; y < e.y; y += 24) sc.gateFx.lineTo(fx + k * 8 + Phaser.Math.Between(-10, 10), y);
        sc.gateFx.strokePath();
      }
      if (!off) for (const p of mine(sc)) if (Math.abs(p.body.center.x - fx) < 26) p.hit(1);
    }
  }

  return { makeArt, build, update };
})();
