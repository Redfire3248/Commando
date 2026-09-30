// Enemy definitions. body: [width, height] of the hitbox. shards: [min, max] dropped on death.
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
};
