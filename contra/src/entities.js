// Players and enemies.
(function () {
  const PW = 44, PH = 100, PRONE_H = 36;

  // ------------------------------------------------------------------ player
  // opts: { agent: id from CG.AGENTS, name: shown on the nametag, bot: true for a computer player }
  CG.Player = class {
    constructor(scene, idx, x, feetY, opts) {
      opts = opts || {};
      this.scene = scene; this.idx = idx; this.C = CG.CONFIG.PLAYER;
      this.agent = CG.AGENT[opts.agent] || CG.AGENTS[idx % CG.AGENTS.length];
      this.name = opts.name || 'P' + (idx + 1);
      this.device = opts.device || null;
      this.bot = !!opts.bot;
      this.remote = !!(opts.device && opts.device.type === 'remote');    // moved by another player's game (online)
      this.netId = opts.id || 'p' + idx;
      // rank rating (bots: how well they play)
      this.rr = opts.rr || 0;
      this.skill = CG.Ranks.skill(this.rr);
      this.owner = opts.owner || null;
      this.shots = 0;
      this.color = CG.PLAYER_COLORS[idx % CG.PLAYER_COLORS.length];
      this.phys = scene.add.zone(x, feetY - PH / 2, PW, PH);
      scene.physics.add.existing(this.phys);
      this.phys.owner = this;
      this.body = this.phys.body;
      this.body.maxVelocity.set(2600, 1500);

      this.art = this.pickArt(scene);
      const A = this.art.anims;
      this.visual = scene.add.image(x, feetY, this.art.tex, A.stand_fwd[0])
        .setOrigin(0.5, this.art.originY).setScale(this.art.scale).setDepth(10);
      this.shield = scene.add.image(x, feetY, 'glow').setDepth(11).setVisible(false);
      // nametag + health bar above the head
      this.tag = scene.add.text(x, feetY - 160, this.name, {
        fontFamily: 'Rajdhani, sans-serif', fontSize: '22px', fontStyle: '700', color: this.color,
      }).setOrigin(0.5, 1).setDepth(30).setShadow(0, 2, '#000', 4);
      this.bar = scene.add.graphics().setDepth(30);

      const hp = this.agent.hp;
      Object.assign(this, {
        facing: 1, aimX: 1, aimY: 0, hp, maxHp: hp, dead: false, out: false, prone: false, onGround: false,
        invT: 0, barrierT: 0, rapid: false, spread: false, fireCd: 0, dropT: 0, ledgeT: -1e9, runT: 0, spin: 0,
        abilityCd: 0, stormT: 0, domeT: 0, dashT: 0, adrenT: 0, overT: 0, god: false, freeAbility: false, dashHit: null,
        pierce: false, blast: false, double: false, ice: false,
        mdashT: 0, mdashCd: 0, airDashed: false, hack: {},
        cloakT: 0, poundPending: false, fire: false, shock: false, magnetT: 0, bootsT: 0, aimT: 0, armor: 0,
      });
    }

    // the agent's own frames, else the old commandos recoloured, else the built-in pixel soldier
    pickArt(scene) {
      const art = CG.DATA.art, ag = this.agent;
      if (!ag.classic && art && art.agents && art.agents[ag.id] && scene.textures.exists('agents')) {
        const a = art.agents[ag.id];
        return { tex: 'agents', anims: a.anims, muzzle: a.muzzle, scale: art.agentScale, originY: art.agentOriginY, spin: a.spin };
      }
      if (CG.CONFIG.SHEET_ART && art && art.players && scene.textures.exists(ag.fallback)) {
        const who = art.players[ag.fallbackWho];
        return { tex: ag.fallback, anims: who.anims, muzzle: who.muzzle, scale: art.playerScale, originY: art.originY };
      }
      return { tex: 'pl' + (this.idx % 5), anims: CG.Art.PIX.anims, muzzle: CG.Art.PIX.muzzle, scale: 1, originY: 1 };
    }

    get alive() { return !this.dead && !this.out; }

    update(dt, inp) {
      if (this.out) { this.tag.setVisible(false); this.bar.clear(); return; }
      const ms = dt * 1000, C = this.C, b = this.body, sc = this.scene;
      const wasCd = this.abilityCd;
      for (const k of ['invT', 'barrierT', 'fireCd', 'dropT', 'abilityCd', 'stormT', 'domeT', 'dashT', 'adrenT', 'overT', 'mdashT', 'mdashCd', 'cloakT', 'magnetT', 'bootsT', 'aimT']) this[k] = Math.max(0, this[k] - ms);
      if (this.hack.dash) this.mdashCd = 0;
      if (this.freeAbility) this.abilityCd = 0;
      if (wasCd > 0 && this.abilityCd <= 0) sc.abilityReady(this);
      if (this.dead) { this.tag.setVisible(false); this.bar.clear(); return; }

      const onGround = this.onGround = b.blocked.down || b.touching.down;
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (onGround) this.airDashed = false;
      // Tac Dash (only agents with `dash`, i.e. Kite): a quick burst in any of eight directions — the held
      // direction keys decide (W + DASH straight up, W + D + DASH up and right…); nothing held = forward.
      // Once per jump in the air, like a Valorant dash.
      if (inp.dashPressed && this.agent.dash && this.mdashCd <= 0 && this.dashT <= 0 && !(this.airDashed && !onGround)) {
        if (dir) this.facing = dir;
        let vx = dir, vy = inp.up ? -1 : inp.down && !onGround ? 1 : 0;
        if (!vx && !vy) vx = this.facing;
        const len = Math.hypot(vx, vy);
        this.mdashVec = { x: vx / len, y: vy / len };
        this.mdashT = 190; this.mdashCd = 3200;
        if (!onGround) this.airDashed = true;
        this.setProne(false);
        sc.dashFx(this);
        CG.Sfx.play('jump');
      }

      if (this.mdashT > 0) {                                  // Tac Dash: straight line, no gravity
        b.allowGravity = false;
        const v = this.mdashVec || { x: this.facing, y: 0 };
        b.velocity.set(v.x * 2500, v.y * 2000);
        this.wasPhasing = true;                               // ease out of it like the Phase Dash
        if (Math.random() < 0.5) sc.afterimage(this);
      } else if (this.dashT > 0) {                            // Phase Dash: straight along the aim (up too), untouchable
        b.allowGravity = false;
        const v = this.dashVec || { x: this.facing, y: 0 }, sp = this.agent.ability.dist / 0.18;
        b.velocity.set(v.x * sp, v.y * sp * 0.8);
        sc.dashHits(this);
        this.wasPhasing = true;
      } else {
        if (this.wasPhasing) { this.wasPhasing = false; if (b.velocity.y < -650) b.velocity.y = -650; }      // ease out of an upward dash
        b.allowGravity = true;
        if (dir && !(this.hack.strafe && inp.shoot)) this.facing = dir;          // strafe hack: keep facing while shooting
        this.setProne(onGround && inp.down && !dir);
        const run = dir * C.run * this.agent.speed * (this.adrenT > 0 ? 1.35 : 1) * (this.perkSpeed || 1) * (this.hack.speed ? 1.6 : 1);
        if (this.launchT > 0) { this.launchT -= ms; b.velocity.x += (run - b.velocity.x) * Math.min(1, dt * 2); }   // thrown by a blast: drift, don't snap
        else b.velocity.x = this.prone ? 0 : run;
        if (onGround) this.airJumps = 1;
        if (inp.jumpPressed && onGround) {
          if (inp.down && sc.time.now - this.ledgeT < 80) this.dropT = 260;      // drop through a ledge
          else { b.velocity.y = -C.jump * (this.hack.jump || this.bootsT > 0 ? 1.45 : 1); this.setProne(false); CG.Sfx.play('jump'); }
        } else if (inp.jumpPressed && this.airJumps > 0) {                       // double jump
          this.airJumps--;
          b.velocity.y = -C.jump * 0.9;
          this.spin = 0;
          sc.sparks.explode(6, b.center.x, b.bottom);
          CG.Sfx.play('jump');
        }
      }
      if (inp.abilityPressed) this.useAbility();

      // 8-way aim: up alone = straight up, up/down + a direction = diagonals, down in the air = straight down
      let ax = dir, ay = 0;
      if (inp.up) ay = -1;
      else if (inp.down && (!onGround || dir)) ay = 1;
      if (ay === 0) ax = this.facing;
      const len = Math.hypot(ax, ay);
      this.aimX = ax / len; this.aimY = ay / len;
      if (this.poundPending && onGround) { this.poundPending = false; sc.groundPound(this); }      // Hammer landed
      if ((this.hack.aim || this.aimT > 0) && inp.shoot) {
        const t = sc.nearestTarget(this);
        if (t) {
          const dx = t.x - b.center.x, dy = t.y - b.center.y, d = Math.hypot(dx, dy) || 1;
          this.aimX = dx / d; this.aimY = dy / d;
          if (!(this.hack.strafe && dir)) this.facing = dx < 0 ? -1 : 1;
        }
      }

      // stay inside the part of the world on screen (the camera never scrolls back): sides and top
      const cam = sc.cameras.main, view = cam.worldView.width ? cam.worldView : { x: cam.scrollX, y: 0, width: CG.CONFIG.W };
      const minX = view.x + PW / 2 + 8, maxX = view.x + view.width - PW / 2 - 8;
      if (this.phys.x < minX) { this.phys.x = minX; if (b.velocity.x < 0) b.velocity.x = 0; }
      if (this.phys.x > maxX) { this.phys.x = maxX; if (b.velocity.x > 0) b.velocity.x = 0; }
      if (b.top < view.y + 4) { this.phys.y += view.y + 4 - b.top; if (b.velocity.y < 0) b.velocity.y = 0; }
      if (b.top > CG.CONFIG.H + 60) { sc.splash(b.center.x); this.die(); return; }   // fell in the water

      const storm = this.stormT > 0, spread = this.spread || storm;
      if (inp.shoot && this.dashT <= 0 && this.fireCd <= 0 && sc.countBullets(this) < C.maxBullets * (spread ? 3 : 1) * (storm ? 3 : 1)) {
        const m = this.muzzle(), a = Math.atan2(this.aimY, this.aimX);
        const fan = storm ? [-0.3, -0.15, 0, 0.15, 0.3] : spread ? [-0.2, 0, 0.2] : [0];          // spread = three-way, storm = five-way
        for (const off of fan) { const bul = sc.fire(this, m.x, m.y, a + off); if (bul && storm) bul.pierce = 1; }
        this.shots++;
        CG.Sfx.play('shoot');
        this.fireCd = (this.rapid || this.adrenT > 0 ? C.rapidMs : C.fireMs) * (storm ? 0.45 : 1);
      }
      this.sync(dt);
    }

    useAbility() {
      if (this.abilityCd > 0 || !this.alive) return false;
      const ab = this.agent.ability, sc = this.scene;
      this.abilityCd = ab.cd * (this.perkCd || 1);
      CG.Sfx.play('ability');
      sc.callout(this, ab.name.toUpperCase());
      switch (this.agent.id) {
        case 'razor': this.stormT = ab.dur; break;
        case 'brick': this.domeT = ab.dur; sc.domeFx(this); break;
        case 'kite': {
          // the way you are aiming: forward, up, the diagonals — and down too while in the air
          let vx = this.aimX, vy = this.aimY;
          if (vy > 0 && this.onGround) { vx = this.facing; vy = 0; }
          const len = Math.hypot(vx, vy) || 1;
          this.dashVec = { x: vx / len, y: vy / len };
          this.dashT = 180; this.invT = Math.max(this.invT, 450); this.dashHit = new Set();
          this.setProne(false);
          sc.dashFx(this);
          break;
        }
        case 'nova':
          for (const p of sc.players) {
            if (sc.pvp && p.team !== this.team) continue;      // a duel: Mend only heals your own team
            if (p.remote || Math.abs(p.body.center.x - this.body.center.x) > ab.range) continue;
            if (p.out) { p.respawn(); continue; }                                    // back in the fight
            if (p.alive) { p.heal(ab.heal); p.invT = Math.max(p.invT, 1500); }
          }
          if (sc.net && !sc.pvp) sc.net.shout('heal', { x: Math.round(this.body.center.x), y: Math.round(this.body.bottom), range: ab.range, n: ab.heal, revive: 1 });
          sc.mendFx(this);
          break;
        case 'volt': sc.chainArc(this, ab.targets, ab.damage, ab.stun); break;
        case 'jax': sc.throwGrenade(this); break;
        case 'ghost': this.cloakT = ab.dur; sc.afterimage(this); break;
        case 'hammer':
          if (this.onGround) sc.groundPound(this);
          else { this.poundPending = true; this.body.velocity.y = 2200; }
          break;
        case 'viper': sc.throwGrenade(this, true); break;
        case 'atlas': sc.spawnDrone(this, ab.dur); break;
        case 'duke': this.adrenT = ab.dur; this.heal(1); break;
      }
      sc.events.emit('ability', this);
      return true;
    }

    heal(n) {
      if (!this.alive) return;
      this.hp = Math.min(this.maxHp, this.hp + n);
      this.scene.plusFx(this.body.center.x, this.body.top);
    }

    setProne(p) {
      if (p === this.prone) return;
      this.prone = p;
      this.body.setSize(PW, p ? PRONE_H : PH, false);
      this.body.setOffset(0, p ? PH - PRONE_H : 0);
    }

    // where bullets leave the rifle
    muzzle() {
      const b = this.body;
      if (!this.onGround) return { x: b.center.x + this.aimX * 40, y: b.center.y + this.aimY * 40 };
      const M = this.art.muzzle, s = this.art.scale;
      const m = this.prone ? M.prone : this.aimY < -0.9 ? M.up : this.aimY < -0.3 ? M.dup : this.aimY > 0.3 ? M.ddown : M.fwd;
      return { x: b.center.x + this.facing * m[0] * s, y: b.bottom + m[1] * s };
    }

    sync(dt) {
      const b = this.body, v = this.visual, A = this.art.anims, moving = Math.abs(b.velocity.x) > 10;
      const loop = (set, t) => set[0] + Math.floor(t) % (set[1] - set[0] + 1);
      let set, f, angle = 0;
      if (!this.onGround && this.dashT <= 0) {
        this.spin += dt * 12;
        set = A.ball; f = loop(set, this.spin);
        if (this.art.spin) angle = (this.spin * 40) % 360 * this.facing;   // no curled-up frames: spin the crouch
      } else if (this.prone) { set = A.prone; f = set[0]; }
      else if (moving) { this.runT += dt * 13; set = this.aimY < 0 ? A.run_dup : this.aimY > 0 ? A.run_ddown : A.run_fwd; f = loop(set, this.runT); }
      else { set = this.aimY < 0 ? (this.aimX ? A.stand_dup : A.stand_up) : this.aimY > 0 ? A.stand_ddown : A.stand_fwd; f = set[0]; }
      v.setFrame(f).setPosition(b.center.x, b.bottom).setFlipX(this.facing < 0).setAngle(angle);
      v.setScale(this.art.scale * (set[2] || 1));
      const blink = this.invT > 0 && this.dashT <= 0 && this.overT <= 0 && Math.floor(this.invT / 80) % 2 === 0;
      v.setAlpha(this.cloakT > 0 ? (this.remote ? 0.12 : 0.3) : blink ? 0.3 : 1);       // Ghost's cloak
      // Overdrive: pulsing gold
      if (this.overT > 0) v.setTint(Math.floor(this.overT / 120) % 2 ? 0xffd23c : 0xfff2b0);
      else if (this.wasOver) v.clearTint();
      this.wasOver = this.overT > 0;
      this.shield.setVisible(this.barrierT > 0).setPosition(b.center.x, b.center.y)
        .setAlpha(this.barrierT > 2000 ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(this.barrierT / 90)));

      // nametag and hearts bar
      const top = b.bottom - 150;
      this.tag.setVisible(true).setPosition(b.center.x, top - 10);
      const g = this.bar, w = 64, x0 = b.center.x - w / 2;
      g.clear();
      g.fillStyle(0x000000, 0.6).fillRect(x0 - 2, top - 6, w + 4, 9);
      g.fillStyle(0x3a0d0d, 1).fillRect(x0, top - 4, w, 5);
      g.fillStyle(this.hp / this.maxHp > 0.34 ? 0x5ce65c : 0xff4d4d, 1).fillRect(x0, top - 4, w * this.hp / this.maxHp, 5);
    }

    // dmg = hearts lost (bullets 1, bombs 2). Returns true if it hurt.
    hit(dmg = 1) {
      if (this.remote) return false;                   // their own game decides when they are hit
      if (this.alive && this.scene.underDome(this)) return false;    // a teammate's Aegis covers you
      if (!this.alive || this.invT > 0 || this.barrierT > 0 || this.domeT > 0 || this.dashT > 0 || this.overT > 0 || this.god) return false;
      this.hp -= dmg;
      if (this.hp <= 0) { this.hp = 0; this.die(); return true; }
      this.invT = 900;
      CG.Sfx.play('hit');
      this.scene.hurtFx(this);
      return true;
    }

    // A death uses one of the team's shared lives. With none left this player is out until the stage ends.
    die() {
      if (!this.alive) return;
      const sc = this.scene, b = this.body, v = this.visual;
      if (this.god) { this.hp = this.maxHp; return; }
      this.dead = true; this.hp = 0; this.rapid = false; this.spread = false; this.barrierT = 0; this.stormT = 0; this.domeT = 0; this.dashT = 0; this.adrenT = 0;
      this.pierce = this.blast = this.double = this.ice = false; this.overT = 0;
      this.fire = this.shock = false; this.magnetT = this.bootsT = this.aimT = this.cloakT = 0; this.armor = 0; this.poundPending = false;
      if (this.armorMax) { this.maxHp -= this.armorMax; this.armorMax = 0; }
      CG.Sfx.play('die');
      b.stop(); b.enable = false;
      this.shield.setVisible(false);
      this.tag.setVisible(false); this.bar.clear();
      v.setFrame(this.art.anims.death[0]).setScale(this.art.scale * (this.art.anims.death[2] || 1));
      const fromX = Phaser.Math.Clamp(v.x, sc.cameras.main.scrollX + 30, sc.cameras.main.scrollX + CG.CONFIG.W - 30);
      v.setPosition(fromX, Math.min(v.y, CG.CONFIG.H - 120)).setAlpha(1);
      sc.boom(fromX, v.y - 50, 14);
      sc.tweens.add({ targets: v, x: fromX - this.facing * 150, y: v.y - 90, angle: -this.facing * 60, duration: 420, ease: 'Quad.out' });
      sc.tweens.add({ targets: v, alpha: 0, delay: 650, duration: 350 });
      if (sc.pvp) {                                       // a duel: down until the round ends (see GameScene.downed)
        sc.pvpDeath(this);
        if (sc.ffa) sc.time.delayedCall(1500, () => { if (!sc.over) this.respawn(); });   // free-for-all: straight back in
        return;
      }
      const respawn = sc.teamLives > 0;
      if (respawn) {
        sc.teamLives--;
        if (sc.net && !sc.net.host) sc.net.send('die', {});      // the host keeps the team's real count
      }
      sc.time.delayedCall(1300, () => {
        if (sc.over) return;
        if (respawn) this.respawn();
        else { this.out = true; v.setVisible(false); sc.checkOver(); }
      });
    }

    respawn() {
      const sc = this.scene, T = CG.CONFIG.TILE;
      const col = sc.pvp ? Math.floor((sc.ffa ? sc.ffaSpawnX(this) : sc.teamSpawn(this.idx)) / T) : CG.Level.safeCol((sc.cameras.main.scrollX + 260 + this.idx * 90) / T);
      this.lastHitBy = null;
      this.dead = false; this.out = false; this.invT = this.C.respawnInvMs; this.fireCd = 0; this.hp = this.maxHp;
      this.setProne(false);
      this.body.enable = true;
      this.body.reset(col * T + T / 2, -40);
      this.visual.setAngle(0).setAlpha(1).setVisible(true);
    }

    // Chain Arc can jump to the other player in a duel: a stand-in that looks like an enemy to the arc code
    duelTarget() {
      return { active: true, isPlayerTarget: true, player: this, x: this.body.center.x, body: this.body, T: {} };
    }

    // an online teammate died / came back in their own game: show it here
    netDie() {
      const v = this.visual, sc = this.scene;
      this.dead = true;
      this.tag.setVisible(false); this.bar.clear();
      v.setFrame(this.art.anims.death[0]).setScale(this.art.scale * (this.art.anims.death[2] || 1));
      sc.boom(v.x, v.y - 50, 14);
      sc.tweens.add({ targets: v, x: v.x - this.facing * 150, y: v.y - 90, angle: -this.facing * 60, duration: 420, ease: 'Quad.out' });
      sc.tweens.add({ targets: v, alpha: 0, delay: 650, duration: 350 });
    }
    netRespawn() {
      this.dead = false;
      this.visual.setAngle(0).setAlpha(1).setVisible(true);
    }

    destroy() { this.tag.destroy(); this.bar.destroy(); }
  };

  // ------------------------------------------------------------------ enemies
  //   ai: runner (charges), rifle (stands and shoots), turret (rotating barrel), flyer (power-up capsule), core
  const TYPES = {
    // sheet: painted frames from enemies_tiles.png (same frame order as the pixel art), used when loaded
    runner: { tex: 'px_runner', sheet: 'sheet_runner', death: [8, 9], frames: true, hp: 1, body: [44, 100], ai: 'runner', speed: 300 },
    rifle:  { tex: 'px_rifle', sheet: 'sheet_rifle', death: [7, 8, 9], frames: true, hp: 2, body: [44, 100], ai: 'rifle', fireMs: 1900 },
    turret: { tex: 'e_turret', hp: 6, body: [84, 112], ai: 'turret', fireMs: 1500, fixed: true },
    flyer:  { tex: 'e_flyer', hp: 1, body: [90, 50], ai: 'flyer', fly: true },
    cannon: { tex: 'boss_cannon', barrelTex: 'boss_barrel', hp: 14, body: [84, 84], ai: 'turret', fireMs: 1250, fixed: true, center: true, boss: true },
    core:   { tex: 'boss_core', hp: 40, body: [100, 160], ai: 'core', fixed: true, boss: true, final: true },
    grenadier: { tex: 'px_gren', frames: true, hp: 2, body: [44, 100], ai: 'gren', fireMs: 2400 },
    drone:  { tex: 'px_drone', frames: true, hp: 2, body: [56, 34], ai: 'drone', fly: true, fireMs: 1700 },
    // the other two stage bosses (final: destroying it clears the stage)
    tank:   { tex: 'boss_tank', hp: 70, body: [240, 110], ai: 'tank', boss: true, final: true, pivotY: 96, barrelScale: 1.6, fireMs: 2300 },
    gunship: { tex: 'boss_heli', frames: true, hp: 55, body: [220, 80], ai: 'gunship', fly: true, boss: true, final: true, fireMs: 1500 },
    // ---- the classic campaign (story stages): art in hazards.js
    gate:   { tex: 'e_gate', hp: 24, body: [80, 470], ai: 'gate', fixed: true, solid: true, fireMs: 1500 },    // base wall + core
    mouth:  { tex: 'e_mouth', hp: 10, body: [110, 90], ai: 'mouth', fixed: true, center: true, fireMs: 2600 },  // spits bugs
    bug:    { tex: 'e_bug', frames: true, hp: 1, body: [44, 32], ai: 'bug', speed: 260 },
    statue: { tex: 'boss_statue', hp: 80, body: [250, 300], ai: 'statue', fixed: true, center: true, boss: true, final: true, fireMs: 2100 },
    orb:    { tex: 'e_orb', hp: 12, body: [70, 70], ai: 'orb', fly: true, boss: true, fireMs: 1700 },
    giant:  { tex: 'boss_giant', frames: true, hp: 110, body: [130, 320], ai: 'giant', boss: true, final: true, fireMs: 2200 },
    heart:  { tex: 'boss_heart', frames: true, hp: 120, body: [210, 210], ai: 'heart', fixed: true, center: true, boss: true, final: true, fireMs: 1900 },
  };

  CG.Enemy = class extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, type, x, y, extra) {
      const T = TYPES[type];
      const sheet = CG.CONFIG.SHEET_ART && T.sheet && scene.textures.exists(T.sheet);
      super(scene, x, y, sheet ? T.sheet : T.tex, T.frames ? 0 : undefined);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.type = type; this.T = T; this.extra = extra; this.painted = sheet; this.fireT = 0;
      // painted art is stored at full size and drawn smaller; Arcade scales the hitbox with the sprite, so undo that
      const sc = sheet ? (scene.enemyScale || 1) : (scene.artScale[this.texture.key] || 1);
      this.setScale(sc);
      // the fortress gets tougher each stage and with more players
      // bosses: tougher each lap and +50% per extra player; soldiers +20% per extra player (a runner takes 2 shots from 4 players up)
      this.hp = this.maxHp = Math.ceil(T.hp * (T.boss ? (1 + 0.35 * scene.diff) * (1 + 0.5 * (scene.players.length - 1)) : 1 + 0.2 * (scene.crowd || 0)));
      this.cd = 500 + Math.random() * 900; this.t = Math.random() * 6; this.hurtT = 0; this.dir = 0; this.baseY = y;
      const mid = T.fly || T.center;
      this.setOrigin(0.5, mid ? 0.5 : 1).setDepth(8);
      const bw = T.body[0] / sc, bh = T.body[1] / sc;
      this.body.setSize(bw, bh, false);
      this.body.setOffset((this.width - bw) / 2, mid ? (this.height - bh) / 2 : this.height - bh);
      if (T.fly) this.body.allowGravity = false;
      if (T.fixed) { this.body.allowGravity = false; this.body.moves = false; this.body.immovable = true; }
      this.cd2 = 900;
      if (T.ai === 'turret' || T.ai === 'tank') {
        const bt = T.barrelTex && scene.textures.exists(T.barrelTex) && scene.artScale[T.barrelTex] ? T.barrelTex : 'e_barrel';
        this.barrel = scene.add.image(x, y, bt).setOrigin(0.12, 0.5).setDepth(9).setRotation(Math.PI);
        this.barrel.setScale((scene.artScale[bt] || 1) * (T.barrelScale || (T.boss && bt === 'e_barrel' ? 1.25 : 1)));
      }
    }

    pivot() {                       // where the barrel is attached
      return { x: this.x, y: this.T.center ? this.y : this.y - (this.T.pivotY || this.displayHeight * 0.52) };
    }

    // turn the barrel toward the player; returns true once it is time to fire
    aimBarrel(dt, P, onScreen, fireMs) {
      const pv = this.pivot();
      this.barrel.setPosition(pv.x, pv.y);
      if (!P) return false;
      this.barrel.rotation = Phaser.Math.Angle.RotateTo(this.barrel.rotation, Math.atan2(P.body.center.y - pv.y, P.body.center.x - pv.x), dt * 2.2);
      if (!onScreen || this.cd > 0) return false;
      this.cd = fireMs;
      return true;
    }
    shootBarrel() {
      if (!this.active) return;
      const pv = this.pivot(), a = this.barrel.rotation, len = this.barrel.displayWidth * 0.85;
      this.scene.efire(pv.x + Math.cos(a) * len, pv.y + Math.sin(a) * len, a);
    }

    tick(dt) {
      const sc = this.scene, b = this.body, T = this.T, ms = dt * 1000;
      this.cd -= ms; this.t += dt; this.fireT -= ms;
      if (this.hurtT > 0) { this.hurtT -= ms; if (this.hurtT <= 0) this.clearTint(); }
      if (this.stunT > 0) {                              // Chain Arc: frozen for a moment
        this.stunT -= ms;
        if (this.hurtT <= 0) this.setTint(Math.floor(this.stunT / 90) % 2 ? 0xb890ff : 0xffffff);
        if (!this.T.fixed && !this.T.fly) b.velocity.x = 0;
        if (this.stunT <= 0) this.clearTint();
        return;
      }
      const P = sc.nearestPlayer(this.x, this.y);
      const cam = sc.cameras.main, onScreen = this.x > cam.scrollX - 40 && this.x < cam.scrollX + CG.CONFIG.W + 40;
      const fireMs = Math.max(650, (T.fireMs || 0) * (1 - 0.1 * sc.diff) / (1 + 0.12 * (sc.crowd || 0)));

      if (T.ai === 'runner') {
        if (!this.dir) this.dir = P && P.body.center.x > this.x ? 1 : -1;
        if (sc.horde && ((this.x < 60 && this.dir < 0) || (this.x > CG.DATA.level.w * CG.CONFIG.TILE - 60 && this.dir > 0))) this.dir *= -1;
        b.velocity.x = this.dir * T.speed * (1 + 0.1 * sc.diff);
        this.setFlipX(this.dir < 0);
        this.setFrame(b.blocked.down ? Math.floor(this.t * 12) % 6 : 6);
        if (b.blocked.down && (!sc.isSurface(this.x + this.dir * 44, b.bottom + 12) || b.blocked.left || b.blocked.right)) b.velocity.y = -880;   // leap gaps and cover
      } else if (T.ai === 'rifle') {
        if (P) {
          this.setFlipX(P.body.center.x < this.x);
          // point the rifle at the player: up, diagonal up, forward, diagonal down, down
          const tilt = Math.round(Math.atan2(P.body.center.y - (this.y - 66), Math.abs(P.body.center.x - this.x)) / (Math.PI / 4));
          const aim = [2, 1, 0, 3, 4][Phaser.Math.Clamp(tilt, -2, 2) + 2];
          this.setFrame(this.painted && this.fireT > 0 && aim === 0 ? 5 : aim);       // painted sheet has a firing pose
        }
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs; this.fireT = 160;
          const a = Math.round(Math.atan2(P.body.center.y - (this.y - 66), P.body.center.x - this.x) / (Math.PI / 4)) * (Math.PI / 4);
          sc.efire(this.x + Math.cos(a) * 44, this.y - 66 + Math.sin(a) * 44, a);
        }
      } else if (T.ai === 'turret') {
        if (this.aimBarrel(dt, P, onScreen, fireMs)) this.shootBarrel();
      } else if (T.ai === 'tank') {                      // rolls back and forth in front of the wall, fires three-shot bursts
        const left = sc.bossCamX + 620, right = CG.DATA.level.boss.wallCol * CG.CONFIG.TILE - 170;
        if (!this.dir) this.dir = -1;
        if (this.x < left) this.dir = 1; else if (this.x > right) this.dir = -1;
        b.velocity.x = this.dir * 90;
        if (this.aimBarrel(dt, P, onScreen, fireMs)) for (let i = 0; i < 3; i++) sc.time.delayedCall(i * 150, () => this.shootBarrel());
      } else if (T.ai === 'gunship') {                   // sweeps across the top of the screen dropping bombs
        this.x = sc.bossCamX + CG.CONFIG.W / 2 + 120 + Math.sin(this.t * 0.7) * 560;
        this.y = 250 + Math.sin(this.t * 1.9) * 70;
        this.setFrame(Math.floor(this.t * 16) % 2);
        if (onScreen) {
          this.cd2 -= ms;
          if (this.cd2 <= 0) { this.cd2 = Math.max(600, 1000 - 80 * sc.diff); sc.ebomb(this.x, this.y + 44, Phaser.Math.Between(-90, 90), 60); }
          if (P && this.cd <= 0) {
            this.cd = fireMs;
            sc.efire(this.x - 90, this.y + 30, Math.atan2(P.body.center.y - this.y - 30, P.body.center.x - this.x + 90));
          }
        }
      } else if (T.ai === 'gren') {                      // lobs grenades in an arc onto the player
        if (P) this.setFlipX(P.body.center.x < this.x);
        this.setFrame(this.cd > fireMs - 300 ? 1 : 0);
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          const t = 1.15, dx = P.body.center.x - this.x, dy = P.body.bottom - (this.y - 84);
          sc.ebomb(this.x, this.y - 84, dx / t, (dy - 0.5 * CG.CONFIG.GRAVITY * t * t) / t);
        }
      } else if (T.ai === 'drone') {                     // drifts across and shoots when the player is near
        b.velocity.x = -170;
        this.y = this.baseY + Math.sin(this.t * 2.4) * 50;
        this.setFrame(Math.floor(this.t * 14) % 2);
        if (P && onScreen && this.cd <= 0 && Math.abs(P.body.center.x - this.x) < 520) {
          this.cd = fireMs;
          sc.efire(this.x, this.y + 16, Math.atan2(P.body.center.y - this.y, P.body.center.x - this.x));
        }
      } else if (T.ai === 'flyer') {
        b.velocity.x = -240;
        this.y = this.baseY + Math.sin(this.t * 3) * 70;
      } else if (T.ai === 'gate') {                      // base wall: the core fires a three-way spread
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          const cy = this.y - this.displayHeight * 0.5, a = Math.atan2(P.body.center.y - cy, P.body.center.x - this.x);
          for (const d of [-0.22, 0, 0.22]) sc.efire(this.x - 30, cy, a + d);
        }
      } else if (T.ai === 'mouth') {                     // alien mouth: drops a bug now and then
        this.setScale(this.scaleX, this.scaleX * (1 + Math.sin(this.t * 6) * 0.04));
        if (onScreen && this.cd <= 0) { this.cd = fireMs; sc.spawnEnemy('bug', this.x, this.y + 50); }
      } else if (T.ai === 'bug') {                       // hops toward the nearest soldier
        if (P) this.dir = P.body.center.x > this.x ? 1 : -1;
        this.setFlipX(this.dir < 0);
        this.setFrame(Math.floor(this.t * 10) % 2);
        if (b.blocked.down) { b.velocity.x = this.dir * T.speed; if (this.cd <= 0) { this.cd = 700 + Math.random() * 500; b.velocity.y = -620; } }
      } else if (T.ai === 'statue') {                    // stone statue: five fireballs in a fan from its mouth
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          const my = this.y + this.displayHeight * 0.18, a = Math.atan2(P.body.center.y - my, P.body.center.x - this.x);
          for (let k = -2; k <= 2; k++) sc.efireKey(this.x - 20, my, a + k * 0.2, 'fireball', 380, 22);
        }
      } else if (T.ai === 'orb') {                       // the statue's arms: orbit it and shoot
        const ex = this.extra || {};
        this.x = ex.cx + Math.cos(this.t * 1.3 + (ex.ph || 0)) * 230;
        this.y = ex.cy + Math.sin(this.t * 1.3 + (ex.ph || 0)) * 170;
        if (P && onScreen && this.cd <= 0) { this.cd = fireMs; sc.efireKey(this.x, this.y, Math.atan2(P.body.center.y - this.y, P.body.center.x - this.x), 'fireball', 420, 22); }
      } else if (T.ai === 'giant') {                     // the giant: stomps back and forth, leaps, throws discs, shockwave on landing
        const left = sc.bossCamX + 500, right = CG.DATA.level.boss.wallCol * CG.CONFIG.TILE - 200;
        if (!this.dir) this.dir = -1;
        if (this.x < left) this.dir = 1; else if (this.x > right) this.dir = -1;
        if (b.blocked.down) {
          if (this.wasAir) { this.wasAir = false; sc.shockwave(this.x, this.y); }
          b.velocity.x = this.dir * 110;
          this.cd2 -= ms;
          if (this.cd2 <= 0) { this.cd2 = 3800 + Math.random() * 1500; b.velocity.y = -1250; b.velocity.x = this.dir * 260; this.wasAir = true; }
        }
        this.setFlipX(this.dir < 0);                     // drawn facing right
        this.setFrame(Math.floor(this.t * 4) % 2);
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          const hy = this.y - this.displayHeight * 0.6, a = Math.atan2(P.body.center.y - hy, P.body.center.x - this.x);
          for (const d of [-0.25, 0, 0.25]) sc.efireKey(this.x, hy, a + d, 'e_disc', 520, 30);
        }
      } else if (T.ai === 'heart') {                     // the alien heart: beats, lobs spores, calls bugs
        this.setFrame(Math.floor(this.t * 3) % 2);
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          for (let k = 0; k < 3; k++) sc.ebomb(this.x - 60, this.y - 40, -260 - k * 170, -560 - k * 60);
        }
        this.cd2 -= ms;
        if (onScreen && this.cd2 <= 0) { this.cd2 = Math.max(1600, 3200 - 200 * sc.diff); sc.spawnEnemy('bug', this.x - 140, this.y + 60); }
      }
    }

    damage(n) {
      if (!this.active) return;
      if (this.puppet) {                                 // online, not the host: the host's game takes the health
        this.scene.net.send('hit', { id: this.netId, n });
        this.setTintFill(0xffffff);
        this.hurtT = 60;
        CG.Sfx.play('hit');
        return;
      }
      this.hp -= n;
      if (this.hp > 0) CG.Sfx.play('hit');
      // the fortress core cracks at half health
      if (this.type === 'core' && this.hp < this.maxHp / 2 && this.texture.key === 'boss_core' && this.scene.textures.exists('boss_core_dmg')) this.setTexture('boss_core_dmg');
      this.setTintFill(0xffffff);
      this.hurtT = 60;
      if (this.hp <= 0) this.scene.killEnemy(this);
    }

    destroy(fromScene) {
      if (this.barrel) { this.barrel.destroy(); this.barrel = null; }
      super.destroy(fromScene);
    }
  };
  CG.Enemy.TYPES = TYPES;
})();
