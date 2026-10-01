// One class for all enemies; behaviour comes from the `ai` field in data/enemies.js.
// With enemies_v2.png sliced (GH.DATA.art.enemies) each type plays its own animations; without it the
// code-drawn placeholder texture in `texture` is used.
GH.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type, x, bottom) {
    const d = GH.DATA.enemies[type];
    const all = (GH.DATA.art && GH.DATA.art.enemies) || {};
    const art = all[type] && scene.textures.exists(all[type].key) ? all[type] : null;
    super(scene, x, bottom, art ? art.key : d.texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(8);

    this.type = type; this.d = d; this.hp = d.hp; this.art = art;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.cd = 600 + Math.random() * 800;
    this.hurtT = 0; this.knockT = 0; this.t = Math.random() * 10;
    this.homeX = x; this.homeY = bottom;
    this.state = 'move'; this.stT = 0;

    // Painted frames are drawn scaled, and Arcade scales the hitbox with the sprite, so sizes are divided by it.
    const sc = art ? art.scale : 1;
    this.setScale(sc);
    const [bw, bh] = d.body;
    if (d.fly) {
      this.body.setSize(bw / sc, bh / sc, true);
      this.body.allowGravity = false;
      this.body.moves = d.ai !== 'turret';           // the Watcher bobs in place; flyers that chase really move
      if (this.body.moves) this.body.setCollideWorldBounds(true);
    } else {
      this.body.setSize(bw / sc, bh / sc, false);
      this.body.setOffset((this.width - bw / sc) / 2, this.height - bh / sc);
      this.body.setCollideWorldBounds(true);
    }
    this.anim(d.fly ? 'idle' : (art && art.anims.walk ? 'walk' : 'idle'));
  }

  anim(name) {
    if (!this.art || !this.art.anims[name]) return;
    this.play(this.type + '_' + name, true);
  }

  tick(dt, P) {
    const b = this.body, d = this.d, sc = this.scene, ms = dt * 1000;
    this.cd -= ms; this.hurtT -= ms; this.knockT -= ms; this.stT -= ms; this.t += dt;

    if (this.hurtT <= 0) {
      if (!this.art && d.ai === 'turret' && this.cd < 320) this.setTint(0xff9cf0);   // about to fire
      else this.clearTint();
    } else if (this.hurtT < 100) {
      this.clearTint();
    }
    if (this.hurtT > 0 && this.art) this.anim('hurt');
    if (this.knockT > 0) return;

    const cx = b.center.x, cy = b.center.y;
    const dx = P.body.center.x - cx, dy = P.body.center.y - cy, dist = Math.hypot(dx, dy);
    const seen = !P.dead && dist < (d.sight || 0);
    const hurt = this.hurtT > 0 && this.art;

    if (d.ai === 'patrol') {
      this.patrol(b, d.speed);
      if (!hurt) this.anim('walk');
    } else if (d.ai === 'hop') {
      if (b.blocked.down) {
        if (this.cd <= 0 && seen) {
          this.dir = Math.sign(dx) || 1;
          b.setVelocity(this.dir * Math.min(d.speed, Math.abs(dx) * 1.3 + 80), -d.jump);
          this.cd = d.cooldown;
        } else {
          b.velocity.x *= 0.8;
        }
      }
      this.setFlipX(dx < 0);
      if (!hurt) {
        if (!b.blocked.down) this.anim('leap');
        else if (this.cd > d.cooldown - 220) this.anim('land');
        else if (seen && this.cd < 260) this.anim('crouch');
        else this.anim('idle');
      }
    } else if (d.ai === 'turret') {
      this.y = this.homeY + Math.sin(this.t * 2) * 12;
      this.setFlipX(dx < 0);
      if (!seen) this.cd = Math.max(this.cd, 500);
      else if (this.cd <= 0) {
        this.cd = d.fireRate;
        const a = Math.atan2(dy, dx);
        sc.weapons.enemyFire(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, a, d.bulletSpeed);
      }
      if (!hurt) this.anim(seen && this.cd < 420 ? 'charge' : 'idle');
    } else if (d.ai === 'brute') {
      this.brute(b, d, dx, dy, seen, hurt, P);
    } else if (d.ai === 'fly') {
      this.fly(b, d, dx, dy, dist, seen, hurt);
    }
  }

  // walk back and forth, turning at walls, ledges and spikes
  patrol(b, speed) {
    const sc = this.scene, cx = b.center.x;
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;
    else if (b.blocked.down) {
      const ahead = cx + this.dir * (b.halfWidth + 8);
      if (!sc.isGround(ahead, b.bottom + 8) || sc.tileAt(ahead, b.bottom - 8) === '^') this.dir *= -1;
    }
    b.velocity.x = this.dir * speed;
    this.setFlipX(this.dir < 0);
  }

  // Carapace Brute: plods toward you, raises its club, smashes the ground in front of it.
  brute(b, d, dx, dy, seen, hurt, P) {
    if (this.state === 'windup') {
      b.velocity.x = 0;
      this.anim('windup');
      if (this.stT <= 0) {
        this.state = 'smash'; this.stT = 420;
        this.anim('smash');
        const f = this.dir, x = b.center.x + f * 40, Rect = Phaser.Geom.Rectangle;
        const zone = new Rect(f > 0 ? x : x - 210, b.bottom - 170, 210, 170);
        const pb = P.body;
        if (Phaser.Geom.Intersects.RectangleToRectangle(zone, new Rect(pb.position.x, pb.position.y, pb.width, pb.height))) {
          P.hurt(1, b.center.x);
        }
        const sc = this.scene;
        sc.cameras.main.shake(140, 0.006);
        sc.fx.dust.explode(14, x + f * 110, b.bottom);
      }
      return;
    }
    if (this.state === 'smash') {
      b.velocity.x = 0;
      if (this.stT <= 0) { this.state = 'move'; this.cd = d.cooldown; }
      return;
    }
    if (seen && Math.abs(dy) < 200) {
      this.dir = Math.sign(dx) || this.dir;
      this.setFlipX(this.dir < 0);
      if (Math.abs(dx) < d.reach && this.cd <= 0 && b.blocked.down) {
        this.state = 'windup'; this.stT = d.windup;
        return;
      }
      // stop at ledges and spikes instead of walking off them
      const ahead = b.center.x + this.dir * (b.halfWidth + 8), sc = this.scene;
      const safe = sc.isGround(ahead, b.bottom + 8) && sc.tileAt(ahead, b.bottom - 8) !== '^';
      b.velocity.x = safe && Math.abs(dx) > 60 ? this.dir * d.speed * 1.4 : 0;
    } else {
      this.patrol(b, d.speed);
    }
    if (!hurt) this.anim('walk');
  }

  // Vengefly: drifts near home, chases you when it sees you, and darts at you from close up.
  fly(b, d, dx, dy, dist, seen, hurt) {
    const toward = (sp, k) => {
      const len = Math.max(1, Math.hypot(dx, dy));
      b.velocity.x += (dx / len * sp - b.velocity.x) * k;
      b.velocity.y += (dy / len * sp - b.velocity.y) * k;
    };
    if (this.state === 'dive') {
      if (this.stT <= 0) { this.state = 'move'; this.cd = d.cooldown; }
    } else if (seen) {
      toward(d.speed, 0.06);
      if (dist < d.diveRange && this.cd <= 0) {
        this.state = 'dive'; this.stT = 420;
        const len = Math.max(1, dist);
        b.setVelocity(dx / len * d.diveSpeed, dy / len * d.diveSpeed);
      }
    } else {
      // drift back home in a lazy figure-of-eight
      const hx = this.homeX + Math.sin(this.t * 0.9) * 90 - b.center.x;
      const hy = this.homeY - 60 + Math.sin(this.t * 1.8) * 30 - b.center.y;
      b.velocity.x += (hx * 1.5 - b.velocity.x) * 0.05;
      b.velocity.y += (hy * 1.5 - b.velocity.y) * 0.05;
    }
    this.setFlipX(b.velocity.x < 0);
    if (!hurt) this.anim(this.state === 'dive' ? 'dive' : 'idle');
  }

  damage(n, kx = 0, knock = 60) {
    if (!this.active) return;
    this.hp -= n;
    this.setTintFill(0xffffff);
    this.hurtT = this.art ? 180 : 80;
    if (this.d.heavy) knock *= 0.15;
    if (kx && knock) {
      if (!this.d.fly) { this.body.velocity.x = kx * knock; this.knockT = 140; }
      else if (this.body.moves) { this.body.velocity.x = kx * knock * 0.9; this.state = 'move'; this.knockT = 120; }
    }
    if (this.hp <= 0) this.scene.killEnemy(this);
  }
};
