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
      const lap = Math.floor(((stage || 1) - 1) / CG.DATA.levels.length);
      const pick = (CG.DATA.level && CG.DATA.level.bg) || BG15[theme] || BG15.jungle;    // story stages name their own scene
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
      this.load.on('progress', (v) => CG.UI.loading(v));
      for (const k in art.images) this.load.image(k, art.images[k]);
      for (const k in art.sheets) this.load.spritesheet(k, art.sheets[k].path, { frameWidth: art.sheets[k].fw, frameHeight: art.sheets[k].fh });
    }
    create() {
      CG.Art.makeAll(this);
      CG.Hazards.makeArt(this);
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
      CG.PORTRAITS = {}; CG.ABICONS = {}; CG.BODIES = {};
      const img = (k) => art && art.images && art.images[k];
      for (const a of CG.AGENTS) {
        if (img('portrait_' + a.id)) CG.PORTRAITS[a.id] = img('portrait_' + a.id);
        const own = !!(art && art.agents && art.agents[a.id] && !a.classic && this.textures.exists('agents'));
        if (own || (art && art.players && this.textures.exists(a.fallback))) {
          // the standing frame: its outline is measured, then the whole figure is cut out for the menus (the squad on
          // the home screen, the locker), and when there is no painted portrait the head and shoulders are cut too
          try {
            const fr = own ? this.textures.getFrame('agents', art.agents[a.id].anims.stand_fwd[0])
              : this.textures.getFrame(a.fallback, art.players[a.fallbackWho].anims.stand_fwd[0]);
            const src = fr.source.image, w = fr.cutWidth, h = fr.cutHeight;
            const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
            const tg = tmp.getContext('2d'); tg.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
            const px = tg.getImageData(0, 0, w, h).data;
            let x0 = w, x1 = 0, y0 = h, y1 = 0;
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            const bw = x1 - x0 + 5, bh = y1 - y0 + 5, bc = document.createElement('canvas');
            bc.width = bw; bc.height = bh;
            bc.getContext('2d').drawImage(tmp, x0 - 2, y0 - 2, bw, bh, 0, 0, bw, bh);
            CG.BODIES[a.id] = bc.toDataURL();
            if (!CG.PORTRAITS[a.id]) {
              // the head: the middle of the solid pixels in the top sixth of the figure
              let sum = 0, n = 0;
              const headEnd = y0 + (y1 - y0) * 0.16;
              for (let y = y0; y < headEnd; y++) for (let x = x0; x <= x1; x++) if (px[(y * w + x) * 4 + 3] > 40) { sum += x; n++; }
              const hx = n ? sum / n : (x0 + x1) / 2, box = Math.max(40, (y1 - y0) * 0.56);
              const c = document.createElement('canvas'), g = c.getContext('2d');
              c.width = c.height = 240;
              g.imageSmoothingEnabled = false;
              g.drawImage(tmp, hx - box * 0.5, y0 - box * 0.06, box, box, 0, 0, 240, 240);
              CG.PORTRAITS[a.id] = c.toDataURL();
              if (!this.textures.exists('portrait_' + a.id)) {                     // the HUD uses it too
                this.textures.addCanvas('portrait_' + a.id, c).setFilter(Phaser.Textures.FilterMode.NEAREST);
              }
            }
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
      const { W, H, TILE: T } = CG.CONFIG, C = CG.CONFIG.PLAYER;
      // DUELS / CUSTOM: two teams against each other in an arena, in rounds (see CG.Modes)
      this.pvp = this.cfg.mode === 'duel' || this.cfg.mode === 'pvp';
      this.pvpSet = Object.assign({ arena: null, rounds: CG.DUEL_KILLS, drops: true }, this.cfg.pvp || {});
      this.ffa = this.pvp && !!this.pvpSet.ffa;                               // free-for-all: everyone their own team
      this.horde = this.cfg.mode === 'horde';                                  // co-op waves in an arena
      const all = this.pvp || this.horde ? CG.DATA.arenas : CG.DATA.levels;
      const pickArena = this.pvp ? this.pvpSet.arena : this.horde ? this.cfg.arena : null;
      const L = CG.DATA.level = (this.pvp || this.horde) && all[pickArena] ? all[pickArena]
        : all[(this.cfg.stage - 1) % all.length];                             // stages repeat, harder each time
      this.myKills = 0; this.heads = 0; this.wave = 0; this.waveT = 2500; this.waveQueue = []; this.waveSpawnT = 0;
      this.diff = this.cfg.stage - 1;
      // more players = a harder stage: tougher, faster-firing soldiers, extra soldiers, quicker boss reinforcements
      this.crowd = Math.max(0, (this.cfg.players || []).length - 1);
      this.score = this.cfg.score;
      this.over = false; this.cleared = false; this.camX = 0; this.spawnI = 0; this.bossOn = false; this.bossT = 2500;
      this.artScale = (CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.scale) || {};
      this.enemyScale = (CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.enemyScale) || 1;
      // field of view (Settings): 1 = the whole screen of world, more = closer
      this.zoom = Math.max(1, Math.min(1.4, parseFloat((() => { try { return localStorage.getItem('commando.fov'); } catch (e) { return ''; } })()) || 1));
      this.viewW = W / this.zoom; this.viewH = H / this.zoom;
      this.bossCamX = L.boss.wallCol * T + 3 * T - this.viewW;

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
      this.players = this.cfg.players.map((cp, i) => new CG.Player(this, i, this.pvp ? (this.ffa ? this.ffaSlotX(i) : this.teamSpawn(i)) : 2.5 * T + i * 70, gy, cp));
      if (this.pvp) {
        // nametags in the team's colour; team scores, the round, who is down this round
        this.players.forEach((p, i) => {
          p.team = this.teamOf(i); p.facing = (this.ffa ? p.body.center.x > CG.DATA.level.w * T / 2 : p.team) ? -1 : 1;
          if (!this.ffa) { p.color = CG.Modes.TEAMS[p.team].color; p.tag.setColor(p.color); }
          // fighters' ranks over their heads
          if (p.rr || p.bot) p.tag.setText(p.name + '  ·  ' + CG.Ranks.of(p.rr).name);
        });
        this.kills = this.ffa ? this.players.map(() => 0) : [0, 0]; this.round = 1; this.down = new Set(); this.roundEnd = false;
        this.bossOn = true;                     // nothing to scroll to
        this.dropT = 6000;
      }
      if (this.horde) { this.bossOn = true; this.dropT = 9000; }
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
      if (this.touchPlayer) CG.Touch.setAbility(this.touchPlayer.agent);
      // only an agent with the Tac Dash gets the DASH button
      const dashBtn = document.getElementById('b-dash');
      if (dashBtn) dashBtn.classList.toggle('hidden', !(this.touchPlayer && this.touchPlayer.agent.dash));
      this.netSeq = 0;
      this.net = this.cfg.online && CG.Online.mid ? CG.Online.attach(this) : null;
      this.isClient = !!(this.net && !this.net.host);       // online but not the host: the host runs the stage
      if (this.input.mouse) this.input.mouse.disableContextMenu();       // right click = ability

      // everything that appears as the camera advances, sorted left to right
      const spawns = L.enemies.map(([t, c, r]) => ({ t, x: (c + 0.5) * T, y: t === 'drone' ? 4.5 * T : t === 'mouth' ? 1.4 * T : (r || L.groundRow) * T }));
      L.capsules.forEach(([c, kind]) => spawns.push({ t: 'flyer', x: (c + 0.5) * T, y: 4 * T, extra: kind }));
      const bx = L.boss.wallCol * T;
      if (L.boss.type === 'none') {
        // a duel arena: no boss
      } else if (L.boss.type === 'fortress') {
        L.boss.cannonRows.forEach((r) => spawns.push({ t: 'cannon', x: bx - 8, y: r * T }));
        spawns.push({ t: 'core', x: bx - 40, y: gy });
      } else if (L.boss.type === 'tank') {
        spawns.push({ t: 'tank', x: bx - 260, y: gy });
      } else if (L.boss.type === 'statue') {            // the waterfall's alien statue and its two orbiting arms
        const cx = bx - 230, cy = 5.2 * T;
        spawns.push({ t: 'statue', x: cx, y: cy });
        spawns.push({ t: 'orb', x: cx - 230, y: cy, extra: { cx, cy, ph: 0 } }, { t: 'orb', x: cx + 230, y: cy, extra: { cx, cy, ph: Math.PI } });
      } else if (L.boss.type === 'giant') {
        spawns.push({ t: 'giant', x: bx - 300, y: gy });
      } else if (L.boss.type === 'heart') {             // the lair: the heart and two mouths guarding it
        spawns.push({ t: 'heart', x: bx - 190, y: 7.6 * T });
        spawns.push({ t: 'mouth', x: bx - 760, y: 1.4 * T }, { t: 'mouth', x: bx - 1260, y: 1.4 * T });
      } else {
        spawns.push({ t: 'gunship', x: bx - 300, y: 250 });
      }
      this.spawns = spawns.sort((a, b) => a.x - b.x);

      this.setupColliders();
      CG.Hazards.build(this);
      this.inp = new CG.Input(this, this.cfg.devices);

      this.buildHud();
      this.buildAbilitySlots();
      if (this.pvp) this.buildDuelHud();
      // coins hanging along the high route: each one is 5 coins for this account (yours alone online)
      this.coinsEarned = this.cfg.coinsEarned || 0;
      this.coinPickups = this.physics.add.group({ allowGravity: false, immovable: true });
      (L.coins || []).forEach(([c, r]) => {
        const k = this.coinPickups.create((c + 0.5) * T, (r + 0.5) * T, 'pk_coin').setDepth(7).setScale(this.artScale.pk_coin || 1);
        this.tweens.add({ targets: k, y: k.y - 10, duration: 700 + (c % 5) * 60, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      });
      this.physics.add.overlap(this.players.map((p) => p.phys), this.coinPickups, (a, b) => {
        const [z, k] = a.owner ? [a, b] : [b, a];
        if (!k.active || z.owner.remote || z.owner.bot || !z.owner.alive) return;
        this.coinsEarned += 5 * (this.coinMult || 1);
        this.sparks.explode(8, k.x, k.y);
        CG.Sfx.play('pickup');
        const t = this.add.text(k.x, k.y - 10, '+' + 5 * (this.coinMult || 1), ts(26, '#ffd23c')).setOrigin(0.5).setDepth(40).setShadow(0, 2, '#000', 4);
        this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
        k.disableBody(true, true);
        this.time.delayedCall(0, () => k.destroy());
      });
      this.scoreText = this.add.text(W - 40, 46, '', ts(38, '#ffffff')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100).setShadow(0, 2, '#000', 6);
      this.stageText = this.add.text(W - 40, 84, 'STAGE ' + (((this.cfg.stage - 1) % CG.DATA.levels.length) + 1) + '/' + CG.DATA.levels.length + ' · ' + L.name, ts(20, '#ffd39a')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
      if (this.pvp) { this.scoreText.setVisible(false); this.stageText.setVisible(false); }   // the duel scoreboard instead
      if (this.horde) this.stageText.setText('HORDE  ·  ' + L.name.replace('ARENA · ', ''));
      this.banner = this.add.text(W / 2, H * 0.36, '', ts(88, '#ff9a3c')).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0).setShadow(0, 5, '#000', 14);
      // the stage card: STAGE 3 · WATERFALL and its briefing (story), or the arena's name
      const lap = Math.floor((this.cfg.stage - 1) / CG.DATA.levels.length);
      this.say(this.pvp || this.horde ? (this.horde ? 'HORDE' : L.name) : 'STAGE ' + (((this.cfg.stage - 1) % CG.DATA.levels.length) + 1) + ' · ' + L.name, 2200);
      if (!this.pvp && !this.horde && (L.brief || lap)) {
        const brief = this.add.text(W / 2, H * 0.36 + 80, (lap && (this.cfg.stage - 1) % CG.DATA.levels.length === 0 ? 'MISSION COMPLETE — THEY CAME BACK STRONGER. ' : '') + (L.brief || ''),
          ts(30, '#ffe7c2')).setOrigin(0.5).setScrollFactor(0).setDepth(100).setShadow(0, 3, '#000', 8);
        this.tweens.add({ targets: brief, alpha: 0, delay: 2600, duration: 600, onComplete: () => brief.destroy() });
      }
      CG.Sfx.play('start');
      if (this.zoom > 1) {
        // the world camera zooms; the HUD (everything fixed to the screen) is drawn by a second camera that does not
        this.cameras.main.setZoom(this.zoom);
        this.uiCam = this.cameras.add(0, 0, W, H);
        this.syncCams = () => {
          for (const o of this.children.list) {
            if (o.__cam) continue;
            o.__cam = 1;
            if (o.scrollFactorX === 0 && o.depth >= 50) this.cameras.main.ignore(o); else this.uiCam.ignore(o);   // HUD vs world + backdrop
          }
        };
        this.syncCams();
      }
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
      const carded = this.pvp ? this.players.filter((p) => !p.bot && !p.remote) : this.players;
      this.hud = carded.map((p, i) => {
        const x = 24 + i * 300, y = 22, id = p.agent.id, h = { p };
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
        h.pw = left(this.add.text(x + 72, y + 54, '', ts(16, '#ffd39a')).setShadow(0, 2, '#000', 4));
        h.lastHp = -1; h.lastMax = -1;
        return h;
      });
      // the team's shared lives, under the score on the right
      this.livesText = fixed(this.add.text(W - 40, 126, '', ts(34, '#ffffff')).setOrigin(1, 0.5).setShadow(0, 2, '#000', 6));
      this.livesIcon = fixed(this.add.image(W - 130, 126, has('life') ? 'life' : 'pk_life'));
      this.livesIcon.setScale(Math.min(1, 40 / this.livesIcon.height));
      this.teamLabel = this.add.text(W - 160, 126, 'TEAM', ts(18, '#ffd39a')).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
      this.adminTag = fixed(this.add.text(W - 40, 162, 'ADMIN · SCORE NOT SAVED', ts(16, '#ff8080')).setOrigin(1, 0.5)).setVisible(false);
      this.coinIcon = fixed(this.add.image(W - 130, 200, 'pk_coin').setScale(0.6 * (this.artScale.pk_coin || 1)));
      this.coinText = fixed(this.add.text(W - 40, 200, '', ts(26, '#ffd23c')).setOrigin(1, 0.5).setShadow(0, 2, '#000', 6));
    }

    // ---------------------------------------------------------------- duels: two teams, rounds
    // which team a player is on (cfg.players[i].team; old 1v1 configs alternate)
    teamOf(i) { const t = this.cfg.players[i] && this.cfg.players[i].team; return typeof t === 'number' ? t : i % 2; }
    // where a player starts each round: their team's side, teammates a little further in
    teamSpawn(i) {
      const cols = CG.DATA.level.spawnCols || [2, 27], team = this.teamOf(i);
      const k = this.cfg.players.slice(0, i).filter((_, j) => this.teamOf(j) === team).length;
      return (cols[team] + (team ? -1 : 1) * k * 1.6 + 0.5) * CG.CONFIG.TILE;
    }
    isFoe(a, b) { return this.pvp && !!a && !!b && a !== b && a.team !== b.team; }
    // free-for-all: start spread evenly across the arena; come back in at the spot furthest from everyone else
    ffaSlotX(i) {
      const L = CG.DATA.level, n = Math.max(2, this.cfg.players.length);
      return (2 + Math.round(i * (L.w - 5) / (n - 1)) + 0.5) * CG.CONFIG.TILE;
    }
    ffaSpawnX(p) {
      let best = this.ffaSlotX(0), bd = -1;
      for (let i = 0; i < 6; i++) {
        const x = this.ffaSlotX(i % this.players.length) + (i >= this.players.length ? 200 : 0);
        const d = Math.min(...this.players.filter((q) => q !== p && q.alive).map((q) => Math.abs(q.body.center.x - x)), 9999);
        if (d > bd) { bd = d; best = x; }
      }
      return best;
    }
    // one person each side: show their names instead of the team names
    get solo() { return this.ffa || (this.players.filter((q) => q.team === 0).length === 1 && this.players.filter((q) => q.team === 1).length === 1); }
    teamName(t) { if (this.ffa) return (this.players[t] || {}).name || '?'; return this.solo ? (this.players.find((q) => q.team === t) || {}).name || '?' : CG.Modes.TEAMS[t].name; }
    buildDuelHud() {
      const { W } = CG.CONFIG, TM = CG.Modes.TEAMS, fixed = (o) => o.setScrollFactor(0).setDepth(102);
      if (this.ffa) {                                    // free-for-all: the top three and your own score
        const plate = fixed(this.add.graphics());
        plate.fillStyle(0x05080a, 0.62).fillRoundedRect(W / 2 - 330, 18, 660, 132, 14);
        this.ffaTitle = fixed(this.add.text(W / 2, 40, 'FREE-FOR-ALL  ·  FIRST TO ' + this.pvpSet.rounds, ts(22, '#ffd39a')).setOrigin(0.5));
        this.ffaRows = [0, 1, 2].map((i) => fixed(this.add.text(W / 2, 74 + i * 28, '', ts(24, '#ffffff')).setOrigin(0.5).setShadow(0, 2, '#000', 6)));
        this.feed = [];
        this.livesText.setVisible(false); this.livesIcon.setVisible(false); this.teamLabel.setVisible(false); this.coinText.setVisible(false); this.coinIcon.setVisible(false);
        return;
      }
      const plate = fixed(this.add.graphics());
      plate.fillStyle(0x05080a, 0.62).fillRoundedRect(W / 2 - 380, 18, 760, 112, 14);
      plate.fillStyle(parseInt(TM[0].color.slice(1), 16), 0.9).fillRect(W / 2 - 380, 18, 10, 112);
      plate.fillStyle(parseInt(TM[1].color.slice(1), 16), 0.9).fillRect(W / 2 + 370, 18, 10, 112);
      this.duelA = fixed(this.add.text(W / 2 - 46, 66, '0', ts(72, TM[0].color)).setOrigin(1, 0.5).setShadow(0, 4, '#000', 10));
      this.duelB = fixed(this.add.text(W / 2 + 46, 66, '0', ts(72, TM[1].color)).setOrigin(0, 0.5).setShadow(0, 4, '#000', 10));
      fixed(this.add.text(W / 2, 62, ':', ts(56, '#ffffff')).setOrigin(0.5).setShadow(0, 4, '#000', 10));
      fixed(this.add.text(W / 2 - 150, 52, this.teamName(0), ts(28, TM[0].color)).setOrigin(1, 0.5).setShadow(0, 2, '#000', 6));
      fixed(this.add.text(W / 2 + 150, 52, this.teamName(1), ts(28, TM[1].color)).setOrigin(0, 0.5).setShadow(0, 2, '#000', 6));
      this.duelDotsA = fixed(this.add.text(W / 2 - 150, 90, '', ts(24, TM[0].color)).setOrigin(1, 0.5));
      this.duelDotsB = fixed(this.add.text(W / 2 + 150, 90, '', ts(24, TM[1].color)).setOrigin(0, 0.5));
      this.duelNames = fixed(this.add.text(W / 2, 150, '', ts(22, '#e8efe6')).setOrigin(0.5).setShadow(0, 2, '#000', 6));
      this.feed = [];
      this.livesText.setVisible(false); this.livesIcon.setVisible(false); this.teamLabel.setVisible(false); this.coinText.setVisible(false); this.coinIcon.setVisible(false);
    }
    updateDuelHud() {
      if (this.ffa) {
        const order = this.players.map((q, i) => ({ q, k: this.kills[i] || 0 })).sort((a, b) => b.k - a.k);
        const me = this.players.find((q) => !q.bot && !q.remote);
        order.slice(0, 3).forEach((o, i) => {
          const t = (i + 1) + '.  ' + o.q.name + '   ' + o.k;
          if (this.ffaRows[i].text !== t) this.ffaRows[i].setText(t).setColor(o.q === me ? '#ffd23c' : o.q.color);
        });
        return;
      }
      const dots = (t) => this.players.filter((q) => q.team === t).map((q) => (q.alive ? '●' : '○')).join(' ');
      this.duelA.setText(this.kills[0] || 0); this.duelB.setText(this.kills[1] || 0);
      this.duelDotsA.setText(dots(0)); this.duelDotsB.setText(dots(1));
      this.duelNames.setText('ROUND ' + (this.round || 1) + '   ·   FIRST TO ' + this.pvpSet.rounds);
    }
    // the kill feed under the scoreboard (the last three)
    feedLine(msg) {
      if (!this.feed) return;
      const { W } = CG.CONFIG;
      const t = this.add.text(W / 2, 0, msg, ts(22, '#ffffff')).setOrigin(0.5).setScrollFactor(0).setDepth(102).setShadow(0, 2, '#000', 6);
      this.feed.unshift(t);
      this.feed.slice(3).forEach((o) => o.destroy());
      this.feed.length = Math.min(this.feed.length, 3);
      this.feed.forEach((o, i) => o.setY(186 + i * 30).setAlpha(1 - i * 0.25));
      this.time.delayedCall(4000, () => { if (t.active) this.tweens.add({ targets: t, alpha: 0, duration: 400, onComplete: () => { t.destroy(); this.feed = (this.feed || []).filter((o) => o !== t); } }); });
    }
    // a player in a duel went down: whoever hurt them last gets the kill (the host / this device keeps count)
    pvpDeath(victim) {
      const killer = victim.lastHitBy && victim.lastHitBy !== victim ? victim.lastHitBy : null;
      if (this.isClient) { this.net.send('kill', { victim: victim.netId, killer: killer ? killer.netId : null }); return; }
      this.downed(victim.netId, killer ? killer.netId : null);
    }
    // a whole team down = the other team scores the round
    downed(victimId, killerId) {
      if (this.ffa) {                                    // free-for-all: a kill is a point, first to the target wins
        if (this.over) return;
        const v = this.players.find((q) => q.netId === victimId), k = killerId && this.players.find((q) => q.netId === killerId);
        const msg = (k ? k.name : 'THE ARENA') + '  ✕  ' + (v ? v.name : '?');
        this.feedLine(msg);
        if (this.net) this.net.shout('feed', { msg });
        if (!k || k === v) return;
        this.kills[k.team] = (this.kills[k.team] || 0) + 1;
        if (!k.bot && !k.remote) this.myKills++;
        if (this.kills[k.team] >= this.pvpSet.rounds) { this.duelWinner = k.team; this.duelOver(k.team); }
        return;
      }
      if (this.over || this.roundEnd || this.down.has(victimId)) return;
      this.down.add(victimId);
      const v = this.players.find((q) => q.netId === victimId), k = killerId && this.players.find((q) => q.netId === killerId);
      const msg = (k ? k.name : 'THE ARENA') + '  ✕  ' + (v ? v.name : '?');
      this.feedLine(msg);
      if (this.net) this.net.shout('feed', { msg });
      for (const t of [0, 1]) {
        if (this.players.some((q) => q.team === t && !this.down.has(q.netId))) continue;
        this.roundWon(1 - t);
        return;
      }
    }
    roundWon(t) {
      this.roundEnd = true;
      this.kills[t]++;
      if (this.kills[t] >= this.pvpSet.rounds) { this.duelWinner = t; this.duelOver(t); return; }
      this.say(this.teamName(t) + (this.solo ? ' SCORES' : ' TAKE THE ROUND'), 1600);
      CG.Sfx.play('clear');
      this.time.delayedCall(2200, () => { if (!this.over) { this.round++; this.resetRound(); } });
    }
    // a new round: everyone on this device back at their spawn with full health and abilities ready
    resetRound() {
      this.roundEnd = false;
      this.down = new Set();
      this.bullets.getChildren().forEach((b) => { if (b.active) this.kill(b); });
      for (const p of this.players) {
        if (p.remote) continue;
        p.respawn();
        p.abilityCd = 0; p.abilityAt = 0; p.mdashCd = 0;
      }
      this.say('ROUND ' + this.round, 1100);
    }
    duelOver(t) {
      if (this.over) return;
      this.over = true;
      const name = this.teamName(t);
      this.say(name + (this.solo ? ' WINS' : ' WIN'), 5000);
      CG.Sfx.play('clear');
      const me = this.players.find((q) => !q.bot && !q.remote);
      const won = !!(me && me.team === t);
      this.time.delayedCall(2200, () => CG.UI.gameOver(0, 1, Object.assign(this.resultOpts(), { duel: true, winner: name, won, online: !!this.net, admin: this.adminUsed, coins: won ? 25 : 5 })));
    }
    // damage another player: a teammate's game decides for its own player online
    damagePlayer(victim, n, by) {
      if (!victim || !victim.alive || victim === by) return;
      if (victim.remote) { if (this.net) this.net.shout('phit', { id: victim.netId, n, by: by ? by.netId : null }); return; }
      victim.lastHitBy = by;
      victim.hit(n);
    }

    // The big ability slot at the bottom of the screen, one per person playing on this device: the icon, a
    // cooldown sweep with the seconds left, the key to press, a glow when it is ready, a bar while it is active.
    buildAbilitySlots() {
      // phone players use the SKILL button instead (it shows the same icon and cooldown, see CG.Touch.setAbility)
      const onPhone = (p) => p.device && (p.device.type === 'touch' || (p.device.type === 'any' && CG.Touch.enabled));
      const { W } = CG.CONFIG, mine = this.players.filter((p) => !p.bot && !p.remote && !onPhone(p)).slice(0, 1);   // only the main player's; the rest see theirs on their HUD card
      const KEY = { kbAll: 'C', kbA: 'H', kbB: 'O', pad: 'Y', touch: 'SKILL', any: CG.Touch.enabled ? 'SKILL' : 'C' };
      const R = 62, gap = 230;
      this.slots = mine.map((p, i) => {
        const x = W - 150, y = 330 + i * gap * 0.85, ab = p.agent.ability;          // top-right corner, under the score
        const c = this.add.container(x, y).setScrollFactor(0).setDepth(101);
        const glow = this.add.circle(0, 0, R + 10, parseInt(p.agent.color.slice(1), 16), 0.35);
        const back = this.add.circle(0, 0, R, 0x0a0d10, 0.85).setStrokeStyle(4, parseInt(p.agent.color.slice(1), 16));
        const key = 'ab_' + p.agent.id, icon = this.textures.exists(key) ? this.add.image(0, 0, key) : this.add.circle(0, 0, R * 0.7, 0x333333);
        if (icon.setScale) icon.setScale((R * 1.7) / Math.max(icon.width, icon.height));
        const sweep = this.add.graphics(), active = this.add.graphics();
        const secs = this.add.text(0, 0, '', ts(46, '#ffffff')).setOrigin(0.5).setShadow(0, 3, '#000', 8);
        const name = this.add.text(0, -R - 22, ab.name.toUpperCase(), ts(20, p.agent.color)).setOrigin(0.5).setShadow(0, 2, '#000', 6);
        const k = (p.device && KEY[p.device.type]) || 'C';
        const keyBox = this.add.text(0, R + 4, k, ts(20, '#10141a')).setOrigin(0.5, 0).setBackgroundColor('#ffd23c').setPadding(8, 2, 8, 2);
        const who = mine.length > 1 ? this.add.text(0, -R - 44, p.name, ts(16, p.color)).setOrigin(0.5) : null;
        // the Tac Dash pip beside it
        const DK = { kbAll: 'SHIFT', kbA: 'T', kbB: 'I', pad: 'B', touch: 'DASH', any: CG.Touch.enabled ? 'DASH' : 'SHIFT' };
        const dBack = this.add.circle(R + 52, 18, 30, 0x0a0d10, 0.85).setStrokeStyle(3, 0x78ffaa);
        const dTxt = this.add.text(R + 52, 18, '»', ts(30, '#78ffaa')).setOrigin(0.5);
        const dSweep = this.add.graphics();
        const dKey = this.add.text(R + 52, 52, (p.device && DK[p.device.type]) || 'SHIFT', ts(14, '#10141a')).setOrigin(0.5, 0).setBackgroundColor('#78ffaa').setPadding(5, 1, 5, 1);
        [dBack, dTxt, dSweep, dKey].forEach((o) => o.setVisible(!!p.agent.dash));
        c.add([glow, back, icon, sweep, active, secs, name, keyBox, dBack, dTxt, dSweep, dKey].concat(who ? [who] : []));
        this.tweens.add({ targets: glow, scale: 1.12, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });
        return { p, c, glow, sweep, active, secs, R, dSweep, dx: R + 52 };
      });
    }
    updateAbilitySlots() {
      for (const s of this.slots || []) {
        const p = s.p, ab = p.agent.ability, cd = p.abilityCd, full = ab.cd * (p.perkCd || 1);
        s.c.setAlpha(p.out ? 0.35 : 1);
        s.glow.setVisible(cd <= 0 && p.alive);
        s.sweep.clear();
        if (cd > 0) {
          s.sweep.fillStyle(0x000000, 0.7).slice(0, 0, s.R - 2, -Math.PI / 2, -Math.PI / 2 + (cd / full) * Math.PI * 2, false).fillPath();
          s.secs.setText(Math.ceil(cd / 1000));
        } else s.secs.setText('');
        // while an ability with a duration is running: a bright ring that runs down
        const left = Math.max(p.stormT, p.domeT, p.adrenT, p.overT) / (p.overT > 0 ? 15000 : ab.dur || 1);
        s.dSweep.clear();
        if (p.mdashCd > 0) s.dSweep.fillStyle(0x000000, 0.7).slice(s.dx, 18, 28, -Math.PI / 2, -Math.PI / 2 + (p.mdashCd / 3200) * Math.PI * 2, false).fillPath();
        s.active.clear();
        if (left > 0 && left <= 1) s.active.lineStyle(7, 0xffd23c, 1).beginPath().arc(0, 0, s.R + 2, -Math.PI / 2, -Math.PI / 2 + left * Math.PI * 2, false).strokePath();
      }
    }

    updateHud() {
      this.updateAbilitySlots();
      if (this.pvp) this.updateDuelHud();
      const heart = this.textures.exists('hud_heart');
      this.hud.forEach((h) => {
        const p = h.p;
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
        const tags = [p.rapid && 'R', p.spread && 'S', p.pierce && 'P', p.blast && 'X', p.double && 'D', p.ice && 'I', p.fire && 'F', p.shock && 'Z',
          p.magnetT > 0 && 'MAG', p.bootsT > 0 && 'BOOTS', p.aimT > 0 && 'AIM', p.cloakT > 0 && 'CLOAK', p.overT > 0 && 'OVERDRIVE'].filter(Boolean).join(' ');
        if (h.pw.text !== tags) h.pw.setText(tags);
        const a = p.out ? 0.3 : 1;
        [h.port, h.name, h.hearts, h.ab].forEach((o) => o && o.setAlpha(a));
        h.cd.clear();
        if (h.ab && p.abilityCd > 0) {                     // a dark wedge that shrinks as the ability recharges
          const f = p.abilityCd / p.agent.ability.cd;
          h.cd.fillStyle(0x000000, 0.65).slice(h.ab.x, h.ab.y, 23, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2, false).fillPath();
        }
      });
      this.livesText.setText('×' + this.teamLives);
      this.coinText.setText('+' + (this.coinsEarned || 0));
      this.adminTag.setVisible(false);
    }

    // ---------------------------------------------------------------- terrain
    buildTerrain() {
      const { H, TILE: T } = CG.CONFIG, L = CG.DATA.level, gy = L.groundRow * T;
      // a story world's own tiles (`L.tiles`, e.g. g_top_w_jungle) when they are in, else the theme's
      const k = (name) => (L.tiles && this.textures.exists(name + '_' + L.tiles) ? name + '_' + L.tiles : name + '_' + L.theme);
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
      // water a little below the banks, darker as it gets deep, and slowly moving
      const ownWater = L.tiles && has('water_' + L.tiles);            // a world's painted water needs no tint
      const ownDeep = L.tiles && has('water_deep_' + L.tiles);
      this.waterTs = [
        fit(this.add.tileSprite(0, gy + 40, L.w * T, T, k('water')).setOrigin(0).setDepth(1).setTint(ownWater ? 0xffffff : 0xd8ecff)),
        fit(this.add.tileSprite(0, gy + 40 + T, L.w * T, H - gy, ownWater && !ownDeep ? k('water') : k('water_deep')).setOrigin(0).setDepth(1)
          .setTint(ownDeep ? 0xffffff : ownWater ? 0x8a8a9a : 0x6f93bd)),
      ];
      const variant = (name, i) => (has(k(name) + '_' + i) ? k(name) + '_' + i : k(name));
      const nIn = has(k('g_in') + '_2') ? 3 : 2;                    // a world set has three fill tiles
      const tile = (x, y, key) => this.add.image(x, y, key).setOrigin(0).setDisplaySize(T + 0.5, T + 0.5).setDepth(2);
      // under a rock cliff the ground is all dirt (no grass line running through the rock)
      const underRock = new Set();
      (L.blocks || []).forEach(([bc, , bw]) => { for (let i = 0; i < bw; i++) underRock.add(bc + i); });
      L.ground.forEach(([a, b]) => {
        zone(this.solids, a * T, gy, (b - a) * T, H - gy + 300);
        for (let c = a; c < b; c++) {
          const edge = underRock.has(c) ? variant('g_in', c % 2) : c === a && has(k('g_left')) ? k('g_left') : c === b - 1 && has(k('g_right')) ? k('g_right') : variant('g_top', c % 3);
          tile(c * T, gy, edge);
          for (let r = L.groundRow + 1; r < L.h; r++) tile(c * T, r * T, variant('g_in', (c + r) % nIn));
        }
      });
      // moving platforms: a ledge that slides back and forth (or up and down); riders move with it
      this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
      (L.movers || []).forEach(([c, r, w, dx, dy, per], i) => {
        const tex = k('ledge'), src = this.textures.get(tex).getSourceImage(), sc = (T + 8) / src.width;
        const plat = this.add.tileSprite(c * T, r * T - 6, w * T, Math.max(24, src.height * sc), tex).setOrigin(0).setDepth(3).setTileScale(sc, sc).setTint(0xffe2b0);
        this.physics.add.existing(plat);
        plat.body.setAllowGravity(false).setImmovable(true).setSize(w * T, 22, false);
        plat.mv = { x0: c * T, y0: r * T - 6, dx: dx * T, dy: -dy * T, per, i };
        this.movers.add(plat);
      });
      // parkour rock: a solid cliff from its top row down to the ground, grass (or plating, or snow) on top
      (L.blocks || []).forEach(([c, r, w]) => {
        zone(this.solids, c * T, r * T, w * T, gy - r * T);
        for (let i = 0; i < w; i++) {
          const edge = i === 0 && has(k('g_left')) ? k('g_left') : i === w - 1 && has(k('g_right')) ? k('g_right') : variant('g_top', (c + i) % 3);
          tile((c + i) * T, r * T, edge);
          for (let rr = r + 1; rr < L.groundRow; rr++) tile((c + i) * T, rr * T, variant('g_in', (c + i + rr) % nIn));
        }
      });
      // cover: solid, stops every bullet, can be stood on. Painted cover (cover50.png) replaces the pixel boxes by key.
      this.covers = this.physics.add.staticGroup();
      this.coverList = [];
      this.brokenCovers = new Set();
      const set = CG.DATA.art && CG.DATA.art.cover50 && CG.DATA.art.cover50[L.theme];
      CG.Level.covers(L).forEach((cv, n) => {
        // painted cover from cover50.png when sliced (cycling through the theme's set, the same on every screen),
        // else the built-in boxes
        let key = 'cv_' + cv.kind;
        if (set && set.length) { const k2 = set[(n * 7 + L.w) % set.length]; if (this.textures.exists(k2)) key = k2; }
        const img = this.add.image(cv.col * T, gy + 2, key).setOrigin(0, 1).setDepth(6);
        const sc = this.artScale[key];
        if (sc) img.setScale(sc);
        const z = zone(this.covers, img.x + 4, img.y - img.displayHeight + 6, img.displayWidth - 8, img.displayHeight - 8);
        const hp = 5;                                    // five hits: one bullet = one damage
        z.cover = { id: n, img, zone: z, hp, max: hp, broken: false };
        this.coverList.push(z.cover);
      });
      // Ledges are solid on every side (you bump your head on them, you can't jump up through them); the hitbox is
      // as thick as the ledge art. Down + Jump still drops you off one.
      this.bridges = [];
      L.ledges.forEach(([c, r, w, kind]) => {
        let top = r * T, bottom = r * T + 20;
        const imgs = [];
        for (let i = 0; i < w; i++) {
          const ownBridge = kind === 'bridge' && has(k('bridge'));    // a world's painted bridge piece
          const img = this.add.image((c + i) * T - 4, r * T - 4, ownBridge ? k('bridge') : k('ledge')).setOrigin(0).setDepth(2);
          imgs.push(img);
          if (img.width !== 16 * 4) img.setDisplaySize(T + 8, (T + 8) * img.height / img.width).setY(r * T - 10);   // painted ledge piece
          top = img.y + 4;
          bottom = Math.max(bottom, img.y + img.displayHeight * 0.8);
        }
        const z = zone(this.ledges, c * T, top, w * T, Math.max(20, bottom - top));
        if (kind === 'bridge') { if (!has(k('bridge'))) imgs.forEach((im) => im.setTint(0xd8c6a0)); this.bridges.push({ zone: z, imgs, x0: c * T, x1: (c + w) * T, top, state: 0 }); }
      });
      // the fortress wall (duel arenas have none)
      const wc = L.boss.wallCol;
      if (wc >= L.w) return;
      zone(this.solids, wc * T, 0, (L.w - wc) * T, gy);
      for (let c = wc; c < wc + 4; c++) for (let r = 0; r < L.groundRow; r++) tile(c * T, r * T, has('boss_wall_' + L.tiles) ? 'boss_wall_' + L.tiles : has(k('wall')) ? k('wall') : 'boss_wall');
    }

    // is there something to stand on at this point?
    isSurface(px, py) {
      const T = CG.CONFIG.TILE, L = CG.DATA.level, col = Math.floor(px / T), row = Math.floor(py / T);
      if (row >= L.groundRow && CG.Level.groundAt(col)) return true;
      return L.ledges.some(([c, r, w]) => r === row && col >= c && col < c + w) || (L.blocks || []).some(([c, r, w]) => r === row && col >= c && col < c + w);
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
      ph.add.collider(bodies, this.movers, (a, b) => { const m = mover(a, b); if (m.owner) m.owner.ledgeT = this.time.now; }, canLand);
      ph.add.collider(this.enemies, this.movers, null, canLand);
      ph.add.collider(this.pickups, this.movers);
      // frag grenades burst on the ground, on cover or on an enemy
      const burst = (g) => { if (g.active) this.fragBurst(g); };
      ph.add.collider(this.grenades, this.solids, (a, b) => burst(mover(a, b)));
      ph.add.collider(this.grenades, this.covers, (a, b) => burst(mover(a, b)));
      ph.add.overlap(this.grenades, this.enemies, (a, b) => burst(a.isFrag ? a : b));
      ph.add.collider(this.enemies, this.covers);
      ph.add.collider(this.pickups, this.covers);
      // cover stops every bullet and takes the damage. Online the host keeps the real count: another player's
      // shots are only drawn here, and enemy shots on a non-host screen are the host's to count.
      const coverOf = (a, b) => (isStatic(a) ? a : b).cover;
      ph.add.overlap(this.bullets, this.covers, (a, b) => {
        const bul = isStatic(a) ? b : a, cv = coverOf(a, b);
        if (!bul.active || !cv || cv.broken) return;
        this.sparks.explode(3, bul.x, bul.y);
        this.kill(bul);
        if (!bul.ghost) this.hitCover(cv, 1);
      });
      ph.add.overlap(this.ebullets, this.covers, (a, b) => {
        const bul = isStatic(a) ? b : a, cv = coverOf(a, b);
        if (!bul.active || !cv || cv.broken) return;
        this.sparks.explode(3, bul.x, bul.y);
        this.kill(bul);
        if (!this.isClient) this.hitCover(cv, 1);
      });
      ph.add.collider(this.ebombs, this.covers, (a, b) => {
        const m = mover(a, b), cv = coverOf(a, b);
        if (!m.active) return;
        this.boom(m.x, m.y, 10); CG.Sfx.play('boom'); this.kill(m);
        if (cv && !this.isClient) this.hitCover(cv, 6);
      });
      ph.add.collider(this.pickups, this.ledges, null, canLand);

      ph.add.overlap(this.bullets, this.enemies, (a, b) => {
        const [bul, e] = pick(a, b, (o) => o.isBullet);
        if (!bul.active || !e.active) return;
        this.sparks.explode(4, bul.x, bul.y);
        if (bul.pierce > 0) { bul.pierce--; bul.hitSet = bul.hitSet || new Set(); if (bul.hitSet.has(e)) return; bul.hitSet.add(e); } else this.kill(bul);
        if (bul.ghost) return;
        // FLANK: a shot in the back (the bullet flies the way the soldier faces) does double damage
        const flank = !e.T.boss && !e.T.fixed && this.fromBehind(bul, e.flipX ? -1 : 1);
        e.lastHitBy = bul.shooter;
        e.damage((bul.dmg || 1) * (flank ? 2 : 1));
        if (flank && bul.shooter && !bul.shooter.bot && !bul.shooter.remote) { this.heads++; this.popText(e.x, e.y - e.displayHeight, 'FLANKED ×2', '#ffd23c'); }
        if (bul.ice && e.active && !e.T.boss) e.stunT = Math.max(e.stunT || 0, 450);
        if (bul.fire && e.active) {                      // fire rounds: it keeps burning for a moment
          for (const ms of [500, 1000]) this.time.delayedCall(ms, () => { if (e.active) { this.sparks.explode(3, e.body.center.x, e.body.top); e.damage(1); } });
        }
        if (bul.shock && e.active) {                     // shock rounds: a spark jumps to the next enemy
          const next = this.enemies.getChildren().find((o) => o !== e && o.active && Phaser.Math.Distance.Between(o.x, o.y, e.x, e.y) < 260);
          if (next) { this.bolt({ x: e.body.center.x, y: e.body.center.y }, { x: next.body.center.x, y: next.body.center.y }); next.damage(1); }
        }
        if (bul.blast) {                                 // a small explosion that also hits whatever is close by
          this.boom(bul.x, bul.y, 8);
          for (const o of this.enemies.getChildren()) {
            if (o !== e && o.active && Phaser.Math.Distance.Between(bul.x, bul.y, o.body.center.x, o.body.center.y) < 95) o.damage(1);
          }
        }
      });
      // a duel: bullets hurt the other player (your own game decides when you are hit)
      ph.add.overlap(bodies, this.bullets, (a, b) => {
        if (!this.pvp) return;
        const [z, bul] = pick(a, b, (o) => !!o.owner), victim = z.owner;
        if (!bul.active || bul.shooter === victim || !victim.alive || (bul.shooter && !this.isFoe(bul.shooter, victim))) return;
        this.kill(bul);
        if (victim.remote) return;
        this.sparks.explode(4, bul.x, bul.y);
        if (this.underDome(victim, true)) {
          const back = this.fire(victim, bul.x, bul.y, Math.atan2(-bul.body.velocity.y, -bul.body.velocity.x));
          if (back) back.setTint(0x8ac8ff);
          return;
        }
        victim.lastHitBy = bul.shooter;
        // FLANK works on players too: get behind them and every shot in the back does double damage
        const flank = this.fromBehind(bul, victim.facing);
        if (victim.hit((bul.dmg || 1) * (flank ? 2 : 1)) && flank) {
          this.popText(victim.body.center.x, victim.body.top - 20, 'FLANKED ×2', '#ffd23c');
          if (bul.shooter && !bul.shooter.bot && !bul.shooter.remote) this.heads++;
        }
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
      ph.add.collider(bodies, this.enemies, null, (a, b) => { const e = a.T ? a : b; return !!(e.T && e.T.solid && e.active); });
      ph.add.overlap(bodies, this.enemies, (a, b) => {
        const [z, e] = pick(a, b, (o) => !!o.owner);
        if (e.active && e.T.ai !== 'flyer' && !e.T.solid) z.owner.hit();
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
      b.isBullet = true; b.shooter = player; b.ghost = !!ghost; b.pierce = 0; b.hitSet = null;
      // bullet power-ups: P pierce, X explosive, D double damage, I ice
      b.dmg = player && player.hack && player.hack.oneshot ? 99 : player && player.double ? 2 : 1;
      b.blast = !!(player && player.blast); b.ice = !!(player && player.ice);
      if (player && player.pierce) b.pierce = 2;
      b.fire = !!(player && player.fire); b.shock = !!(player && player.shock);
      if (player && player.cloakT > 0 && !ghost) { b.dmg *= 3; player.cloakT = 0; b.setTint(0xff6a7a); }      // out of the cloak: triple damage
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
    spawnEnemy(type, x, y, extra) {
      if (this.isClient) return null;
      const e = new CG.Enemy(this, type, x, y, extra);
      e.netId = ++this.netSeq;
      this.enemies.add(e);
      return e;
    }
    efireKey(x, y, a, key, speed, hit) {
      const b = this.shot(this.ebullets, this.textures.exists(key) ? key : 'ebullet', x, y, a, speed + 30 * this.diff, hit || 16);
      CG.Sfx.play('eshoot');
      return b;
    }
    // a landing giant: everyone standing on the ground near it is hit
    shockwave(x, y) {
      this.cameras.main.shake(260, 0.014);
      CG.Sfx.play('bigboom');
      for (let k = -3; k <= 3; k++) this.boom(x + k * 70, y - 10, 10);
      for (const p of this.players) if (!p.remote && p.alive && p.onGround && Math.abs(p.body.center.x - x) < 360) p.hit(2);
    }
    efire(x, y, a) {
      this.shot(this.ebullets, 'ebullet', x, y, a, CG.CONFIG.ENEMY_BULLET_SPEED + 35 * this.diff, 16);
      CG.Sfx.play('eshoot');
    }
    // a thrown grenade or dropped bomb: falls under gravity
    ebomb(x, y, vx, vy) {
      const b = this.ebombs.get(x, y, 'bomb');
      if (!b) return;
      b.setTexture('bomb').setActive(true).setVisible(true).setDepth(9).setScale(this.artScale.bomb || 1);
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
        if (p.dead || p.out || p.cloakT > 0) continue;
        const d = Math.abs(p.body.center.x - x) + Math.abs(p.body.center.y - y);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }

    // ---------------------------------------------------------------- enemies, power-ups, boss
    updateMovers() {
      if (!this.movers) return;
      const clock = Date.now() / 1000;
      this.movers.getChildren().forEach((m) => {
        const v = m.mv, ph = Math.sin((clock / v.per + v.i * 0.37) * Math.PI * 2) * 0.5 + 0.5;
        const nx = v.x0 + v.dx * ph, ny = v.y0 + v.dy * ph, ddx = nx - m.x, ddy = ny - m.y;
        // whoever stands on it rides along
        for (const p of this.players) {
          const b = p.body;
          if (p.remote || !p.alive || !b) continue;
          if (Math.abs(b.bottom - m.body.top) < 8 && b.right > m.body.left + 4 && b.left < m.body.right - 4 && b.velocity.y >= 0) {
            p.phys.x += ddx; p.phys.y += ddy;
          }
        }
        m.body.reset(nx, ny);
      });
    }
    // ---------------------------------------------------------------- Horde
    updateHorde(delta) {
      const { TILE: T } = CG.CONFIG, L = CG.DATA.level, gy = L.groundRow * T, Wd = L.w * T;
      const alive = this.enemies.getChildren().some((e) => e.active);
      if (!this.waveQueue.length && !alive) {
        this.waveT -= delta;
        if (this.waveT <= 0) this.startWave();
        return;
      }
      this.waveSpawnT -= delta;
      if (this.waveQueue.length && this.waveSpawnT <= 0) {
        this.waveSpawnT = Math.max(260, 950 - 45 * this.wave);
        const t = this.waveQueue.shift(), left = Math.random() < 0.5;
        const x = t === 'giant' ? Wd / 2 : left ? Phaser.Math.Between(40, 260) : Wd - Phaser.Math.Between(40, 260);
        const e = this.spawnEnemy(t, x, t === 'drone' ? 4.5 * T : gy);
        if (e && t === 'runner') e.dir = left ? 1 : -1;
      }
    }
    startWave() {
      const T = CG.CONFIG.TILE, L = CG.DATA.level;
      this.wave++;
      this.waveT = 3500;
      const n = this.wave, count = 4 + 2 * n + 2 * (this.crowd || 0), q = [];
      for (let i = 0; i < count; i++) {
        const r = Math.random();
        q.push(n >= 4 && r < 0.18 ? 'drone' : n >= 3 && r < 0.36 ? 'grenadier' : n >= 2 && r < 0.6 ? 'rifle' : 'runner');
      }
      if (n % 5 === 0) q.push('giant');
      this.waveQueue = q;
      this.say('WAVE ' + n, 1400);
      this.stageText.setText('HORDE  ·  WAVE ' + n);
      CG.Sfx.play('start');
      // a breather: everyone gets a heart back, sometimes a power-up falls
      for (const p of this.players) if (p.alive && !p.remote) p.heal(1);
      if (n > 1) this.dropPickup(Phaser.Math.Between(8, L.w - 8) * T, 40, ['heal', 'rapid', 'spread', 'pierce', 'blast', 'barrier'][n % 6]);
      this.score += 500 * (n - 1);
    }
    // FLANK (instead of headshots, which were luck at this size): a bullet flying the same way its target faces hit
    // it in the back. Pure positioning — jump over a soldier, get round a player — nothing random.
    fromBehind(bul, facing) {
      const dx = Math.cos(bul.rotation);                 // the way it was fired (it may already be stopped by the hit)
      return Math.abs(dx) > 0.3 && Math.sign(dx) === Math.sign(facing || 1);
    }
    // a short word that floats up and fades (FLANKED ×2, +1 ...)
    popText(x, y, msg, col) {
      const t = this.add.text(x, y, msg, ts(22, col || '#ffffff')).setOrigin(0.5).setDepth(40).setShadow(0, 2, '#000', 5);
      this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }
    killEnemy(e) {
      const c = e.body.center, S = CG.CONFIG.SCORE;
      if (e.lastHitBy && !e.lastHitBy.bot && !e.lastHitBy.remote) this.myKills++;
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
      const left = { turret: 'e_wreck', core: CG.worldKey(this, 'boss_core_dead') }[e.type];     // wreckage stays behind
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
      k.body.setVelocity(0, -420);                 // pops up, lands, then floats in place (see floatPickups)
      k.body.setBounce(0.2);
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
      const PW = { pierce: 'PIERCING ROUNDS', blast: 'EXPLOSIVE ROUNDS', double: 'DOUBLE DAMAGE', ice: 'ICE ROUNDS' };
      if (PW[k.kind]) { p[k.kind] = true; this.say(PW[k.kind], 900); }
      if (k.kind === 'fire') { p.fire = true; this.say('FIRE ROUNDS', 900); }
      if (k.kind === 'shock') { p.shock = true; this.say('SHOCK ROUNDS', 900); }
      if (k.kind === 'magnet') { p.magnetT = 20000; this.say('COIN MAGNET', 900); }
      if (k.kind === 'boots') { p.bootsT = 20000; this.say('JUMP BOOTS', 900); }
      if (k.kind === 'autoaim') { p.aimT = 12000; this.say('AUTO AIM', 900); }
      if (k.kind === 'bigheal') { p.heal(p.maxHp); this.say('FULL HEAL', 900); }
      if (k.kind === 'armor') { if (!p.armorMax) { p.armorMax = 2; p.maxHp += 2; } p.hp = Math.min(p.maxHp, p.hp + 2); this.say('ARMOUR +2', 900); }
      if (k.kind === 'dcoins') { this.coinMult = 2; this.say('DOUBLE COINS', 900); }
      if (k.kind === 'overdrive') {                     // the admin's item: 15 s untouchable, five-way piercing spray, fast
        p.overT = 15000; p.stormT = 15000; p.adrenT = 15000;
        this.say('OVERDRIVE', 1200);
        this.cameras.main.flash(250, 255, 210, 60);
      }
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
      CG.UI.storyCleared(((this.cfg.stage - 1) % CG.DATA.levels.length) + 1);     // the COMMAND home screen shows it
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
          teamLives: this.teamLives, adminUsed: this.adminUsed, online: this.cfg.online, coinsEarned: this.coinsEarned, mode: this.cfg.mode,
        });
      });
    }

    checkOver() {
      if (this.over || this.isClient || !this.players.every((p) => p.out || (p.remote && !p.netSeen))) return;
      this.over = true;
      this.say('GAME OVER', 5000);
      CG.Sfx.play('over');
      this.time.delayedCall(1400, () => CG.UI.gameOver(this.score, this.cfg.stage, Object.assign(this.resultOpts(), { admin: this.adminUsed, online: !!this.net, coins: this.coinsEarned })));
    }
    // what the end screen needs for the rank: the kind of match, kills, headshots, the wave, the foes' rating
    resultOpts() {
      const me = this.players.find((q) => !q.bot && !q.remote);
      const foes = this.players.filter((q) => me && this.isFoe(me, q));
      const place = this.ffa && me ? 1 + this.players.filter((q) => (this.kills[q.team] || 0) > (this.kills[me.team] || 0)).length : 0;
      return {
        kind: this.horde ? 'horde' : this.ffa ? 'ffa' : this.pvp ? (this.pvpSet.custom ? 'custom' : 'duel') : 'story',
        kills: this.myKills, heads: this.heads, wave: this.wave, place, fighters: this.players.length,
        foesRR: foes.length ? foes.reduce((a, q) => a + (q.rr || 0), 0) / foes.length : null,
        humans: this.players.filter((q) => !q.bot && !q.remote).length,
      };
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
        if (this.pvp && q.team !== p.team) continue;
        if (q.domeT > 0 && q.alive && (self || q !== p) && Math.abs(q.body.center.x - p.body.center.x) < q.agent.ability.range
          && Math.abs(q.body.bottom - p.body.bottom) < 140) return q;
      }
      return null;
    }
    throwGrenade(p, toxic) {
      const g = this.grenades.get(p.body.center.x, p.body.top + 20, 'bomb');
      if (!g) return;
      g.setTexture('bomb').setActive(true).setVisible(true).setDepth(9).setScale(1.4 * (this.artScale.bomb || 1)).setTint(toxic ? 0x9dff4a : 0x7fb3ff);
      g.isFrag = true; g.owner = p; g.toxic = !!toxic;
      g.body.enable = true; g.body.allowGravity = true;
      g.body.setSize(18, 18, true);
      g.body.reset(p.body.center.x, p.body.top + 20);
      g.body.setVelocity(p.facing * 560 + p.body.velocity.x * 0.5, -760);
      g.body.setAngularVelocity(p.facing * 600);
    }
    fragBurst(g) {
      if (g.toxic) { this.toxicCloud(g); return; }
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
      for (const cv of this.coverList) {
        if (!cv.broken && Phaser.Math.Distance.Between(x, y, cv.zone.x, cv.zone.y) < ab.radius + cv.zone.width / 2) this.hitCover(cv, ab.damage * 2);
      }
      if (this.pvp) for (const q of this.players) {
        if (this.isFoe(g.owner, q) && q.alive && Phaser.Math.Distance.Between(x, y, q.body.center.x, q.body.center.y) < ab.radius) this.damagePlayer(q, 3, g.owner);
      }
      // the blast throws players (Jax too: grenade jumps). Teammates are only thrown, never hurt.
      this.launchPlayers(x, y, ab.radius * 1.15);
      if (this.net) this.net.shout('blast', { x: Math.round(x), y: Math.round(y), r: Math.round(ab.radius * 1.15) });
    }
    launchPlayers(x, y, r) {
      for (const p of this.players) {
        if (!p.alive || p.remote) continue;
        const c = p.body.center, dx = c.x - x, dy = c.y - y, d = Math.hypot(dx, dy);
        if (d > r) continue;
        const k = 1 - d / r * 0.5;                            // stronger close to the blast
        p.body.velocity.x = (dx / (d || 1)) * 950 * k;
        p.body.velocity.y = -Math.max(700, 1350 * k);
        p.airDashed = false; p.airJumps = 1;                 // you can still dash / double jump after the launch
        p.launchT = 400;                                     // let the throw carry for a moment before steering takes over
      }
    }
    // Viper: a cloud of gas where the canister lands, poisoning everything inside
    toxicCloud(g) {
      const ab = CG.AGENT.viper.ability, x = g.x, y = g.y - 40, owner = g.owner;
      g.setActive(false).setVisible(false); g.body.stop(); g.body.enable = false;
      CG.Sfx.play('boom');
      const cloud = this.add.particles(x, y, 'spark', {
        lifespan: 900, speed: { min: 10, max: 60 }, scale: { start: 5, end: 9 }, alpha: { start: 0.35, end: 0 },
        tint: [0x7dff4a, 0x4aa832, 0xb8ff7a], frequency: 40, emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, ab.radius * 0.7) },
      }).setDepth(13);
      const tick = this.time.addEvent({ delay: 400, repeat: Math.floor(ab.dur / 400) - 1, callback: () => {
        for (const e of this.enemies.getChildren()) {
          if (e.active && Phaser.Math.Distance.Between(x, y, e.body.center.x, e.body.center.y) < ab.radius) e.damage(1);
        }
        if (this.pvp) for (const q of this.players) {
          if (this.isFoe(owner, q) && q.alive && Phaser.Math.Distance.Between(x, y, q.body.center.x, q.body.center.y) < ab.radius) this.damagePlayer(q, 1, owner);
        }
      } });
      this.time.delayedCall(ab.dur, () => { cloud.stop(); this.time.delayedCall(1000, () => cloud.destroy()); tick.remove(); });
    }
    // Hammer: a shockwave along the ground
    groundPound(p) {
      const ab = CG.AGENT.hammer.ability, c = p.body.center, bottom = p.body.bottom;
      this.cameras.main.shake(260, 0.014);
      CG.Sfx.play('bigboom');
      this.boom(c.x, bottom - 10, 22);
      for (const dx of [-160, -80, 80, 160]) this.time.delayedCall(Math.abs(dx), () => this.boom(c.x + dx, bottom - 6, 8));
      for (const e of this.enemies.getChildren().slice()) {
        if (!e.active || Math.abs(e.body.center.x - c.x) > ab.radius || Math.abs(e.body.bottom - bottom) > 140) continue;
        if (!e.T.boss) e.stunT = Math.max(e.stunT || 0, ab.stun);
        e.damage(ab.damage);
      }
      for (const cv of this.coverList || []) if (!cv.broken && Math.abs(cv.zone.x - c.x) < ab.radius) this.hitCover(cv, 4);
      if (this.pvp) for (const q of this.players) {
        if (this.isFoe(p, q) && q.alive && Math.abs(q.body.center.x - c.x) < ab.radius && Math.abs(q.body.bottom - bottom) < 140) this.damagePlayer(q, 2, p);
      }
    }
    // Atlas: a drone over his head that shoots the nearest target
    spawnDrone(p, dur) {
      if (p.drone) p.drone.destroy();
      // ATLAS's own sentry (painted) — else the enemy drone tinted blue
      const own = this.textures.exists('px_sentry'), key = own ? 'px_sentry' : this.textures.exists('px_drone') ? 'px_drone' : 'e_flyer';
      const d = p.drone = this.add.sprite(p.body.center.x, p.body.top - 140, key, 0).setDepth(12).setFlipX(!own);
      if (own) d.setScale(this.artScale.px_sentry || 1); else d.setTint(0x8ad0ff).setScale(this.artScale[key] || 1);
      d.cd = 0; d.left = dur; d.t = 0;
    }
    updateDrones(dt) {
      for (const p of this.players) {
        const d = p.drone;
        if (!d) continue;
        d.left -= dt * 1000; d.cd -= dt * 1000; d.t += dt;
        if (d.left <= 0 || !p.alive) { this.boom(d.x, d.y, 6); d.destroy(); p.drone = null; continue; }
        d.x += (p.body.center.x - p.facing * 40 - d.x) * Math.min(1, dt * 6);
        d.y += (p.body.top - 140 + Math.sin(d.t * 4) * 10 - d.y) * Math.min(1, dt * 6);
        if (d.texture.frameTotal > 2) d.setFrame(Math.floor(d.t * 14) % 2);
        const t = this.nearestTarget(p);
        if (t && d.cd <= 0 && !p.remote) {
          d.cd = 280;
          const a = Math.atan2(t.y - d.y, t.x - d.x);
          this.fire(p, d.x + Math.cos(a) * 20, d.y + Math.sin(a) * 20, a);
          d.setFlipX(t.x > d.x);
        }
      }
    }
    // coin magnet: coins and pick-ups fly to whoever has it
    updateMagnets(dt) {
      for (const p of this.players) {
        if (!(p.magnetT > 0) || !p.alive || p.remote) continue;
        const c = p.body.center;
        const pull = (k) => {
          if (!k || !k.active) return;
          const dx = c.x - k.x, dy = c.y - k.y, d = Math.hypot(dx, dy);
          if (d < 500 && d > 4) { this.tweens.killTweensOf(k); k.x += dx / d * Math.min(d, 900 * dt); k.y += dy / d * Math.min(d, 900 * dt); if (k.body) k.body.reset(k.x, k.y); }
        };
        this.coinPickups.children.iterate(pull);
        if (!this.isClient) this.pickups.children.iterate(pull);
      }
    }

    // ---------------------------------------------------------------- breakable cover
    hitCover(cv, dmg, fromNet) {
      if (!cv || cv.broken) return;
      cv.img.setTint(0xffc8a0);                          // a quick warm flicker on each hit
      this.time.delayedCall(60, () => { if (!cv.broken) this.tintCover(cv); });
      if (this.isClient && !fromNet) { this.net.send('cover', { id: cv.id, n: dmg }); return; }     // the host counts it
      cv.hp -= dmg;
      if (cv.hp <= 0) this.breakCover(cv);
    }
    // the more damaged, the darker and more battered it looks
    tintCover(cv) {
      const f = Math.max(0, cv.hp / cv.max), c = Math.round(150 + 105 * f);
      if (f >= 1) cv.img.clearTint(); else cv.img.setTint(Phaser.Display.Color.GetColor(c, Math.round(c * 0.92), Math.round(c * 0.85)));
      if (f < 0.5 && !cv.cracked) { cv.cracked = true; cv.img.setAngle(cv.id % 2 ? 1.5 : -1.5); }
    }
    breakCover(cv) {
      if (cv.broken) return;
      cv.broken = true;
      this.brokenCovers.add(cv.id);
      const x = cv.img.x + cv.img.displayWidth / 2, y = cv.img.y - cv.img.displayHeight / 2;
      this.boom(x, y, 16);
      this.sparks.explode(18, x, y);
      CG.Sfx.play('boom');
      this.cameras.main.shake(90, 0.004);
      cv.zone.body.enable = false;
      this.tweens.add({ targets: cv.img, alpha: 0, scaleY: cv.img.scaleY * 0.3, duration: 260, onComplete: () => cv.img.destroy() });
      this.time.delayedCall(0, () => cv.zone.destroy());
    }
    // a fading copy of the player (Tac Dash trail)
    afterimage(p) {
      const v = p.visual, g = this.add.image(v.x, v.y, v.texture.key, v.frame.name).setOrigin(v.originX, v.originY)
        .setScale(v.scaleX, v.scaleY).setFlipX(v.flipX).setTintFill(parseInt(p.agent.color.slice(1), 16)).setAlpha(0.45).setDepth(9);
      this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    }
    // what auto aim locks on to: the closest enemy on screen (or opponent in a duel)
    nearestTarget(p) {
      const cam = this.cameras.main, c = p.body.center;
      let best = null, bd = Infinity;
      const look = (x, y) => {
        if (x < cam.scrollX - 20 || x > cam.scrollX + CG.CONFIG.W + 20) return;
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < bd) { bd = d; best = { x, y }; }
      };
      for (const e of this.enemies.getChildren()) if (e.active && e.T.ai !== 'flyer') look(e.body.center.x, e.body.center.y);
      if (this.pvp) for (const q of this.players) if (this.isFoe(p, q) && q.alive && !(q.cloakT > 0)) look(q.body.center.x, q.body.center.y);
      return best;
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
      if (this.pvp) {
        for (const q of this.players) {
          if (!this.isFoe(p, q) || !q.alive || p.dashHit.has(q)) continue;
          const b = q.body;
          if (Math.abs(b.center.x - c.x) < b.halfWidth + 40 && Math.abs(b.center.y - c.y) < b.halfHeight + 50) {
            p.dashHit.add(q);
            this.fxSprite('fx_slash', b.center.x, b.center.y, 0.6);
            this.damagePlayer(q, 2, p);
          }
        }
      }
    }
    // Chain Arc: lightning from the player to the nearest enemy on screen, then on to the next nearest
    chainArc(p, n, dmg, stun) {
      const cam = this.cameras.main, W = CG.CONFIG.W;
      const pool = this.enemies.getChildren().filter((e) => e.active && e.x > cam.scrollX - 20 && e.x < cam.scrollX + W + 20);
      if (this.pvp) this.players.forEach((q) => { if (this.isFoe(p, q) && q.alive) pool.push(q.duelTarget()); });
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
        if (e.isPlayerTarget) { this.damagePlayer(e.player, 2, p); return; }
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
      if (this.pvp) {
        this.camX = 0;
        if (!this.isClient && !this.over) {
          this.dropT -= delta;
          if (this.dropT <= 0 && this.pvpSet.drops) {
            this.dropT = 9000;
            const kinds = ['heal', 'heal', 'rapid', 'spread', 'pierce', 'blast', 'double', 'ice', 'barrier', 'fire', 'shock', 'boots', 'armor', 'autoaim'];
            const k = this.dropPickup(Phaser.Math.Between(6, 24) * T, 40, kinds[Phaser.Math.Between(0, kinds.length - 1)]);
            if (k) k.body.setVelocity(0, 0);
          }
        }
      } else if (this.isClient) {
        if (this.netCamX !== undefined) this.camX += (this.netCamX - this.camX) * (1 - Math.exp(-8 * dt));
      } else if (alive.length) {
        let target = Math.min(Math.max(...alive.map((p) => p.body.center.x)) - this.viewW * 0.42, this.bossCamX);
        for (const e of this.enemies.getChildren()) if (e.active && e.T.solid && e.x > this.camX) target = Math.min(target, e.x + 140 - this.viewW);
        if (target > this.camX) this.camX += (target - this.camX) * (1 - Math.exp(-7 * dt));
      }
      if (this.zoom > 1) {
        // zoomed in: camX is still the left edge of what is seen; follow the players up and down too
        const z = this.zoom, alive2 = this.players.filter((p) => p.alive && !p.remote);
        if (this.pvp && alive2.length) this.camX = Phaser.Math.Clamp(alive2[0].body.center.x - this.viewW / 2, 0, CG.DATA.level.w * CG.CONFIG.TILE - this.viewW);
        cam.scrollX = this.camX - (W - this.viewW) / 2;
        const ys = alive2.length ? alive2.reduce((a, p) => a + p.body.center.y, 0) / alive2.length : H * 0.7;
        const top = Phaser.Math.Clamp(ys - this.viewH * 0.62, 0, H - this.viewH);
        cam.scrollY += (top - (H - this.viewH) / 2 - cam.scrollY) * Math.min(1, dt * 6);
      } else cam.scrollX = this.camX;
      this.bgFar.tilePositionX = this.camX * 0.12 * this.bgFar.scrollK;
      this.bgTrees.tilePositionX = this.camX * 0.4 * this.bgTrees.scrollK;

      while (!this.isClient && this.spawnI < this.spawns.length && this.spawns[this.spawnI].x < this.camX + W + 100) {
        const s = this.spawns[this.spawnI++];
        const e = new CG.Enemy(this, s.t, s.x, s.y, s.extra);
        e.netId = ++this.netSeq;
        this.enemies.add(e);
        // a bigger squad meets more soldiers: one extra for every two extra players, just behind the first
        if (['runner', 'rifle', 'grenadier', 'drone'].includes(s.t) && !this.pvp) {
          for (let k = 1; k <= Math.floor(this.crowd / 2); k++) {
            const x2 = new CG.Enemy(this, s.t, s.x + 90 * k, s.y, s.extra);
            x2.netId = ++this.netSeq;
            this.enemies.add(x2);
          }
        }
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

      if (this.horde && !this.isClient && !this.over) this.updateHorde(delta);
      // boss fight: camera locked at the fortress, soldiers keep arriving from behind
      if (!this.isClient && !this.bossOn && !this.horde && this.camX >= this.bossCamX - 4) { this.bossOn = true; this.say(CG.DATA.level.boss.say, 1800); }
      if (this.bossOn && !this.cleared && !this.isClient && !this.horde && !this.pvp) {
        this.bossT -= delta;
        if (this.bossT <= 0) {
          this.bossT = Math.max(1100, (3800 - 350 * this.diff) / (1 + 0.25 * this.crowd));
          const r = new CG.Enemy(this, 'runner', this.camX - 40, CG.DATA.level.groundRow * T);
          r.dir = 1; r.netId = ++this.netSeq;
          this.enemies.add(r);
        }
      }

      CG.Hazards.update(this, dt);
      this.updateMovers();
      for (const w of this.waterTs || []) w.tilePositionX += dt * 22;
      if (this.syncCams) this.syncCams();
      this.updateHud();
      this.updateDomes();
      this.updateDrones(dt);
      this.updateMagnets(dt);
      this.pickups.children.iterate((k) => {
        if (!k || !k.active || k.floating || !k.body || !k.body.moves || !(k.body.blocked.down || k.body.touching.down)) return;
        k.floating = true;
        k.body.stop();
        k.body.moves = false;
        this.tweens.add({ targets: k, y: k.y - 14, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      });
      if (this.touchPlayer && CG.Touch.enabled) {
        const p = this.touchPlayer;
        CG.Touch.cooldown(p.abilityCd / (p.agent.ability.cd * (p.perkCd || 1)), p.abilityCd, p.mdashCd / 3200);
      }
      this.scoreText.setText(String(this.score).padStart(7, '0'));
    }
  };
})();
