// Screen-space UI, drawn in its own scene on top of the game.
(function () {
  const ts = (size, color, weight = '700', family = 'Rajdhani') => ({
    fontFamily: `${family}, "Segoe UI", sans-serif`, fontSize: size + 'px', fontStyle: weight, color,
  });

  GH.HUDScene = class extends Phaser.Scene {
    constructor() { super('HUD'); }

    create() {
      const G = this.G = this.scene.get('Game');
      this.masks = [];
      this.last = {};

      this.hurtOv = this.add.image(0, 0, 'vignette_red').setOrigin(0).setDisplaySize(1920, 1080).setAlpha(0);

      this.shardIcon = this.add.image(62, 150, 'shard').setScale(1.3);
      this.shardText = this.add.text(88, 150, '0', ts(40, '#e6f8ff')).setOrigin(0, 0.5).setShadow(0, 2, '#000', 6);

      this.panel = this.add.graphics();
      this.wIcon = this.add.image(122, 990, 'w_pistol');
      this.wName = this.add.text(204, 958, '', ts(34, '#ffffff'));
      this.wSub = this.add.text(204, 1000, '', ts(20, '#9aa6b8', '600'));
      this.slots = this.add.container(0, 0);
      this.weaponUi = [this.panel, this.wIcon, this.wName, this.wSub, this.slots];
      this.weaponUi.forEach((o) => o.setVisible(GH.CONFIG.GUNS));

      this.toastA = this.add.text(960, 200, '', ts(58, '#f3eee2', '700', 'Cinzel')).setOrigin(0.5).setAlpha(0).setShadow(0, 4, '#000', 12);
      this.toastB = this.add.text(960, 262, '', ts(28, '#c5d1e0', '600')).setOrigin(0.5).setAlpha(0).setShadow(0, 2, '#000', 8);
      this.areaA = this.add.text(960, 420, '', ts(84, '#f3eee2', '700', 'Cinzel')).setOrigin(0.5).setAlpha(0).setShadow(0, 4, '#000', 16);
      this.areaB = this.add.text(960, 500, '', ts(30, '#9fb2c8', '600')).setOrigin(0.5).setAlpha(0);

      this.help = this.add.text(1884, 36, this.helpText(), Object.assign(ts(20, '#cfd8e6', '600'), {
        align: 'right', lineSpacing: 6, backgroundColor: 'rgba(5,7,13,0.7)', padding: { x: 18, y: 14 },
      })).setOrigin(1, 0);
      this.time.delayedCall(20000, () => this.tweens.add({ targets: this.help, alpha: 0, duration: 800 }));
      this.input.keyboard.on('keydown-H', () => {
        this.tweens.killTweensOf(this.help);
        this.help.setAlpha(this.help.alpha > 0.5 ? 0 : 1);
      });

      G.events.on('toast', this.toast, this);
      G.events.on('area', this.area, this);
      G.events.on('hurt', () => {
        this.hurtOv.setAlpha(0.9);
        this.tweens.add({ targets: this.hurtOv, alpha: 0, duration: 520 });
      });
    }

    helpText() {
      if (GH.Touch && GH.Touch.enabled) {
        return [
          'Left thumb: move',
          'Hold up or down while you SLASH to strike that way',
          'Slash down in the air to bounce off spikes and enemies',
          'Push up at a bench to rest + save',
          'Push down + JUMP to drop through ledges',
        ].join('\n');
      }
      const lines = [
        'MOVE     ← →    or    A D',
        'JUMP     Z    or    Space',
        'ATTACK     X    or    Left click',
        'DASH     C    or    Shift  /  Right click',
        'Hold ↑ or ↓ while you attack to strike up or down',
        'Attack downward in mid-air to bounce off spikes and enemies',
      ];
      if (GH.CONFIG.GUNS) lines.push('SHOOT   F        AIM IN PLACE   hold R        SWAP GUN   Q  E');
      lines.push('REST   ↑ at a bench        DROP   ↓ + Jump', 'Gamepad works too   ·   H hides this');
      return lines.join('\n');
    }

    toast(a, b, color = '#f3eee2') {
      const both = [this.toastA, this.toastB];
      this.tweens.killTweensOf(both);
      this.toastA.setText(a).setColor(color).setAlpha(0).setY(222);
      this.toastB.setText(b || '').setAlpha(0);
      this.tweens.add({ targets: both, alpha: 1, duration: 250 });
      this.tweens.add({ targets: this.toastA, y: 200, duration: 400, ease: 'Cubic.out' });
      this.tweens.add({ targets: both, alpha: 0, delay: 2800, duration: 600 });
    }

    area(name, sub) {
      const both = [this.areaA, this.areaB];
      this.areaA.setText(name.toUpperCase().split('').join(' '));
      this.areaB.setText((sub || '').toUpperCase().split('').join(' '));
      this.tweens.add({ targets: both, alpha: 1, duration: 1200, ease: 'Sine.inOut' });
      this.tweens.add({ targets: both, alpha: 0, delay: 3200, duration: 1200, ease: 'Sine.inOut' });
    }

    refreshWeapon(P) {
      const w = P.weapon, r = GH.RARITY[w.rarity], col = GH.hexToInt(r.color);
      this.wIcon.setTexture('w_' + w.id);
      this.wIcon.setScale(Math.min(1, 150 / this.wIcon.width, 84 / this.wIcon.height));
      this.wName.setText(w.name);
      const dmg = w.damage + (w.pellets > 1 ? '×' + w.pellets : '');
      this.wSub.setText(`${r.label.toUpperCase()}   ·   ${dmg} DMG   ·   ${(1000 / w.fireRate).toFixed(1)}/s`).setColor(r.color);
      this.panel.clear();
      this.panel.fillStyle(0x05070d, 0.62).fillRoundedRect(32, 932, 480, 116, 14);
      this.panel.lineStyle(2, col, 0.7).strokeRoundedRect(32, 932, 480, 116, 14);

      this.slots.removeAll(true);
      P.weapons.forEach((id, i) => {
        const x = 32 + i * 74, y = 878, g = this.add.graphics();
        g.fillStyle(0x05070d, 0.6).fillRoundedRect(x, y, 66, 44, 8);
        if (i === P.weaponIndex) g.lineStyle(2, 0xffffff, 0.85).strokeRoundedRect(x, y, 66, 44, 8);
        const icon = this.add.image(x + 33, y + 24, 'w_' + id).setAlpha(i === P.weaponIndex ? 1 : 0.6);
        icon.setScale(Math.min(54 / icon.width, 30 / icon.height));
        const num = this.add.text(x + 5, y + 1, String(i + 1), ts(14, '#8b96a8'));
        this.slots.add([g, icon, num]);
      });
    }

    update() {
      const P = this.G.player, L = this.last;
      if (!P) return;

      if (P.maxHp !== L.max) {
        this.masks.forEach((m) => m.destroy());
        this.masks = [];
        for (let i = 0; i < P.maxHp; i++) this.masks.push(this.add.image(60 + i * 58, 72, 'mask'));
        L.max = P.maxHp; L.hp = undefined;
      }
      if (P.hp !== L.hp) {
        this.masks.forEach((m, i) => {
          const full = i < P.hp;
          m.setTexture(full ? 'mask' : 'mask_empty');
          if (L.hp !== undefined && full !== (i < L.hp)) {
            this.tweens.add({ targets: m, scale: { from: 1.5, to: 1 }, duration: 260, ease: 'Back.out' });
          }
        });
        L.hp = P.hp;
      }
      if (P.shards !== L.shards) {
        if (L.shards !== undefined) this.tweens.add({ targets: this.shardIcon, scale: { from: 1.8, to: 1.3 }, duration: 180 });
        this.shardText.setText(String(P.shards));
        L.shards = P.shards;
      }
      const key = P.weapons.join(',') + '|' + P.weaponIndex;
      if (key !== L.w) { this.refreshWeapon(P); L.w = key; }
    }
  };
})();
