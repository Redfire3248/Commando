// The stage, in TILE units (1 tile = 64px). The camera only ever scrolls to the right.
//   ground:  [from, to)            columns of solid ground; everything between two pieces is a water pit
//   ledges:  [column, row, width]  one-way ledges (jump up through them, Down + Jump drops through)
//   enemies: [type, column, row]   row = the surface they stand on (14 = ground, 11 / 8 = ledges)
//   capsules: [column, power-up]   flying pods; shoot one to drop rapid / barrier / life
CG.DATA.level = {
  w: 230, h: 17,
  groundRow: 14,
  ground: [[0, 30], [34, 58], [63, 90], [96, 120], [125, 150], [156, 230]],
  ledges: [
    [8, 11, 6], [16, 8, 6], [25, 11, 7], [36, 11, 6], [46, 8, 6], [54, 11, 10],
    [66, 11, 6], [76, 8, 6], [86, 11, 11], [100, 11, 6], [110, 8, 6], [117, 11, 9],
    [130, 11, 6], [138, 8, 6], [146, 11, 11], [160, 11, 6], [172, 8, 6], [181, 11, 6], [193, 11, 6],
  ],
  enemies: [
    ['runner', 20], ['runner', 26], ['rifle', 27, 11], ['runner', 36], ['rifle', 38, 11], ['runner', 40],
    ['turret', 42], ['runner', 44], ['rifle', 48, 8], ['runner', 52], ['runner', 64], ['rifle', 67, 11],
    ['runner', 68], ['runner', 72], ['rifle', 78, 8], ['runner', 80], ['turret', 84], ['runner', 88],
    ['runner', 98], ['rifle', 102, 11], ['runner', 104], ['turret', 108], ['runner', 112], ['rifle', 112, 8],
    ['runner', 118], ['runner', 128], ['rifle', 132, 11], ['runner', 134], ['turret', 136], ['rifle', 140, 8],
    ['runner', 142], ['runner', 148], ['runner', 158], ['rifle', 162, 11], ['runner', 164], ['turret', 166],
    ['runner', 170], ['rifle', 174, 8], ['runner', 178], ['rifle', 183, 11], ['runner', 186], ['turret', 190],
    ['runner', 194], ['rifle', 195, 11], ['runner', 200], ['runner', 206],
  ],
  capsules: [[30, 'rapid'], [95, 'barrier'], [145, 'life'], [185, 'rapid']],
  // the fortress at the end: a wall with two cannons and a core at its base
  boss: { wallCol: 214, cannonRows: [5.5, 9.5] },
};

CG.Level = {
  groundAt(col) {
    return CG.DATA.level.ground.some(([a, b]) => col >= a && col < b);
  },
  // nearest column at or after `col` that has ground under it (used to drop respawning players somewhere safe)
  safeCol(col) {
    const L = CG.DATA.level;
    for (let c = Math.max(0, Math.floor(col)); c < L.w; c++) if (this.groundAt(c) && this.groundAt(c + 1)) return c;
    return L.w - 4;
  },
};
