// Rooms are described in TILE coordinates (1 tile = 64px), origin top-left.
//   solids:    [x, y, width, height]   solid rock
//   platforms: [x, y, width]           one-way ledges (jump up through, DOWN + JUMP to drop)
//   spikes:    [x, y, width]           hazard row, sits on the ground below it
//   spawn / bench / enemies / pickups use the tile the thing stands IN (feet on the tile below).
//   decor:     [prop name, x, y, scale?]  scenery from the props sheet; hanging props attach to the tile above.
GH.DATA.rooms = {
  crossing: {
    name: 'Forgotten Crossing',
    subtitle: 'Test Chamber',
    w: 110, h: 28,
    solids: [
      [0, 0, 110, 2],     // ceiling
      [0, 0, 2, 28],      // left wall
      [108, 0, 2, 28],    // right wall
      // floor, broken by five pits (spikes at the bottom — fall in and you are sent back to the edge)
      [0, 24, 15, 4], [18, 24, 14, 4], [36, 24, 20, 4], [60, 24, 5, 4], [68, 24, 22, 4], [93, 24, 17, 4],
      [15, 27, 3, 1], [32, 27, 4, 1], [56, 27, 4, 1], [65, 27, 3, 1], [90, 27, 3, 1],   // pit bottoms
      [22, 21, 4, 3],     // step block
      [50, 16, 3, 8],     // tall wall — needs Ember Wings (double jump)
      [77, 2, 2, 19],     // shaft: left pillar, hangs from the ceiling (walk under it)
      [83, 8, 2, 16],     // shaft: right pillar, rises from the floor — needs Grave Claws (wall jump)
    ],
    platforms: [
      [28, 19, 5],        // spread gun
      [39, 21, 3],        // over the spikes, double-jump orb
      [46, 19, 3],        // step up to the tall wall
      [54, 20, 3], [55, 16, 6],   // far side of the wall, laser
      [87, 20, 4], [90, 16, 4], [86, 12, 3],   // arena: way back up to the pillar
      [96, 17, 5], [102, 20, 4],
    ],
    spikes: [[38, 23, 8], [15, 26, 3], [32, 26, 4], [56, 26, 4], [65, 26, 3], [90, 26, 3]],
    spawn: [6, 23],
    bench: [9, 23],
    enemies: [
      ['crawler', 28, 23],
      ['turret', 64, 9],
      ['hopper', 62, 23],
      ['crawler', 69, 23],
      ['hopper', 97, 23],
      ['crawler', 100, 23],
      ['crawler', 98, 16],
      ['turret', 99, 9],
    ],
    decor: [
      ['cobweb', 3, 2], ['grave', 4, 23], ['lantern_post', 12, 23, 0.8], ['bones', 20, 23, 0.5], ['crystal', 27, 23],
      ['mushrooms', 37, 23], ['rubble', 48, 23, 0.5], ['pillar', 61, 23, 0.7], ['urn', 63, 23, 0.45],
      ['crystal_small', 69, 23, 0.5], ['roots', 71, 23, 0.7], ['vine', 77.5, 21], ['shield', 88, 23, 0.55],
      ['moss', 94, 23, 0.5], ['cage', 101, 23, 0.6], ['stalagmite', 106, 23, 0.7],
      ['chain', 15, 2], ['lantern_hang', 24, 2, 0.8], ['vine', 33, 2], ['stalactite', 44, 2], ['lantern_hang', 60, 2, 0.8],
      ['vine', 70, 2], ['chain', 88, 2], ['stalactite', 95, 2], ['lantern_hang', 104, 2, 0.8], ['cobweb', 106, 2],
    ],
    pickups: [
      ['weapon', 'spread', 30, 18],
      ['ability', 'doubleJump', 40, 20],
      ['weapon', 'laser', 58, 15],
      ['ability', 'wallJump', 73, 23],
      ['weapon', 'flame', 84, 7],
      ['weapon', 'shotgun', 88, 19],
      ['weapon', 'homing', 98, 14],
      ['weapon', 'rail', 104, 19],
    ],
  },
};
