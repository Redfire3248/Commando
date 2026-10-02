// The stages, in TILE units (1 tile = 64px). The camera only ever scrolls to the right.
//   theme:    which set of ground, water and background art to use (see THEMES in art.js)
//   ground:   [from, to)            columns of solid ground; everything between two pieces is a pit
//   ledges:   [column, row, width]  one-way ledges (jump up through them, Down + Jump drops through)
//   enemies:  [type, column, row]   row = the surface they stand on (14 = ground, 11 / 8 = ledges);
//                                   drones fly, so they only need a column
//   capsules: [column, power-up]    flying pods; shoot one to drop rapid / spread / barrier / life
//   boss:     what waits at the wall at the end of the stage
// Stages repeat after the last one, harder each time round.
// STORY MODE: the eight stages of the classic campaign, in order — the jungle and its defense wall, the first
// base, the waterfall climb, the second base, the snow field, the energy zone, the hangar and the alien lair.
// Each stage is a run of hand-picked SECTIONS (see CG.Level.SECTIONS) followed by its boss:
//   bg: which painted scene from backgrounds15.png (first lap, later laps)   brief: the line under the stage name
CG.STORY = [
  { name: 'JUNGLE', theme: 'jungle', bg: [1, 4], brief: 'Break through the jungle and blow up the defense wall',
    sections: ['fight', 'bridge', 'climb0', 'tower', 'bridge', 'fight', 'nest'],
    boss: { type: 'fortress', cannonRows: [5.5, 9.5], say: 'DESTROY THE DEFENSE WALL' } },
  { name: 'BASE 1', theme: 'base', bg: [5, 8], brief: 'Fight down the corridors of the enemy base',
    sections: ['alley', 'fight', 'alley', 'tower', 'alley', 'gauntlet'],
    boss: { type: 'fortress', cannonRows: [4.5, 7.5, 10.5], say: 'DESTROY THE BASE CORE' } },
  { name: 'WATERFALL', theme: 'jungle', bg: [2, 3], brief: 'Climb the falls — watch the sky',
    sections: ['fight', 'falls', 'climb1', 'falls', 'drones', 'falls'],
    boss: { type: 'gunship', say: 'BRING DOWN THE GUARDIAN' } },
  { name: 'BASE 2', theme: 'base', bg: [6, 12], brief: 'Deeper in: more guns, higher walls',
    sections: ['gauntlet', 'tower', 'alley', 'climb2', 'nest', 'alley', 'gauntlet'],
    boss: { type: 'fortress', cannonRows: [3.5, 6.5, 9.5], say: 'DESTROY THE EYE CORE' } },
  { name: 'SNOW FIELD', theme: 'snow', bg: [9, 10], brief: 'Cross the frozen field before the armour arrives',
    sections: ['fight', 'gauntlet', 'bridge', 'nest', 'fight', 'drones', 'gauntlet'],
    boss: { type: 'tank', say: 'STOP THE ARMORED TANK' } },
  { name: 'ENERGY ZONE', theme: 'base', bg: [11, 7], brief: 'The reactor halls are burning — keep moving',
    sections: ['alley', 'climb0', 'nest', 'climb1', 'alley', 'drones', 'nest'],
    boss: { type: 'gunship', say: 'SHOOT DOWN THE REACTOR GUARD' } },
  { name: 'HANGAR', theme: 'base', bg: [13, 12], brief: 'Through the hangar and the loading cranes',
    sections: ['gauntlet', 'tower', 'drones', 'climb2', 'alley', 'tower', 'gauntlet'],
    boss: { type: 'tank', say: 'STOP THE HANGAR WALKER' } },
  { name: "ALIEN'S LAIR", theme: 'base', bg: [15, 14], brief: 'The source of it all. End it here',
    sections: ['drones', 'falls', 'nest', 'gauntlet', 'drones', 'climb1', 'nest', 'gauntlet'],
    boss: { type: 'fortress', cannonRows: [3.5, 6.5, 9.5], say: 'DESTROY THE ALIEN HEART' } },
];


CG.Level = {
  // Story sections. Each takes its first column `s` and returns { w, ledges, enemies, covers, coins }.
  // Rows: 14 = the ground, ledges at 11 / 8 / 5 (and 3 on the waterfall). Ground enemies have no row.
  SECTIONS: {
    fight: (s) => ({ w: 16, covers: [s + 4, s + 11], enemies: [['runner', s + 7], ['rifle', s + 9], ['runner', s + 14]] }),
    gauntlet: (s) => ({ w: 18, covers: [s + 3, s + 10], enemies: [['turret', s + 7], ['rifle', s + 13], ['runner', s + 15], ['grenadier', s + 16], ['runner', s + 17]] }),
    bridge: (s) => ({ w: 24, ledges: [[s + 2, 11, 4], [s + 7, 11, 4], [s + 12, 11, 4], [s + 17, 11, 5]],
      enemies: [['runner', s + 8, 11], ['rifle', s + 13, 11], ['runner', s + 19, 11], ['runner', s + 10], ['runner', s + 20]], coins: [[s + 9, 9], [s + 14, 9], [s + 19, 9]] }),
    tower: (s) => ({ w: 15, ledges: [[s + 2, 11, 4], [s + 7, 8, 4], [s + 2, 5, 4]], covers: [s + 12],
      enemies: [['rifle', s + 3, 5], ['rifle', s + 8, 8], ['turret', s + 10]], coins: [[s + 3, 3], [s + 4, 3]] }),
    alley: (s) => ({ w: 20, covers: [s + 2, s + 8, s + 14], enemies: [['turret', s + 5], ['turret', s + 11], ['rifle', s + 17], ['runner', s + 18]] }),
    nest: (s) => ({ w: 15, ledges: [[s + 4, 8, 6]], covers: [s + 1, s + 12],
      enemies: [['grenadier', s + 5, 8], ['grenadier', s + 8, 8], ['rifle', s + 6], ['runner', s + 10]], coins: [[s + 6, 6], [s + 7, 6]] }),
    drones: (s) => ({ w: 14, covers: [s + 6], enemies: [['drone', s + 3], ['drone', s + 8], ['drone', s + 12], ['runner', s + 9], ['runner', s + 12]] }),
    // the waterfall: up a staircase of rocks to the top of the falls, and down the other side
    falls: (s) => ({ w: 27, ledges: [[s + 1, 11, 3], [s + 5, 8, 3], [s + 9, 5, 3], [s + 13, 3, 4], [s + 19, 6, 3], [s + 23, 9, 3]],
      enemies: [['rifle', s + 10, 5], ['grenadier', s + 14, 3], ['rifle', s + 20, 6], ['drone', s + 8], ['drone', s + 17], ['runner', s + 12], ['runner', s + 22]],
      coins: [[s + 14, 1], [s + 15, 1], [s + 16, 1]] }),
    climb0: (s) => CG.Level.climb(0, s), climb1: (s) => CG.Level.climb(1, s), climb2: (s) => CG.Level.climb(2, s),
  },
  // a parkour climb with a rifleman on its highest ledge
  climb(k, s) {
    const c = this.CLIMBS[k](s), top = c.ledges.reduce((a, l) => (l[1] < a[1] ? l : a));
    return { w: c.w, ledges: c.ledges, coins: c.coins, enemies: [['rifle', top[0] + 1, top[1]], ['runner', s + c.w - 2]] };
  },
  // a story stage from its sections, in the format the Game scene reads
  build(def, li) {
    const L = { name: def.name, theme: def.theme, bg: def.bg, brief: def.brief, story: li + 1, h: 17, groundRow: 14, handmade: true,
      ledges: [], enemies: [], capsules: [], coins: [], coverCols: [] };
    let c = 10;
    def.sections.forEach((name) => {
      const sec = this.SECTIONS[name](c);
      L.ledges.push(...(sec.ledges || []));
      L.enemies.push(...(sec.enemies || []));
      L.coins.push(...(sec.coins || []));
      L.coverCols.push(...(sec.covers || []));
      c += sec.w + 2;
    });
    // a power-up pod every 30 columns or so
    const kinds = ['rapid', 'spread', 'pierce', 'barrier', 'blast', 'double', 'life', 'ice', 'fire', 'shock', 'armor', 'autoaim', 'bigheal', 'magnet', 'boots', 'dcoins'];
    for (let x = 24, n = li * 3; x < c - 6; x += 30, n++) L.capsules.push([x, kinds[n % kinds.length]]);
    L.boss = Object.assign({ wallCol: c + 14 }, def.boss);
    L.w = L.boss.wallCol + 16;
    L.ground = [[0, L.w]];
    return L;
  },
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
      if (L.parkourDone || L.handmade) return;
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
      const kinds = ['pierce', 'blast', 'double', 'ice', 'fire', 'shock', 'magnet', 'boots', 'autoaim', 'armor', 'dcoins', 'bigheal'];
      ledges.filter(([, r]) => r === 5).forEach(([lc], i) => L.capsules.push([lc + 1, kinds[(i + li * 3) % kinds.length]]));
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
CG.DATA.levels = CG.STORY.map((d, i) => CG.Level.build(d, i));
CG.DATA.level = CG.DATA.levels[0];     // the stage being played; the Game scene swaps this
CG.Level.noPits();
CG.Level.parkour();
CG.Level.check();

// 1v1 DUEL arenas: one screen wide (the camera never moves), mirror-image ledges and cover, no enemies.
// First to CG.DUEL_KILLS kills wins. Power-ups drop from the sky now and then.
CG.DUEL_KILLS = 5;
CG.DATA.arenas = [
  {
    name: 'ARENA · JUNGLE RUINS', theme: 'jungle', w: 30, h: 17, groundRow: 14, arena: true,
    ground: [[0, 30]], ledges: [[2, 11, 4], [24, 11, 4], [11, 8, 8], [5, 5, 4], [21, 5, 4]],
    coverCols: [8, 20], coins: [], enemies: [], capsules: [], spawnCols: [2, 27],
    boss: { type: 'none', wallCol: 30, say: '' },
  },
  {
    name: 'ARENA · STEEL YARD', theme: 'base', w: 30, h: 17, groundRow: 14, arena: true,
    ground: [[0, 30]], ledges: [[4, 11, 5], [21, 11, 5], [12, 6, 6], [1, 8, 3], [26, 8, 3]],
    coverCols: [10, 18], coins: [], enemies: [], capsules: [], spawnCols: [2, 27],
    boss: { type: 'none', wallCol: 30, say: '' },
  },
  {
    name: 'ARENA · FROZEN PASS', theme: 'snow', w: 30, h: 17, groundRow: 14, arena: true,
    ground: [[0, 30]], ledges: [[6, 11, 3], [21, 11, 3], [10, 8, 3], [17, 8, 3], [13, 5, 4]],
    coverCols: [3, 14, 25], coins: [], enemies: [], capsules: [], spawnCols: [1, 28],
    boss: { type: 'none', wallCol: 30, say: '' },
  },
];
