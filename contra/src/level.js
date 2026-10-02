// The stages, in TILE units (1 tile = 64px). The camera only ever scrolls to the right.
//   theme:    which set of ground, water and background art to use (see THEMES in art.js)
//   ground:   [from, to)            columns of solid ground; everything between two pieces is a pit
//   ledges:   [column, row, width]  one-way ledges (jump up through them, Down + Jump drops through)
//   enemies:  [type, column, row]   row = the surface they stand on (14 = ground, 11 / 8 = ledges);
//                                   drones fly, so they only need a column
//   capsules: [column, power-up]    flying pods; shoot one to drop rapid / spread / barrier / life
//   boss:     what waits at the wall at the end of the stage
// Stages repeat after the last one, harder each time round.
CG.DATA.levels = [
  {
    name: 'JUNGLE', theme: 'jungle', w: 230, h: 17, groundRow: 14,
    ground: [[0, 30], [34, 58], [63, 90], [96, 120], [125, 150], [156, 230]],
    ledges: [
      [8, 11, 6], [16, 8, 6], [25, 11, 7], [36, 11, 6], [46, 8, 6], [54, 11, 10],
      [66, 11, 6], [76, 8, 6], [86, 11, 11], [100, 11, 6], [110, 8, 6], [117, 11, 9],
      [130, 11, 6], [138, 8, 6], [146, 11, 11], [160, 11, 6], [172, 8, 6], [181, 11, 6], [193, 11, 6],
    ],
    enemies: [
      ['runner', 20], ['runner', 26], ['rifle', 27, 11], ['runner', 36], ['rifle', 38, 11], ['runner', 40],
      ['turret', 42], ['runner', 44], ['rifle', 48, 8], ['grenadier', 50], ['runner', 52], ['drone', 62], ['runner', 64],
      ['rifle', 67, 11], ['runner', 68], ['runner', 72], ['rifle', 78, 8], ['runner', 80], ['turret', 84], ['runner', 88],
      ['runner', 98], ['rifle', 102, 11], ['runner', 104], ['turret', 108], ['grenadier', 110], ['runner', 112],
      ['rifle', 112, 8], ['runner', 118], ['drone', 124], ['runner', 128], ['rifle', 132, 11], ['runner', 134],
      ['turret', 136], ['rifle', 140, 8], ['runner', 142], ['runner', 148], ['drone', 152], ['runner', 158],
      ['rifle', 162, 11], ['runner', 164], ['turret', 166], ['runner', 170], ['rifle', 174, 8], ['grenadier', 176],
      ['runner', 178], ['rifle', 183, 11], ['runner', 186], ['turret', 190], ['runner', 194], ['rifle', 195, 11],
      ['runner', 200], ['runner', 206],
    ],
    capsules: [[30, 'rapid'], [60, 'spread'], [95, 'barrier'], [145, 'life'], [185, 'rapid']],
    boss: { type: 'fortress', wallCol: 214, cannonRows: [5.5, 9.5], say: 'DESTROY THE CORE' },
  },
  {
    name: 'STEEL YARD', theme: 'base', w: 240, h: 17, groundRow: 14,
    ground: [[0, 24], [28, 52], [57, 80], [84, 110], [116, 140], [144, 176], [181, 240]],
    ledges: [
      [6, 11, 6], [14, 8, 6], [22, 11, 8], [34, 11, 6], [42, 8, 6], [50, 11, 9],
      [62, 11, 6], [70, 8, 6], [78, 11, 8], [90, 11, 6], [98, 8, 6], [107, 11, 11],
      [122, 11, 6], [130, 8, 6], [138, 11, 8], [150, 11, 6], [158, 8, 6], [166, 11, 6], [174, 11, 9],
      [188, 11, 6], [196, 8, 6], [204, 11, 6],
    ],
    enemies: [
      ['rifle', 16, 8], ['runner', 18], ['runner', 30], ['grenadier', 34], ['rifle', 36, 11], ['runner', 36],
      ['turret', 40], ['rifle', 44, 8], ['runner', 46], ['drone', 50], ['runner', 60], ['rifle', 64, 11],
      ['runner', 66], ['turret', 68], ['rifle', 72, 8], ['runner', 76], ['drone', 82], ['grenadier', 86],
      ['runner', 88], ['rifle', 92, 11], ['turret', 94], ['runner', 96], ['rifle', 100, 8], ['runner', 104],
      ['drone', 112], ['runner', 118], ['turret', 122], ['rifle', 124, 11], ['runner', 126], ['rifle', 132, 8],
      ['grenadier', 134], ['runner', 136], ['drone', 146], ['runner', 148], ['rifle', 152, 11], ['turret', 154],
      ['runner', 156], ['rifle', 160, 8], ['grenadier', 164], ['rifle', 168, 11], ['runner', 170], ['drone', 178],
      ['runner', 184], ['turret', 186], ['rifle', 190, 11], ['runner', 192], ['grenadier', 194], ['rifle', 198, 8],
      ['runner', 200], ['drone', 202], ['rifle', 206, 11], ['turret', 208], ['runner', 210],
    ],
    capsules: [[26, 'spread'], [74, 'rapid'], [120, 'barrier'], [160, 'life'], [196, 'spread']],
    boss: { type: 'tank', wallCol: 224, say: 'STOP THE TANK' },
  },
  {
    name: 'FROZEN PASS', theme: 'snow', w: 250, h: 17, groundRow: 14,
    ground: [[0, 20], [25, 46], [50, 68], [74, 96], [100, 118], [124, 150], [155, 178], [184, 250]],
    ledges: [
      [6, 11, 5], [12, 8, 5], [18, 11, 9], [30, 11, 6], [38, 8, 6], [44, 11, 8],
      [56, 11, 5], [62, 8, 5], [66, 11, 10], [80, 11, 6], [88, 8, 6], [94, 11, 8],
      [106, 11, 5], [112, 8, 5], [116, 11, 10], [130, 11, 6], [138, 8, 6], [146, 11, 11],
      [162, 11, 6], [170, 8, 5], [176, 11, 10], [192, 11, 6], [200, 8, 6], [208, 11, 6], [216, 8, 6],
    ],
    enemies: [
      ['rifle', 13, 8], ['runner', 16], ['drone', 22], ['runner', 28], ['grenadier', 30], ['rifle', 32, 11],
      ['runner', 34], ['turret', 36], ['rifle', 40, 8], ['runner', 42], ['drone', 48], ['runner', 52],
      ['grenadier', 56], ['rifle', 58, 11], ['runner', 60], ['turret', 64], ['rifle', 64, 8], ['drone', 70],
      ['runner', 78], ['rifle', 82, 11], ['runner', 84], ['grenadier', 86], ['turret', 88], ['rifle', 90, 8],
      ['runner', 92], ['drone', 98], ['runner', 102], ['rifle', 108, 11], ['turret', 108], ['runner', 110],
      ['rifle', 114, 8], ['drone', 120], ['runner', 126], ['grenadier', 128], ['rifle', 132, 11], ['runner', 134],
      ['turret', 136], ['rifle', 140, 8], ['runner', 142], ['drone', 152], ['runner', 158], ['grenadier', 160],
      ['rifle', 164, 11], ['runner', 166], ['turret', 168], ['rifle', 172, 8], ['runner', 174], ['drone', 180],
      ['runner', 188], ['grenadier', 190], ['rifle', 194, 11], ['runner', 196], ['turret', 198], ['rifle', 202, 8],
      ['runner', 204], ['grenadier', 206], ['rifle', 210, 11], ['drone', 210], ['runner', 212], ['turret', 214],
      ['rifle', 218, 8], ['runner', 220],
    ],
    capsules: [[24, 'spread'], [72, 'barrier'], [122, 'rapid'], [170, 'life'], [200, 'spread']],
    boss: { type: 'gunship', wallCol: 234, say: 'SHOOT DOWN THE GUNSHIP' },
  },
];
CG.DATA.level = CG.DATA.levels[0];     // the stage being played; the Game scene swaps this

CG.Level = {
  // Cover: low walls and crates standing on the ground every so often. Same places every time (and on every
  // player's screen online). Kept clear of the start, the boss and where ground enemies appear.
  // Cover pieces for this stage (placed in the fight zones by parkour()).
  covers(L) {
    const kinds = L.theme === 'snow' ? ['snowbags', 'crate', 'barrier', 'icecrate', 'snowbags'] : ['sandbags', 'crate', 'barrier', 'crates', 'drums'];
    return (L.coverCols || []).map((col) => ({ kind: kinds[(col * 7 + 3) % kinds.length], col }));
  },
  groundAt(col) {
    return CG.DATA.level.ground.some(([a, b]) => col >= a && col < b);
  },
  // nearest column at or after `col` that has ground under it (used to drop respawning players somewhere safe)
  safeCol(col) {
    const L = CG.DATA.level;
    for (let c = Math.max(0, Math.floor(col)); c < L.w; c++) if (this.groundAt(c) && this.groundAt(c + 1)) return c;
    return L.w - 4;
  },
  // The stages used to have pits; the ground is now one unbroken floor (cover replaced the gaps).
  noPits() { CG.DATA.levels.forEach((L) => { L.ground = [[0, L.w]]; }); },

  // Parkour layout: every stage is rebuilt as FIGHT zones (open ground with cover to hide behind, nothing
  // overhead) and CLIMB sections (ledge routes up to a high path, with coins up there). Built the same way every
  // time (and on every screen online). Enemies that stood on the old ledges move onto the nearest new ledge at
  // their height, or down to the ground.
  CLIMBS: [
    (s) => ({ w: 22, ledges: [[s + 1, 11, 4], [s + 6, 8, 4], [s + 11, 5, 5], [s + 17, 8, 4]], coins: [[s + 12, 4], [s + 13, 4], [s + 14, 4]] }),   // up and over
    (s) => ({ w: 21, ledges: [[s + 1, 11, 3], [s + 5, 8, 3], [s + 9, 11, 3], [s + 13, 8, 3], [s + 17, 5, 3]], coins: [[s + 6, 7], [s + 14, 7], [s + 18, 4]] }), // zigzag
    (s) => ({ w: 25, ledges: [[s + 1, 11, 3], [s + 5, 8, 3], [s + 9, 5, 3], [s + 13, 5, 3], [s + 17, 5, 3], [s + 21, 8, 3]], coins: [[s + 10, 4], [s + 14, 4], [s + 18, 4]] }), // high stepping stones
  ],
  parkour() {
    CG.DATA.levels.forEach((L, li) => {
      if (L.parkourDone) return;
      L.parkourDone = true;
      const end = L.boss.wallCol - 10, ledges = [], coins = [], covers = [];
      let c = 10, k = li;
      while (c < end - 18) {
        // fight zone: open ground, two pieces of cover
        covers.push(c + 4, c + 11);
        c += 16;
        if (c >= end - 18) break;
        const climb = this.CLIMBS[k++ % this.CLIMBS.length](c);
        if (c + climb.w > end) break;
        ledges.push(...climb.ledges);
        coins.push(...climb.coins);
        c += climb.w + 2;
      }
      // enemies placed on the old ledges: onto the nearest new ledge at that height, else onto the ground
      L.enemies.forEach((e) => {
        const [, col, row] = e;
        if (!row || row === L.groundRow) return;
        let best = null, bd = 99;
        for (const [lc, lr, lw] of ledges) {
          if (lr !== row) continue;
          const d = col < lc ? lc - col : col >= lc + lw ? col - (lc + lw - 1) : 0;
          if (d < bd) { bd = d; best = [lc, lw]; }
        }
        if (best && bd <= 8) e[1] = Math.min(Math.max(col, best[0]), best[0] + best[1] - 1);
        else e.length = 2;                       // no row = standing on the ground
      });
      // an enemy standing on the ground where cover goes steps out of its way
      L.enemies.forEach((e) => {
        if (e[2] && e[2] !== L.groundRow) return;
        for (const cc of covers) if (e[1] >= cc - 1 && e[1] <= cc + 3) e[1] = cc + 4;
      });
      L.ledges = ledges;
      L.coins = coins;
      L.coverCols = covers;
      // flying capsules with the bullet power-ups, one over each climb
      const kinds = ['pierce', 'blast', 'double', 'ice'];
      ledges.filter(([, r]) => r === 5).forEach(([lc], i) => { if (i % 2 === 0) L.capsules.push([lc + 1, kinds[(i / 2 + li) % kinds.length]]); });
      L.capsules.sort((a, b) => a[0] - b[0]);
    });
  },
  // Checks every stage's enemies stand on something. Logs a warning for any that would fall.
  check() {
    CG.DATA.levels.forEach((L) => {
      L.enemies.forEach(([t, c, r]) => {
        if (t === 'drone') return;
        const ok = r ? L.ledges.some(([lc, lr, lw]) => lr === r && c >= lc && c < lc + lw) : L.ground.some(([a, b]) => c >= a && c < b);
        if (!ok) console.warn('[level ' + L.name + '] ' + t + ' at column ' + c + (r ? ' row ' + r : '') + ' has nothing to stand on');
      });
    });
  },
};
CG.Level.noPits();
CG.Level.parkour();
CG.Level.check();
