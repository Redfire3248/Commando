// Weapon definitions. The game, the HUD and (later) the admin panel all read this one list,
// so adding an entry here is all it takes to add a weapon.
//
// fireRate: ms between shots      damage: per bullet       speed: px/s       life: seconds
// pellets/spread: bullets per shot and the fan angle in degrees      jitter: random aim error (deg)
// pierce: extra enemies a bullet passes through      homing: turn rate (rad/s)      grow: end scale
// hit: hitbox size (px)      recoil: push-back on the player      shake: camera shake strength
GH.DATA.weapons = [
  { id: 'pistol',  name: 'Rust Pistol',   rarity: 'common',    color: '#ffd27a',
    desc: 'Reliable sidearm. Never runs dry.',
    fireRate: 170, damage: 8, speed: 1500, life: 0.9, texture: 'b_pistol', hit: 14 },

  { id: 'spread',  name: 'Spread Gun',    rarity: 'rare',      color: '#ff5a5a',
    desc: 'A five-way fan of fire. The classic.',
    fireRate: 260, damage: 6, speed: 1250, life: 0.7, pellets: 5, spread: 40, texture: 'b_spread', hit: 18 },

  { id: 'laser',   name: 'Lumen Laser',   rarity: 'rare',      color: '#5ae8ff',
    desc: 'A piercing bolt that cuts through three foes.',
    fireRate: 320, damage: 22, speed: 2600, life: 0.6, pierce: 3, texture: 'b_laser', hit: 14 },

  { id: 'flame',   name: 'Emberthrower',  rarity: 'epic',      color: '#ff9a3c',
    desc: 'Short range. Burns through everything in its path.',
    fireRate: 45, damage: 3, speed: 760, speedVar: 0.25, life: 0.45, jitter: 8, pierce: 99,
    grow: 2.6, fade: true, noFlash: true, texture: 'b_flame', hit: 26, knock: 0 },

  { id: 'homing',  name: 'Seeker Swarm',  rarity: 'epic',      color: '#b67cff',
    desc: 'Twin missiles that hunt the nearest enemy.',
    fireRate: 380, damage: 10, speed: 780, life: 1.8, pellets: 2, spread: 30, homing: 6.5,
    texture: 'b_homing', hit: 16 },

  { id: 'shotgun', name: 'Grave Scatter', rarity: 'rare',      color: '#e8e8e8',
    desc: 'Devastating up close. Kicks like a mule.',
    fireRate: 620, damage: 7, speed: 1500, speedVar: 0.3, life: 0.32, pellets: 8, spread: 26, jitter: 4,
    texture: 'b_shotgun', hit: 12, recoil: 420, shake: 0.004, knock: 160 },

  { id: 'rail',    name: 'Void Rail',     rarity: 'legendary', color: '#e0b3ff',
    desc: 'One slow, colossal shot that pierces all.',
    fireRate: 900, damage: 60, speed: 3600, life: 0.5, pierce: 99, texture: 'b_rail', hit: 16,
    recoil: 260, shake: 0.006, knock: 260 },
];

GH.DATA.weaponById = {};
GH.DATA.weapons.forEach((w) => { w.tint = GH.hexToInt(w.color); GH.DATA.weaponById[w.id] = w; });
