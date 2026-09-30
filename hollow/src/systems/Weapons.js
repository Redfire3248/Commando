// Bullet pools for the player and for enemies. Driven entirely by data/weapons.js.
GH.Weapons = class {
  constructor(scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({ allowGravity: false, maxSize: 500 });
    this.enemyBullets = scene.physics.add.group({ allowGravity: false, maxSize: 200 });
    this.artImages = (GH.DATA.art && GH.DATA.art.images) || {};
    this.artScale = (GH.DATA.art && GH.DATA.art.scale) || {};     // full-resolution art -> size drawn in game
  }

  fire(w, x, y, angle) {
    const n = w.pellets || 1;
    const spread = Phaser.Math.DegToRad(w.spread || 0);
    const jit = Phaser.Math.DegToRad(w.jitter || 0);
    for (let i = 0; i < n; i++) {
      const off = n > 1 ? -spread / 2 + spread * i / (n - 1) : 0;
      this.spawn(w, x, y, angle + off + (Math.random() * 2 - 1) * jit);
    }
    if (!w.noFlash) this.flash(x, y, angle, w.tint);
    if (w.shake) this.scene.cameras.main.shake(80, w.shake);
  }

  spawn(w, x, y, a) {
    const b = this.bullets.get(x, y, w.texture);
    if (!b) return;
    // Painted bullets have dark parts and their own glow, so they draw normally; placeholders are pure glow.
    const sc = this.artScale[w.texture] || 1;
    b.setTexture(w.texture).setActive(true).setVisible(true).setRotation(a).setScale(sc).setAlpha(1)
      .setDepth(9).setBlendMode(this.artImages[w.texture] ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);
    b.base = sc;
    b.body.enable = true;
    b.body.allowGravity = false;
    b.body.setSize(w.hit / sc, w.hit / sc, true);      // Arcade scales the body with the sprite; undo that
    b.body.reset(x, y);
    const sp = w.speed * (1 + (Math.random() * 2 - 1) * (w.speedVar || 0));
    b.body.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp);
    b.w = w; b.age = 0; b.pierce = w.pierce || 0; b.hitSet = new Set(); b.spd = sp; b.ang = a;
  }

  enemyFire(x, y, a, speed) {
    const b = this.enemyBullets.get(x, y, 'eb');
    if (!b) return;
    const sc = this.artScale.eb || 1;
    b.setTexture('eb').setActive(true).setVisible(true).setScale(sc).setDepth(9)
      .setBlendMode(this.artImages.eb ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD);
    b.body.enable = true;
    b.body.allowGravity = false;
    b.body.setSize(18 / sc, 18 / sc, true);
    b.body.reset(x, y);
    b.body.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    b.age = 0; b.life = 4;
  }

  flash(x, y, a, tint) {
    const f = this.scene.add.image(x, y, 'flash').setDepth(12).setBlendMode(Phaser.BlendModes.ADD).setRotation(a);
    const sc = this.artScale.flash;
    if (sc) f.setOrigin(0, 0.5).setScale(sc * 0.6); else f.setScale(0.7).setTint(tint);
    this.scene.tweens.add({ targets: f, alpha: 0, scale: sc ? sc * 0.9 : 1.15, duration: 70, onComplete: () => f.destroy() });
  }

  kill(b) {
    b.setActive(false).setVisible(false);
    b.body.stop();
    b.body.enable = false;
  }

  clear() {
    this.bullets.children.iterate((b) => { if (b && b.active) this.kill(b); });
    this.enemyBullets.children.iterate((b) => { if (b && b.active) this.kill(b); });
  }

  update(dt) {
    const enemies = this.scene.enemies.getChildren();
    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      const w = b.w;
      b.age += dt;
      if (b.age >= w.life) { this.kill(b); return; }
      if (w.grow) b.setScale(b.base * (1 + (w.grow - 1) * b.age / w.life));
      if (w.fade) b.setAlpha(1 - b.age / w.life);
      if (w.homing) {
        let best = null, bd = 720 * 720;
        for (const e of enemies) {
          if (!e.active) continue;
          const dx = e.body.center.x - b.x, dy = e.body.center.y - b.y, d = dx * dx + dy * dy;
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const target = Math.atan2(best.body.center.y - b.y, best.body.center.x - b.x);
          b.ang = Phaser.Math.Angle.RotateTo(b.ang, target, w.homing * dt);
        }
        b.body.setVelocity(Math.cos(b.ang) * b.spd, Math.sin(b.ang) * b.spd);
        b.setRotation(b.ang);
      }
    });
    this.enemyBullets.children.iterate((b) => {
      if (!b || !b.active) return;
      b.age += dt;
      b.rotation += dt * 6;
      if (b.age > b.life) this.kill(b);
    });
  }
};
