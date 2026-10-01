GH.BootScene = class extends Phaser.Scene {
  constructor() { super('Boot'); }

  // Real art built by tools/build_art.py. Anything missing falls back to the code-drawn placeholder.
  preload() {
    const art = GH.DATA.art;
    if (!art) return;
    for (const k in art.images) this.load.image(k, art.images[k]);
    for (const k in art.sheets) {
      const s = art.sheets[k];
      this.load.spritesheet(k, s.path, { frameWidth: s.fw, frameHeight: s.fh });
    }
  }

  create() {
    GH.Art.makeAll(this);
    for (const [key, fps] of [['fx_impact', 30], ['fx_explosion', 20]]) {
      if (!this.textures.exists(key)) continue;
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }), frameRate: fps });
    }
    // enemies_v2 / boss_warden_v2: one animation per entry in the manifest, keyed <type>_<anim> and boss_<anim>
    const art = GH.DATA.art || {};
    const make = (key, tex, [start, end, fps], loop) => this.anims.create({
      key, frames: this.anims.generateFrameNumbers(tex, { start, end }), frameRate: fps, repeat: loop ? -1 : 0,
    });
    for (const type in art.enemies || {}) {
      const e = art.enemies[type];
      if (!this.textures.exists(e.key)) continue;
      for (const n in e.anims) make(type + '_' + n, e.key, e.anims[n], ['walk', 'idle', 'dive', 'leap'].includes(n));
    }
    if (art.boss && this.textures.exists('boss_warden')) {
      for (const n in art.boss.anims) make('boss_' + n, 'boss_warden', art.boss.anims[n], ['idle', 'walk', 'air', 'charge', 'cage'].includes(n));
    }
    if (this.textures.exists('boss_wave')) make('boss_wave', 'boss_wave', [0, 2, 12], true);
    // Wait (briefly) for the web fonts so the HUD doesn't render in a fallback face.
    const fonts = document.fonts
      ? Promise.all([document.fonts.load('700 40px Cinzel'), document.fonts.load('700 24px Rajdhani')])
      : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 1500));
    Promise.race([fonts, timeout]).catch(() => {}).then(() => this.scene.start('Game'));
  }
};
