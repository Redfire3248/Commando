// COMMANDO — the run-and-gun game. Everything hangs off the global CG (plain <script> tags, no build step).
window.CG = window.CG || {};
CG.DATA = CG.DATA || {};

CG.CONFIG = {
  W: 1920, H: 1080, TILE: 64,
  MAX_PLAYERS: 5,
  // true = the players use the painted commandos from assets/commandos.png (sliced by tools/build_art.py),
  // along with that sheet's bullet, muzzle flash, badges and capsule. Players 3 to 5 are the blue commando
  // recoloured green, yellow and purple. false = everything uses the built-in pixel art.
  SHEET_ART: true,
  GRAVITY: 2600,
  PLAYER: {
    run: 400, jump: 1080,
    lives: 3,
    fireMs: 150, rapidMs: 80, bulletSpeed: 1400, maxBullets: 6,
    respawnInvMs: 2200, barrierMs: 10000,
  },
  ENEMY_BULLET_SPEED: 430,
  SCORE: { runner: 100, rifle: 300, turret: 500, flyer: 200, grenadier: 300, drone: 300, cannon: 1000, core: 5000, tank: 6000, gunship: 7000, pickup: 200 },
};
