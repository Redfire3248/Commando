// All of COMMANDO's art, drawn in code as pixel art: each sprite is painted on a tiny canvas and
// scaled up with hard edges. No image files are needed for the game to run.
CG.PLAYER_COLORS = ['#4d8dff', '#ff4d4d', '#45d862', '#ffd23c', '#c878ff'];

CG.Art = (() => {
  const S = 3;                                   // screen pixels per art pixel for characters
  const FW = 40, FH = 44, CX = 20, GY = 43;      // soldier frame (in art pixels): centre column and ground row

  function lowres(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    return c;
  }
  // scale a small canvas up into a game texture; `frames` splits it into equal frames left to right
  function put(scene, key, c, s, frames) {
    if (scene.textures.exists(key)) return;
    const t = scene.textures.createCanvas(key, c.width * s, c.height * s);
    const o = t.getContext();
    o.imageSmoothingEnabled = false;
    o.drawImage(c, 0, 0, c.width * s, c.height * s);
    if (frames) {
      const fw = c.width / frames * s;
      for (let i = 0; i < frames; i++) t.add(i, 0, i * fw, 0, fw, c.height * s);
    }
    t.refresh();
  }
  const R = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function line(g, x0, y0, x1, y1, th, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    g.fillStyle = col;
    for (let i = 0; i <= n; i++) {
      g.fillRect(Math.round(x0 + (x1 - x0) * i / n - th / 2), Math.round(y0 + (y1 - y0) * i / n - th / 2), th, th);
    }
  }
  function disc(g, cx, cy, r, col) {
    g.fillStyle = col;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------------ soldiers
  // o.phase: run-cycle angle (null = standing)   o.aim: [dx, dy] rifle direction (null = no rifle)
  // Returns where the rifle tip is, relative to the feet, in art pixels.
  function soldier(g, ox, pal, o) {
    const hip = { x: CX, y: 27 };
    let a1 = 0.22, a2 = -0.22, b1 = 0, b2 = 0;
    if (o.phase != null) {
      a1 = Math.sin(o.phase) * 0.85; a2 = -a1;
      b1 = 0.15 + 0.85 * Math.max(0, Math.cos(o.phase)); b2 = 0.15 + 0.85 * Math.max(0, -Math.cos(o.phase));
    }
    if (o.tuck) { a1 = 0.9; a2 = 0.3; b1 = 1.5; b2 = 1.3; }
    const leg = (a, b) => {
      const k = { x: hip.x + Math.sin(a) * 8, y: hip.y + Math.cos(a) * 8 };
      return { k, f: { x: k.x + Math.sin(a - b) * 8, y: k.y + Math.cos(a - b) * 8 } };
    };
    const L1 = leg(a1, b1), L2 = leg(a2, b2);
    const lift = o.tuck ? -6 : GY - 1 - Math.max(L1.f.y, L2.f.y);         // keep the lower foot on the ground
    const X = (x) => ox + x, Y = (y) => y + lift, lean = o.phase != null ? 1 : 0;
    const drawLeg = (L, col) => {
      line(g, X(hip.x), Y(hip.y), X(L.k.x), Y(L.k.y), 3, col);
      line(g, X(L.k.x), Y(L.k.y), X(L.f.x), Y(L.f.y), 3, col);
      R(g, X(L.f.x - 1), Y(L.f.y - 1), 4, 2, pal.boots);
    };
    drawLeg(L2, pal.pants2);                                              // far leg, darker
    R(g, X(CX - 4 + lean), Y(15), 9, 11, pal.shirt);
    R(g, X(CX - 4 + lean), Y(25), 9, 3, pal.pants);
    if (pal.belt) line(g, X(CX - 4 + lean), Y(16), X(CX + 4 + lean), Y(24), 1, pal.belt);
    drawLeg(L1, pal.pants);                                               // near leg
    R(g, X(CX - 3 + lean), Y(7), 7, 7, pal.skin);
    if (pal.helmet) { R(g, X(CX - 4 + lean), Y(5), 9, 4, pal.helmet); R(g, X(CX - 4 + lean), Y(8), 10, 1, pal.helmet); }
    else {
      R(g, X(CX - 3 + lean), Y(6), 7, 2, pal.hair);
      R(g, X(CX - 3 + lean), Y(9), 7, 1, pal.band); R(g, X(CX - 6 + lean), Y(9), 3, 1, pal.band); R(g, X(CX - 7 + lean), Y(10), 2, 1, pal.band);
    }
    R(g, X(CX + 2 + lean), Y(11), 1, 1, '#111');
    const sh = { x: CX + 1 + lean, y: 18 };
    if (o.aim) {
      const [dx, dy] = o.aim;
      line(g, X(sh.x - dx * 3), Y(sh.y - dy * 3), X(sh.x + dx * 2), Y(sh.y + dy * 2), 2, '#7a4a22');       // stock
      line(g, X(sh.x + dx * 2), Y(sh.y + dy * 2), X(sh.x + dx * 15), Y(sh.y + dy * 15), 2, o.gun || '#20242b');
      R(g, X(sh.x + dx * 8), Y(sh.y + dy * 8), 1, 1, '#ffb060');
      line(g, X(sh.x), Y(sh.y), X(sh.x + dx * 5), Y(sh.y + dy * 5 + 1), 2, pal.skin);                         // arm
      return { mx: sh.x + dx * 16 - CX, my: sh.y + dy * 16 + lift - GY };
    }
    if (o.throw) {                                                        // arm up, grenade in hand
      line(g, X(sh.x), Y(sh.y), X(sh.x + 5), Y(sh.y - 9), 2, pal.skin);
      R(g, X(sh.x + 5), Y(sh.y - 12), 3, 3, '#1d2024');
    } else {
      line(g, X(sh.x), Y(sh.y), X(sh.x - Math.sin(a1) * 6), Y(sh.y + 6), 2, pal.skin);                       // swinging arm
    }
    return null;
  }
  function prone(g, ox, pal) {
    R(g, ox + 1, 38, 3, 4, pal.boots); R(g, ox + 4, 38, 13, 4, pal.pants);
    R(g, ox + 17, 36, 11, 6, pal.shirt);
    R(g, ox + 28, 33, 7, 7, pal.skin); R(g, ox + 28, 32, 7, 2, pal.hair); R(g, ox + 28, 35, 7, 1, pal.band); R(g, ox + 26, 35, 2, 1, pal.band);
    R(g, ox + 33, 37, 1, 1, '#111');
    line(g, ox + 26, 40, ox + 39, 40, 2, '#20242b'); R(g, ox + 30, 41, 3, 1, pal.skin);
    return { mx: 39 - CX, my: 40 - GY };
  }
  function ball(g, ox, pal, flip) {
    disc(g, ox + CX, 30, 9, pal.pants);
    disc(g, ox + CX + (flip ? -2 : 2), flip ? 32 : 28, 6, pal.shirt);
    R(g, ox + CX - 3, flip ? 33 : 21, 6, 6, pal.skin); R(g, ox + CX - 3, flip ? 37 : 23, 6, 1, pal.band);
    R(g, ox + CX + (flip ? 4 : -7), flip ? 23 : 34, 4, 3, pal.boots);
  }
  function dead(g, ox, pal) {
    line(g, ox + 24, 27, ox + 34, 21, 3, pal.pants); R(g, ox + 33, 18, 4, 3, pal.boots);
    line(g, ox + 24, 29, ox + 33, 28, 3, pal.pants2);
    R(g, ox + 12, 22, 13, 8, pal.shirt);
    R(g, ox + 5, 19, 7, 7, pal.skin); R(g, ox + 5, 18, 7, 2, pal.hair); R(g, ox + 5, 21, 7, 1, pal.band);
    line(g, ox + 14, 22, ox + 9, 13, 2, pal.skin); line(g, ox + 20, 22, ox + 25, 14, 2, pal.skin);
  }

  const D = 0.7071;
  const AIMS = { fwd: [1, 0], up: [0, -1], dup: [D, -D], ddown: [D, D], down: [0, 1] };
  // frame numbers inside a player sheet, and where each pose's rifle tip is (screen pixels from the feet)
  const PIX = { anims: {}, muzzle: {}, tex: (i) => 'pl' + i };

  function playerSheet(scene, idx, pal) {
    let n = 0;
    const c = lowres(FW * 26, FH, (g) => {
      const tip = (name, m) => { if (idx === 0) PIX.muzzle[name] = [m.mx * S, m.my * S]; };
      const anim = (name, count) => { if (idx === 0) PIX.anims[name] = [n, n + count - 1]; };
      for (const a of ['fwd', 'dup', 'ddown']) {
        anim('run_' + a, 6);
        for (let k = 0; k < 6; k++) { const m = soldier(g, FW * n++, pal, { phase: k / 6 * Math.PI * 2, aim: AIMS[a] }); if (k === 0 && a !== 'fwd') tip(a, m); }
      }
      for (const a of ['fwd', 'up', 'dup', 'ddown']) {
        anim('stand_' + a, 1);
        const m = soldier(g, FW * n++, pal, { aim: AIMS[a] });
        if (a === 'fwd' || a === 'up') tip(a, m);
      }
      anim('prone', 1); tip('prone', prone(g, FW * n++, pal));
      anim('ball', 2); ball(g, FW * n++, pal, false); ball(g, FW * n++, pal, true);
      anim('death', 1); dead(g, FW * n++, pal);
    });
    put(scene, 'pl' + idx, c, S, 26);
  }

  // tiny 3x5 letters for the power-up badges
  const FONT = {
    R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'],
    B: ['110', '101', '110', '101', '110'], '1': ['010', '110', '010', '010', '111'],
  };
  function letter(g, ch, x, y, col) {
    FONT[ch].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') R(g, x + i, y + j, 1, 1, col); }));
  }
  function badge(g, col, ch) {       // 26x16
    [[0, 4, 6, 2], [1, 6, 6, 2], [3, 8, 5, 2], [20, 4, 6, 2], [19, 6, 6, 2], [18, 8, 5, 2]].forEach(([x, y, w, h]) => R(g, x, y, w, h, '#c9d2de'));
    disc(g, 13, 8, 6, '#2b3038'); disc(g, 13, 8, 5, col);
    letter(g, ch, 12, 6, '#10141a');
  }

  function dirt(g, w, h, base, dark, light) {
    R(g, 0, 0, w, h, base);
    for (let i = 0; i < w * h / 9; i++) R(g, rnd(0, w) | 0, rnd(0, h) | 0, 1, 1, Math.random() < 0.5 ? dark : light);
  }

  function makeAll(scene) {
    // ---- players: five colours ----
    const base = { skin: '#f0b384', hair: '#2a1d14', boots: '#15171c' };
    [
      { band: '#4d8dff', shirt: '#e8e8e8', pants: '#3358b0', pants2: '#26448a' },
      { band: '#ff4d4d', shirt: '#f0b384', pants: '#b3342f', pants2: '#8c2622', hair: '#e0bb5a', belt: '#6b4a1e' },
      { band: '#45d862', shirt: '#2d3238', pants: '#2f8a44', pants2: '#246b35' },
      { band: '#ffd23c', shirt: '#e8e8e8', pants: '#a8861f', pants2: '#846a18', hair: '#7a3b1c' },
      { band: '#c878ff', shirt: '#2d3238', pants: '#7644a8', pants2: '#5c3584', hair: '#e8e8e8' },
    ].forEach((p, i) => playerSheet(scene, i, Object.assign({}, base, p)));

    // ---- enemy soldiers ----
    const foe = { skin: '#d6a27a', helmet: '#5d6b52', shirt: '#6f7a5a', pants: '#4d5540', pants2: '#3d4433', boots: '#15171c' };
    put(scene, 'px_runner', lowres(FW * 7, FH, (g) => {
      for (let k = 0; k < 6; k++) soldier(g, FW * k, foe, { phase: k / 6 * Math.PI * 2 });
      soldier(g, FW * 6, foe, { tuck: true });
    }), S, 7);
    const rif = Object.assign({}, foe, { helmet: '#a33a3a', shirt: '#8a5a3a', pants: '#5a4030', pants2: '#47321f' });
    put(scene, 'px_rifle', lowres(FW * 5, FH, (g) => {
      ['fwd', 'dup', 'up', 'ddown', 'down'].forEach((a, k) => soldier(g, FW * k, rif, { aim: AIMS[a], gun: '#8d97a3' }));
    }), S, 5);

    // ---- machines ----
    const dome = (g, r, cy) => { disc(g, 16, cy, r, '#4a525c'); disc(g, 16, cy, r - 3, '#30353c'); disc(g, 16, cy, 3, '#ff5a4a'); R(g, 15, cy - 1, 1, 1, '#ffd0a0'); };
    put(scene, 'e_turret', lowres(32, 32, (g) => { R(g, 3, 22, 26, 10, '#3b4148'); R(g, 3, 22, 26, 2, '#7b8692'); dome(g, 11, 18); }), S);
    put(scene, 'boss_cannon', lowres(32, 32, (g) => { disc(g, 16, 16, 15, '#2b3038'); dome(g, 12, 16); [[4, 4], [27, 4], [4, 27], [27, 27]].forEach(([x, y]) => R(g, x, y, 1, 1, '#9aa4b0')); }), S);
    put(scene, 'e_barrel', lowres(24, 8, (g) => { R(g, 0, 1, 20, 6, '#30353c'); R(g, 0, 1, 20, 2, '#7b8692'); R(g, 19, 0, 5, 8, '#1d2024'); }), S);
    put(scene, 'e_flyer', lowres(34, 20, (g) => {
      [[0, 3, 8, 2], [2, 5, 8, 2], [26, 3, 8, 2], [24, 5, 8, 2]].forEach(([x, y, w, h]) => R(g, x, y, w, h, '#c9d2de'));
      disc(g, 17, 11, 8, '#525b66'); R(g, 9, 8, 17, 2, '#8d97a3'); disc(g, 17, 12, 3, '#ffb060'); R(g, 16, 11, 1, 1, '#fff2d0');
    }), S);
    put(scene, 'boss_core', lowres(36, 56, (g) => {
      R(g, 0, 0, 36, 56, '#23272d'); R(g, 2, 2, 32, 52, '#3b424b'); R(g, 2, 2, 32, 2, '#7b8692');
      disc(g, 18, 28, 12, '#7a1a16'); disc(g, 18, 28, 9, '#ff4a3a'); disc(g, 18, 28, 5, '#ffb38a'); disc(g, 18, 28, 2, '#fff2d0');
      [[5, 6], [30, 6], [5, 49], [30, 49]].forEach(([x, y]) => R(g, x, y, 2, 2, '#9aa4b0'));
    }), S);
    put(scene, 'boss_wall', lowres(16, 16, (g) => {
      R(g, 0, 0, 16, 16, '#3b424b'); R(g, 0, 0, 16, 1, '#7b8692'); R(g, 0, 0, 1, 16, '#5c6672'); R(g, 0, 15, 16, 1, '#22272d'); R(g, 15, 0, 1, 16, '#22272d');
      R(g, 3, 3, 1, 1, '#9aa4b0'); R(g, 12, 12, 1, 1, '#9aa4b0');
    }), 4);

    // ---- power-ups, bullets, effects ----
    put(scene, 'pk_rapid', lowres(26, 16, (g) => badge(g, '#ffd23c', 'R')), S);
    put(scene, 'pk_barrier', lowres(26, 16, (g) => badge(g, '#5ad0ff', 'B')), S);
    put(scene, 'pk_spread', lowres(26, 16, (g) => badge(g, '#ff8a3c', 'S')), S);
    put(scene, 'pk_life', lowres(26, 16, (g) => badge(g, '#ff7a7a', '1')), S);
    const orb = (c1, c2) => (g) => { disc(g, 4, 4, 3, c2); disc(g, 4, 4, 2, c1); R(g, 3, 3, 2, 2, '#ffffff'); };
    put(scene, 'bullet', lowres(9, 9, orb('#ffd27a', '#ff8a3c')), S);
    put(scene, 'ebullet', lowres(9, 9, orb('#ff9aa8', '#ff3050')), S);
    put(scene, 'flash', lowres(12, 12, (g) => { disc(g, 6, 6, 4, '#ffd27a'); disc(g, 6, 6, 2, '#ffffff'); R(g, 6, 5, 6, 2, '#fff2d0'); }), S);
    put(scene, 'spark', lowres(2, 2, (g) => R(g, 0, 0, 2, 2, '#ffffff')), S);
    put(scene, 'px_boom', lowres(24 * 5, 24, (g) => {
      const at = (i) => 24 * i + 12;
      disc(g, at(0), 12, 5, '#ffffff');
      disc(g, at(1), 12, 8, '#ffd23c'); disc(g, at(1), 12, 5, '#ffffff');
      disc(g, at(2), 12, 11, '#ff8a3c'); disc(g, at(2), 12, 7, '#ffd23c'); disc(g, at(2), 11, 3, '#ffffff');
      disc(g, at(3), 12, 11, '#b3402a'); disc(g, at(3), 10, 6, '#ff8a3c'); disc(g, at(3) + 5, 16, 3, '#55595f');
      [[-6, -5, 3], [5, -6, 4], [-3, 5, 4], [6, 5, 3]].forEach(([x, y, r]) => disc(g, at(4) + x, 12 + y, r, '#55595f'));
    }), 4, 5);
    put(scene, 'glow', lowres(44, 44, (g) => {                      // the shield: a ring of light
      disc(g, 22, 22, 20, 'rgba(90,208,255,0.35)'); g.globalCompositeOperation = 'destination-out'; disc(g, 22, 22, 17, '#000');
      g.globalCompositeOperation = 'source-over'; disc(g, 22, 22, 17, 'rgba(90,208,255,0.1)');
    }), S);
    put(scene, 'life', lowres(8, 12, (g) => { R(g, 2, 0, 4, 4, '#d0d6de'); disc(g, 4, 8, 3, '#ffffff'); R(g, 3, 7, 2, 2, '#c0c6ce'); }), S);

    // ---- more enemies and the other two bosses ----
    const gren = Object.assign({}, foe, { helmet: '#34507a', shirt: '#4a5f86', pants: '#2f3d58', pants2: '#252f45' });
    put(scene, 'px_gren', lowres(FW * 2, FH, (g) => { soldier(g, 0, gren, {}); soldier(g, FW, gren, { throw: true }); }), S, 2);
    put(scene, 'px_drone', lowres(22 * 2, 14, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 22;
        R(g, o + 6, 5, 10, 6, '#525b66'); R(g, o + 7, 6, 8, 2, '#8d97a3'); R(g, o + 10, 8, 2, 2, '#ff4a4a');
        R(g, o + 4, 4, 1, 2, '#2b3038'); R(g, o + 17, 4, 1, 2, '#2b3038');
        if (f) { R(g, o + 3, 3, 4, 1, '#c9d2de'); R(g, o + 15, 3, 4, 1, '#c9d2de'); }
        else { R(g, o + 1, 3, 8, 1, '#c9d2de'); R(g, o + 13, 3, 8, 1, '#c9d2de'); }
      }
    }), S, 2);
    put(scene, 'bomb', lowres(8, 8, (g) => { disc(g, 4, 4, 3, '#1d2024'); R(g, 3, 2, 2, 1, '#ff4a4a'); }), S);
    put(scene, 'boss_tank', lowres(90, 44, (g) => {
      R(g, 6, 30, 78, 12, '#22262b');
      for (let i = 0; i < 6; i++) { disc(g, 12 + i * 13, 37, 4, '#3b424b'); R(g, 11 + i * 13, 36, 2, 2, '#7b8692'); }
      R(g, 4, 22, 82, 10, '#5d6f4c'); R(g, 10, 18, 70, 6, '#5d6f4c'); R(g, 10, 18, 70, 2, '#86a06c');
      R(g, 30, 6, 32, 13, '#4c5d3e'); R(g, 30, 6, 32, 2, '#78906a'); R(g, 40, 3, 10, 4, '#3e4c33');
      R(g, 44, 11, 4, 4, '#c0392b'); R(g, 14, 25, 3, 3, '#2b3038'); R(g, 72, 25, 3, 3, '#2b3038');
    }), S);
    put(scene, 'boss_heli', lowres(84 * 2, 36, (g) => {
      for (let f = 0; f < 2; f++) {
        const o = f * 84;
        R(g, o + 50, 16, 28, 4, '#4c5d3e'); R(g, o + 74, 9, 4, 11, '#4c5d3e'); disc(g, o + 78, 10, 3, f ? '#8d97a3' : '#c9d2de');
        R(g, o + 22, 12, 30, 16, '#4c5d3e'); R(g, o + 20, 16, 4, 10, '#4c5d3e'); R(g, o + 22, 12, 30, 2, '#78906a');
        R(g, o + 22, 15, 10, 8, '#9fd8ff'); R(g, o + 23, 16, 4, 2, '#e6f8ff');
        R(g, o + 44, 19, 4, 4, '#c0392b');
        R(g, o + 36, 8, 2, 4, '#2b3038');
        if (f) R(g, o + 24, 6, 26, 2, '#c9d2de'); else R(g, o + 4, 6, 66, 2, '#c9d2de');
        R(g, o + 26, 28, 1, 3, '#22262b'); R(g, o + 46, 28, 1, 3, '#22262b'); R(g, o + 20, 31, 32, 1, '#22262b');
        R(g, o + 14, 24, 9, 3, '#22262b');
      }
    }), S, 2);

    // ---- terrain + background, one set per stage theme ----
    for (const id in THEMES) theme(scene, id, THEMES[id]);
  }

  // ------------------------------------------------------------------ stage themes
  // Each theme gets its own ground, ledge, liquid and three background layers, named <key>_<theme>.
  const THEMES = {
    jungle: {
      sky: ['#16264a', '#1c3358', '#244366', '#2d5670', '#356a72', '#3c7a6c', '#2f6656', '#224e40', '#173a2e'],
      far: '#1f4a3c', farHi: '#2c6450', cap: 2, farKind: 'hills', near: '#0f2a1e', nearKind: 'palms',
      top: '#2f8a3a', topHi: '#7be06a', dirt: ['#6b4423', '#553518', '#86582f'], rock: '#4a2f15',
      liquid: ['#1c5a96', '#8fd8ff', '#3f8fd0', '#154878', '#103a62'],
    },
    base: {
      sky: ['#0c0a1e', '#141030', '#1d1740', '#281f4e', '#33285a', '#3c305e', '#32284e', '#251d3a', '#18132a'],
      far: '#1d1838', farHi: '#ffd76a', cap: 0, farKind: 'city', near: '#0b0916', nearKind: 'towers',
      top: '#c9a227', topHi: '#ffe680', hazard: true, dirt: ['#4a4f5a', '#3a3f48', '#5c6370'], rock: '#2b2f36',
      liquid: ['#3a7a1c', '#c8ff6a', '#6fbf2a', '#285a12', '#1d440c'],
    },
    snow: {
      sky: ['#3b4f7a', '#4d6590', '#6480a6', '#7e9aba', '#9ab3cc', '#b4c8da', '#9db4cc', '#8098b6', '#667e9e'],
      far: '#5f7896', farHi: '#eef6fd', cap: 9, farKind: 'hills', near: '#22344a', nearKind: 'pines',
      top: '#e8f2fb', topHi: '#ffffff', dirt: ['#5a6478', '#485064', '#707a90'], rock: '#3c4456',
      liquid: ['#1a3a5e', '#9fd0f0', '#35608c', '#12294a', '#0c1e38'],
    },
  };
  function theme(scene, id, t) {
    const k = (name) => name + '_' + id;
    const surface = (g, y, hgt) => {
      R(g, 0, y, 16, hgt, t.top);
      if (t.hazard) for (let x = 0; x < 16; x += 4) R(g, x, y + 1, 2, hgt - 1, '#1a1a1a');
      R(g, 0, y, 16, 1, t.topHi);
    };
    put(scene, k('g_top'), lowres(16, 16, (g, w, h) => {
      dirt(g, w, h, t.dirt[0], t.dirt[1], t.dirt[2]);
      surface(g, 0, 4);
      if (!t.hazard) [1, 4, 6, 9, 12, 14].forEach((x) => R(g, x, 4, 1, 1 + (x % 3), t.top));
    }), 4);
    put(scene, k('g_in'), lowres(16, 16, (g, w, h) => {
      dirt(g, w, h, t.dirt[0], t.dirt[1], t.dirt[2]); R(g, 3, 5, 3, 2, t.rock); R(g, 10, 11, 3, 2, t.rock);
    }), 4);
    put(scene, k('ledge'), lowres(16, 8, (g) => {
      R(g, 0, 2, 16, 5, t.dirt[0]); surface(g, 0, 3);
      [2, 7, 11].forEach((x) => R(g, x, 7, 2, 1, t.rock));
    }), 4);
    const q = t.liquid;
    put(scene, k('water'), lowres(16, 16, (g) => {
      R(g, 0, 0, 16, 16, q[0]); R(g, 0, 0, 16, 2, q[1]); R(g, 0, 2, 16, 1, q[2]);
      R(g, 2, 6, 5, 1, q[2]); R(g, 10, 10, 4, 1, q[2]); R(g, 5, 13, 4, 1, q[3]);
    }), 4);
    put(scene, k('water_deep'), lowres(16, 16, (g) => {
      R(g, 0, 0, 16, 16, q[3]); R(g, 3, 4, 4, 1, q[0]); R(g, 10, 9, 4, 1, q[0]); R(g, 1, 13, 3, 1, q[4]);
    }), 4);

    put(scene, k('bg_sky'), lowres(1, 9, (g) => t.sky.forEach((c, i) => R(g, 0, i, 1, 1, c))), 120);
    put(scene, k('bg_far'), lowres(256, 270, (g, w, h) => {
      if (t.farKind === 'city') {                                   // a skyline with lit windows
        for (let i = 0; i < 16; i++) {
          const x = i * 16, top = 110 + (i * 37) % 90;
          R(g, x, top, 15, h - top, t.far);
          for (let y = top + 4; y < h - 50; y += 7) for (let wx = x + 2; wx < x + 13; wx += 4) if ((wx * 7 + y * 3 + i) % 5 === 0) R(g, wx, y, 2, 2, t.farHi);
        }
        return;
      }
      for (let x = 0; x < w; x++) {                                 // rolling hills or snow-capped peaks
        const a = x / w * Math.PI * 2;
        const y = Math.round(150 + Math.sin(a * 2) * 34 + Math.sin(a * 5 + 1) * 16 + Math.sin(a * 11) * 5);
        R(g, x, y, 1, h - y, t.far); R(g, x, y, 1, Math.max(2, t.cap + Math.round(Math.sin(a * 9) * 3)), t.farHi);
      }
    }), 4);
    put(scene, k('bg_trees'), lowres(256, 270, (g, w, h) => {
      const col = t.near;
      for (let i = 0; i < 9; i++) {
        const x = (i * 29 + 11) % w, top = 70 + (i * 37) % 80;
        for (const o of [-w, 0, w]) {
          if (t.nearKind === 'palms') {
            R(g, x + o, top, 3, h - top, col);
            for (let f = -3; f <= 3; f++) line(g, x + o + 1, top, x + o + 1 + f * 11, top + 14 + Math.abs(f) * 5, 2, col);
          } else if (t.nearKind === 'towers') {                     // radio masts and pipes
            R(g, x + o, top, 3, h - top, col);
            for (let y = top + 10; y < h - 44; y += 18) R(g, x + o - 5, y, 13, 1, col);
            R(g, x + o, top - 2, 3, 2, '#ff4a4a');
          } else {                                                  // pines
            R(g, x + o, top + 60, 3, h - top, col);
            for (let f = 0; f < 5; f++) R(g, x + o + 1 - (f * 4 + 2), top + f * 14, (f * 4 + 2) * 2 + 1, 15, col);
            R(g, x + o - 1, top, 5, 2, t.farHi);
          }
        }
      }
      R(g, 0, h - 44, w, 44, col);
      for (let x = 0; x < w; x += 5) R(g, x, h - 44 - ((x * 7) % 9), 3, 10, col);
      if (t.nearKind === 'pines') R(g, 0, h - 44, w, 2, t.farHi);
    }), 4);
  }

  // Players 3-5 when the painted sheet is in use: copies of commando A with his blue recoloured.
  // Only strongly blue pixels (trousers, headband) change hue; skin, shirt and rifle are left alone.
  const EXTRA_HUES = { 2: 130, 3: 48, 4: 285 };
  function recolourCommandos(scene, fw, fh, lastFrame) {
    const src = scene.textures.get('commandos').getSourceImage();
    const cols = Math.floor(src.width / fw), h = Math.ceil((lastFrame + 1) / cols) * fh;
    for (const idx in EXTRA_HUES) {
      const key = 'commandos_' + idx;
      if (scene.textures.exists(key)) continue;
      const t = scene.textures.createCanvas(key, src.width, h), g = t.getContext();
      g.drawImage(src, 0, 0);
      const img = g.getImageData(0, 0, src.width, h), d = img.data, target = EXTRA_HUES[idx] / 360;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const r = d[i] / 255, gr = d[i + 1] / 255, b = d[i + 2] / 255;
        const mx = Math.max(r, gr, b), mn = Math.min(r, gr, b), l = (mx + mn) / 2, dl = mx - mn;
        if (dl < 0.08) continue;
        const s = dl / (1 - Math.abs(2 * l - 1));
        let hue = mx === r ? ((gr - b) / dl) % 6 : mx === gr ? (b - r) / dl + 2 : (r - gr) / dl + 4;
        hue = (hue / 6 + 1) % 1;
        if (hue < 0.53 || hue > 0.72 || s < 0.25) continue;                 // not blue: leave it
        const nh = (target + (hue - 0.625) + 1) % 1, c = (1 - Math.abs(2 * l - 1)) * s, m = l - c / 2;
        const x = c * (1 - Math.abs((nh * 6) % 2 - 1)), k = Math.floor(nh * 6);
        const [R2, G2, B2] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k];
        d[i] = (R2 + m) * 255; d[i + 1] = (G2 + m) * 255; d[i + 2] = (B2 + m) * 255;
      }
      g.putImageData(img, 0, 0);
      for (let f = 0; f <= lastFrame; f++) t.add(f, 0, (f % cols) * fw, Math.floor(f / cols) * fh, fw, fh);
      t.refresh();
    }
  }

  return { makeAll, PIX, recolourCommandos };
})();
