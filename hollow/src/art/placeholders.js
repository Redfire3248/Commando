// Placeholder art, drawn in code so the game is playable before any AI sheets exist.
// Every texture key made here is what the sliced AI art will replace later (same keys).
GH.Art = (() => {
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function tex(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;      // real art was loaded under this key — keep it
    const t = scene.textures.createCanvas(key, w, h);
    draw(t.getContext(), w, h);
    t.refresh();
  }
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function glow(ctx, x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function ell(ctx, x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  }
  function poly(ctx, pts, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath(); ctx.fill();
  }

  // ------------------------------------------------------------------ player
  function player(ctx) {            // 96x128, faces right, feet on the bottom edge
    ctx.fillStyle = '#0d1018';
    ctx.fillRect(36, 100, 10, 28); ctx.fillRect(52, 100, 10, 28);
    ctx.fillStyle = '#232a3a';
    ctx.fillRect(34, 122, 14, 6); ctx.fillRect(50, 122, 16, 6);
    // scarf tail
    ctx.fillStyle = '#a3262e';
    ctx.beginPath(); ctx.moveTo(34, 52); ctx.quadraticCurveTo(14, 56, 4, 70); ctx.lineTo(12, 74);
    ctx.quadraticCurveTo(22, 64, 38, 62); ctx.closePath(); ctx.fill();
    // cloak
    const cg = ctx.createLinearGradient(0, 44, 0, 112);
    cg.addColorStop(0, '#2a3350'); cg.addColorStop(1, '#141a2b');
    poly(ctx, [[30, 50], [68, 50], [80, 104], [72, 110], [66, 104], [58, 112], [50, 104], [42, 111], [34, 104], [26, 110], [18, 104]], cg);
    ctx.strokeStyle = 'rgba(140,200,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(68, 52); ctx.lineTo(79, 102); ctx.stroke();
    // scarf
    ell(ctx, 49, 52, 22, 8, '#c4323b');
    ctx.fillStyle = '#e0525a'; ctx.fillRect(40, 47, 22, 3);
    // hood
    const hg = ctx.createRadialGradient(56, 24, 4, 50, 32, 30);
    hg.addColorStop(0, '#3a4566'); hg.addColorStop(1, '#161c2e');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(30, 46); ctx.quadraticCurveTo(24, 10, 50, 6); ctx.quadraticCurveTo(76, 8, 72, 46);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(40, 10); ctx.quadraticCurveTo(30, 0, 20, 4); ctx.quadraticCurveTo(30, 10, 33, 22);
    ctx.closePath(); ctx.fill();
    // face + eyes
    ell(ctx, 57, 30, 12, 13, '#04050a');
    ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 10;
    ell(ctx, 54, 30, 2.6, 4, '#bffbff'); ell(ctx, 62, 30, 2.6, 4, '#bffbff');
    ctx.shadowBlur = 0;
  }

  function gun(ctx) {               // 72x22, pivot near the left
    ctx.fillStyle = '#3b4254'; ctx.fillRect(4, 6, 44, 10);
    ctx.fillStyle = '#6a7489'; ctx.fillRect(4, 6, 44, 3);
    ctx.fillStyle = '#262b38'; ctx.fillRect(46, 8, 24, 6);
    ctx.fillStyle = '#1a1e28'; ctx.fillRect(10, 14, 9, 8);
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(30, 10, 6, 3);
  }

  // ------------------------------------------------------------------ weapon icons (128x56)
  function weaponIcon(ctx, w) {
    const c = w.color, metal = '#2c3242', mid = '#434b5e', hi = '#6a7489', wood = '#5a3a24';
    const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); };
    const on = () => { ctx.shadowColor = c; ctx.shadowBlur = 10; };
    const off = () => { ctx.shadowBlur = 0; };
    switch (w.id) {
      case 'pistol':
        R(30, 18, 46, 16, mid); R(30, 18, 46, 4, hi); R(74, 21, 24, 9, metal); R(38, 32, 14, 18, metal);
        on(); R(56, 24, 10, 4, c); off(); break;
      case 'spread':
        R(14, 20, 64, 18, mid); R(14, 20, 64, 4, hi); R(4, 22, 14, 20, metal); R(34, 36, 12, 16, metal);
        [-0.35, 0, 0.35].forEach((a) => {
          ctx.save(); ctx.translate(76, 29); ctx.rotate(a);
          R(0, -4, 36, 8, metal); on(); R(30, -3, 6, 6, c); off();
          ctx.restore();
        });
        on(); R(30, 26, 30, 4, c); off(); break;
      case 'laser':
        R(10, 18, 74, 20, mid); R(10, 18, 74, 4, hi); R(84, 23, 36, 10, metal); R(2, 22, 12, 18, metal); R(40, 36, 12, 16, metal);
        on(); R(86, 26, 34, 4, c); ell(ctx, 30, 29, 6, 6, c); off(); break;
      case 'flame':
        R(12, 14, 70, 18, mid); R(12, 14, 70, 4, hi); R(82, 12, 28, 22, metal); R(106, 9, 12, 28, mid); R(4, 16, 12, 16, metal);
        on(); ell(ctx, 46, 42, 26, 9, c); off(); break;
      case 'homing':
        R(8, 14, 96, 24, mid); R(8, 14, 96, 4, hi); R(104, 11, 16, 30, metal); R(40, 36, 12, 16, metal);
        on(); for (let i = 0; i < 3; i++) R(24 + i * 22, 22, 12, 8, c); off(); break;
      case 'shotgun':
        R(4, 24, 26, 16, wood); R(28, 20, 40, 16, mid); R(28, 20, 40, 4, hi);
        R(66, 20, 58, 6, metal); R(66, 28, 58, 6, metal); R(38, 34, 12, 16, wood);
        on(); R(50, 27, 8, 4, c); off(); break;
      case 'rail':
        R(2, 22, 20, 16, metal); R(20, 18, 40, 20, mid); R(20, 18, 40, 4, hi); R(58, 24, 68, 6, metal); R(30, 36, 12, 16, metal);
        on(); for (let i = 0; i < 5; i++) R(64 + i * 12, 20, 5, 14, c); off(); break;
      default:
        R(10, 18, 80, 18, mid); R(10, 18, 80, 4, hi); R(88, 22, 30, 8, metal); R(36, 34, 12, 16, metal);
        on(); R(50, 24, 14, 4, c); off();
    }
  }

  function orb(ctx, color, glyph) { // 72x72 ability orb
    glow(ctx, 36, 36, 36, [[0, rgba(color, 0.95)], [0.45, rgba(color, 0.4)], [1, rgba(color, 0)]]);
    glow(ctx, 36, 36, 17, [[0, '#ffffff'], [1, rgba(color, 0.9)]]);
    ctx.strokeStyle = '#0b0f1a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (glyph === 'wings') { ctx.moveTo(27, 42); ctx.lineTo(36, 33); ctx.lineTo(45, 42); ctx.moveTo(27, 34); ctx.lineTo(36, 25); ctx.lineTo(45, 34); }
    if (glyph === 'claw') { for (let i = 0; i < 3; i++) { ctx.moveTo(30 + i * 7, 27); ctx.lineTo(26 + i * 7, 45); } }
    if (glyph === 'dash') { ctx.moveTo(27, 28); ctx.lineTo(35, 36); ctx.lineTo(27, 44); ctx.moveTo(37, 28); ctx.lineTo(45, 36); ctx.lineTo(37, 44); }
    ctx.stroke();
  }

  // ------------------------------------------------------------------ enemies (face right)
  function crawler(ctx) {           // 132x84 (drawn on a 110x70 grid, scaled up)
    ctx.scale(1.2, 1.2);
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const x = 24 + i * 18; ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x - 6, 68); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, 14, 0, 56);
    g.addColorStop(0, '#b0703a'); g.addColorStop(1, '#5a3218');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(50, 52, 44, 36, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,0.7)'; ctx.lineWidth = 2;
    [26, 46, 66].forEach((x) => { ctx.beginPath(); ctx.ellipse(x, 52, 14, 34, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(8, 50, 88, 6);
    ell(ctx, 94, 46, 14, 13, '#e2d9c6');
    ell(ctx, 99, 44, 4, 5, '#0a0a0a');
  }
  function hopper(ctx) {            // 84x84
    ctx.strokeStyle = '#1f3a2a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[24, 58, 12, 66, 22, 82], [58, 58, 72, 66, 62, 82]].forEach((l) => {
      ctx.beginPath(); ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.lineTo(l[4], l[5]); ctx.stroke();
    });
    const g = ctx.createRadialGradient(48, 32, 4, 42, 42, 30);
    g.addColorStop(0, '#6fb58a'); g.addColorStop(1, '#274636');
    ell(ctx, 42, 44, 27, 25, g);
    ell(ctx, 40, 54, 16, 10, 'rgba(200,240,210,0.18)');
    poly(ctx, [[28, 24], [22, 6], [36, 20]], '#274636');
    poly(ctx, [[50, 20], [60, 4], [58, 24]], '#274636');
    ell(ctx, 54, 38, 9, 9, '#f4f1e6');
    ell(ctx, 57, 38, 4, 5, '#0a0a0a');
  }
  function turret(ctx) {            // 90x90
    ctx.strokeStyle = '#1d1430'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [30, 45, 60].forEach((x, i) => {
      ctx.beginPath(); ctx.moveTo(x, 62); ctx.quadraticCurveTo(x + (i - 1) * 10, 76, x + (i - 1) * 4, 88); ctx.stroke();
    });
    const g = ctx.createRadialGradient(52, 30, 4, 45, 40, 32);
    g.addColorStop(0, '#5a4382'); g.addColorStop(1, '#150f22');
    ell(ctx, 45, 40, 31, 30, g);
    ctx.shadowColor = '#ff5ad6'; ctx.shadowBlur = 14;
    ell(ctx, 52, 40, 14, 14, '#ff7ae0');
    ctx.shadowBlur = 0;
    ell(ctx, 54, 40, 4, 10, '#12061a');
  }

  // ------------------------------------------------------------------ world
  function stone(ctx, w, h, base) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
      const s = rnd(4, 14);
      ctx.fillRect(rnd(0, w - s) | 0, rnd(0, h - s) | 0, s, s * rnd(0.4, 1));
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    let x = rnd(8, w - 8), y = rnd(4, 20);
    ctx.moveTo(x, y);
    for (let i = 0; i < 3; i++) { x += rnd(-14, 14); y += rnd(8, 16); ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
  function tileTop(ctx, w, h) {
    stone(ctx, w, h, '#1b1f2d');
    ctx.fillStyle = '#2f4a44'; ctx.fillRect(0, 0, w, 10);
    for (let x = 2; x < w; x += rnd(5, 11)) ctx.fillRect(x | 0, 10, 3, rnd(2, 9));
    ctx.fillStyle = '#7fb0a0'; ctx.fillRect(0, 0, w, 2);
  }
  function platform(ctx, w) {       // 64x20
    const g = ctx.createLinearGradient(0, 2, 0, 16);
    g.addColorStop(0, '#54486a'); g.addColorStop(1, '#231d2e');
    ctx.fillStyle = g; ctx.fillRect(0, 2, w, 14);
    ctx.fillStyle = '#9a8ab4'; ctx.fillRect(0, 2, w, 2);
    ctx.fillStyle = '#16121d'; ctx.fillRect(28, 16, 8, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(6, 8, 3, 3); ctx.fillRect(55, 8, 3, 3);
  }
  function spikes(ctx, w, h) {      // 64x64, points up
    for (let i = 0; i < 4; i++) {
      const x = i * 16, g = ctx.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, '#efe8d8'); g.addColorStop(1, '#6b6358');
      poly(ctx, [[x, h], [x + 8, 22 + (i % 2) * 6], [x + 16, h]], g);
    }
  }
  function bench(ctx) {             // 140x70
    ctx.fillStyle = '#2b3042'; ctx.fillRect(16, 40, 10, 30); ctx.fillRect(114, 40, 10, 30);
    ctx.fillRect(18, 4, 8, 30); ctx.fillRect(114, 4, 8, 30);
    const g = ctx.createLinearGradient(0, 30, 0, 44);
    g.addColorStop(0, '#6b7390'); g.addColorStop(1, '#3a4058');
    ctx.fillStyle = g; ctx.fillRect(6, 32, 128, 12);
    ctx.fillStyle = '#4a5068'; ctx.fillRect(14, 8, 112, 8);
    ctx.fillStyle = '#9aa4c4'; ctx.fillRect(6, 32, 128, 2);
  }

  function bgLayer(ctx, w, h, color, count, big) {
    const wrap = (fn) => { [-w, 0, w].forEach((o) => { ctx.save(); ctx.translate(o, 0); fn(); ctx.restore(); }); };
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {         // stalactites
      const x = rnd(0, w), hw = rnd(20, big ? 110 : 70), len = rnd(120, big ? 520 : 380);
      wrap(() => poly(ctx, [[x - hw, 0], [x + hw, 0], [x + rnd(-10, 10), len]], color));
    }
    for (let i = 0; i < count; i++) {         // stalagmites / broken pillars
      const x = rnd(0, w), hw = rnd(30, big ? 150 : 90), top = h - rnd(160, big ? 640 : 460);
      wrap(() => poly(ctx, [[x - hw, h], [x - hw * 0.5, top + 60], [x - hw * 0.15, top], [x + hw * 0.3, top + 40], [x + hw, h]], color));
    }
    if (big) {                                // hanging chains
      ctx.strokeStyle = color; ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        const x = rnd(0, w), len = rnd(200, 520);
        ctx.setLineDash([10, 6]);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  function hood(ctx, full) {        // 48x58 health icon
    ctx.beginPath(); ctx.moveTo(6, 54); ctx.quadraticCurveTo(0, 12, 24, 4); ctx.quadraticCurveTo(48, 12, 42, 54); ctx.closePath();
    if (full) {
      const g = ctx.createLinearGradient(0, 0, 0, 58);
      g.addColorStop(0, '#fbf7ee'); g.addColorStop(1, '#b3ab9c');
      ctx.fillStyle = g; ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ell(ctx, 25, 33, 11, 13, full ? '#0a0c14' : 'rgba(255,255,255,0.07)');
    if (full) {
      ctx.shadowColor = '#6ff3ff'; ctx.shadowBlur = 8;
      ell(ctx, 21, 33, 2.2, 3.6, '#bffbff'); ell(ctx, 29, 33, 2.2, 3.6, '#bffbff');
      ctx.shadowBlur = 0;
    }
  }

  function vignette(ctx, w, h, color, inner, strength) {
    const g = ctx.createRadialGradient(w / 2, h / 2, inner, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, strength));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------------------------ build everything
  function makeAll(scene) {
    tex(scene, 'player', 96, 128, player);
    tex(scene, 'gun', 72, 22, gun);
    GH.DATA.weapons.forEach((w) => tex(scene, 'w_' + w.id, 128, 56, (ctx) => weaponIcon(ctx, w)));
    for (const id in GH.DATA.abilities) {
      const a = GH.DATA.abilities[id];
      tex(scene, 'orb_' + id, 72, 72, (ctx) => orb(ctx, a.color, a.glyph));
    }

    tex(scene, 'e_crawler', 132, 84, crawler);
    tex(scene, 'e_hopper', 84, 84, hopper);
    tex(scene, 'e_turret', 90, 90, turret);

    for (let i = 0; i < 3; i++) tex(scene, 'tile_in' + i, 64, 64, (ctx, w, h) => stone(ctx, w, h, '#151824'));
    tex(scene, 'tile_top', 64, 64, tileTop);
    tex(scene, 'tile_plat', 64, 20, platform);
    tex(scene, 'spikes', 64, 64, spikes);
    tex(scene, 'bench', 140, 70, bench);

    // bullets
    const W = '#ffffff';
    tex(scene, 'b_pistol', 20, 20, (c) => glow(c, 10, 10, 10, [[0, W], [0.35, '#ffd27a'], [1, 'rgba(255,210,122,0)']]));
    tex(scene, 'b_spread', 26, 26, (c) => glow(c, 13, 13, 13, [[0, W], [0.35, '#ff5a5a'], [1, 'rgba(255,90,90,0)']]));
    tex(scene, 'b_shotgun', 14, 14, (c) => glow(c, 7, 7, 7, [[0, W], [0.5, '#e8e8e8'], [1, 'rgba(232,232,232,0)']]));
    tex(scene, 'b_flame', 40, 40, (c) => glow(c, 20, 20, 20, [[0, '#fff3c0'], [0.3, '#ff9a3c'], [0.7, 'rgba(220,60,20,0.5)'], [1, 'rgba(220,60,20,0)']]));
    tex(scene, 'b_laser', 60, 12, (c) => {
      c.shadowColor = '#5ae8ff'; c.shadowBlur = 8;
      c.fillStyle = '#5ae8ff'; c.fillRect(6, 3, 48, 6);
      c.shadowBlur = 0; c.fillStyle = W; c.fillRect(10, 5, 40, 2);
    });
    tex(scene, 'b_rail', 130, 14, (c) => {
      const g = c.createLinearGradient(0, 0, 130, 0);
      g.addColorStop(0, 'rgba(224,179,255,0)'); g.addColorStop(0.7, '#c98bff'); g.addColorStop(1, W);
      c.shadowColor = '#c98bff'; c.shadowBlur = 8;
      c.fillStyle = g; c.fillRect(4, 4, 122, 6);
      c.shadowBlur = 0; c.fillStyle = W; c.fillRect(60, 6, 66, 2);
    });
    tex(scene, 'b_homing', 30, 16, (c) => {
      c.shadowColor = '#b67cff'; c.shadowBlur = 8;
      poly(c, [[4, 3], [20, 3], [28, 8], [20, 13], [4, 13]], '#b67cff');
      c.shadowBlur = 0; c.fillStyle = W; c.fillRect(8, 6, 10, 4);
    });
    tex(scene, 'eb', 28, 28, (c) => {
      glow(c, 14, 14, 14, [[0, '#ffd0f4'], [0.4, '#ff4fd0'], [1, 'rgba(255,79,208,0)']]);
      ell(c, 14, 14, 4, 4, '#3a0a30');
    });

    // fx
    tex(scene, 'spark', 16, 16, (c) => glow(c, 8, 8, 8, [[0, W], [0.4, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]));
    tex(scene, 'glow', 128, 128, (c) => glow(c, 64, 64, 64, [[0, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]));
    tex(scene, 'flash', 64, 64, (c) => {
      glow(c, 32, 32, 30, [[0, W], [0.3, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
      poly(c, [[20, 32], [62, 26], [62, 38]], 'rgba(255,255,255,0.9)');
    });
    tex(scene, 'slash', 200, 140, (c) => {
      const g = c.createLinearGradient(0, 0, 200, 0);
      g.addColorStop(0.25, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(200,240,255,0.75)'); g.addColorStop(1, W);
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(70, 70, 125, 66, 0, -Math.PI / 2, Math.PI / 2);
      c.ellipse(52, 70, 100, 50, 0, Math.PI / 2, -Math.PI / 2, true);
      c.closePath(); c.fill();
    });
    tex(scene, 'shard', 22, 28, (c) => {
      const g = c.createLinearGradient(0, 0, 22, 28);
      g.addColorStop(0, '#f0fdff'); g.addColorStop(1, '#3fb8e0');
      c.shadowColor = '#6ff3ff'; c.shadowBlur = 5;
      poly(c, [[11, 2], [20, 14], [11, 26], [2, 14]], g);
      c.shadowBlur = 0;
      poly(c, [[11, 2], [14, 14], [11, 26], [8, 14]], 'rgba(255,255,255,0.55)');
    });
    tex(scene, 'cache', 72, 72, (c) => {
      glow(c, 36, 36, 36, [[0, '#0a0612'], [0.55, '#2a1245'], [0.8, 'rgba(180,110,255,0.55)'], [1, 'rgba(180,110,255,0)']]);
      [[28, 30], [42, 26], [36, 44]].forEach(([x, y]) => poly(c, [[x, y - 7], [x + 5, y], [x, y + 7], [x - 5, y]], '#bffbff'));
    });

    // hud
    tex(scene, 'mask', 48, 58, (c) => hood(c, true));
    tex(scene, 'mask_empty', 48, 58, (c) => hood(c, false));
    tex(scene, 'vignette', 960, 540, (c, w, h) => vignette(c, w, h, '#000000', 180, 0.82));
    tex(scene, 'vignette_red', 960, 540, (c, w, h) => vignette(c, w, h, '#ff1430', 220, 0.6));

    // background
    tex(scene, 'bg_grad', 16, 1080, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#141d33'); g.addColorStop(0.55, '#0a0e19'); g.addColorStop(1, '#0d1420');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    tex(scene, 'bg_far', 1024, 1080, (c, w, h) => bgLayer(c, w, h, '#111828', 9, false));
    tex(scene, 'bg_mid', 1024, 1080, (c, w, h) => bgLayer(c, w, h, '#0a0e18', 6, true));
  }

  return { makeAll };
})();
