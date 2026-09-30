// Global namespace. Everything hangs off GH so the game runs from plain <script> tags (no build step).
window.GH = window.GH || {};
GH.DATA = GH.DATA || {};

GH.CONFIG = {
  WIDTH: 1920,
  HEIGHT: 1080,
  TILE: 64,          // in-game tile size (art is authored at 256 and drawn down)
  GRAVITY: 3000,
  // Sword-only for now (Hollow Knight style). Set to true to bring back guns, weapon pickups and the weapon HUD.
  GUNS: false,
  PLAYER: {
    // fast and snappy: near-instant run speed, tight air control, short sharp dash
    runSpeed: 660, accel: 9000, airAccel: 7000, friction: 10000,
    jumpVel: 1150, jumpCut: 0.4, maxFall: 1700,
    coyoteMs: 100, bufferMs: 130,
    dashSpeed: 1600, dashMs: 150, dashCooldownMs: 350,
    wallSlide: 280, wallJumpX: 640, wallJumpY: 1060,
    maxHp: 5, iframesMs: 1100, knockX: 560, knockY: 640,
    slideMs: 380,            // press DOWN while running to slide under things
    slashMs: 240, slashCooldownMs: 280, slashDamage: 18, pogoVel: 1150,
  },
};

GH.RARITY = {
  common:    { label: 'Common',    color: '#b8c0cc' },
  rare:      { label: 'Rare',      color: '#4fa3ff' },
  epic:      { label: 'Epic',      color: '#b56cff' },
  legendary: { label: 'Legendary', color: '#ffb347' },
};

GH.hexToInt = (hex) => parseInt(hex.slice(1), 16);
