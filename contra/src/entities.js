// Players and enemies.
(function () {
  const PW = 44, PH = 100, PRONE_H = 36;

  // ------------------------------------------------------------------ player
  CG.Player = class {
    constructor(scene, idx, x, feetY, lives) {
      this.scene = scene; this.idx = idx; this.C = CG.CONFIG.PLAYER;
      this.phys = scene.add.zone(x, feetY - PH / 2, PW, PH);
      scene.physics.add.existing(this.phys);
      this.phys.owner = this;
      this.body = this.phys.body;
      this.body.maxVelocity.set(1200, 1500);

      // Every pose has the rifle drawn in. With CONFIG.SHEET_ART the painted commandos are used: P1 blue, P2 red,
      // P3-P5 recoloured copies of the blue one. Otherwise (or if the sheet is missing) the built-in pixel art.
      const sheet = CG.CONFIG.SHEET_ART && CG.DATA.art && CG.DATA.art.players && scene.textures.exists('commandos') ? CG.DATA.art : null;
      const tex = idx < 2 ? 'commandos' : 'commandos_' + idx, who = sheet ? sheet.players[idx < 2 ? idx : 0] : null;
      this.art = sheet && scene.textures.exists(tex)
        ? { tex, anims: who.anims, muzzle: who.muzzle, scale: sheet.playerScale, originY: sheet.originY }
        : { tex: 'pl' + idx, anims: CG.Art.PIX.anims, muzzle: CG.Art.PIX.muzzle, scale: 1, originY: 1 };
      this.visual = scene.add.image(x, feetY, this.art.tex, this.art.anims.stand_fwd[0])
        .setOrigin(0.5, this.art.originY).setScale(this.art.scale).setDepth(10);
      this.shield = scene.add.image(x, feetY, 'glow').setDepth(11).setVisible(false);

      Object.assign(this, {
        facing: 1, aimX: 1, aimY: 0, lives, dead: false, out: false, prone: false, onGround: false,
        invT: 0, barrierT: 0, rapid: false, fireCd: 0, dropT: 0, ledgeT: -1e9, runT: 0, spin: 0,
      });
    }

    update(dt, inp) {
      if (this.out) return;
      const ms = dt * 1000, C = this.C, b = this.body, sc = this.scene;
      for (const k of ['invT', 'barrierT', 'fireCd', 'dropT']) this[k] = Math.max(0, this[k] - ms);
      if (this.dead) return;

      const onGround = this.onGround = b.blocked.down || b.touching.down;
      const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (dir) this.facing = dir;
      this.setProne(onGround && inp.down && !dir);
      b.velocity.x = this.prone ? 0 : dir * C.run;

      if (inp.jumpPressed && onGround) {
        if (inp.down && sc.time.now - this.ledgeT < 80) this.dropT = 260;      // drop through a ledge
        else { b.velocity.y = -C.jump; this.setProne(false); }
      }

      // 8-way aim: up alone = straight up, up/down + a direction = diagonals, down in the air = straight down
      let ax = dir, ay = 0;
      if (inp.up) ay = -1;
      else if (inp.down && (!onGround || dir)) ay = 1;
      if (ay === 0) ax = this.facing;
      const len = Math.hypot(ax, ay);
      this.aimX = ax / len; this.aimY = ay / len;

      // stay on screen (the camera never scrolls back)
      const cam = sc.cameras.main, minX = cam.scrollX + PW / 2 + 8, maxX = cam.scrollX + CG.CONFIG.W - PW / 2 - 8;
      if (this.phys.x < minX) this.phys.x = minX;
      if (this.phys.x > maxX) this.phys.x = maxX;
      if (b.top > CG.CONFIG.H + 60) { this.die(); return; }                     // fell in the water

      if (inp.shoot && this.fireCd <= 0 && sc.countBullets(this) < C.maxBullets) {
        const m = this.muzzle();
        sc.fire(this, m.x, m.y, Math.atan2(this.aimY, this.aimX));
        this.fireCd = this.rapid ? C.rapidMs : C.fireMs;
      }
      this.sync(dt);
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
      const m = this.prone ? M.prone : this.aimY < 0 ? (this.aimX ? M.dup : M.up) : this.aimY > 0 ? M.ddown : M.fwd;
      return { x: b.center.x + this.facing * m[0] * s, y: b.bottom + m[1] * s };
    }

    sync(dt) {
      const b = this.body, v = this.visual, A = this.art.anims, moving = Math.abs(b.velocity.x) > 10;
      const loop = (set, t) => set[0] + Math.floor(t) % (set[1] - set[0] + 1);
      let f;
      if (!this.onGround) { this.spin += dt * 12; f = loop(A.ball, this.spin); }
      else if (this.prone) f = A.prone[0];
      else if (moving) { this.runT += dt * 13; f = loop(this.aimY < 0 ? A.run_dup : this.aimY > 0 ? A.run_ddown : A.run_fwd, this.runT); }
      else f = this.aimY < 0 ? A.stand_up[0] : A.stand_fwd[0];
      v.setFrame(f).setPosition(b.center.x, b.bottom).setFlipX(this.facing < 0);
      const blink = this.invT > 0 && Math.floor(this.invT / 80) % 2 === 0;
      v.setAlpha(blink ? 0.3 : 1);
      this.shield.setVisible(this.barrierT > 0).setPosition(b.center.x, b.center.y)
        .setAlpha(this.barrierT > 2000 ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(this.barrierT / 90)));
    }

    hit() {
      if (this.dead || this.out || this.invT > 0 || this.barrierT > 0) return;
      this.die();
    }

    die() {
      if (this.dead || this.out) return;
      const sc = this.scene, b = this.body, v = this.visual;
      this.dead = true; this.lives--; this.rapid = false; this.barrierT = 0;
      b.stop(); b.enable = false;
      this.shield.setVisible(false);
      v.setFrame(this.art.anims.death[0]);
      const fromX = Phaser.Math.Clamp(v.x, sc.cameras.main.scrollX + 30, sc.cameras.main.scrollX + CG.CONFIG.W - 30);
      v.setPosition(fromX, Math.min(v.y, CG.CONFIG.H - 120)).setAlpha(1);
      sc.boom(fromX, v.y - 50, 14);
      sc.tweens.add({ targets: v, x: fromX - this.facing * 150, y: v.y - 90, angle: -this.facing * 60, duration: 420, ease: 'Quad.out' });
      sc.tweens.add({ targets: v, alpha: 0, delay: 650, duration: 350 });
      sc.time.delayedCall(1300, () => {
        if (sc.over) return;
        if (this.lives > 0) this.respawn();
        else { this.out = true; v.setVisible(false); sc.checkOver(); }
      });
    }

    respawn() {
      const sc = this.scene, T = CG.CONFIG.TILE;
      const col = CG.Level.safeCol((sc.cameras.main.scrollX + 260 + this.idx * 90) / T);
      this.dead = false; this.invT = this.C.respawnInvMs; this.fireCd = 0;
      this.setProne(false);
      this.body.enable = true;
      this.body.reset(col * T + T / 2, -40);
      this.visual.setAngle(0).setAlpha(1).setVisible(true);
    }
  };

  // ------------------------------------------------------------------ enemies
  //   ai: runner (charges), rifle (stands and shoots), turret (rotating barrel), flyer (power-up capsule), core
  const TYPES = {
    runner: { tex: 'px_runner', frames: true, hp: 1, body: [44, 100], ai: 'runner', speed: 300 },
    rifle:  { tex: 'px_rifle', frames: true, hp: 2, body: [44, 100], ai: 'rifle', fireMs: 1900 },
    turret: { tex: 'e_turret', hp: 6, body: [84, 112], ai: 'turret', fireMs: 1500, fixed: true },
    flyer:  { tex: 'e_flyer', hp: 1, body: [90, 50], ai: 'flyer', fly: true },
    cannon: { tex: 'boss_cannon', hp: 14, body: [84, 84], ai: 'turret', fireMs: 1250, fixed: true, center: true, boss: true },
    core:   { tex: 'boss_core', hp: 40, body: [100, 160], ai: 'core', fixed: true, boss: true },
  };

  CG.Enemy = class extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, type, x, y, extra) {
      const T = TYPES[type];
      super(scene, x, y, T.tex, T.frames ? 0 : undefined);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.type = type; this.T = T; this.extra = extra;
      // the fortress gets tougher each stage and with more players
      this.hp = Math.ceil(T.hp * (T.boss ? (1 + 0.35 * scene.diff) * (1 + 0.5 * (scene.players.length - 1)) : 1));
      this.cd = 500 + Math.random() * 900; this.t = Math.random() * 6; this.hurtT = 0; this.dir = 0; this.baseY = y;
      const mid = T.fly || T.center;
      this.setOrigin(0.5, mid ? 0.5 : 1).setDepth(8);
      const [bw, bh] = T.body;
      this.body.setSize(bw, bh, false);
      this.body.setOffset((this.width - bw) / 2, mid ? (this.height - bh) / 2 : this.height - bh);
      if (T.fly) this.body.allowGravity = false;
      if (T.fixed) { this.body.allowGravity = false; this.body.moves = false; this.body.immovable = true; }
      if (T.ai === 'turret') {
        this.barrel = scene.add.image(x, y, 'e_barrel').setOrigin(0.12, 0.5).setDepth(9).setRotation(Math.PI);
        if (T.boss) this.barrel.setScale(1.25);
      }
    }

    pivot() {                       // where the barrel is attached
      return { x: this.x, y: this.T.center ? this.y : this.y - this.height * 0.52 };
    }

    tick(dt) {
      const sc = this.scene, b = this.body, T = this.T, ms = dt * 1000;
      this.cd -= ms; this.t += dt;
      if (this.hurtT > 0) { this.hurtT -= ms; if (this.hurtT <= 0) this.clearTint(); }
      const P = sc.nearestPlayer(this.x, this.y);
      const cam = sc.cameras.main, onScreen = this.x > cam.scrollX - 40 && this.x < cam.scrollX + CG.CONFIG.W + 40;
      const fireMs = Math.max(800, (T.fireMs || 0) * (1 - 0.1 * sc.diff));

      if (T.ai === 'runner') {
        if (!this.dir) this.dir = P && P.body.center.x > this.x ? 1 : -1;
        b.velocity.x = this.dir * T.speed * (1 + 0.1 * sc.diff);
        this.setFlipX(this.dir < 0);
        this.setFrame(b.blocked.down ? Math.floor(this.t * 12) % 6 : 6);
        if (b.blocked.down && !sc.isSurface(this.x + this.dir * 44, b.bottom + 12)) b.velocity.y = -880;   // leap the gap
      } else if (T.ai === 'rifle') {
        if (P) {
          this.setFlipX(P.body.center.x < this.x);
          // point the rifle at the player: up, diagonal up, forward, diagonal down, down
          const tilt = Math.round(Math.atan2(P.body.center.y - (this.y - 66), Math.abs(P.body.center.x - this.x)) / (Math.PI / 4));
          this.setFrame([2, 1, 0, 3, 4][Phaser.Math.Clamp(tilt, -2, 2) + 2]);
        }
        if (P && onScreen && this.cd <= 0) {
          this.cd = fireMs;
          const a = Math.round(Math.atan2(P.body.center.y - (this.y - 66), P.body.center.x - this.x) / (Math.PI / 4)) * (Math.PI / 4);
          sc.efire(this.x + Math.cos(a) * 44, this.y - 66 + Math.sin(a) * 44, a);
        }
      } else if (T.ai === 'turret') {
        const pv = this.pivot();
        this.barrel.setPosition(pv.x, pv.y);
        if (P) {
          const want = Math.atan2(P.body.center.y - pv.y, P.body.center.x - pv.x);
          this.barrel.rotation = Phaser.Math.Angle.RotateTo(this.barrel.rotation, want, dt * 2.2);
          if (onScreen && this.cd <= 0) {
            this.cd = fireMs;
            const a = this.barrel.rotation, len = 64 * this.barrel.scaleX;
            sc.efire(pv.x + Math.cos(a) * len, pv.y + Math.sin(a) * len, a);
          }
        }
      } else if (T.ai === 'flyer') {
        b.velocity.x = -240;
        this.y = this.baseY + Math.sin(this.t * 3) * 70;
      }
    }

    damage(n) {
      if (!this.active) return;
      this.hp -= n;
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
