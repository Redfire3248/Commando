window.addEventListener('load', () => {
  GH.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#07080d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GH.CONFIG.WIDTH,
      height: GH.CONFIG.HEIGHT,
    },
    physics: {
      default: 'arcade',
      // One physics step per drawn frame, sized to that frame. A fixed step rate that doesn't match the
      // screen's refresh rate makes movement stutter (some frames move twice, some not at all).
      arcade: { gravity: { y: GH.CONFIG.GRAVITY }, fixedStep: false, debug: false },
    },
    input: { gamepad: true, activePointers: 3 },
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    scene: [GH.BootScene, GH.GameScene, GH.HUDScene],
  });
});
