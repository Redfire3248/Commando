(function () {
  const ADD = Phaser.BlendModes.ADD;
  const ts = (size, color) => ({ fontFamily: 'Rajdhani, "Segoe UI", sans-serif', fontSize: size + 'px', fontStyle: '700', color });

  // Three layers that scroll at different speeds. Painted strips from backgrounds.png are used where they were
  // sliced (they are short wide strips, so each is drawn at a fixed height and repeated sideways).
  // backgrounds15.png: one full scene per stage. Each stage theme has a few; every time the stages repeat the
  // next one is used. (Numbers are the panels in reading order.)
  const BG15 = { jungle: [1, 2, 3, 4, 14, 7], base: [5, 6, 12, 13, 15, 8], snow: [9, 10, 11] };
  function backdrop(scene, theme, stage) {
    const { W, H } = CG.CONFIG;
    const list = CG.DATA.art && CG.DATA.art.bg15;
    if (list && list.length >= 15) {
      const lap = Math.floor(((stage || 1) - 1) / CG.DATA.levels.length), pick = BG15[theme] || BG15.jungle;
      const key = 'bg15_' + pick[lap % pick.length];
      if (scene.textures.exists(key)) {
        const src = scene.textures.get(key).getSourceImage();
        const gy = CG.DATA.level ? CG.DATA.level.groundRow * CG.CONFIG.TILE : H * 0.83;
        const sc = Math.max(H, (gy + 40) / 0.9) / src.height;       // the panel's dark bottom band sits behind the ground
        scene.add.rectangle(0, 0, W, H, 0x05070a).setOrigin(0).setScrollFactor(0).setDepth(-11);
        scene.bgFar = scene.add.tileSprite(0, 0, W, Math.ceil(src.height * sc), key).setOrigin(0).setTileScale(sc, sc).setScrollFactor(0).setDepth(-10);
        scene.bgFar.scrollK = 1 / sc;
        scene.bgTrees = scene.add.tileSprite(0, 0, 4, 4, '__DEFAULT').setVisible(false);
        scene.bgTrees.scrollK = 0;
        return;
      }
    }
    const P = (CG.DATA.art && CG.DATA.art.backgrounds && CG.DATA.art.backgrounds[theme]) || {};
    const has = (k) => k && scene.textures.exists(k);
    const strip = (key, y, h, depth) => {
      const src = scene.textures.get(key).getSourceImage(), sc = h / src.height;
      return scene.add.tileSprite(0, y, W, h, key).setOrigin(0).setTileScale(sc, sc).setScrollFactor(0).setDepth(depth);
    };
    // where the painted near / far strips sit (bottom of the screen, far one above it)
    const nearH = 430, farH = 360, nearY = H - nearH + 40, farY = nearY - farH + 90;
    if (has(P.sky)) {
      const src = scene.textures.get(P.sky).getSourceImage();
      const h = has(P.far) ? farY + 60 : H, sc = h / src.height;
      scene.add.tileSprite(0, 0, W, h, P.sky).setOrigin(0).setTileScale(sc, sc).setScrollFactor(0).setDepth(-10);
      if (h < H) scene.add.rectangle(0, h, W, H - h, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(-10.5);
    } else {
      scene.add.image(0, 0, 'bg_sky_' + theme).setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-10);
    }
    scene.bgFar = has(P.far) ? strip(P.far, farY, farH, -9)
      : scene.add.tileSprite(0, 0, W, H, 'bg_far_' + theme).setOrigin(0).setScrollFactor(0).setDepth(-9);
    // the painted near layer (fences, barrels) read as things on the floor sliding past, so it is not used;
    // over a painted far layer there is no near layer at all
    scene.bgTrees = has(P.far) ? scene.add.tileSprite(0, 0, 4, 4, '__DEFAULT').setVisible(false)
      : scene.add.tileSprite(0, 0, W, H, 'bg_trees_' + theme).setOrigin(0).setScrollFactor(0).setDepth(-8);
    // tileSprite scroll is in texture pixels, so a scaled strip scrolls slower: keep the speed the same on screen
    scene.bgFar.scrollK = 1 / (scene.bgFar.tileScaleX || 1);
    scene.bgTrees.scrollK = 1 / (scene.bgTrees.tileScaleX || 1);
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
      for (const k of (art && art.pixel) || []) {
        if (this.textures.exists(k)) this.textures.get(k).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      // ability effects from ability_fx.png: key, frame count, frames per second, loop
      for (const [k, n, fps, loop] of [['fx_storm', 4, 24, true], ['fx_mend', 5, 12], ['fx_plus', 5, 10], ['fx_dash', 4, 20],
        ['fx_blink', 3, 16], ['fx_dome', 6, 10, true], ['fx_dome_break', 4, 12], ['fx_arc', 4, 20, true], ['fx_spark', 3, 16],
        ['fx_charge', 3, 14], ['fx_slash', 3, 16]]) {
        if (this.textures.exists(k)) this.anims.create({ key: k, frames: this.anims.generateFrameNumbers(k, { start: 0, end: n - 1 }), frameRate: fps, repeat: loop ? -1 : 0 });
      }
      if (CG.CONFIG.SHEET_ART && art && art.players && this.textures.exists('commandos')) {
        const last = Math.max(...Object.values(art.players[0].anims).map((a) => a[1]));
        CG.Art.recolourCommandos(this, art.sheets.commandos.fw, art.sheets.commandos.fh, last);
      }
      // explosion and splash animations: painted ones from enemies_tiles.png when loaded, pixel art otherwise
      const painted = this.textures.exists('fx_boom');
      this.anims.create({ key: 'boom', frames: this.anims.generateFrameNumbers(painted ? 'fx_boom' : 'px_boom', { start: 0, end: painted ? 3 : 4 }), frameRate: painted ? 14 : 18 });
      if (this.textures.exists('fx_splash')) this.anims.create({ key: 'splash', frames: this.anims.generateFrameNumbers('fx_splash', { start: 0, end: 1 }), frameRate: 7 });
      // pictures for the menus: the agents' portraits and ability icons (painted sheet, else a frame of the sheet)
      CG.PORTRAITS = {}; CG.ABICONS = {};
      const img = (k) => art && art.images && art.images[k];
      for (const a of CG.AGENTS) {
        if (img('portrait_' + a.id)) CG.PORTRAITS[a.id] = img('portrait_' + a.id);
        else if (art && art.players && this.textures.exists(a.fallback)) {
          // no painted portrait (the classic commandos): head and shoulders cut from their standing frame
          try {
            const fr = this.textures.getFrame(a.fallback, art.players[a.fallbackWho].anims.stand_fwd[0]);
            const src = fr.source.image, c = document.createElement('canvas'), g = c.getContext('2d');
            const box = 120, sx = fr.cutX + fr.cutWidth / 2 - box / 2 - 6, sy = fr.cutY + fr.cutHeight * 0.3;
            c.width = c.height = 240;
            g.drawImage(src, sx, sy, box, box, 0, 0, 240, 240);
            CG.PORTRAITS[a.id] = c.toDataURL();
          } catch (e) { /* no picture */ }
        }
        if (img('ab_' + a.id)) CG.ABICONS[a.id] = img('ab_' + a.id);
        else if (this.textures.exists('ab_' + a.id)) CG.ABICONS[a.id] = this.textures.getBase64('ab_' + a.id);
      }
      this.scene.start('Backdrop');
      CG.UI.ready();
    }
  };

  // ------------------------------------------------------------------ moving jungle behind the menus
  CG.BackdropScene = class extends Phaser.Scene {
    constructor() { super('Backdrop'); }
    create() { backdrop(this, 'jungle', 1); this.x = 0; }
    update(t, delta) {
      this.x += delta * 0.06;
      this.bgFar.tilePositionX = this.x * 0.3 * this.bgFar.scrollK;
      this.bgTrees.tilePositionX = this.x * this.bgTrees.scrollK;
    }
  };

  // ------------------------------------------------------------------ the game
  CG.GameScene = class extends Phaser.Scene {
    constructor() { super('Game'); }
    // cfg.players: [{ device, agent, name, bot }]; cfg.teamLives carries over between stages
    init(data) {
      this.cfg = Object.assign({ players: [{ device: { type: 'kbAll' }, agent: 'razor', name: 'P1' }], stage: 1, score: 0, teamLives: null }, data);
      this.cfg.devices = this.cfg.players.map((p) => p.device);
    }

    create() {
      const { W, H, TILE: T } = CG.CONFIG, C = CG.CONFIG.PLAYER, all = CG.DATA.levels;
      const L = CG.DATA.level = all[(this.cfg.stage - 1) % all.length];        // stages repeat, harder each time
      this.diff = this.cfg.stage - 1;
      this.score = this.cfg.score;
      this.over = false; this.cleared = false; this.camX = 0; this.spawnI = 0; this.bossOn = false; this.bossT = 2500;
      this.artScale = (CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.scale) || {};
      this.enemyScale = (CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.enemyScale) || 1;
      this.bossCamX = L.boss.wallCol * T + 3 * T - W;

      backdrop(this, L.theme, this.cfg.stage);
      this.physics.world.setBounds(0, 0, L.w * T, H + 600);
      this.cameras.main.setBounds(0, 0, L.w * T, H);
      this.buildTerrain();

      this.sparks = this.add.particles(0, 0, 'spark', {
        lifespan: { min: 200, max: 600 }, speed: { min: 120, max: 560 }, scale: { start: 1.5, end: 0 },
        gravityY: 700, blendMode: 'ADD', tint: [0xffffff, 0xffd27a, 0xff8a3c], emitting: false,
      }).setDepth(15);

      this.bullets = this.physics.add.group({ allowGravity: false, maxSize: 90 });
      this.ebullets = this.physics.add.group({ allowGravity: false, maxSize: 120 });
      this.ebombs = this.physics.add.group({ maxSize: 40 });                   // grenades and bombs: these fall
      this.grenades = this.physics.add.group({ maxSize: 12 });                 // Jax's frag grenades
      this.enemies = this.add.group();
      this.pickups = this.physics.add.group();

      const gy = L.groundRow * T;
      this.players = this.cfg.players.map((cp, i) => new CG.Player(this, i, 2.5 * T + i * 70, gy, cp));
      // one pool of lives for the whole team: 3 for one player, 2 more for each extra player
      this.teamLives = this.cfg.teamLives !== null && this.cfg.teamLives !== undefined ? this.cfg.teamLives : C.lives + 2 * (this.players.length - 1);
      this.adminUsed = !!this.cfg.adminUsed;
      // shop perks for this device's account holder (player 1 here, or my own soldier online)
      const fx = CG.Net.online ? CG.Shop.effects() : {};
      const mine = this.cfg.online ? this.players.find((p) => p.owner === CG.Net.uid && !p.bot) : this.players.find((p) => !p.bot && !p.remote);
      if (mine) {
        CG.Shop.apply(mine, fx);
        if (fx.life && !this.cfg.online && (this.cfg.teamLives === null || this.cfg.teamLives === undefined)) this.teamLives++;
      }
      this.touchPlayer = this.players.find((p) => p.device && (p.device.type === 'touch' || p.device.type === 'any'));
      this.netSeq = 0;
      this.net = this.cfg.online && CG.Online.mid ? CG.Online.attach(this) : null;
      this.isClient = !!(this.net && !this.net.host);       // online but not the host: the host runs the stage
      if (this.input.mouse) this.input.mouse.disableContextMenu();       // right click = ability

      // everything that appears as the camera advances, sorted left to right
      const spawns = L.enemies.map(([t, c, r]) => ({ t, x: (c + 0.5) * T, y: t === 'drone' ? 4.5 * T : (r || L.groundRow) * T }));
      L.capsules.forEach(([c, kind]) => spawns.push({ t: 'flyer', x: (c + 0.5) * T, y: 4 * T, extra: kind }));
      const bx = L.boss.wallCol * T;
      if (L.boss.type === 'fortress') {
        L.boss.cannonRows.forEach((r) => spawns.push({ t: 'cannon', x: bx - 8, y: r * T }));
        spawns.push({ t: 'core', x: bx - 40, y: gy });
      } else if (L.boss.type === 'tank') {
        spawns.push({ t: 'tank', x: bx - 260, y: gy });
      } else {
        spawns.push({ t: 'gunship', x: bx - 300, y: 250 });
      }
      this.spawns = spawns.sort((a, b) => a.x - b.x);

      this.setupColliders();
      this.inp = new CG.Input(this, this.cfg.devices);

      this.buildHud();
      this.scoreText = this.add.text(W - 40, 46, '', ts(38, '#ffffff')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100).setShadow(0, 2, '#000', 6);
      this.stageText = this.add.text(W - 40, 84, 'STAGE ' + this.cfg.stage + ' · ' + L.name, ts(20, '#ffd39a')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
      this.banner = this.add.text(W / 2, H * 0.36, '', ts(88, '#ff9a3c')).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0).setShadow(0, 5, '#000', 14);
      this.say(L.name, 1800);
      CG.Sfx.play('start');
      CG.UI.onGameStart(this);
    }

    // ---------------------------------------------------------------- HUD
    // per player: portrait, name, hearts, ability icon with its cooldown; the team's lives in the middle
    buildHud() {
      const { W } = CG.CONFIG, fixed = (o) => o.setScrollFactor(0).setDepth(100);
      // phones show the game small: the players' part of the HUD is drawn bigger there
      const k = CG.Touch.enabled ? 1.45 : 1;
      this.hudL = this.add.container(0, 0).setScrollFactor(0).setDepth(100).setScale(k);
      const left = (o) => { this.hudL.add(o); return o; };
      const has = (k) => this.textures.exists(k);
      this.hud = this.players.map((p, i) => {
        const x = 24 + i * 300, y = 22, id = p.agent.id, h = {};
        h.port = has('portrait_' + id) ? left(this.add.image(x, y, 'portrait_' + id).setOrigin(0)) : null;
        if (h.port) h.port.setScale(64 / h.port.height);
        else if (p.art.tex !== 'pl' + (p.idx % 5)) {
          // no painted portrait (the classic commandos): the head and shoulders of their standing frame
          const f = this.add.image(0, 0, p.art.tex, p.art.anims.stand_fwd[0]).setOrigin(0);
          const cw = f.width, cx = cw / 2 - 55, cy = f.height * 0.3, k = 64 / 110;
          f.setCrop(cx, cy, 110, 110).setScale(k).setPosition(x - cx * k, y - cy * k);
          h.port = left(f);
        }
        h.name = left(this.add.text(x + 72, y - 2, p.name, ts(22, p.color)).setShadow(0, 2, '#000', 4));
        h.hearts = left(this.add.container(x + 72, y + 40));
        h.ab = has('ab_' + id) ? left(this.add.image(x + 250, y + 30, 'ab_' + id)) : null;
        if (h.ab) h.ab.setScale(44 / h.ab.height);
        h.cd = left(this.add.graphics());
        h.lastHp = -1; h.lastMax = -1;
        return h;
      });
      // the team's shared lives, under the score on the right
      this.livesText = fixed(this.add.text(W - 40, 126, '', ts(34, '#ffffff')).setOrigin(1, 0.5).setShadow(0, 2, '#000', 6));
      this.livesIcon = fixed(this.add.image(W - 130, 126, has('life') ? 'life' : 'pk_life'));
      this.livesIcon.setScale(Math.min(1, 40 / this.livesIcon.height));
      this.add.text(W - 160, 126, 'TEAM', ts(18, '#ffd39a')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
      this.adminTag = fixed(this.add.text(W - 40, 162, 'ADMIN · SCORE NOT SAVED', ts(16, '#ff8080')).setOrigin(1, 0.5)).setVisible(this.adminUsed);
    }

    updateHud() {
      const heart = this.textures.exists('hud_heart');
      this.hud.forEach((h, i) => {
        const p = this.players[i];
        if (p.hp !== h.lastHp || p.maxHp !== h.lastMax) {
          h.hearts.removeAll(true);
          for (let k = 0; k < p.maxHp; k++) {
            const img = heart ? this.add.image(k * 22, 0, k < p.hp ? 'hud_heart' : 'hud_heart_empty').setScale(20 / 64)
              : this.add.rectangle(k * 22, 0, 16, 16, k < p.hp ? 0xff4d4d : 0x333333);
            if (heart) img.setScale(20 / img.height);
            h.hearts.add(img);
          }
          h.lastHp = p.hp; h.lastMax = p.maxHp;
        }
        const a = p.out ? 0.3 : 1;
        [h.port, h.name, h.hearts, h.ab].forEach((o) => o && o.setAlpha(a));
        h.cd.clear();
        if (h.ab && p.abilityCd > 0) {                     // a dark wedge that shrinks as the ability recharges
          const f = p.abilityCd / p.agent.ability.cd;
          h.cd.fillStyle(0x000000, 0.65).slice(h.ab.x, h.ab.y, 23, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2, false).fillPath();
        }
      });
      this.livesText.setText('×' + this.teamLives);
      this.adminTag.setVisible(this.adminUsed);
    }

    // ---------------------------------------------------------------- terrain
    buildTerrain() {
      const { H, TILE: T } = CG.CONFIG, L = CG.DATA.level, gy = L.groundRow * T, k = (name) => name + '_' + L.theme;
      const zone = (group, x, y, w, h) => {
        const z = this.add.zone(x + w / 2, y + h / 2, w, h);
        this.physics.add.existing(z, true);
        group.add(z);
        return z;
      };
      this.solids = this.physics.add.staticGroup();
      this.ledges = this.physics.add.staticGroup();

      // water fills the bottom of the stage; the ground pieces cover it
      const has = (key) => this.textures.exists(key);
      const fit = (ts) => { const w = ts.texture.getSourceImage().width; if (w !== T) ts.setTileScale(T / w); return ts; };
      fit(this.add.tileSprite(0, gy + 40, L.w * T, T, k('water')).setOrigin(0).setDepth(1));
      fit(this.add.tileSprite(0, gy + 40 + T, L.w * T, H - gy, k('water_deep')).setOrigin(0).setDepth(1));
      const variant = (name, i) => (has(k(name) + '_' + i) ? k(name) + '_' + i : k(name));
      const tile = (x, y, key) => this.add.image(x, y, key).setOrigin(0).setDisplaySize(T + 0.5, T + 0.5).setDepth(2);
      L.ground.forEach(([a, b]) => {
        zone(this.solids, a * T, gy, (b - a) * T, H - gy + 300);
        for (let c = a; c < b; c++) {
          const edge = c === a && has(k('g_left')) ? k('g_left') : c === b - 1 && has(k('g_right')) ? k('g_right') : variant('g_top', c % 3);
          tile(c * T, gy, edge);
          for (let r = L.groundRow + 1; r < L.h; r++) tile(c * T, r * T, variant('g_in', (c + r) % 2));
        }
      });
      // cover: solid, stops every bullet, can be stood on. Painted cover (cover50.png) replaces the pixel boxes by key.
      this.covers = this.physics.add.staticGroup();
      for (const cv of CG.Level.covers(L)) {
        const key = 'cv_' + cv.kind, img = this.add.image(cv.col * T, gy + 2, key).setOrigin(0, 1).setDepth(6);
        const sc = this.artScale[key];
        if (sc) img.setScale(sc);
        zone(this.covers, img.x + 4, img.y - img.displayHeight + 6, img.displayWidth - 8, img.displayHeight - 8);
      }
      // Ledges are solid on every side (you bump your head on them, you can't jump up through them); the hitbox is
      // as thick as the ledge art. Down + Jump still drops you off one.
      L.ledges.forEach(([c, r, w]) => {
        let top = r * T, bottom = r * T + 20;
        for (let i = 0; i < w; i++) {
          const img = this.add.image((c + i) * T - 4, r * T - 4, k('ledge')).setOrigin(0).setDepth(2);
          if (img.width !== 16 * 4) img.setDisplaySize(T + 8, (T + 8) * img.height / img.width).setY(r * T - 10);   // painted ledge piece
          top = img.y + 4;
          bottom = Math.max(bottom, img.y + img.displayHeight * 0.8);
        }
        zone(this.ledges, c * T, top, w * T, Math.max(20, bottom - top));
      });
      // the fortress wall
      const wc = L.boss.wallCol;
      zone(this.solids, wc * T, 0, (L.w - wc) * T, gy);
      for (let c = wc; c < wc + 4; c++) for (let r = 0; r < L.groundRow; r++) tile(c * T, r * T, has(k('wall')) ? k('wall') : 'boss_wall');
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
      // ledges are solid, except while a player is dropping off one (Down + Jump)
      const canLand = (a, b) => { const m = mover(a, b); return !(m.owner && m.owner.dropT > 0); };
      const pick = (a, b, test) => (test(a) ? [a, b] : [b, a]);

      ph.add.collider(bodies, this.solids);
      ph.add.collider(bodies, this.ledges, (a, b) => { const m = mover(a, b); if (m.body.touching.down || m.body.blocked.down) m.owner.ledgeT = this.time.now; }, canLand);
      ph.add.collider(this.enemies, this.solids);
      ph.add.collider(this.enemies, this.ledges, null, canLand);
      ph.add.collider(this.pickups, this.solids);
      ph.add.collider(bodies, this.covers);
      // frag grenades burst on the ground, on cover or on an enemy
      const burst = (g) => { if (g.active) this.fragBurst(g); };
      ph.add.collider(this.grenades, this.solids, (a, b) => burst(mover(a, b)));
      ph.add.collider(this.grenades, this.covers, (a, b) => burst(mover(a, b)));
      ph.add.overlap(this.grenades, this.enemies, (a, b) => burst(a.isFrag ? a : b));
      ph.add.collider(this.enemies, this.covers);
      ph.add.collider(this.pickups, this.covers);
      const stop = (a, b) => { const bul = isStatic(a) ? b : a; if (bul.active) { this.sparks.explode(3, bul.x, bul.y); this.kill(bul); } };
      ph.add.overlap(this.bullets, this.covers, stop);
      ph.add.overlap(this.ebullets, this.covers, stop);
      ph.add.collider(this.ebombs, this.covers, (a, b) => {
        const m = mover(a, b);
        if (m.active) { this.boom(m.x, m.y, 10); CG.Sfx.play('boom'); this.kill(m); }
      });
      ph.add.collider(this.pickups, this.ledges, null, canLand);

      ph.add.overlap(this.bullets, this.enemies, (a, b) => {
        const [bul, e] = pick(a, b, (o) => o.isBullet);
        if (!bul.active || !e.active) return;
        this.sparks.explode(4, bul.x, bul.y);
        if (bul.pierce > 0) { bul.pierce--; bul.hitSet = bul.hitSet || new Set(); if (bul.hitSet.has(e)) return; bul.hitSet.add(e); } else this.kill(bul);
        if (!bul.ghost) e.damage(1);
      });
      ph.add.overlap(bodies, this.ebullets, (a, b) => {
        const [z, bul] = pick(a, b, (o) => !!o.owner);
        if (!bul.active || z.owner.dead) return;
        const shield = this.underDome(z.owner, true);
        this.kill(bul);
        if (shield) {                                    // Aegis: the shot goes back the way it came
          const back = this.fire(shield, bul.x, bul.y, Math.atan2(-bul.body.velocity.y, -bul.body.velocity.x));
          if (back) back.setTint(0x8ac8ff);
          return;
        }
        z.owner.hit();
      });
      // grenades and bombs burst on the ground and kill on touch
      ph.add.collider(this.ebombs, this.solids, (a, b) => {
        const m = mover(a, b);
        if (m.active) { this.boom(m.x, m.y, 10); CG.Sfx.play('boom'); this.kill(m); }
      });
      ph.add.overlap(bodies, this.ebombs, (a, b) => {
        const [z, bomb] = pick(a, b, (o) => !!o.owner);
        if (!bomb.active || z.owner.dead) return;
        this.boom(bomb.x, bomb.y, 10);
        this.kill(bomb);
        z.owner.hit(2);
      });
      ph.add.overlap(bodies, this.enemies, (a, b) => {
        const [z, e] = pick(a, b, (o) => !!o.owner);
        if (e.active && e.T.ai !== 'flyer') z.owner.hit();
      });
      ph.add.overlap(bodies, this.pickups, (a, b) => {
        const [z, k] = pick(a, b, (o) => !!o.owner);
        if (k.active && !z.owner.dead && !z.owner.remote) this.collect(z.owner, k);
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
    fire(player, x, y, a, ghost) {
      const b = this.shot(this.bullets, 'bullet', x, y, a, CG.CONFIG.PLAYER.bulletSpeed, 16);
      if (!b) return null;
      b.isBullet = true; b.shooter = player; b.ghost = !!ghost; b.pierce = 0;
      if (player && player.perkGold) b.setTint(0xffd27a); else b.clearTint();
      if (player && player.stormT > 0 && this.anims.exists('fx_storm')) {
        const f = this.add.sprite(x, y, 'fx_storm', 0).setOrigin(0, 0.5).setRotation(a).setScale(0.35).setDepth(12);
        f.play('fx_storm');
        this.time.delayedCall(60, () => f.destroy());
        return b;
      }
      const sc = this.artScale.flash;
      const f = this.add.image(x, y, 'flash').setDepth(12).setRotation(a);
      if (sc) f.setOrigin(0, 0.5).setScale(sc * 0.7).setBlendMode(ADD);
      this.tweens.add({ targets: f, alpha: 0, duration: 60, onComplete: () => f.destroy() });
      return b;
    }
    efire(x, y, a) {
      this.shot(this.ebullets, 'ebullet', x, y, a, CG.CONFIG.ENEMY_BULLET_SPEED + 35 * this.diff, 16);
      CG.Sfx.play('eshoot');
    }
    // a thrown grenade or dropped bomb: falls under gravity
    ebomb(x, y, vx, vy) {
      const b = this.ebombs.get(x, y, 'bomb');
      if (!b) return;
      b.setTexture('bomb').setActive(true).setVisible(true).setDepth(9);
      b.body.enable = true;
      b.body.allowGravity = true;
      b.body.setSize(18, 18, true);
      b.body.reset(x, y);
      b.body.setVelocity(vx, vy);
    }
    countBullets(player) {
      let n = 0;
      this.bullets.children.iterate((b) => { if (b && b.active && b.shooter === player) n++; });
      return n;
    }
    kill(b) { b.setActive(false).setVisible(false); b.body.stop(); b.body.enable = false; }

    boom(x, y, n) {
      this.sparks.explode(n, x, y);
      const key = this.textures.exists('fx_boom') ? 'fx_boom' : 'px_boom';
      const e = this.add.sprite(x, y, key, 0).setDepth(14).setScale((this.artScale.fx_boom || 1) * (n > 25 ? 2.2 : n > 15 ? 1.4 : 1));
      e.play('boom');
      e.once('animationcomplete', () => e.destroy());
    }

    // a splash where something fell into the water
    splash(x) {
      if (!this.anims.exists('splash')) return;
      const s = this.add.sprite(x, CG.DATA.level.groundRow * CG.CONFIG.TILE + 48, 'fx_splash', 0).setOrigin(0.5, 1)
        .setScale(this.artScale.fx_splash || 1).setDepth(3);
      s.play('splash');
      s.once('animationcomplete', () => s.destroy());
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
      CG.Sfx.play(e.T.boss ? 'bigboom' : 'boom');
      this.cameras.main.shake(e.T.boss ? 260 : 80, e.T.boss ? 0.012 : 0.004);
      if (e.type === 'flyer') this.dropPickup(c.x, c.y, e.extra);
      else if (!e.T.boss && Math.random() < 0.08) this.dropPickup(c.x, c.y, 'heal');       // soldiers sometimes drop a first-aid kit
      else if (e.T.boss && !e.T.final) this.dropPickup(c.x, c.y, 'heal_big');
      if (e.painted && e.T.death) {                  // painted soldiers: knocked back, then lying still, then fade
        const d = this.add.image(e.x, e.y, e.texture.key, e.T.death[0]).setOrigin(0.5, 1).setScale(e.scaleX).setFlipX(e.flipX).setDepth(7);
        e.T.death.slice(1).forEach((f, i) => this.time.delayedCall(140 * (i + 1), () => d.active && d.setFrame(f)));
        this.tweens.add({ targets: d, x: d.x + (e.flipX ? 60 : -60), duration: 300, ease: 'Quad.out' });
        this.tweens.add({ targets: d, alpha: 0, delay: 900, duration: 500, onComplete: () => d.destroy() });
      }
      const left = { turret: 'e_wreck', core: 'boss_core_dead' }[e.type];     // wreckage stays behind
      if (left && this.textures.exists(left) && this.artScale[left]) {
        this.add.image(e.x, e.y, left).setOrigin(0.5, 1).setScale(this.artScale[left]).setDepth(7);
      }
      e.setActive(false).setVisible(false);
      e.body.enable = false;
      if (e.barrel) e.barrel.setVisible(false);
      this.time.delayedCall(0, () => e.destroy());
      if (e.T.final) this.stageClear();
    }

    puppetGone(e) {
      const c = e.body.center, cam = this.cameras.main;
      if (c.x > cam.scrollX - 100 && c.x < cam.scrollX + CG.CONFIG.W + 100 && c.y < CG.CONFIG.H) {
        this.boom(c.x, c.y, e.T.boss ? 40 : 18);
        CG.Sfx.play(e.T.boss ? 'bigboom' : 'boom');
      }
      e.destroy();
    }

    dropPickup(x, y, kind) {
      const key = this.textures.exists('pk_' + kind) ? 'pk_' + kind : 'pk_life';
      const k = this.pickups.create(x, y, key).setDepth(7);
      if (this.artScale[key]) k.setScale(this.artScale[key]);
      k.kind = kind;
      k.netId = ++this.netSeq;
      k.body.setVelocity(-60, -420);
      k.body.setBounce(0.3);
      return k;
    }

    collect(p, k) {
      const C = CG.CONFIG.PLAYER;
      if (k.kind === 'heal' && p.hp >= p.maxHp) return;                 // leave it for someone who needs it
      if (k.kind === 'rapid') { p.rapid = true; this.say('RAPID FIRE', 900); }
      if (k.kind === 'spread') { p.spread = true; this.say('SPREAD SHOT', 900); }
      CG.Sfx.play('pickup');
      if (k.kind === 'barrier') { p.barrierT = C.barrierMs; this.say('SHIELD', 900); }
      if (k.kind === 'life' && !this.isClient) { this.teamLives++; this.say('TEAM LIFE +1', 900); }
      if (k.kind === 'heal') p.heal(2);
      if (k.kind === 'heal_big') {
        this.players.forEach((q) => { if (q.alive && !q.remote) q.heal(q.maxHp); });
        if (this.net) this.net.shout('heal', { all: true, n: 99 });
        this.say('TEAM HEALED', 900);
      }
      if (this.isClient) this.net.send('pick', { id: k.netId });
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
      if (this.cleared || this.isClient) return;
      this.cleared = true;
      this.time.delayedCall(0, () => {             // after the physics step that killed the core has finished
        this.enemies.getChildren().slice().forEach((e) => { if (e.active) { this.boom(e.x, e.y - 40, 16); e.destroy(); } });
        this.ebullets.children.iterate((b) => { if (b && b.active) this.kill(b); });
        this.ebombs.children.iterate((b) => { if (b && b.active) this.kill(b); });
      });
      const wallX = CG.DATA.level.boss.wallCol * CG.CONFIG.TILE;
      for (let i = 0; i < 9; i++) {
        this.time.delayedCall(i * 170, () => this.boom(wallX + Phaser.Math.Between(-20, 160), Phaser.Math.Between(150, 850), 30));
      }
      this.say('STAGE CLEAR', 2400);
      CG.Sfx.play('clear');
      this.time.delayedCall(3300, () => {
        this.scene.restart({
          players: this.cfg.players, stage: this.cfg.stage + 1, score: this.score + 3000,
          teamLives: this.teamLives, adminUsed: this.adminUsed, online: this.cfg.online,
        });
      });
    }

    checkOver() {
      if (this.over || this.isClient || !this.players.every((p) => p.out || (p.remote && !p.netSeen))) return;
      this.over = true;
      this.say('GAME OVER', 5000);
      CG.Sfx.play('over');
      this.time.delayedCall(1400, () => CG.UI.gameOver(this.score, this.cfg.stage, { admin: this.adminUsed, online: !!this.net }));
    }

    // ---------------------------------------------------------------- abilities and their effects
    fxSprite(key, x, y, scale, opts) {
      if (!this.anims.exists(key)) return null;
      const f = this.add.sprite(x, y, key, 0).setScale(scale).setDepth((opts && opts.depth) || 13);
      if (opts && opts.origin) f.setOrigin(...opts.origin);
      f.play(key);
      if (!this.anims.get(key).repeat) f.once('animationcomplete', () => f.destroy());
      return f;
    }
    // the ability's name pops up over the player
    callout(p, text) {
      const t = this.add.text(p.body.center.x, p.body.top - 70, text, ts(30, p.agent.color)).setOrigin(0.5).setDepth(40).setShadow(0, 3, '#000', 6);
      this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, delay: 500, duration: 700, ease: 'Quad.out', onComplete: () => t.destroy() });
      this.cameras.main.flash(90, 255, 255, 255, false);
      this.cameras.main.shake(120, 0.004);
    }
    abilityReady(p) {
      if (p.remote) return;
      const i = this.players.indexOf(p), h = this.hud && this.hud[i];
      if (h && h.ab) this.tweens.add({ targets: h.ab, scale: { from: h.ab.scale * 1.5, to: h.ab.scale }, duration: 350, ease: 'Back.out' });
      if (!p.bot) CG.Sfx.play('ready');
    }
    // is this player inside a teammate's Aegis dome? Returns the dome's owner (or null)
    underDome(p, self) {
      for (const q of this.players) {
        if (q.domeT > 0 && q.alive && (self || q !== p) && Math.abs(q.body.center.x - p.body.center.x) < q.agent.ability.range
          && Math.abs(q.body.bottom - p.body.bottom) < 140) return q;
      }
      return null;
    }
    throwGrenade(p) {
      const g = this.grenades.get(p.body.center.x, p.body.top + 20, 'bomb');
      if (!g) return;
      g.setTexture('bomb').setActive(true).setVisible(true).setDepth(9).setScale(1.4).setTint(0x7fb3ff);
      g.isFrag = true; g.owner = p;
      g.body.enable = true; g.body.allowGravity = true;
      g.body.setSize(18, 18, true);
      g.body.reset(p.body.center.x, p.body.top + 20);
      g.body.setVelocity(p.facing * 560 + p.body.velocity.x * 0.5, -760);
      g.body.setAngularVelocity(p.facing * 600);
    }
    fragBurst(g) {
      const ab = CG.AGENT.jax.ability, x = g.x, y = g.y;
      g.setActive(false).setVisible(false); g.body.stop(); g.body.enable = false;
      this.boom(x, y - 20, 30);
      this.boom(x - 70, y - 10, 12); this.boom(x + 70, y - 10, 12);
      CG.Sfx.play('bigboom');
      this.cameras.main.shake(200, 0.01);
      for (const e of this.enemies.getChildren().slice()) {
        if (!e.active) continue;
        if (Phaser.Math.Distance.Between(x, y, e.body.center.x, e.body.center.y) < ab.radius + e.body.halfWidth) e.damage(ab.damage);
      }
    }
    hurtFx(p) {
      this.sparks.explode(6, p.body.center.x, p.body.center.y);
      this.cameras.main.shake(70, 0.003);
    }
    plusFx(x, y) {
      if (!this.fxSprite('fx_plus', x, y - 20, 0.5)) this.sparks.explode(8, x, y);
    }
    mendFx(p) {
      const c = p.body;
      if (!this.fxSprite('fx_mend', c.center.x, c.bottom + 10, 1.4, { origin: [0.5, 1], depth: 6 })) this.sparks.explode(20, c.center.x, c.bottom);
    }
    domeFx(p) {
      if (p.dome) p.dome.destroy();
      p.dome = this.fxSprite('fx_dome', p.body.center.x, p.body.bottom + 8, 0.95, { origin: [0.5, 1], depth: 12 });
      if (p.dome) p.dome.setAlpha(0.75);
    }
    updateDomes() {
      for (const p of this.players) {
        if (!p.dome) continue;
        if (p.domeT > 0 && p.alive) { p.dome.setPosition(p.body.center.x, p.body.bottom + 8); continue; }
        const x = p.dome.x, y = p.dome.y;
        p.dome.destroy(); p.dome = null;
        this.fxSprite('fx_dome_break', x, y, 0.95, { origin: [0.5, 1], depth: 12 });
      }
    }
    dashFx(p) {
      const c = p.body.center;
      const f = this.fxSprite('fx_dash', c.x + p.facing * 60, c.y, 1.2, { depth: 9 });
      if (f) f.setFlipX(p.facing < 0);
      p.dashRefund = false;
      this.time.delayedCall(180, () => this.fxSprite('fx_blink', p.body.center.x, p.body.center.y, 0.8));
    }
    // Phase Dash: every enemy the dash passes through takes damage once
    dashHits(p) {
      const c = p.body.center;
      for (const e of this.enemies.getChildren()) {
        if (!e.active || p.dashHit.has(e) || e.T.ai === 'flyer') continue;
        const b = e.body;
        if (Math.abs(b.center.x - c.x) < b.halfWidth + 40 && Math.abs(b.center.y - c.y) < b.halfHeight + 50) {
          p.dashHit.add(e);
          this.fxSprite('fx_slash', b.center.x, b.center.y, 0.6);
          e.damage(p.agent.ability.damage);
          if (!e.active && !p.dashRefund) { p.dashRefund = true; p.abilityCd *= 0.5; }
        }
      }
    }
    // Chain Arc: lightning from the player to the nearest enemy on screen, then on to the next nearest
    chainArc(p, n, dmg, stun) {
      const cam = this.cameras.main, W = CG.CONFIG.W;
      const pool = this.enemies.getChildren().filter((e) => e.active && e.x > cam.scrollX - 20 && e.x < cam.scrollX + W + 20);
      let from = { x: p.body.center.x, y: p.body.center.y }, hits = [];
      for (let i = 0; i < n && pool.length; i++) {
        pool.sort((a, b) => Phaser.Math.Distance.Between(from.x, from.y, a.body.center.x, a.body.center.y)
          - Phaser.Math.Distance.Between(from.x, from.y, b.body.center.x, b.body.center.y));
        const e = pool.shift(), to = { x: e.body.center.x, y: e.body.center.y };
        this.bolt(from, to);
        hits.push(e);
        from = to;
      }
      if (this.net && hits.length) {
        const pts = [[Math.round(p.body.center.x), Math.round(p.body.center.y)]].concat(hits.map((e) => [Math.round(e.body.center.x), Math.round(e.body.center.y)]));
        this.net.shout('arc', { pts });
      }
      hits.forEach((e, i) => this.time.delayedCall(i * 60, () => {
        if (!e.active) return;
        this.fxSprite('fx_spark', e.body.center.x, e.body.center.y, 0.7);
        if (stun && !e.T.boss) e.stunT = stun;
        e.damage(dmg);
      }));
      if (!hits.length) this.fxSprite('fx_charge', p.body.center.x, p.body.center.y, 0.8);
    }
    bolt(a, b) {
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      if (this.textures.exists('fx_arc')) {
        const fw = this.textures.get('fx_arc').get(0).width;
        const s = this.add.sprite(a.x, a.y, 'fx_arc', 0).setOrigin(0, 0.5).setRotation(ang).setDepth(13)
          .setScale(len / fw, 0.6).setBlendMode(Phaser.BlendModes.ADD);
        s.play('fx_arc');
        this.tweens.add({ targets: s, alpha: 0, delay: 180, duration: 160, onComplete: () => s.destroy() });
      } else {
        const g = this.add.graphics().setDepth(13);
        g.lineStyle(4, 0xd9a0ff, 1).lineBetween(a.x, a.y, b.x, b.y);
        this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
      }
    }

    // ---------------------------------------------------------------- frame
    update(time, delta) {
      if (this.over) return;
      const dt = Math.min(delta, 50) / 1000, { W, H, TILE: T } = CG.CONFIG, cam = this.cameras.main;
      const ins = this.inp.read();
      this.players.forEach((p, i) => (p.remote ? this.net.applyPlayer(p, dt) : p.update(dt, ins[i])));
      if (this.net) this.net.tick(dt);

      // the camera follows whoever is furthest ahead, and never goes back
      const alive = this.players.filter((p) => !p.dead && !p.out && (!p.remote || p.netSeen));
      if (this.isClient) {
        if (this.netCamX !== undefined) this.camX += (this.netCamX - this.camX) * (1 - Math.exp(-8 * dt));
      } else if (alive.length) {
        const target = Math.min(Math.max(...alive.map((p) => p.body.center.x)) - W * 0.42, this.bossCamX);
        if (target > this.camX) this.camX += (target - this.camX) * (1 - Math.exp(-7 * dt));
      }
      cam.scrollX = this.camX;
      this.bgFar.tilePositionX = this.camX * 0.12 * this.bgFar.scrollK;
      this.bgTrees.tilePositionX = this.camX * 0.4 * this.bgTrees.scrollK;

      while (!this.isClient && this.spawnI < this.spawns.length && this.spawns[this.spawnI].x < this.camX + W + 100) {
        const s = this.spawns[this.spawnI++];
        const e = new CG.Enemy(this, s.t, s.x, s.y, s.extra);
        e.netId = ++this.netSeq;
        this.enemies.add(e);
      }
      for (const e of this.enemies.getChildren().slice()) {
        if (!e.active || e.puppet) continue;
        e.tick(dt);
        if (!e.T.boss && (e.x < this.camX - 260 || e.y > H + 260)) {
          if (e.y > H + 260 && !e.T.fly) this.splash(e.x);
          e.destroy();
        }
      }

      const off = (b) => b.x < this.camX - 60 || b.x > this.camX + W + 60 || b.y < -60 || b.y > H + 60;
      this.bullets.children.iterate((b) => { if (b && b.active && off(b)) this.kill(b); });
      this.ebullets.children.iterate((b) => { if (b && b.active && off(b)) this.kill(b); });
      this.ebombs.children.iterate((b) => { if (b && b.active && (b.y > H + 60 || b.x < this.camX - 200)) this.kill(b); });
      this.grenades.children.iterate((g) => { if (g && g.active && (g.y > H + 60 || g.x > this.camX + W + 200)) this.kill(g); });
      if (!this.isClient) this.pickups.children.iterate((k) => { if (k && k.active && (k.x < this.camX - 100 || k.y > H + 100)) k.destroy(); });

      // boss fight: camera locked at the fortress, soldiers keep arriving from behind
      if (!this.isClient && !this.bossOn && this.camX >= this.bossCamX - 4) { this.bossOn = true; this.say(CG.DATA.level.boss.say, 1800); }
      if (this.bossOn && !this.cleared && !this.isClient) {
        this.bossT -= delta;
        if (this.bossT <= 0) {
          this.bossT = Math.max(1800, 3800 - 350 * this.diff);
          const r = new CG.Enemy(this, 'runner', this.camX - 40, CG.DATA.level.groundRow * T);
          r.dir = 1; r.netId = ++this.netSeq;
          this.enemies.add(r);
        }
      }

      this.updateHud();
      this.updateDomes();
      if (this.touchPlayer && CG.Touch.enabled) {
        const p = this.touchPlayer;
        CG.Touch.cooldown(p.abilityCd / (p.agent.ability.cd * (p.perkCd || 1)));
      }
      this.scoreText.setText(String(this.score).padStart(7, '0'));
    }
  };
})();
