// One class for all enemies; behaviour comes from the `ai` field in data/enemies.js.
GH.Enemy = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type, x, bottom) {
    const d = GH.DATA.enemies[type];
    super(scene, x, bottom, d.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(8);

    this.type = type; this.d = d; this.hp = d.hp;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.cd = 600 + Math.random() * 800;
    this.hurtT = 0; this.knockT = 0; this.t = Math.random() * 10;
    this.homeY = bottom;

    const [bw, bh] = d.body;
    if (d.fly) {
      this.body.setSize(bw, bh, true);
      this.body.allowGravity = false;
      this.body.moves = false;
    } else {
      this.body.setSize(bw, bh, false);
      this.body.setOffset((this.width - bw) / 2, this.height - bh);
      this.body.setCollideWorldBounds(true);
    }
  }

  tick(dt, P) {
    const b = this.body, d = this.d, sc = this.scene, ms = dt * 1000;
    this.cd -= ms; this.hurtT -= ms; this.knockT -= ms; this.t += dt;

    if (this.hurtT <= 0) {
      if (d.ai === 'turret' && this.cd < 320) this.setTint(0xff9cf0);   // about to fire
      else this.clearTint();
    }
    if (this.knockT > 0) return;

    const cx = b.center.x, cy = b.center.y;
    const dx = P.body.center.x - cx, dy = P.body.center.y - cy, dist = Math.hypot(dx, dy);
    const seen = !P.dead && dist < (d.sight || 0);

    if (d.ai === 'patrol') {
      if (b.blocked.left) this.dir = 1;
      else if (b.blocked.right) this.dir = -1;
      else if (b.blocked.down) {
        // turn around at ledges and in front of spikes
        const ahead = cx + this.dir * (b.halfWidth + 8);
        if (!sc.isGround(ahead, b.bottom + 8) || sc.tileAt(ahead, b.bottom - 8) === '^') this.dir *= -1;
      }
      b.velocity.x = this.dir * d.speed;
      this.setFlipX(this.dir < 0);
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
    } else if (d.ai === 'turret') {
      this.y = this.homeY + Math.sin(this.t * 2) * 12;
      this.setFlipX(dx < 0);
      if (!seen) this.cd = Math.max(this.cd, 500);
      else if (this.cd <= 0) {
        this.cd = d.fireRate;
        const a = Math.atan2(dy, dx);
        sc.weapons.enemyFire(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, a, d.bulletSpeed);
      }
    }
  }

  damage(n, kx = 0, knock = 60) {
    if (!this.active) return;
    this.hp -= n;
    this.setTintFill(0xffffff);
    this.hurtT = 80;
    if (!this.d.fly && kx && knock) { this.body.velocity.x = kx * knock; this.knockT = 140; }
    if (this.hp <= 0) this.scene.killEnemy(this);
  }
};
