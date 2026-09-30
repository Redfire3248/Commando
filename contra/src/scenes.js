(function () {
  const ADD = Phaser.BlendModes.ADD;
  const ts = (size, color) => ({ fontFamily: 'Rajdhani, "Segoe UI", sans-serif', fontSize: size + 'px', fontStyle: '700', color });

  function backdrop(scene) {
    const { W, H } = CG.CONFIG;
    scene.add.image(0, 0, 'bg_sky').setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-10);
    scene.bgFar = scene.add.tileSprite(0, 0, W, H, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-9);
    scene.bgTrees = scene.add.tileSprite(0, 0, W, H, 'bg_trees').setOrigin(0).setScrollFactor(0).setDepth(-8);
  }

  // ------------------------------------------------------------------ boot
  CG.BootScene = class extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {                       // real art from tools/build_art.py; anything missing keeps its placeholder
      const art = CG.DATA.art;
      if (!art || !CG.CONFIG.SHEET_ART) return;
      for (const k in art.images) this.load.image(k, art.images[k]);
      for (const k in art.sheets) this.load.spritesheet(k, art.sheets[k].path, { frameWidth: art.sheets[k].fw, frameHeight: art.sheets[k].fh });
    }
    create() {
      CG.Art.makeAll(this);
      const art = CG.DATA.art;
      if (CG.CONFIG.SHEET_ART && art && art.players && this.textures.exists('commandos')) {
        const last = Math.max(...Object.values(art.players[0].anims).map((a) => a[1]));
        CG.Art.recolourCommandos(this, art.sheets.commandos.fw, art.sheets.commandos.fh, last);
      }
      this.anims.create({ key: 'px_boom', frames: this.anims.generateFrameNumbers('px_boom', { start: 0, end: 4 }), frameRate: 18 });
      this.scene.start('Backdrop');
      CG.UI.ready();
    }
  };

  // ------------------------------------------------------------------ moving jungle behind the menus
  CG.BackdropScene = class extends Phaser.Scene {
    constructor() { super('Backdrop'); }
    create() { backdrop(this); this.x = 0; }
    update(t, delta) {
      this.x += delta * 0.06;
      this.bgFar.tilePositionX = this.x * 0.3;
      this.bgTrees.tilePositionX = this.x;
    }
  };

  // ------------------------------------------------------------------ the game
  CG.GameScene = class extends Phaser.Scene {
    constructor() { super('Game'); }
    init(data) { this.cfg = Object.assign({ devices: [{ type: 'kbAll' }], stage: 1, score: 0, lives: null }, data); }

    create() {
      const { W, H, TILE: T } = CG.CONFIG, L = CG.DATA.level, C = CG.CONFIG.PLAYER;
      this.diff = this.cfg.stage - 1;
      this.score = this.cfg.score;
      this.over = false; this.cleared = false; this.camX = 0; this.spawnI = 0; this.bossOn = false; this.bossT = 2500;
      this.artScale = (CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.scale) || {};
      this.bossCamX = L.boss.wallCol * T + 3 * T - W;

      backdrop(this);
      this.physics.world.setBounds(0, 0, L.w * T, H + 600);
      this.cameras.main.setBounds(0, 0, L.w * T, H);
      this.buildTerrain();

      this.sparks = this.add.particles(0, 0, 'spark', {
        lifespan: { min: 200, max: 600 }, speed: { min: 120, max: 560 }, scale: { start: 1.5, end: 0 },
        gravityY: 700, blendMode: 'ADD', tint: [0xffffff, 0xffd27a, 0xff8a3c], emitting: false,
      }).setDepth(15);

      this.bullets = this.physics.add.group({ allowGravity: false, maxSize: 40 });
      this.ebullets = this.physics.add.group({ allowGravity: false, maxSize: 120 });
      this.enemies = this.add.group();
      this.pickups = this.physics.add.group();

      const gy = L.groundRow * T;
      this.players = [];
      for (let i = 0; i < this.cfg.devices.length; i++) {
        const lives = this.cfg.lives ? this.cfg.lives[i] : C.lives;
        const p = new CG.Player(this, i, 2.5 * T + i * 70, gy, lives);
        if (lives <= 0) { p.out = true; p.body.enable = false; p.visual.setVisible(false); }
        this.players.push(p);
      }

      // everything that appears as the camera advances, sorted left to right
      const spawns = L.enemies.map(([t, c, r]) => ({ t, x: (c + 0.5) * T, y: (r || L.groundRow) * T }));
      L.capsules.forEach(([c, kind]) => spawns.push({ t: 'flyer', x: (c + 0.5) * T, y: 4 * T, extra: kind }));
      const bx = L.boss.wallCol * T;
      L.boss.cannonRows.forEach((r) => spawns.push({ t: 'cannon', x: bx - 8, y: r * T }));
      spawns.push({ t: 'core', x: bx - 40, y: gy });
      this.spawns = spawns.sort((a, b) => a.x - b.x);

      this.setupColliders();
      this.inp = new CG.Input(this, this.cfg.devices);

      // HUD: a medal and a life count per player on the left, score and stage on the right
      this.hud = this.players.map((p, i) => {
        const x = 44 + i * 190, col = CG.PLAYER_COLORS[i];
        return {
          icon: this.add.image(x, 50, 'life').setTint(parseInt(col.slice(1), 16)).setScrollFactor(0).setDepth(100),
          text: this.add.text(x + 22, 50, '', ts(30, col)).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100).setShadow(0, 2, '#000', 6),
        };
      });
      this.scoreText = this.add.text(W - 40, 46, '', ts(38, '#ffffff')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100).setShadow(0, 2, '#000', 6);
      this.stageText = this.add.text(W - 40, 84, 'STAGE ' + this.cfg.stage, ts(20, '#ffd39a')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
      this.banner = this.add.text(W / 2, H * 0.36, '', ts(88, '#ff9a3c')).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0).setShadow(0, 5, '#000', 14);
      this.say('STAGE ' + this.cfg.stage, 1800);
      CG.UI.onGameStart(this);
    }

    // ---------------------------------------------------------------- terrain
    buildTerrain() {
      const { H, TILE: T } = CG.CONFIG, L = CG.DATA.level, gy = L.groundRow * T;
      const zone = (group, x, y, w, h) => {
        const z = this.add.zone(x + w / 2, y + h / 2, w, h);
        this.physics.add.existing(z, true);
        group.add(z);
        return z;
      };
      this.solids = this.physics.add.staticGroup();
      this.ledges = this.physics.add.staticGroup();

      // water fills the bottom of the stage; the ground pieces cover it
      this.add.tileSprite(0, gy + 40, L.w * T, T, 'water').setOrigin(0).setDepth(1);
      this.add.tileSprite(0, gy + 40 + T, L.w * T, H - gy, 'water_deep').setOrigin(0).setDepth(1);
      L.ground.forEach(([a, b]) => {
        zone(this.solids, a * T, gy, (b - a) * T, H - gy + 300);
        for (let c = a; c < b; c++) {
          this.add.image(c * T, gy, 'g_top').setOrigin(0).setDepth(2);
          for (let r = L.groundRow + 1; r < L.h; r++) this.add.image(c * T, r * T, 'g_in').setOrigin(0).setDepth(2);
        }
      });
      L.ledges.forEach(([c, r, w]) => {
        const cc = zone(this.ledges, c * T, r * T, w * T, 20).body.checkCollision;
        cc.down = cc.left = cc.right = false;
        for (let i = 0; i < w; i++) this.add.image((c + i) * T, r * T - 4, 'ledge').setOrigin(0).setDepth(2);
      });
      // the fortress wall
      const wc = L.boss.wallCol;
      zone(this.solids, wc * T, 0, (L.w - wc) * T, gy);
      for (let c = wc; c < wc + 4; c++) for (let r = 0; r < L.groundRow; r++) this.add.image(c * T, r * T, 'boss_wall').setOrigin(0).setDepth(2);
    }

    // is there something to stand on at this point?
    isSurface(px, py) {
      const T = CG.CONFIG.TILE, L = CG.DATA.level, col = Math.floor(px / T), row = Math.floor(py / T);
      if (row >= L.groundRow && CG.Level.groundAt(col)) return true;
      return L.ledges.some(([c, r, w]) => r === row && col >= c && col < c + w);
    }

    setupColliders() {
      const ph = this.physics, bodies = this.players.map((p) => p.phys);
      const isStatic = (o) => o.body instanceof Phaser.Physics.Arcade.StaticBody;
      const mover = (a, b) => (isStatic(a) ? b : a), terrain = (a, b) => (isStatic(a) ? a : b);
      const canLand = (a, b) => {
        const m = mover(a, b), body = m.body, top = terrain(a, b).body.position.y;
        if (m.owner && m.owner.dropT > 0) return false;
        return body.velocity.y >= 0 && body.prev.y + body.height <= top + 14;
      };
      const pick = (a, b, test) => (test(a) ? [a, b] : [b, a]);

      ph.add.collider(bodies, this.solids);
      ph.add.collider(bodies, this.ledges, (a, b) => { mover(a, b).owner.ledgeT = this.time.now; }, canLand);
      ph.add.collider(this.enemies, this.solids);
      ph.add.collider(this.enemies, this.ledges, null, canLand);
      ph.add.collider(this.pickups, this.solids);
      ph.add.collider(this.pickups, this.ledges, null, canLand);

      ph.add.overlap(this.bullets, this.enemies, (a, b) => {
        const [bul, e] = pick(a, b, (o) => o.isBullet);
        if (!bul.active || !e.active) return;
        this.sparks.explode(4, bul.x, bul.y);
        this.kill(bul);
        e.damage(1);
      });
      ph.add.overlap(bodies, this.ebullets, (a, b) => {
        const [z, bul] = pick(a, b, (o) => !!o.owner);
        if (!bul.active || z.owner.dead) return;
        this.kill(bul);
        z.owner.hit();
      });
      ph.add.overlap(bodies, this.enemies, (a, b) => {
        const [z, e] = pick(a, b, (o) => !!o.owner);
        if (e.active && e.T.ai !== 'flyer') z.owner.hit();
      });
      ph.add.overlap(bodies, this.pickups, (a, b) => {
        const [z, k] = pick(a, b, (o) => !!o.owner);
        if (k.active && !z.owner.dead) this.collect(z.owner, k);
      });
    }

    // ---------------------------------------------------------------- shooting
    shot(group, key, x, y, a, speed, hit) {
      const b = group.get(x, y, key);
      if (!b) return null;
      const sc = this.artScale[key] || 1;
      b.setTexture(key).setActive(true).setVisible(true).setRotation(a).setScale(sc).setDepth(9)
        .setBlendMode(Phaser.BlendModes.NORMAL);
      b.body.enable = true;
      b.body.allowGravity = false;
      b.body.setSize(hit / sc, hit / sc, true);
      b.body.reset(x, y);
      b.body.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
      return b;
    }
    fire(player, x, y, a) {
      const b = this.shot(this.bullets, 'bullet', x, y, a, CG.CONFIG.PLAYER.bulletSpeed, 16);
      if (!b) return;
      b.isBullet = true; b.shooter = player;
      const sc = this.artScale.flash;
      const f = this.add.image(x, y, 'flash').setDepth(12).setRotation(a);
      if (sc) f.setOrigin(0, 0.5).setScale(sc * 0.7).setBlendMode(ADD);
      this.tweens.add({ targets: f, alpha: 0, duration: 60, onComplete: () => f.destroy() });
    }
    efire(x, y, a) {
      this.shot(this.ebullets, 'ebullet', x, y, a, CG.CONFIG.ENEMY_BULLET_SPEED + 35 * this.diff, 16);
    }
    countBullets(player) {
      let n = 0;
      this.bullets.children.iterate((b) => { if (b && b.active && b.shooter === player) n++; });
      return n;
    }
    kill(b) { b.setActive(false).setVisible(false); b.body.stop(); b.body.enable = false; }

    boom(x, y, n) {
      this.sparks.explode(n, x, y);
      const e = this.add.sprite(x, y, 'px_boom', 0).setDepth(14).setScale(n > 25 ? 2.2 : n > 15 ? 1.4 : 1);
      e.play('px_boom');
      e.once('animationcomplete', () => e.destroy());
    }

    nearestPlayer(x, y) {
      let best = null, bd = Infinity;
      for (const p of this.players) {
        if (p.dead || p.out) continue;
        const d = Math.abs(p.body.center.x - x) + Math.abs(p.body.center.y - y);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }

    // ---------------------------------------------------------------- enemies, power-ups, boss
    killEnemy(e) {
      const c = e.body.center, S = CG.CONFIG.SCORE;
      this.score += S[e.type] || 0;
      this.boom(c.x, c.y, e.T.boss ? 40 : 18);
      this.cameras.main.shake(e.T.boss ? 260 : 80, e.T.boss ? 0.012 : 0.004);
      if (e.type === 'flyer') this.dropPickup(c.x, c.y, e.extra);
      e.setActive(false).setVisible(false);
      e.body.enable = false;
      if (e.barrel) e.barrel.setVisible(false);
      this.time.delayedCall(0, () => e.destroy());
      if (e.type === 'core') this.stageClear();
    }

    dropPickup(x, y, kind) {
      const k = this.pickups.create(x, y, 'pk_' + kind).setDepth(7);
      if (this.artScale['pk_' + kind]) k.setScale(this.artScale['pk_' + kind]);
      k.kind = kind;
      k.body.setVelocity(-60, -420);
      k.body.setBounce(0.3);
    }

    collect(p, k) {
      const C = CG.CONFIG.PLAYER;
      if (k.kind === 'rapid') { p.rapid = true; this.say('RAPID FIRE', 900); }
      if (k.kind === 'barrier') { p.barrierT = C.barrierMs; this.say('SHIELD', 900); }
      if (k.kind === 'life') { p.lives++; this.say('EXTRA LIFE', 900); }
      this.score += CG.CONFIG.SCORE.pickup;
      this.sparks.explode(14, k.x, k.y);
      k.disableBody(true, true);
      this.time.delayedCall(0, () => k.destroy());
    }

    say(msg, ms) {
      this.tweens.killTweensOf(this.banner);
      this.banner.setText(msg).setAlpha(1);
      this.tweens.add({ targets: this.banner, alpha: 0, delay: ms, duration: 500 });
    }

    stageClear() {
      if (this.cleared) return;
      this.cleared = true;
      this.time.delayedCall(0, () => {             // after the physics step that killed the core has finished
        this.enemies.getChildren().slice().forEach((e) => { if (e.active) { this.boom(e.x, e.y - 40, 16); e.destroy(); } });
        this.ebullets.children.iterate((b) => { if (b && b.active) this.kill(b); });
      });
      const wallX = CG.DATA.level.boss.wallCol * CG.CONFIG.TILE;
      for (let i = 0; i < 9; i++) {
        this.time.delayedCall(i * 170, () => this.boom(wallX + Phaser.Math.Between(-20, 160), Phaser.Math.Between(150, 850), 30));
      }
      this.say('STAGE CLEAR', 2400);
      this.time.delayedCall(3300, () => {
        this.scene.restart({
          devices: this.cfg.devices, stage: this.cfg.stage + 1, score: this.score + 3000,
          lives: this.players.map((p) => p.lives),
        });
      });
    }

    checkOver() {
      if (this.over || !this.players.every((p) => p.out)) return;
      this.over = true;
      this.say('GAME OVER', 5000);
      this.time.delayedCall(1400, () => CG.UI.gameOver(this.score, this.cfg.stage));
    }

    // ---------------------------------------------------------------- frame
    update(time, delta) {
      if (this.over) return;
      const dt = Math.min(delta, 50) / 1000, { W, H, TILE: T } = CG.CONFIG, cam = this.cameras.main;
      const ins = this.inp.read();
      this.players.forEach((p, i) => p.update(dt, ins[i]));

      // the camera follows whoever is furthest ahead, and never goes back
      const alive = this.players.filter((p) => !p.dead && !p.out);
      if (alive.length) {
        const target = Math.min(Math.max(...alive.map((p) => p.body.center.x)) - W * 0.42, this.bossCamX);
        if (target > this.camX) this.camX += (target - this.camX) * (1 - Math.exp(-7 * dt));
      }
      cam.scrollX = this.camX;
      this.bgFar.tilePositionX = this.camX * 0.12;
      this.bgTrees.tilePositionX = this.camX * 0.4;

      while (this.spawnI < this.spawns.length && this.spawns[this.spawnI].x < this.camX + W + 100) {
        const s = this.spawns[this.spawnI++];
        this.enemies.add(new CG.Enemy(this, s.t, s.x, s.y, s.extra));
      }
      for (const e of this.enemies.getChildren().slice()) {
        if (!e.active) continue;
        e.tick(dt);
        if (!e.T.boss && (e.x < this.camX - 260 || e.y > H + 260)) e.destroy();
      }

      const off = (b) => b.x < this.camX - 60 || b.x > this.camX + W + 60 || b.y < -60 || b.y > H + 60;
      this.bullets.children.iterate((b) => { if (b && b.active && off(b)) this.kill(b); });
      this.ebullets.children.iterate((b) => { if (b && b.active && off(b)) this.kill(b); });
      this.pickups.children.iterate((k) => { if (k && k.active && (k.x < this.camX - 100 || k.y > H + 100)) k.destroy(); });

      // boss fight: camera locked at the fortress, soldiers keep arriving from behind
      if (!this.bossOn && this.camX >= this.bossCamX - 4) { this.bossOn = true; this.say('DESTROY THE CORE', 1800); }
      if (this.bossOn && !this.cleared) {
        this.bossT -= delta;
        if (this.bossT <= 0) {
          this.bossT = Math.max(1800, 3800 - 350 * this.diff);
          const r = new CG.Enemy(this, 'runner', this.camX - 40, CG.DATA.level.groundRow * T);
          r.dir = 1;
          this.enemies.add(r);
        }
      }

      this.hud.forEach((h, i) => {
        const p = this.players[i];
        h.text.setText('×' + Math.max(0, p.lives) + (p.rapid ? '  R' : '') + (p.barrierT > 0 ? '  S' : ''));
        h.icon.setAlpha(p.out ? 0.3 : 1); h.text.setAlpha(p.out ? 0.3 : 1);
      });
      this.scoreText.setText(String(this.score).padStart(7, '0'));
    }
  };
})();
