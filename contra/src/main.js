window.addEventListener('load', () => {
  CG.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b1410',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: CG.CONFIG.W, height: CG.CONFIG.H },
    // one physics step per drawn frame (a fixed step rate that doesn't match the screen makes movement stutter)
    physics: { default: 'arcade', arcade: { gravity: { y: CG.CONFIG.GRAVITY }, fixedStep: false, debug: false } },
    input: { gamepad: true, activePointers: 3 },
    render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
    scene: [CG.BootScene, CG.BackdropScene, CG.GameScene],
  });
  CG.Net.init();
});
