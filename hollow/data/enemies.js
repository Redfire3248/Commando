// Enemy definitions. body: [width, height] of the hitbox. shards: [min, max] dropped on death.
// texture is the code-drawn placeholder used when enemies_v2.png has not been sliced.
GH.DATA.enemies = {
  crawler: {
    name: 'Husk Crawler', desc: 'Patrols back and forth. Harmless until you touch it.',
    texture: 'e_crawler', ai: 'patrol', hp: 34, contact: 1, speed: 110, body: [100, 70], shards: [2, 4],
  },
  hopper: {
    name: 'Mire Hopper', desc: 'Leaps at anything that comes close.',
    texture: 'e_hopper', ai: 'hop', hp: 44, contact: 1, speed: 340, jump: 950, cooldown: 1300, sight: 760,
    body: [64, 72], shards: [3, 5],
  },
  turret: {
    name: 'Watcher', desc: 'A floating eye that spits cursed orbs.',
    texture: 'e_turret', ai: 'turret', fly: true, hp: 70, contact: 1, fireRate: 1700, bulletSpeed: 520, sight: 980,
    body: [62, 62], shards: [5, 8],
  },
  brute: {
    name: 'Carapace Brute', desc: 'Slow and heavy. Raises its club, then smashes the ground in front of it.',
    texture: 'e_hopper', ai: 'brute', heavy: true, hp: 150, contact: 1, speed: 80, sight: 900, reach: 230,
    windup: 520, cooldown: 1500, body: [110, 190], shards: [10, 14],
  },
  vengefly: {
    name: 'Vengefly', desc: 'Chases you through the air and darts in with its stinger.',
    texture: 'e_turret', ai: 'fly', fly: true, hp: 36, contact: 1, speed: 260, sight: 820,
    diveRange: 380, diveSpeed: 680, cooldown: 1700, body: [64, 58], shards: [3, 5],
  },
};
