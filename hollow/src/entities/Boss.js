// The Hollow Warden: the first boss. Sleeps until the arena locks, then cycles through
//   slam   — lifts the lantern-mace, smashes the ground in front and sends a shockwave rolling along the floor
//   leap   — jumps at you and lands with a shockwave going both ways
//   charge — runs at you and staggers when it hits the wall (free hits)
// Below half health it roars, moves faster and its slams send waves both ways.
// It lives in the scene's enemies group, so slashes, contact damage and terrain work like any enemy.
GH.Boss = class extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, bottom) {
    const art = GH.DATA.art && GH.DATA.art.boss && scene.textures.exists('boss_warden') ? GH.DATA.art.boss : null;
    super(scene, x, bottom, art ? 'boss_warden' : 'e_hopper', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.art = art;
    const sc = art ? art.scale : 3.2;
    this.setOrigin(0.5, 1).setDepth(8).setScale(sc);
    this.d = { name: 'The Hollow Warden', contact: 1, shards: [0, 0] };
    this.maxHp = this.hp = 540;
    this.facing = -1;
    this.state = 'sleep'; this.stT = 0; this.hurtT = 0;
    this.phase2 = false;
    this.awake = false;
    const BW = 150, BH = 270;
    this.body.setSize(BW / sc, BH / sc, false);
    this.body.setOffset((this.width - BW / sc) / 2, this.height - BH / sc);
    this.body.setCollideWorldBounds(true);
    this.anim('idle');
  }

  anim(name) {
    if (this.art && this.art.anims[name]) this.play('boss_' + name, true);
  }

  face(dir) {
    this.facing = dir || this.facing;
    this.setFlipX(this.facing > 0);              // the art faces left
  }

  go(state, ms, anim) {
    this.state = state; this.stT = ms; this.hit = false;
    if (anim) this.anim(anim);
  }

  wake() {
    if (this.awake) return;
    this.awake = true;
    this.go('roar', 1300, 'roar');
    this.scene.cameras.main.shake(900, 0.006);
  }

  tick(dt, P) {
    if (this.state === 'dead') return;
    const b = this.body, ms = dt * 1000, sc = this.scene;
    this.stT -= ms; this.hurtT -= ms;
    if (this.hurtT <= 0) this.clearTint();
    if (this.state === 'sleep') { b.velocity.x = 0; return; }

    const dx = P.body.center.x - b.center.x, adx = Math.abs(dx);
    const fast = this.phase2 ? 1.3 : 1;

    switch (this.state) {
      case 'roar':
        b.velocity.x = 0;
        if (this.stT <= 0) this.go('idle', 400, 'idle');
        break;

      case 'idle':
        b.velocity.x = 0;
        this.face(Math.sign(dx));
        if (this.stT > 0 || P.dead) break;
        {
          const r = Math.random();
          if (adx < 330) this.go('lift', 560 / fast, 'lift');
          else if (r < 0.35) this.go('walk', 1500, 'walk');
          else if (r < 0.7) this.go('crouch', 380 / fast, 'crouch');
          else this.go('chargeWind', 420 / fast, 'charge');
        }
        break;

      case 'walk':
        this.face(Math.sign(dx));
        b.velocity.x = this.facing * 190 * fast;
        if (adx < 300) this.go('lift', 560 / fast, 'lift');
        else if (this.stT <= 0) this.go('idle', 300, 'idle');
        break;

      // ---- slam
      case 'lift':
        b.velocity.x = 0;
        if (this.stT <= 0) {
          this.go('smash', 160, 'smash');
          this.strike(P, this.facing, 270, 230);
          sc.cameras.main.shake(220, 0.012);
          const fx = b.center.x + this.facing * 200;
          sc.fx.dust.explode(18, fx, b.bottom);
          sc.fx.sparks.explode(12, fx, b.bottom - 10);
          sc.spawnWave(fx, b.bottom, this.facing);
          if (this.phase2) sc.spawnWave(b.center.x - this.facing * 80, b.bottom, -this.facing);
        }
        break;
      case 'smash':
        if (this.stT <= 0) this.go('buried', 520 / fast, 'buried');
        break;
      case 'buried':
        if (this.stT <= 0) this.go('pull', 420 / fast, 'pull');
        break;
      case 'pull':
        if (this.stT <= 0) this.go('idle', 650 / fast, 'idle');
        break;

      // ---- leap
      case 'crouch':
        b.velocity.x = 0;
        this.face(Math.sign(dx));
        if (this.stT <= 0) {
          this.go('air', 0, 'air');
          b.setVelocity(Phaser.Math.Clamp(dx / 1.0, -950, 950), -1500);
        }
        break;
      case 'air':
        if (b.velocity.y > 0) this.anim('fall');
        if (b.blocked.down && this.stT < -150) {
          b.velocity.x = 0;
          this.go('land', 420 / fast, 'land');
          sc.cameras.main.shake(260, 0.014);
          sc.fx.dust.explode(24, b.center.x, b.bottom);
          sc.spawnWave(b.center.x + 90, b.bottom, 1);
          sc.spawnWave(b.center.x - 90, b.bottom, -1);
        }
        break;
      case 'land':
        if (this.stT <= 0) this.go('idle', 600 / fast, 'idle');
        break;

      // ---- charge
      case 'chargeWind':
        b.velocity.x = 0;
        this.face(Math.sign(dx));
        if (Math.floor(this.stT / 70) % 2) this.setTint(0xffa060); else this.clearTint();
        if (this.stT <= 0) { this.clearTint(); this.go('charge', 1700, 'charge'); }
        break;
      case 'charge':
        b.velocity.x = this.facing * 820 * fast;
        if ((this.facing < 0 && b.blocked.left) || (this.facing > 0 && b.blocked.right) || this.stT <= 0) {
          b.velocity.x = -this.facing * 160;
          this.go('stagger', 1100, 'stagger');
          sc.cameras.main.shake(300, 0.016);
          sc.fx.sparks.explode(16, b.center.x + this.facing * 80, b.center.y);
        }
        break;
      case 'stagger':
        b.velocity.x *= 0.9;
        if (this.stT <= 0) this.go('idle', 450, 'idle');
        break;
    }
  }

  // damage the player if they stand in the zone in front of the boss
  strike(P, dir, w, h) {
    const b = this.body, Rect = Phaser.Geom.Rectangle;
    const x = b.center.x + dir * 30;
    const zone = new Rect(dir > 0 ? x : x - w, b.bottom - h, w, h);
    const pb = P.body;
    if (Phaser.Geom.Intersects.RectangleToRectangle(zone, new Rect(pb.position.x, pb.position.y, pb.width, pb.height))) {
      P.hurt(1, b.center.x);
    }
  }

  damage(n) {
    if (!this.active || this.state === 'dead' || !this.awake) return;
    this.hp -= n;
    this.setTintFill(0xffffff);
    this.hurtT = 70;
    if (!this.phase2 && this.hp <= this.maxHp / 2) {
      this.phase2 = true;
      if (this.state === 'idle' || this.state === 'walk') this.go('roar', 1000, 'roar');
      this.scene.cameras.main.shake(700, 0.008);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.state = 'dead';
    this.hp = 0;
    this.body.velocity.x = 0;
    this.clearTint();
    this.anim('death');
    const sc = this.scene;
    sc.cameras.main.shake(900, 0.014);
    sc.hitstop(160);
    this.once('animationcomplete', () => this.anim('cage'));
    // stop hurting the player and let them walk through the remains
    sc.time.delayedCall(0, () => {
      if (!this.body) return;
      this.body.stop();
      this.body.moves = false;
      this.body.checkCollision.none = true;
    });
    sc.bossDefeated(this);
  }
};
