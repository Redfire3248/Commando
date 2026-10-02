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
  { name: 'JUNGLE', tiles: 'w_jungle', theme: 'jungle', bg: [1, 4], brief: 'Cross the jungle — the bridges blow up behind you — and break the defense wall',
    sections: ['fight', 'river', 'hop', 'cliff', 'movers', 'climbwall', 'river', 'highcliff', 'islands', 'nest'],
    boss: { type: 'fortress', cannonRows: [5.5, 9.5], say: 'DESTROY THE DEFENSE WALL' } },
  { name: 'BASE 1', tiles: 'w_base1', theme: 'base', bg: [5, 8], brief: 'Break every wall core to open the way through the base',
    sections: ['gatehall', 'lift', 'cliff', 'gatehall', 'movers', 'highcliff', 'ravine', 'gatehall'],
    boss: { type: 'fortress', cannonRows: [4.5, 7.5, 10.5], say: 'DESTROY THE BASE CORE' } },
  { name: 'WATERFALL', tiles: 'w_falls', theme: 'jungle', bg: [2, 3], brief: 'Climb the falls — watch for falling rocks',
    sections: ['falls', 'hop', 'climbwall', 'falls', 'movers', 'ravine', 'falls', 'lift'],
    boss: { type: 'statue', say: 'DESTROY THE ALIEN STATUE' } },
  { name: 'BASE 2', tiles: 'w_base2', theme: 'base', bg: [6, 12], brief: 'Deeper in: more walls, more guns',
    sections: ['gatehall', 'movers', 'highcliff', 'ravine', 'gatehall', 'lift', 'climbwall', 'gatehall'],
    boss: { type: 'fortress', cannonRows: [3.5, 6.5, 9.5], say: 'DESTROY THE TWIN CORE' } },
  { name: 'SNOW FIELD', tiles: 'w_snow', theme: 'snow', bg: [9, 10], brief: 'Cross the frozen field before the armour arrives',
    sections: ['river', 'hop', 'cliff', 'movers', 'islands', 'highcliff', 'ravine', 'climbwall', 'gauntlet'],
    boss: { type: 'tank', say: 'STOP THE ARMORED CARRIER' } },
  { name: 'ENERGY ZONE', tiles: 'w_energy', theme: 'base', bg: [11, 7], brief: 'Time your run past the fire jets',
    sections: ['flames', 'lift', 'cliff', 'flames', 'movers', 'climbwall', 'flames', 'ravine'],
    boss: { type: 'giant', say: 'TAKE DOWN THE GIANT' } },
  { name: 'HANGAR', tiles: 'w_hangar', theme: 'base', bg: [13, 12], brief: 'Mind the crushers — they come down hard',
    sections: ['crushers', 'movers', 'highcliff', 'crushers', 'hop', 'lift', 'crushers', 'ravine'],
    boss: { type: 'fortress', cannonRows: [3.5, 6.5, 9.5], say: 'BREAK THE FINAL GATE' } },
  { name: "ALIEN'S LAIR", tiles: 'w_alien', theme: 'base', bg: [15, 14], brief: 'The source of it all. End it here',
    sections: ['hive', 'hop', 'climbwall', 'hive', 'movers', 'highcliff', 'lift', 'ravine', 'hive'],
    boss: { type: 'heart', say: 'DESTROY THE ALIEN HEART' } },
];


CG.Level = {
  // Story sections. Each takes its first column `s` and returns { w, ledges, enemies, covers, coins }.
  // Rows: 14 = the ground, ledges at 11 / 8 / 5 (and 3 on the waterfall). Ground enemies have no row.
  SECTIONS: {
    fight: (s) => ({ w: 16, covers: [s + 4, s + 11], enemies: [['runner', s + 7], ['rifle', s + 9], ['runner', s + 14]] }),
    gauntlet: (s) => ({ w: 18, covers: [s + 3, s + 10], enemies: [['turret', s + 7], ['rifle', s + 13], ['runner', s + 15], ['grenadier', s + 16], ['runner', s + 17]] }),
    bridge: (s) => ({ w: 24, ledges: [[s + 2, 11, 4, 'bridge'], [s + 7, 11, 4, 'bridge'], [s + 12, 11, 4, 'bridge'], [s + 17, 11, 5, 'bridge']],
      enemies: [['runner', s + 8, 11], ['rifle', s + 13, 11], ['runner', s + 19, 11], ['runner', s + 10], ['runner', s + 20]], coins: [[s + 9, 9], [s + 14, 9], [s + 19, 9]] }),
    tower: (s) => ({ w: 15, ledges: [[s + 2, 11, 4], [s + 7, 8, 4], [s + 2, 5, 4]], covers: [s + 12],
      enemies: [['rifle', s + 3, 5], ['rifle', s + 8, 8], ['turret', s + 10]], coins: [[s + 3, 3], [s + 4, 3]] }),
    alley: (s) => ({ w: 20, covers: [s + 2, s + 8, s + 14], enemies: [['turret', s + 5], ['turret', s + 11], ['rifle', s + 17], ['runner', s + 18]] }),
    nest: (s) => ({ w: 15, ledges: [[s + 4, 8, 6]], covers: [s + 1, s + 12],
      enemies: [['grenadier', s + 5, 8], ['grenadier', s + 8, 8], ['rifle', s + 6], ['runner', s + 10]], coins: [[s + 6, 6], [s + 7, 6]] }),
    drones: (s) => ({ w: 14, covers: [s + 6], enemies: [['drone', s + 3], ['drone', s + 8], ['drone', s + 12], ['runner', s + 9], ['runner', s + 12]] }),
    // the waterfall: up a staircase of rocks to the top of the falls, and down the other side
    // a base corridor ending at a wall with a core: the screen stops until it is destroyed
    gatehall: (s) => ({ w: 20, covers: [s + 3], enemies: [['runner', s + 8], ['rifle', s + 11], ['runner', s + 13], ['gate', s + 18]] }),
    flames: (s) => ({ w: 20, hazards: [['flame', s + 5], ['flame', s + 10], ['flame', s + 15]], enemies: [['runner', s + 12], ['rifle', s + 18]] }),
    crushers: (s) => ({ w: 20, hazards: [['crusher', s + 4], ['crusher', s + 9], ['crusher', s + 14]], enemies: [['runner', s + 7], ['runner', s + 16], ['rifle', s + 19]] }),
    hive: (s) => ({ w: 18, covers: [s + 2], enemies: [['mouth', s + 6], ['mouth', s + 13], ['runner', s + 10], ['grenadier', s + 16]] }),
    falls: (s) => ({ w: 27, hazards: [['rocks', s + 4, s + 23]], ledges: [[s + 1, 11, 3], [s + 5, 8, 3], [s + 9, 5, 3], [s + 13, 3, 4], [s + 19, 6, 3], [s + 23, 9, 3]],
      enemies: [['rifle', s + 10, 5], ['grenadier', s + 14, 3], ['rifle', s + 20, 6], ['drone', s + 8], ['drone', s + 17], ['runner', s + 12], ['runner', s + 22]],
      coins: [[s + 14, 1], [s + 15, 1], [s + 16, 1]] }),
    climb0: (s) => CG.Level.climb(0, s), climb1: (s) => CG.Level.climb(1, s), climb2: (s) => CG.Level.climb(2, s),
    // ---- parkour: water you must not fall in (gaps), solid rock to climb (blocks: [col, top row, width])
    // a river with a bridge that blows up under you: run, and double-jump if it goes
    river: (s) => ({ w: 13, gaps: [[s + 3, s + 10]], ledges: [[s + 3, 14, 7, 'bridge']], enemies: [['runner', s + 11], ['rifle', s + 12]] }),
    // a rock cliff to jump up onto, with a rifleman on top
    cliff: (s) => ({ w: 16, blocks: [[s + 4, 11, 9]], enemies: [['rifle', s + 9, 11], ['runner', s + 14]], coins: [[s + 6, 9], [s + 7, 9]] }),
    // a staircase of cliffs: up two levels and down again
    highcliff: (s) => ({ w: 21, blocks: [[s + 3, 11, 4], [s + 7, 8, 7], [s + 14, 11, 4]],
      enemies: [['rifle', s + 10, 8], ['grenadier', s + 12, 8], ['runner', s + 15, 11], ['runner', s + 19]], coins: [[s + 9, 6], [s + 10, 6], [s + 11, 6]] }),
    // stepping stones across open water
    islands: (s) => ({ w: 20, gaps: [[s + 2, s + 18]], ledges: [[s + 3, 12, 3], [s + 8, 11, 3], [s + 13, 12, 3]],
      enemies: [['drone', s + 8], ['drone', s + 15], ['runner', s + 19]], coins: [[s + 9, 9], [s + 10, 9]] }),
    // hop across water on small platforms at different heights
    hop: (s) => ({ w: 25, gaps: [[s + 2, s + 23]], ledges: [[s + 3, 12, 2], [s + 7, 10, 2], [s + 11, 8, 2], [s + 15, 10, 2], [s + 19, 12, 2]],
      enemies: [['drone', s + 11], ['rifle', s + 12, 8], ['runner', s + 24]], coins: [[s + 11, 6], [s + 12, 6]] }),
    // a tall rock wall: climb the ledges up its face, over the top, and drop down the far side
    climbwall: (s) => ({ w: 22, blocks: [[s + 9, 5, 4]], ledges: [[s + 2, 11, 3], [s + 5, 8, 3], [s + 2, 6, 2], [s + 14, 8, 3]],
      enemies: [['rifle', s + 10, 5], ['grenadier', s + 15, 8], ['runner', s + 19]], coins: [[s + 10, 3], [s + 11, 3]] }),
    // moving platforms over water: ride them across (movers: [col, row, width, tiles across, tiles up, seconds a trip])
    movers: (s) => ({ w: 24, gaps: [[s + 2, s + 22]], movers: [[s + 3, 12, 3, 4, 0, 3.4], [s + 11, 10, 3, 0, 3, 3.0], [s + 15, 12, 3, 4, 0, 3.8]],
      enemies: [['drone', s + 10], ['drone', s + 17], ['runner', s + 23]], coins: [[s + 12, 6]] }),
    // a lift up to a high ledge route over a pit, then down again
    lift: (s) => ({ w: 24, gaps: [[s + 4, s + 20]], movers: [[s + 2, 13, 2, 0, 6, 4.2]], ledges: [[s + 6, 7, 4], [s + 12, 7, 4], [s + 18, 10, 3]],
      enemies: [['rifle', s + 8, 7], ['rifle', s + 14, 7], ['runner', s + 22]], coins: [[s + 10, 5], [s + 11, 5]] }),
    // a wide ravine: two rocks and a bridge in the middle that gives way
    ravine: (s) => ({ w: 18, gaps: [[s + 3, s + 15]], ledges: [[s + 4, 11, 2], [s + 8, 10, 3, 'bridge'], [s + 13, 11, 2]],
      enemies: [['rifle', s + 16], ['drone', s + 9]], coins: [[s + 9, 8]] }),
  },
  // a parkour climb with a rifleman on its highest ledge
  climb(k, s) {
    const c = this.CLIMBS[k](s), top = c.ledges.reduce((a, l) => (l[1] < a[1] ? l : a));
    return { w: c.w, ledges: c.ledges, coins: c.coins, enemies: [['rifle', top[0] + 1, top[1]], ['runner', s + c.w - 2]] };
  },
  // a story stage from its sections, in the format the Game scene reads
  build(def, li) {
    const L = { name: def.name, theme: def.theme, tiles: def.tiles, bg: def.bg, brief: def.brief, story: li + 1, h: 17, groundRow: 14, handmade: true,
      ledges: [], enemies: [], capsules: [], coins: [], coverCols: [], hazards: [], blocks: [], gaps: [], movers: [] };
    let c = 10;
    def.sections.forEach((name) => {
      const sec = this.SECTIONS[name](c);
      L.ledges.push(...(sec.ledges || []));
      L.enemies.push(...(sec.enemies || []));
      L.coins.push(...(sec.coins || []));
      L.coverCols.push(...(sec.covers || []));
      L.hazards.push(...(sec.hazards || []));
      L.blocks.push(...(sec.blocks || []));
      L.gaps.push(...(sec.gaps || []));
      L.movers.push(...(sec.movers || []));
      c += sec.w + 2;
    });
    // a power-up pod every 30 columns or so
    const kinds = ['rapid', 'spread', 'pierce', 'barrier', 'blast', 'double', 'life', 'ice', 'fire', 'shock', 'armor', 'autoaim', 'bigheal', 'magnet', 'boots', 'dcoins'];
    for (let x = 24, n = li * 3; x < c - 6; x += 30, n++) L.capsules.push([x, kinds[n % kinds.length]]);
    L.boss = Object.assign({ wallCol: c + 14 }, def.boss);
    L.w = L.boss.wallCol + 16;
    // the ground, with the water gaps cut out of it
    L.ground = [];
    let from = 0;
    L.gaps.slice().sort((a, b) => a[0] - b[0]).forEach(([a, b]) => { if (a > from) L.ground.push([from, a]); from = b; });
    L.ground.push([from, L.w]);
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
  noPits() { CG.DATA.levels.forEach((L) => { if (!L.handmade) L.ground = [[0, L.w]]; }); },     // story stages keep their water

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
        if (t === 'drone' || t === 'mouth') return;              // these hang in the air
        const ok = r ? L.ledges.some(([lc, lr, lw]) => lr === r && c >= lc && c < lc + lw) || (L.blocks || []).some(([bc, br, bw]) => br === r && c >= bc && c < bc + bw)
          : L.ground.some(([a, b]) => c >= a && c < b);
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
