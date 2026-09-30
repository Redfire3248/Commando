// The player. Physics lives on an invisible zone so the visible sprite can squash, stretch and
// crouch without changing the hitbox.
(function () {
  const approach = (v, t, d) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
  const W = 52, H = 104, CROUCH_H = 70, GUN_LEN = 56;

  GH.Player = class {
    constructor(scene, x, bottom) {
      const C = this.C = GH.CONFIG.PLAYER;
      this.scene = scene;
      this.phys = scene.add.zone(x, bottom - H / 2, W, H);
      scene.physics.add.existing(this.phys);
      this.body = this.phys.body;
      this.body.setCollideWorldBounds(true);
      this.body.maxVelocity.set(2400, C.maxFall);

      this.visual = scene.add.image(x, bottom, 'player').setOrigin(0.5, 1).setDepth(10);
      this.gun = scene.add.image(x, bottom, 'gun').setOrigin(0.18, 0.5).setDepth(11);

      Object.assign(this, {
        facing: 1, aimX: 1, aimY: 0, aimAngle: 0,
        hp: C.maxHp, maxHp: C.maxHp, shards: 0,
        abilities: { dash: true, doubleJump: false, wallJump: false },
        weapons: ['pistol'], weaponIndex: 0,
        // timers (ms)
        coyote: 0, buffer: 0, dashT: 0, dashCd: 0, fireCd: 0, slashCd: 0, iframes: 0, ctrlLock: 0, dropT: 0,
        wallT: 0, ghostT: 0, platT: -1e9,
        airJumps: 0, airDash: true, jumping: false, crouching: false, wallSliding: false, lastWall: 0,
        wasGround: false, onGroundNow: false, fallVy: 0, dead: false, frozen: false,
        sx: 1, sy: 1, bob: 0, kick: 0,
      });
      this.lastSafe = { x, y: bottom };

      // Real art (if tools/build_art.py has produced it): animated body + a gun held in two hands.
      const art = GH.DATA.art || {};
      this.sheet = art.player && scene.textures.get('player').frameTotal > 10 ? art.player : null;
      this.held = art.held && scene.textures.exists('guns_held') ? art.held : null;
      this.animT = 0; this.runT = 0; this.landT = 0; this.slashAnim = null; this.animScale = 1;
      this.slideT = 0; this.flipT = 0; this.kickT = 0; this.slideDir = 1; this.pose = null;
      if (this.sheet) this.visual.setOrigin(0.5, this.sheet.originY);
      if (this.held) this.gun.setTexture('guns_held', 0).setOrigin(this.held.originX, 0.5).setScale(this.held.scale);
    }

    // Where bullets leave the gun.
    muzzle() {
      const g = this.held && this.held.guns[this.weapon.id];
      if (!g) return { x: this.gun.x + this.aimX * GUN_LEN, y: this.gun.y + this.aimY * GUN_LEN };
      const s = this.held.scale, c = Math.cos(this.aimAngle), sn = Math.sin(this.aimAngle);
      const mx = g.mx * s, my = g.my * s * (this.gun.flipY ? -1 : 1);
      return { x: this.gun.x + mx * c - my * sn, y: this.gun.y + mx * sn + my * c };
    }

    // Returns true when the sprite sheet has its own slash frames (so no separate swing arc is drawn).
    startSlashAnim(dir) {
      if (!this.sheet) return false;
      if (dir === 'fwd' && !this.onGroundNow && this.sheet.anims.slash_air) dir = 'air';
      if (!this.sheet.anims['slash_' + dir]) return false;
      this.slashAnim = { dir, t: 0 };
      this.pose = null;
      return true;
    }

    // Hold a named animation for a moment (resting at a bench, lifting a new item). Moving cancels it.
    strikePose(name, seconds) {
      if (this.sheet && this.sheet.anims[name]) this.pose = { name, t: 0, dur: seconds };
    }

    get weapon() {
      return GH.DATA.weaponById[this.weapons[this.weaponIndex]] || GH.DATA.weaponById.pistol;
    }

    giveWeapon(id) {
      if (!this.weapons.includes(id)) this.weapons.push(id);
      this.weaponIndex = this.weapons.indexOf(id);
    }

    cycle(d) {
      const n = this.weapons.length;
      if (n > 1) this.weaponIndex = (this.weaponIndex + d + n) % n;
    }

    update(dt, inp) {
      const C = this.C, b = this.body, h = inp.held, p = inp.pressed, ms = dt * 1000;
      const fx = this.scene.fx;
      for (const k of ['coyote', 'buffer', 'dashCd', 'fireCd', 'slashCd', 'iframes', 'ctrlLock', 'dropT', 'wallT',
        'slideT', 'flipT', 'kickT']) {
        this[k] = Math.max(0, this[k] - ms);
      }

      const onGround = b.blocked.down || b.touching.down;
      const onPlatform = onGround && this.scene.time.now - this.platT < 80;
      this.onGroundNow = onGround;
      if (onGround) {
        this.coyote = C.coyoteMs;
        this.airJumps = this.abilities.doubleJump ? 1 : 0;
        this.airDash = true;
        if (!this.wasGround) this.land();
      } else {
        this.fallVy = b.velocity.y;
      }
      this.wasGround = onGround;

      // ---- weapon switching ----
      if (p.next) this.cycle(1);
      if (p.prev) this.cycle(-1);
      if (inp.slot >= 0 && inp.slot < this.weapons.length) this.weaponIndex = inp.slot;

      // ---- run / dash ----
      const dir = (h.right ? 1 : 0) - (h.left ? 1 : 0);
      if (this.pose && (dir || p.jump || p.dash || !onGround)) this.pose = null;

      // slide: tap DOWN while running. Low hitbox, keeps its speed, ends on its own or with a jump.
      if (this.slideT > 0) {
        if (!onGround || p.jump || p.dash) this.slideT = 0;
      } else if (onGround && p.down && Math.abs(b.velocity.x) > C.runSpeed * 0.7 && this.dashT <= 0) {
        this.slideT = C.slideMs;
        this.slideDir = Math.sign(b.velocity.x);
        fx.dust.explode(6, b.center.x, b.bottom);
      }
      const sliding = this.slideT > 0;

      if (dir && this.dashT <= 0 && this.ctrlLock <= 0 && !sliding) this.facing = dir;
      this.setCrouch(onGround && (sliding || (h.down && !dir)) && this.dashT <= 0);

      if (this.dashT > 0) {
        this.dashT -= ms;
        b.setVelocity(this.facing * C.dashSpeed, 0);
        this.ghostT -= ms;
        if (this.ghostT <= 0) { this.ghostT = 28; this.ghost(); }
        if (this.dashT <= 0) { b.allowGravity = true; b.velocity.x = this.facing * C.runSpeed; }
      } else if (p.dash && this.abilities.dash && this.dashCd <= 0 && (onGround || this.airDash)) {
        this.dashT = C.dashMs;
        this.dashCd = C.dashCooldownMs;
        if (!onGround) this.airDash = false;
        b.allowGravity = false;
        this.jumping = false;
        this.setCrouch(false);
        fx.dust.explode(8, b.center.x, b.bottom);
      } else if (sliding) {
        this.facing = this.slideDir;
        b.velocity.x = this.slideDir * C.runSpeed * (0.55 + 0.75 * this.slideT / C.slideMs);
      } else if (this.ctrlLock <= 0) {
        const target = (h.lock || this.crouching) ? 0 : dir * C.runSpeed;
        const acc = onGround ? (target === 0 ? C.friction : C.accel) : C.airAccel;
        b.velocity.x = approach(b.velocity.x, target, acc * dt);
      }

      // ---- wall slide ----
      const wallDir = (!onGround && this.abilities.wallJump) ? (b.blocked.left ? -1 : (b.blocked.right ? 1 : 0)) : 0;
      this.wallSliding = wallDir !== 0 && dir === wallDir && b.velocity.y > 0 && this.dashT <= 0;
      if (this.wallSliding) {
        b.velocity.y = Math.min(b.velocity.y, C.wallSlide);
        this.airDash = true;
        this.airJumps = this.abilities.doubleJump ? 1 : 0;
        this.wallT = 130;
        this.lastWall = wallDir;
        this.facing = -wallDir;
        if (Math.random() < 0.25) fx.dust.explode(1, b.center.x + wallDir * 26, b.center.y + 30);
      }

      // ---- jump ----
      if (p.jump) this.buffer = C.bufferMs;
      if (this.buffer > 0 && this.dashT <= 0) {
        if (onPlatform && h.down) {
          this.dropT = 260;                       // drop through a one-way platform
          this.buffer = 0;
        } else if (onGround || this.coyote > 0) {
          this.doJump(C.jumpVel);
          fx.dust.explode(5, b.center.x, b.bottom);
        } else if (this.wallT > 0) {
          this.buffer = 0; this.wallT = 0;
          this.jumping = true;
          b.setVelocity(-this.lastWall * C.wallJumpX, -C.wallJumpY);
          this.facing = -this.lastWall;
          this.ctrlLock = 170;
          this.kickT = 200;
          fx.dust.explode(6, b.center.x + this.lastWall * 26, b.center.y);
        } else if (this.airJumps > 0) {
          this.airJumps--;
          this.flipT = 300;
          this.doJump(C.jumpVel * 0.95);
          fx.glint.explode(10, b.center.x, b.bottom);
        }
      }
      if (this.jumping && !h.jump && b.velocity.y < 0) { b.velocity.y *= C.jumpCut; this.jumping = false; }
      if (b.velocity.y >= 0) this.jumping = false;

      // ---- 8-way aim (Contra style) ----
      let ax = dir, ay = 0;
      if (h.up) ay = -1;
      else if (h.down && (!onGround || dir || h.lock)) ay = 1;
      if (onGround && ay === 1 && ax === 0) ay = 0;   // can't fire into the floor
      if (ay === 0) ax = this.facing;
      if (this.wallSliding && ax !== 0) ax = this.facing;
      const len = Math.hypot(ax, ay);
      this.aimX = ax / len; this.aimY = ay / len;
      this.aimAngle = Math.atan2(ay, ax);

      // ---- remember the last safe ground (spikes send you back here) ----
      if (onGround && this.scene.isSafeGround(b.center.x, b.bottom)) {
        this.lastSafe.x = b.center.x; this.lastSafe.y = b.bottom;
      }

      this.syncVisual(dt);

      // ---- shoot ----
      if (GH.CONFIG.GUNS && h.shoot && this.fireCd <= 0 && this.dashT <= 0) {
        const w = this.weapon;
        this.fireCd = w.fireRate;
        const m = this.muzzle();
        this.scene.weapons.fire(w, m.x, m.y, this.aimAngle);
        this.kick = 1;
        if (w.recoil) {
          if (onGround) b.velocity.x -= this.aimX * w.recoil * 0.4;
          else { b.velocity.x -= this.aimX * w.recoil; b.velocity.y -= this.aimY * w.recoil * 1.2; }
        }
      }

      // ---- melee slash ----
      if (p.slash && this.slashCd <= 0 && this.dashT <= 0) {
        this.slashCd = C.slashCooldownMs;
        this.scene.startSlash(h.up ? 'up' : (h.down && !onGround ? 'down' : 'fwd'));
      }
    }

    doJump(v) {
      this.body.velocity.y = -v;
      this.jumping = true;
      this.coyote = 0; this.buffer = 0;
      this.sx = 0.8; this.sy = 1.22;
    }

    land() {
      const hard = this.fallVy > 700;
      this.sx = hard ? 1.3 : 1.15; this.sy = hard ? 0.74 : 0.88;
      if (hard) this.scene.fx.dust.explode(10, this.body.center.x, this.body.bottom);
      this.landT = 160;
      this.fallVy = 0;
    }

    pogo() {
      this.body.velocity.y = -this.C.pogoVel;
      this.jumping = false;
      this.airJumps = this.abilities.doubleJump ? 1 : 0;
      this.airDash = true;
    }

    setCrouch(c) {
      if (c === this.crouching) return;
      this.crouching = c;
      // Keep the feet planted: shrink the hitbox from the top.
      this.body.setSize(W, c ? CROUCH_H : H, false);
      this.body.setOffset(0, c ? H - CROUCH_H : 0);
    }

    hurt(n, srcX, noKnock) {
      if (this.dead || this.iframes > 0) return false;
      const b = this.body;
      this.hp = Math.max(0, this.hp - n);
      this.iframes = this.C.iframesMs;
      if (!noKnock) {
        const d = Math.sign(b.center.x - srcX) || -this.facing;
        this.dashT = 0;
        b.allowGravity = true;
        b.setVelocity(d * this.C.knockX, -this.C.knockY);
        this.ctrlLock = 200;
      }
      this.scene.onPlayerHurt();
      if (this.hp <= 0) this.scene.playerDied();
      return true;
    }

    teleport(x, bottom) {
      this.setCrouch(false);
      this.dashT = 0;
      this.body.allowGravity = true;
      this.body.reset(x, bottom - H / 2);
      this.syncVisual(0);
    }

    revive(x, bottom) {
      this.dead = false; this.frozen = false;
      this.hp = this.maxHp;
      this.body.enable = true;
      this.teleport(x, bottom);
      this.visual.setVisible(true);
      this.iframes = 800;
    }

    ghost() {
      const v = this.visual;
      const g = this.scene.add.image(v.x, v.y, 'player', v.frame.name).setOrigin(0.5, v.originY).setFlipX(v.flipX)
        .setScale(v.scaleX, v.scaleY).setTintFill(0x6ff3ff).setAlpha(0.45).setDepth(9)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    }

    // Picks the sprite-sheet frame for what the player is doing right now.
    frameFor(dt) {
      const an = this.sheet.anims, b = this.body, C = this.C;
      // Frames are stored at the sheet's own resolution; each animation says how large to draw it.
      this.animScale = 1;
      const at = (name, t, loop) => {
        const [s, e, fps, scale] = an[name], n = e - s + 1, i = Math.floor(t * fps);
        this.animScale = scale || 1;
        return s + (loop ? i % n : Math.min(i, n - 1));
      };
      this.animT += dt;
      this.landT = Math.max(0, this.landT - dt * 1000);
      if (this.slashAnim) {
        const sa = this.slashAnim;
        sa.t += dt;
        if (sa.t * 1000 > C.slashMs) this.slashAnim = null;
        else return at('slash_' + sa.dir, sa.t, false);
      }
      if (this.dashT > 0 && an.dash) return at('dash', (C.dashMs - this.dashT) / 1000, false);
      if (this.ctrlLock > 0 && this.iframes > C.iframesMs - 400 && an.hurt) return at('hurt', this.animT, true);
      if (this.pose) {
        this.pose.t += dt;
        if (this.pose.t > this.pose.dur) this.pose = null;
        else return at(this.pose.name, this.pose.t, false);
      }
      if (!this.onGroundNow) {
        const vy = b.velocity.y, j = an.jump;
        if (this.wallSliding) return an.wall ? at('wall', this.animT, true) : j[0] + 5;
        if (this.kickT > 0 && an.wallkick) return at('wallkick', 0, false);
        if (this.flipT > 0 && an.flip) return at('flip', (300 - this.flipT) / 1000, true);
        this.animScale = j[3] || 1;
        if (j[1] - j[0] >= 7) return j[0] + (vy < -650 ? 1 : vy < -250 ? 2 : vy < 250 ? 4 : vy < 800 ? 5 : 6);
        return j[0] + (vy < -700 ? 0 : vy < -220 ? 1 : vy < 220 ? 2 : 3);     // launch, rising, apex, falling
      }
      if (this.slideT > 0 && an.slide) return at('slide', (C.slideMs - this.slideT) / 1000, false);
      if (this.crouching) return at('crouch', this.animT, true);
      if (Math.abs(b.velocity.x) > 60) {
        this.runT += dt * Math.abs(b.velocity.x) / C.runSpeed;
        return at('run', this.runT, true);
      }
      if (this.landT > 0) return at('land', (160 - this.landT) / 1000, false);
      return at('idle', this.animT, true);
    }

    syncVisual(dt) {
      const b = this.body, v = this.visual, C = this.C;
      const dashing = this.dashT > 0;
      const k = Math.min(1, dt * 14);
      this.sx += (1 - this.sx) * k;
      this.sy += (1 - this.sy) * k;

      let gunHidden = this.dead || dashing || !GH.CONFIG.GUNS;
      if (this.sheet) {
        v.setFrame(this.frameFor(dt));
        v.setPosition(b.center.x, b.bottom);
        // the sheet has real poses, so only a hint of squash and stretch
        const sc = this.sheet.scale * this.animScale;
        v.setScale(sc * (1 + (this.sx - 1) * 0.4), sc * (1 + (this.sy - 1) * 0.4));
        gunHidden = gunHidden || !!this.slashAnim || (this.ctrlLock > 0 && this.iframes > C.iframesMs - 400);
      } else {
        const running = this.onGroundNow && Math.abs(b.velocity.x) > 60 && !dashing;
        this.bob = running ? this.bob + dt * Math.abs(b.velocity.x) / 32 : 0;
        v.setPosition(b.center.x, b.bottom + (running ? -Math.abs(Math.sin(this.bob)) * 6 : 0));
        v.setScale(this.sx * (dashing ? 1.18 : 1), this.sy * (this.crouching ? 0.72 : 1) * (dashing ? 0.88 : 1));
        v.rotation = Phaser.Math.Clamp(b.velocity.x / C.runSpeed, -1.5, 1.5) * 0.06;
      }
      v.setFlipX(this.facing < 0);
      const blink = this.iframes > 0 && Math.floor(this.iframes / 70) % 2 === 0;
      v.setAlpha(blink ? 0.35 : 1);

      this.kick *= Math.pow(0.0005, dt);
      const shoulderY = b.bottom - (this.crouching ? 42 : 66);
      // Painted guns are held from under the cloak: the arm is drawn behind the body so only the hand and
      // gun show past it. Aiming upward moves the gun forward so it clears the hood.
      const up = this.held ? Math.max(0, -this.aimY) : 0;
      const reach = this.held ? -6 + 40 * up : 4;
      this.gun.setPosition(
        b.center.x + this.facing * reach - this.aimX * this.kick * 10,
        shoulderY - this.aimY * this.kick * 10
      );
      if (this.held) {
        const g = this.held.guns[this.weapon.id];
        if (g) this.gun.setFrame(g.frame);
        this.gun.setDepth(9);
      }
      // Keep the grip (and the arm) on the body's side of the barrel whichever way it points.
      const flip = this.aimX !== 0 ? this.aimX < 0 : (this.aimY < 0 ? this.facing > 0 : this.facing < 0);
      this.gun.setRotation(this.aimAngle).setFlipY(this.held ? flip : (this.aimX < 0 || (this.aimX === 0 && this.facing < 0)));
      this.gun.setAlpha(v.alpha).setVisible(!gunHidden);
    }
  };
})();
