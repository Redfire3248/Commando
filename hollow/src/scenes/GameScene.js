GH.GameScene = class extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    const T = GH.CONFIG.TILE;
    this.T = T;
    this.save = GH.Save.load() || {};
    this.room = GH.DATA.rooms.crossing;
    this.collected = new Set(this.save.collected || []);
    this.slash = null;
    this.stopped = false;
    this.cache = null;
    this.cacheData = null;

    this.buildBackground();
    this.buildRoom();
    this.makeFx();

    this.inp = new GH.Controls(this);
    this.weapons = new GH.Weapons(this);

    const [sx, sy] = this.save.benched ? this.room.bench : this.room.spawn;
    const P = this.player = new GH.Player(this, (sx + 0.5) * T, (sy + 1) * T);
    if (this.save.weapons) {
      const owned = this.save.weapons.filter((id) => GH.DATA.weaponById[id]);
      if (owned.length) P.weapons = owned;
      P.weaponIndex = Phaser.Math.Clamp(this.save.weaponIndex || 0, 0, P.weapons.length - 1);
    }
    Object.assign(P.abilities, this.save.abilities || {});
    P.shards = this.save.shards || 0;

    this.enemies = this.add.group();
    this.spawnEnemies();
    this.buildPickups();
    this.shards = this.physics.add.group({ maxSize: 200 });
    this.setupColliders();
    if (this.save.cache) this.makeCache(this.save.cache.x, this.save.cache.y, this.save.cache.amount);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.room.w * T, this.room.h * T);
    cam.startFollow(P.phys, false, 1, 0.18);   // locked sideways (no lag), eased up and down
    cam.setFollowOffset(0, 60);

    this.input.keyboard.on('keydown-F2', () => this.toggleDebug());
    this.scene.launch('HUD');
    this.time.delayedCall(500, () => this.events.emit('area', this.room.name, this.room.subtitle));
  }

  // ================================================================ world
  buildBackground() {
    const { WIDTH: W, HEIGHT: H } = GH.CONFIG;
    this.add.image(0, 0, 'bg_grad').setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-10);
    this.bgFar = this.add.tileSprite(0, 0, W, H, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-9);
    this.bgMid = this.add.tileSprite(0, 0, W, H, 'bg_mid').setOrigin(0).setScrollFactor(0).setDepth(-8);
    this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(50);
  }

  buildRoom() {
    const R = this.room, T = this.T;
    const g = this.grid = Array.from({ length: R.h }, () => Array(R.w).fill('.'));
    const fill = (x, y, w, h, ch) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < R.w) g[j][i] = ch;
    };
    R.solids.forEach((r) => fill(r[0], r[1], r[2], r[3], '#'));
    R.platforms.forEach(([x, y, w]) => fill(x, y, w, 1, '='));
    R.spikes.forEach(([x, y, w]) => fill(x, y, w, 1, '^'));

    this.physics.world.setBounds(0, 0, R.w * T, R.h * T);

    const zone = (group, x, y, w, h) => {
      const z = this.add.zone(x + w / 2, y + h / 2, w, h);
      this.physics.add.existing(z, true);
      group.add(z);
      return z;
    };
    this.solids = this.physics.add.staticGroup();
    R.solids.forEach(([x, y, w, h]) => zone(this.solids, x * T, y * T, w * T, h * T));

    this.platforms = this.physics.add.staticGroup();
    R.platforms.forEach(([x, y, w]) => {
      const c = zone(this.platforms, x * T, y * T, w * T, 20).body.checkCollision;
      c.down = c.left = c.right = false;
    });

    this.spikeZones = this.physics.add.staticGroup();
    R.spikes.forEach(([x, y, w]) => zone(this.spikeZones, x * T + 6, y * T + 28, w * T - 12, 36));

    const art = GH.DATA.art || {}, painted = art.images || {};
    const tiles = art.tiles && this.textures.exists('tiles') ? art.tiles : null;
    const solid = (i, j) => i < 0 || j < 0 || i >= R.w || j >= R.h || g[j][i] === '#';
    for (let j = 0; j < R.h; j++) {
      for (let i = 0; i < R.w; i++) {
        const ch = g[j][i];
        if (ch === '#' && tiles) {
          // pick the tile whose mossy/worn edges face the open sides
          const U = !solid(i, j - 1), D = !solid(i, j + 1), L = !solid(i - 1, j), Rt = !solid(i + 1, j);
          const set = U && L ? tiles.topLeft : U && Rt ? tiles.topRight : U ? tiles.top : D ? tiles.bottom
            : L ? tiles.left : Rt ? tiles.right : tiles.inner;
          this.add.image(i * T, j * T, 'tiles', set[(i * 7 + j * 13) % set.length]).setOrigin(0)
            .setDisplaySize(T + 0.5, T + 0.5).setDepth(2);
        } else if (ch === '#') {
          const top = j > 0 && g[j - 1][i] !== '#';
          this.add.image(i * T, j * T, top ? 'tile_top' : 'tile_in' + ((i * 7 + j * 13) % 3)).setOrigin(0).setDepth(2);
        } else if (ch === '=' && !painted.tile_plat) {
          this.add.image(i * T, j * T, 'tile_plat').setOrigin(0).setDepth(2);
        } else if (ch === '^' && !painted.spikes) {
          this.add.image(i * T, j * T, 'spikes').setOrigin(0).setDepth(1);
        }
      }
    }
    // Painted ledges and spikes are wider than one tile: lay one piece per two tiles, half a piece for an odd end.
    const strip = (key, x, y, w, originY, depth) => {
      const src = this.textures.get(key).getSourceImage(), sc = 2 * T / src.width;
      for (let k = 0; k < w; k += 2) {
        const img = this.add.image((x + k) * T, y, key).setOrigin(0, originY).setScale(sc).setDepth(depth);
        if (w - k === 1) img.setCrop(0, 0, src.width / 2, src.height);
      }
    };
    if (painted.tile_plat) R.platforms.forEach(([x, y, w]) => strip('tile_plat', x, y * T - 4, w, 0, 2));
    if (painted.spikes) R.spikes.forEach(([x, y, w]) => strip('spikes', x, (y + 1) * T + 4, w, 1, 1));

    // decorations (only when the props sheet is loaded)
    if (art.props && this.textures.exists('props')) {
      for (const [name, tx, ty, scale] of R.decor || []) {
        const p = art.props[name];
        if (!p) continue;
        const x = (tx + 0.5) * T, y = p.hang ? ty * T : (ty + 1) * T;
        // scenery is dimmed a little so it sits behind the action instead of competing with the player
        this.add.image(x, y + (p.hang ? -2 : 6), 'props', p.frame).setOrigin(0.5, p.hang ? 0 : 1).setScale(scale || 0.6)
          .setDepth(4).setTint(name.startsWith('lantern') ? 0xffffff : 0x8f9bb0);
        if (name.startsWith('lantern')) {
          this.add.image(x, p.hang ? y + 90 : y - 100, 'glow').setTint(0xffb060).setBlendMode(Phaser.BlendModes.ADD)
            .setScale(2.6).setAlpha(0.28).setDepth(3);
        }
      }
    }

    // bench (rest + save point)
    const [bx, by] = R.bench;
    const b = this.benchPos = { x: (bx + 0.5) * T, y: (by + 1) * T };
    this.add.image(b.x, b.y - 50, 'glow').setTint(0xffd9a0).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4).setAlpha(0.3).setDepth(4);
    this.add.image(b.x, b.y + (painted.bench ? 8 : 0), 'bench').setOrigin(0.5, 1).setScale(painted.bench ? 0.85 : 1).setDepth(5);
    this.benchPrompt = this.add.text(b.x, b.y - 130, '▲  REST', {
      fontFamily: 'Rajdhani, sans-serif', fontSize: '28px', fontStyle: '700', color: '#ffe9c4',
    }).setOrigin(0.5).setAlpha(0).setDepth(20).setShadow(0, 2, '#000000', 6);
  }

  tileAt(px, py) {
    const row = this.grid[Math.floor(py / this.T)];
    return row ? row[Math.floor(px / this.T)] : undefined;
  }
  isGround(px, py) {
    const t = this.tileAt(px, py);
    return t === '#' || t === '=';
  }
  isSafeGround(x, bottom) {
    return this.isGround(x - 30, bottom + 8) && this.isGround(x + 30, bottom + 8)
      && this.tileAt(x - 60, bottom - 8) !== '^' && this.tileAt(x + 60, bottom - 8) !== '^';
  }

  makeFx() {
    const ADD = 'ADD';
    const p = (cfg) => this.add.particles(0, 0, 'spark', Object.assign({ emitting: false }, cfg));
    this.fx = {
      sparks: p({ lifespan: { min: 150, max: 380 }, speed: { min: 150, max: 520 }, scale: { start: 0.9, end: 0 }, blendMode: ADD, tint: [0xffffff, 0xffe2a0, 0xffc060] }).setDepth(15),
      burst: p({ lifespan: { min: 300, max: 800 }, speed: { min: 120, max: 620 }, scale: { start: 1.6, end: 0 }, gravityY: 900, blendMode: ADD, tint: [0xff9a5a, 0xffd27a, 0xffffff] }).setDepth(15),
      glint: p({ lifespan: { min: 200, max: 500 }, speed: { min: 60, max: 300 }, scale: { start: 0.9, end: 0 }, blendMode: ADD, tint: [0x6ff3ff, 0xbffbff, 0xffffff] }).setDepth(15),
      dust: p({ lifespan: { min: 250, max: 500 }, speedX: { min: -160, max: 160 }, speedY: { min: -120, max: -20 }, scale: { start: 1.1, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: 0x8a93a8 }).setDepth(9),
    };
    // drifting motes in the air
    const R = this.room, T = this.T;
    this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: R.w * T }, y: { min: 0, max: R.h * T },
      lifespan: 7000, speedX: { min: -12, max: 12 }, speedY: { min: -22, max: -6 },
      scale: { min: 0.15, max: 0.45 }, alpha: { start: 0.45, end: 0 }, frequency: 60,
      blendMode: ADD, tint: 0x9fd8ff,
    }).setDepth(3);
  }

  // ================================================================ entities
  spawnEnemies() {
    const T = this.T;
    for (const [type, tx, ty] of this.room.enemies) {
      this.enemies.add(new GH.Enemy(this, type, (tx + 0.5) * T, (ty + 1) * T));
    }
  }
  respawnEnemies() {
    this.enemies.getChildren().slice().forEach((e) => e.destroy());
    this.spawnEnemies();
  }

  buildPickups() {
    const T = this.T, ADD = Phaser.BlendModes.ADD;
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const [kind, id, tx, ty] of this.room.pickups) {
      const key = kind + ':' + id;
      if (this.collected.has(key)) continue;
      if (kind === 'weapon' && !GH.CONFIG.GUNS) continue;
      const def = kind === 'weapon' ? GH.DATA.weaponById[id] : GH.DATA.abilities[id];
      const x = (tx + 0.5) * T, y = (ty + 0.5) * T;
      const glow = this.add.image(x, y, 'glow').setBlendMode(ADD).setDepth(6).setTint(GH.hexToInt(def.color))
        .setScale(kind === 'weapon' ? 1.2 : 1.5);
      const s = this.pickups.create(x, y, kind === 'weapon' ? 'w_' + id : 'orb_' + id).setDepth(7);
      s.setScale(Math.min(1, 120 / s.width));
      Object.assign(s, { key, kind, pid: id, glow });
      this.tweens.add({ targets: [s, glow], y: y - 12, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: glow, alpha: 0.45, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  collect(k) {
    if (!k.active) return;
    const P = this.player;
    this.collected.add(k.key);
    if (k.kind === 'weapon') {
      const w = GH.DATA.weaponById[k.pid];
      P.giveWeapon(k.pid);
      this.events.emit('toast', w.name.toUpperCase(), w.desc, w.color);
    } else {
      const a = GH.DATA.abilities[k.pid];
      P.abilities[k.pid] = true;
      this.events.emit('toast', a.name.toUpperCase(), a.desc, a.color);
    }
    P.strikePose('triumph', 0.9);
    this.fx.glint.explode(24, k.x, k.y);
    this.cameras.main.flash(180, 255, 255, 255);
    this.tweens.killTweensOf([k, k.glow]);
    k.glow.destroy();
    k.disableBody(true, true);
    this.time.delayedCall(0, () => k.destroy());
    this.writeSave();
  }

  spawnShards(x, y, n) {
    for (let i = 0; i < n; i++) {
      const s = this.shards.get(x, y, 'shard');
      if (!s) return;
      s.setTexture('shard').setActive(true).setVisible(true).setDepth(7);
      s.body.enable = true;
      s.body.allowGravity = true;
      s.body.setSize(18, 22, true);
      s.body.reset(x, y);
      s.body.setBounce(0.45).setDrag(160, 0);
      s.body.setVelocity(Phaser.Math.Between(-260, 260), Phaser.Math.Between(-700, -380));
      s.magnet = false; s.age = 0;
    }
  }
  updateShards(dt) {
    const P = this.player, px = P.body.center.x, py = P.body.center.y;
    this.shards.children.iterate((s) => {
      if (!s || !s.active) return;
      s.age += dt;
      s.rotation = Math.sin(s.age * 6) * 0.3;
      const dx = px - s.x, dy = py - s.y, d = Math.hypot(dx, dy);
      if (!P.dead && s.age > 0.45 && d < 280 && d > 1) {
        s.magnet = true;
        s.body.allowGravity = false;
        const sp = Math.max(700, 1400 - d * 2);
        s.body.setVelocity(dx / d * sp, dy / d * sp);
      }
      if (s.age > 30) this.hideShard(s);
    });
  }
  hideShard(s) {
    s.setActive(false).setVisible(false);
    s.body.stop();
    s.body.enable = false;
  }
  grabShard(s) {
    if (!s.active || s.age < 0.3) return;
    this.player.shards++;
    this.fx.glint.explode(3, s.x, s.y);
    this.hideShard(s);
  }

  // Shards lost on death wait where you fell.
  makeCache(x, y, amount) {
    this.dropCache();
    const c = this.cache = this.physics.add.image(x, y, 'cache').setDepth(7);
    c.body.allowGravity = false;
    c.amount = amount;
    this.cacheData = { x, y, amount };
    this.tweens.add({ targets: c, scale: 1.2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.cacheCollider = this.physics.add.overlap(this.player.phys, c, () => this.grabCache());
  }
  dropCache() {
    if (!this.cache) return;
    this.cacheCollider.destroy();
    this.tweens.killTweensOf(this.cache);
    this.cache.destroy();
    this.cache = null; this.cacheData = null;
  }
  grabCache() {
    const c = this.cache;
    if (!c || this.player.dead) return;
    this.player.shards += c.amount;
    this.events.emit('toast', 'RECOVERED', `+${c.amount} shards`, '#6ff3ff');
    this.fx.glint.explode(30, c.x, c.y);
    const dead = c;
    this.cache = null; this.cacheData = null;
    dead.body.enable = false;
    dead.setVisible(false);
    this.time.delayedCall(0, () => {
      this.cacheCollider.destroy();
      this.tweens.killTweensOf(dead);
      dead.destroy();
    });
    this.writeSave();
  }

  // ================================================================ collisions
  setupColliders() {
    const P = this.player, W = this.weapons, ph = this.physics;
    // Arcade doesn't promise which object comes first in a callback, so sort them out explicitly.
    const isStatic = (o) => o.body instanceof Phaser.Physics.Arcade.StaticBody;
    const mover = (a, b) => (isStatic(a) ? b : a);           // the moving thing in a thing-vs-terrain pair
    const terrain = (a, b) => (isStatic(a) ? a : b);
    const other = (a, b) => (a === P.phys ? b : a);           // whatever the player touched
    const canLand = (a, b) => {
      const body = mover(a, b).body, plat = terrain(a, b).body;
      return body.velocity.y >= 0 && body.prev.y + body.height <= plat.position.y + 12;
    };

    ph.add.collider(P.phys, this.solids);
    ph.add.collider(P.phys, this.platforms, () => { P.platT = this.time.now; }, (a, b) => P.dropT <= 0 && canLand(a, b));
    ph.add.collider(this.enemies, this.solids);
    ph.add.collider(this.enemies, this.platforms, null, canLand);
    ph.add.collider(this.shards, this.solids, null, (a, b) => !mover(a, b).magnet);
    ph.add.collider(this.shards, this.platforms, null, (a, b) => !mover(a, b).magnet && canLand(a, b));

    ph.add.overlap(W.bullets, this.solids, (a, b) => this.bulletWall(mover(a, b)));
    ph.add.overlap(W.enemyBullets, this.solids, (a, b) => W.kill(mover(a, b)));
    ph.add.overlap(W.bullets, this.enemies, (a, b) => (a.w ? this.bulletHit(a, b) : this.bulletHit(b, a)));
    ph.add.overlap(P.phys, W.enemyBullets, (a, b) => { const o = other(a, b); if (o.active && P.hurt(1, o.x)) W.kill(o); });
    ph.add.overlap(P.phys, this.enemies, (a, b) => { const e = other(a, b); if (e.active) P.hurt(e.d.contact, e.body.center.x); });
    ph.add.overlap(P.phys, this.spikeZones, () => this.spikeHit());
    ph.add.overlap(P.phys, this.pickups, (a, b) => this.collect(other(a, b)));
    ph.add.overlap(P.phys, this.shards, (a, b) => this.grabShard(other(a, b)));
  }

  // Plays a one-shot effect animation from the art sheets. Returns false if that art isn't loaded.
  playFx(key, x, y, scale) {
    if (!this.anims.exists(key)) return false;
    const s = this.add.sprite(x, y, key).setDepth(14).setScale(scale).setRotation(Math.random() * 6.28);
    s.play(key);
    s.once('animationcomplete', () => s.destroy());
    return true;
  }

  bulletWall(b) {
    if (!b.active) return;
    if (!b.w.fade && !this.playFx('fx_impact', b.x, b.y, 0.45)) this.fx.sparks.explode(3, b.x, b.y);
    this.weapons.kill(b);
  }

  bulletHit(b, e) {
    if (!b.active || !e.active || b.hitSet.has(e)) return;
    b.hitSet.add(e);
    if (b.w.fade || !this.playFx('fx_impact', b.x, b.y, 0.5)) this.fx.sparks.explode(4, b.x, b.y);
    e.damage(b.w.damage, Math.sign(b.body.velocity.x) || 1, b.w.knock === undefined ? 60 : b.w.knock);
    if (b.pierce-- <= 0) this.weapons.kill(b);
  }

  killEnemy(e) {
    const c = e.body.center;
    if (!this.playFx('fx_explosion', c.x, c.y, 0.95)) this.fx.burst.explode(22, c.x, c.y);
    this.fx.sparks.explode(10, c.x, c.y);
    this.cameras.main.shake(90, 0.004);
    this.hitstop(40);
    const [a, b] = e.d.shards;
    this.spawnShards(c.x, c.y, Phaser.Math.Between(a, b));
    // Disable now, destroy after the physics step finishes iterating.
    e.setActive(false).setVisible(false);
    e.body.enable = false;
    this.time.delayedCall(0, () => e.destroy());
  }

  // ================================================================ melee
  startSlash(dir) {
    // With real art the swing arc is part of the player's own slash frames.
    const baked = this.player.startSlashAnim(dir);
    const img = this.add.image(0, 0, 'slash').setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setAlpha(baked ? 0 : 0.95);
    this.tweens.add({ targets: img, alpha: 0, duration: GH.CONFIG.PLAYER.slashMs, ease: 'Quad.in', onComplete: () => img.destroy() });
    this.slash = { dir, facing: this.player.facing, t: 0, hit: new Set(), img, pogo: false };
    this.updateSlash(0);
  }

  slashGeom() {
    const s = this.slash, c = this.player.body.center, f = s.facing, Rect = Phaser.Geom.Rectangle;
    if (s.dir === 'up') return { rect: new Rect(c.x - 75, c.y - 230, 150, 190), x: c.x, y: c.y - 125, rot: -Math.PI / 2 };
    if (s.dir === 'down') return { rect: new Rect(c.x - 75, c.y + 20, 150, 190), x: c.x, y: c.y + 120, rot: Math.PI / 2 };
    return { rect: new Rect(f > 0 ? c.x + 10 : c.x - 190, c.y - 80, 180, 140), x: c.x + f * 100, y: c.y - 6, rot: f > 0 ? 0 : Math.PI };
  }

  updateSlash(dt) {
    const s = this.slash;
    if (!s) return;
    s.t += dt * 1000;
    const g = this.slashGeom(), C = GH.CONFIG.PLAYER, P = this.player;
    s.img.setPosition(g.x, g.y).setRotation(g.rot);
    if (s.t > C.slashMs) { this.slash = null; return; }
    if (s.t > 130) return;                       // hit window is the first 130ms

    const Rect = Phaser.Geom.Rectangle, hits = Phaser.Geom.Intersects.RectangleToRectangle;
    const bodyRect = (b) => new Rect(b.position.x, b.position.y, b.width, b.height);
    let bounce = false;

    for (const e of this.enemies.getChildren()) {
      if (!e.active || s.hit.has(e) || !hits(g.rect, bodyRect(e.body))) continue;
      s.hit.add(e);
      this.fx.sparks.explode(8, e.body.center.x, e.body.center.y);
      e.damage(C.slashDamage, s.dir === 'fwd' ? s.facing : 0, 420);
      this.hitstop(55);
      this.cameras.main.shake(60, 0.003);
      if (s.dir === 'down') bounce = true;
      else if (s.dir === 'fwd') P.body.velocity.x -= s.facing * 260;
    }
    // slashing swats enemy shots out of the air
    this.weapons.enemyBullets.children.iterate((b) => {
      if (b && b.active && g.rect.contains(b.x, b.y)) {
        this.weapons.kill(b);
        this.fx.sparks.explode(6, b.x, b.y);
      }
    });
    // pogo off spikes and enemies with a downward slash
    if (s.dir === 'down' && !bounce) {
      bounce = this.spikeZones.getChildren().some((z) => hits(g.rect, bodyRect(z.body)));
    }
    if (bounce && !s.pogo) { s.pogo = true; P.pogo(); }
  }

  // ================================================================ damage / death / rest
  hitstop(ms) {
    if (this.stopped) return;
    this.stopped = true;
    this.physics.world.pause();
    this.time.delayedCall(ms, () => { this.physics.world.resume(); this.stopped = false; });
  }

  onPlayerHurt() {
    this.hitstop(110);
    this.cameras.main.shake(180, 0.01);
    this.events.emit('hurt');
  }

  spikeHit() {
    const P = this.player;
    if (P.dead || P.frozen) return;
    P.hurt(1, P.body.center.x, true);
    if (P.dead) return;
    P.frozen = true;
    P.body.stop();
    P.body.allowGravity = false;
    const cam = this.cameras.main;
    cam.fadeOut(160, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      P.teleport(P.lastSafe.x, P.lastSafe.y);
      P.frozen = false;
      cam.fadeIn(220, 0, 0, 0);
    });
  }

  playerDied() {
    const P = this.player, c = P.body.center;
    P.dead = true; P.frozen = true;
    P.body.stop();
    P.body.enable = false;
    P.visual.setVisible(false);
    P.gun.setVisible(false);
    if (P.sheet && P.sheet.anims.death) {           // shatter frames from the sprite sheet
      const [first, last] = P.sheet.anims.death, v = P.visual;
      const d = this.add.image(v.x, v.y, 'player', first).setOrigin(0.5, v.originY)
        .setScale(P.sheet.scale * (P.sheet.anims.death[3] || 1)).setFlipX(v.flipX).setDepth(10);
      for (let f = first + 1; f <= last; f++) this.time.delayedCall(130 * (f - first), () => { if (d.active) d.setFrame(f); });
      this.tweens.add({ targets: d, alpha: 0, delay: 130 * (last - first) + 140, duration: 500, onComplete: () => d.destroy() });
    }
    this.fx.burst.explode(40, c.x, c.y);
    this.cameras.main.shake(300, 0.012);
    if (P.shards > 0) {
      this.makeCache(P.lastSafe.x, P.lastSafe.y - 60, P.shards);
      P.shards = 0;
      this.events.emit('toast', 'SHATTERED', 'Your shards wait where you fell.', '#ff6b6b');
    } else {
      this.events.emit('toast', 'SHATTERED', '', '#ff6b6b');
    }
    this.time.delayedCall(1300, () => {
      const cam = this.cameras.main;
      cam.fadeOut(400, 0, 0, 0);
      cam.once('camerafadeoutcomplete', () => {
        P.revive(this.benchPos.x, this.benchPos.y);
        this.weapons.clear();
        this.respawnEnemies();
        this.writeSave();
        cam.fadeIn(500, 0, 0, 0);
      });
    });
  }

  updateBench() {
    const P = this.player, b = this.benchPos;
    const near = !P.dead && Math.abs(P.body.center.x - b.x) < 90 && Math.abs(P.body.bottom - b.y) < 40;
    this.benchPrompt.setAlpha(Phaser.Math.Linear(this.benchPrompt.alpha, near ? 1 : 0, 0.2));
    if (near && P.onGroundNow && this.inp.pressed.up) {
      P.hp = P.maxHp;
      P.strikePose('rest', 1.6);
      this.respawnEnemies();
      this.writeSave();
      this.fx.glint.explode(20, b.x, b.y - 60);
      this.events.emit('toast', 'RESTED', 'Health restored  ·  Progress saved', '#ffe9c4');
    }
  }

  writeSave() {
    const P = this.player;
    GH.Save.write({
      benched: true,
      weapons: P.weapons, weaponIndex: P.weaponIndex, abilities: P.abilities, shards: P.shards,
      collected: [...this.collected], cache: this.cacheData,
    });
  }

  toggleDebug() {
    const w = this.physics.world;
    if (!w.debugGraphic) { w.createDebugGraphic(); w.drawDebug = false; }
    w.drawDebug = !w.drawDebug;
    w.debugGraphic.setDepth(100).setVisible(w.drawDebug);
    if (!w.drawDebug) w.debugGraphic.clear();
  }

  // ================================================================ frame
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000, P = this.player;
    this.inp.update();
    if (!P.frozen) P.update(dt, this.inp);
    for (const e of this.enemies.getChildren()) if (e.active) e.tick(dt, P);
    this.weapons.update(dt);
    this.updateSlash(dt);
    this.updateShards(dt);
    this.updateBench();

    // Camera: eases toward a point a little ahead of the player. The easing uses real elapsed time, so it
    // glides the same on a 60Hz and a 144Hz screen instead of lurching with the frame rate.
    const cam = this.cameras.main;
    const ease = (rate) => 1 - Math.exp(-rate * dt);
    this.lookX = Phaser.Math.Linear(this.lookX || 0, P.facing * 110, ease(2.2));
    cam.followOffset.x = -this.lookX;
    this.bgFar.tilePositionX = cam.scrollX * 0.12;
    this.bgMid.tilePositionX = cam.scrollX * 0.3;
  }
};
