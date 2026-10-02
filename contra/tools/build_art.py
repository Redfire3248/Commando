"""Slices the raw AI sheets in contra/assets/ into game-ready art.

    python contra/tools/build_art.py

It ONLY slices: every pixel is copied exactly as it is in your sheet — no background removal, no
resizing, no clean-up. The game scales the full-resolution frames when it draws them.

Reads   contra/assets/commandos.png      (10x5: two commandos + rifle, bullet, flashes, badges, capsule)
Writes  contra/assets/atlas/*.png  and  contra/src/art.gen.js  (the list the game loads at boot)
Anything missing keeps its code-drawn placeholder.  Needs: pip install pillow numpy scipy
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'assets', 'atlas')
COLS, ROWS = 10, 5
manifest = {'images': {}, 'sheets': {}, 'scale': {}}


def load(name):
    p = os.path.join(ROOT, 'assets', name)
    if not os.path.exists(p):
        print('  (missing, skipped)', name)
        return None
    return np.array(Image.open(p).convert('RGBA'))


def save(img, key):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, key + '.png'))
    return 'assets/atlas/' + key + '.png'


def cut_cells(a, thr=30, grow=4, min_area=40):
    """Works out which grid cell every painted shape belongs to (by where its middle is), so a sprite
    that strays over a grid line still comes out whole. Returns {cell index: (RGBA array, x0, y0)}."""
    H, W = a.shape[:2]
    cw, ch = W / COLS, H / ROWS
    mask = a[..., 3] > thr
    lab, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=grow))
    owner = np.full((H, W), -1, int)
    gx = np.minimum(COLS - 1, (np.arange(W) // cw).astype(int))[None, :].repeat(H, 0)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        part = lab[sl] == i + 1
        if (part & mask[sl]).sum() < min_area:
            continue
        ys, xs = np.nonzero(part)
        row = min(ROWS - 1, int((ys.mean() + sl[0].start) // ch))
        if sl[1].stop - sl[1].start > 1.45 * cw:          # two neighbours touch: split on the grid line
            owner[sl][part] = (row * COLS + gx[sl])[part]
        else:
            owner[sl][part] = row * COLS + min(COLS - 1, int((xs.mean() + sl[1].start) // cw))
    cells = {}
    for idx in range(COLS * ROWS):
        m = (owner == idx) & (a[..., 3] > 0)
        if not m.any():
            continue
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = a[y0:y1, x0:x1].copy()
        crop[~m[y0:y1, x0:x1]] = 0
        cells[idx] = (crop, x0, y0)
    return cells


# ------------------------------------------------------------------------------------ the two commandos
# Cells within one commando's two rows (0-19). Row 2 has an empty cell at position 16.
POSES = [
    ('run_fwd', [0, 1, 2, 3, 4, 5], 'feet', (1, 0)),
    ('stand_fwd', [6], 'feet', (1, 0)), ('stand_up', [7], 'feet', (0, -1)),
    ('stand_dup', [8], 'feet', (1, -1)), ('stand_ddown', [9], 'feet', (1, 1)),
    ('run_dup', [10, 11, 12], 'feet', (1, -1)), ('run_ddown', [13, 14], 'feet', (1, 1)),
    ('prone', [15], 'feet', (1, 0)), ('ball', [17, 18], 'mid', None), ('death', [19], 'mid', None),
]
MUZZLE = {'fwd': 'stand_fwd', 'up': 'stand_up', 'dup': 'run_dup', 'ddown': 'run_ddown', 'prone': 'prone'}
CELL, OX, BASE = 288, 144, 240


def build_commandos(a):
    H, W = a.shape[:2]
    cw = W / COLS
    cells = cut_cells(a)
    frames, players = [], []
    stand_h = cells[6][0].shape[0]
    for who in range(2):
        first = who * 2 * COLS
        anims, tips = {}, {}
        for name, idxs, mode, aim in POSES:
            start = len(frames)
            for k in idxs:
                if first + k not in cells:
                    print('  commandos: no sprite found in cell', first + k, '(', name, ') — skipped this sheet')
                    return
                crop, x0, y0 = cells[first + k]
                h, w = crop.shape[:2]
                # keep each sprite where the artist put it inside its cell, left to right
                x = OX + x0 - ((first + k) % COLS + 0.5) * cw
                y = BASE - h if mode == 'feet' else BASE - stand_h / 2 - h / 2
                if mode == 'mid':
                    x = OX - w / 2
                frames.append((crop, round(x), round(y)))
                if aim and k == idxs[0]:                     # rifle tip = the solid pixel furthest along the aim
                    ys, xs = np.nonzero(crop[..., 3] > 150)
                    i = int(np.argmax(xs * aim[0] + ys * aim[1]))
                    tips[name] = [int(round(x) + xs[i] - OX), int(round(y) + ys[i] - BASE)]
            anims[name] = [start, len(frames) - 1]
        players.append({'anims': anims, 'muzzle': {k: tips[v] for k, v in MUZZLE.items()}})
    cols = 8
    sheet = Image.new('RGBA', (cols * CELL, -(-len(frames) // cols) * CELL), (0, 0, 0, 0))
    for i, (crop, x, y) in enumerate(frames):
        cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
        cell.paste(Image.fromarray(crop), (x, y))
        sheet.paste(cell, ((i % cols) * CELL, (i // cols) * CELL))
    manifest['sheets']['commandos'] = {'path': save(sheet, 'commandos'), 'fw': CELL, 'fh': CELL}
    manifest['players'] = players
    manifest['originY'] = BASE / CELL
    manifest['playerScale'] = round(132 / stand_h, 4)
    print('  commandos:', len(frames), 'frames, standing height', stand_h, 'px')

    # row 5: bullet, muzzle flash, badges, capsule — each with the width it is DRAWN at in game
    items = [(41, 'bullet', 46), (42, 'flash', 90), (46, 'pk_rapid', 84), (47, 'pk_barrier', 84), (48, 'pk_life', 56), (49, 'e_flyer', 120)]
    for idx, key, width in items:
        if idx not in cells:
            continue
        img = Image.fromarray(cells[idx][0])
        manifest['images'][key] = save(img, key)
        manifest['scale'][key] = round(width / img.width, 4)


# ------------------------------------------------------------------------------------ enemies, machines, effects, jungle tiles
# enemies_tiles.png, 10x5:  row 1 runner (run 6, jump 2, death 2) · row 2 rifleman (aim fwd, diag-up, up,
# diag-down, down, firing, kneeling, death 3) · row 3 turret base, turret barrel, wreck, cannon housing, cannon
# barrel, core intact / damaged / destroyed, enemy bullet, wall panel · row 4 explosion 4, splash 2, fern, boulder,
# crate, ledge · row 5 ground tops 3, inner earth 2, left cliff, right cliff, water surface, deep water, steel wall
IMAGES = [  # (cell, texture key, width it is DRAWN at in game; 0 = drawn by the terrain code at tile size)
    (20, 'e_turret', 112), (21, 'e_barrel', 84), (22, 'e_wreck', 120), (23, 'boss_cannon', 116), (24, 'boss_barrel', 140),
    (25, 'boss_core', 132), (26, 'boss_core_dmg', 132), (27, 'boss_core_dead', 132), (28, 'ebullet', 30),
    (36, 'prop_fern', 120), (37, 'prop_rock', 104), (38, 'prop_crate', 84), (39, 'ledge_jungle', 0),
]
TILES = [  # (cell, texture key) — solid squares, drawn 64x64
    (40, 'g_top_jungle'), (41, 'g_top_jungle_1'), (42, 'g_top_jungle_2'), (43, 'g_in_jungle'), (44, 'g_in_jungle_1'),
    (45, 'g_left_jungle'), (46, 'g_right_jungle'), (47, 'water_jungle'), (48, 'water_deep_jungle'), (49, 'boss_wall'),
]


def strip(cells, idxs, a, key, cw_, ch_=200, base=196):
    """Soldier frames side by side, feet on one line, each kept where the artist put it inside its cell."""
    H, W = a.shape[:2]
    cw = W / COLS
    sheet = Image.new('RGBA', (len(idxs) * cw_, ch_), (0, 0, 0, 0))
    for i, k in enumerate(idxs):
        crop, x0, _ = cells[k]
        h = crop.shape[0]
        x = cw_ / 2 + x0 - ((k % COLS) + 0.5) * cw
        sheet.paste(Image.fromarray(crop), (i * cw_ + round(x), base - h))
    manifest['sheets'][key] = {'path': save(sheet, key), 'fw': cw_, 'fh': ch_}


def solid_square(crop):
    """The opaque part of a tile cell: rows and columns that are almost fully solid (pixels unchanged)."""
    solid = crop[..., 3] > 200
    rows, cols = np.nonzero(solid.mean(1) > 0.85)[0], np.nonzero(solid.mean(0) > 0.85)[0]
    if not len(rows) or not len(cols):
        return crop
    return crop[rows.min():rows.max() + 1, cols.min():cols.max() + 1]


def clean_tile(crop, rows=True):
    """A ground tile cut from a sheet where the tiles touch: the cut can carry a strip of the neighbouring tile and a
    light border line along its edges, which show as seams when tiles are laid side by side. Edge columns (and rows)
    whose colour is far from the tile's own middle are cut off — at most a fifth of the tile on each side. Pixels
    inside are left untouched."""
    t = solid_square(crop)
    rgb = t[..., :3].astype(float)

    mid = np.median(rgb[int(rgb.shape[0] * 0.25):int(rgb.shape[0] * 0.75), int(rgb.shape[1] * 0.25):int(rgb.shape[1] * 0.75)].reshape(-1, 3), axis=0)
    off = np.abs(rgb - mid).mean(2) > 38          # pixels far from the tile's own colour

    def keep(frac, n):                             # frac: share of "far" pixels in each column / row
        lo, hi = 0, n
        while lo < n * 0.2 and frac[lo] > 0.45:
            lo += 1
        while hi > n * 0.8 and frac[hi - 1] > 0.45:
            hi -= 1
        return lo, hi
    x0, x1 = keep(off.mean(0), t.shape[1])
    y0, y1 = keep(off.mean(1), t.shape[0])
    if not rows:                                   # top pieces keep their top edge (stripes, grass, snow)
        y0 = 0
    t = t[y0:y1, x0:x1]
    # then a thin even margin off every side that can touch another tile (slivers the colour test can't see)
    mx = round(t.shape[1] * (0.1 if rows else 0.06))
    my = round(t.shape[0] * 0.05) if rows else 0
    return t[my:t.shape[0] - (my or round(t.shape[0] * 0.03)), mx:t.shape[1] - mx]


def build_enemies(a):
    cells = cut_cells(a)
    missing = [k for k in list(range(0, 40)) + [t for t, _ in TILES] if k not in cells]
    if missing:
        print('  enemies_tiles: nothing found in cells', missing, '— those keep the pixel art')
    if all(k in cells for k in range(0, 20)):
        strip(cells, list(range(0, 10)), a, 'sheet_runner', 208)
        strip(cells, list(range(10, 20)), a, 'sheet_rifle', 224)
        manifest['enemyScale'] = round(132 / cells[10][0].shape[0], 4)     # same height as the commandos
    if all(k in cells for k in range(30, 36)):
        boom, splash = [cells[k][0] for k in range(30, 34)], [cells[k][0] for k in (34, 35)]
        for key, crops in (('fx_boom', boom), ('fx_splash', splash)):
            fw, fh = max(c.shape[1] for c in crops), max(c.shape[0] for c in crops)
            img = Image.new('RGBA', (fw * len(crops), fh), (0, 0, 0, 0))
            for i, c in enumerate(crops):        # explosions centred, splashes standing on the water line
                img.paste(Image.fromarray(c), (i * fw + (fw - c.shape[1]) // 2, (fh - c.shape[0]) // (2 if key == 'fx_boom' else 1)))
            manifest['sheets'][key] = {'path': save(img, key), 'fw': fw, 'fh': fh}
        manifest['scale']['fx_boom'] = round(96 / max(c.shape[1] for c in boom), 4)
        manifest['scale']['fx_splash'] = round(150 / max(c.shape[1] for c in splash), 4)
    for idx, key, width in IMAGES:
        if idx in cells:
            img = Image.fromarray(cells[idx][0])
            manifest['images'][key] = save(img, key)
            if width:
                manifest['scale'][key] = round(width / img.width, 4)
    for idx, key in TILES:
        if idx in cells:
            manifest['images'][key] = save(Image.fromarray(clean_tile(cells[idx][0], rows=key.startswith('g_in'))), key)
    print('  enemies, machines, effects, jungle tiles:', len(cells), 'sprites')


# ------------------------------------------------------------------------------------ Steel Yard + Frozen Pass terrain, props
# terrain2.png, 10x5: row 1 Steel Yard tiles · row 2 Steel Yard ledge + props · row 3 Frozen Pass tiles ·
# row 4 Frozen Pass ledge + props · row 5 jungle extras
TILE_NAMES = ['g_top', 'g_top_1', 'g_top_2', 'g_in', 'g_in_1', 'g_left', 'g_right', 'water', 'water_deep', 'wall']
PROP_HEIGHT = {  # cell: height it is DRAWN at in game (px); cells not listed are not used as scenery
    11: 110, 12: 96, 13: 80, 14: 150, 15: 80, 16: 220, 17: 120, 18: 110, 19: 100,
    31: 190, 32: 96, 33: 90, 34: 100, 35: 60, 36: 90, 37: 180, 38: 130, 39: 80,
    40: 260, 41: 200, 43: 260, 45: 140, 46: 100, 47: 70, 48: 140,
}
PROP_THEME = {1: 'base', 3: 'snow', 4: 'jungle'}          # sheet row -> stage theme


def tile_key(name, theme):
    """g_top -> g_top_base, g_top_1 -> g_top_base_1 (the names the game looks for)."""
    if name[-2:] in ('_1', '_2'):
        return name[:-2] + '_' + theme + name[-2:]
    return name + '_' + theme


def build_terrain2(a):
    cells = cut_cells(a)
    cw = a.shape[1] / COLS
    for row, theme in ((0, 'base'), (2, 'snow')):
        for i, name in enumerate(TILE_NAMES):
            idx = row * COLS + i
            if idx not in cells:
                continue
            crop = cells[idx][0]
            if crop.shape[1] < 0.8 * cw:              # an edge piece drawn narrower than a full square: not usable as a tile
                print('  terrain2: cell', idx, '(' + name + ', ' + theme + ') is not a full square — skipped')
                continue
            key = tile_key(name, theme)
            manifest['images'][key] = save(Image.fromarray(clean_tile(crop, rows=name.startswith('g_in'))), key)
    for idx, theme in ((10, 'base'), (30, 'snow')):
        if idx in cells:
            manifest['images']['ledge_' + theme] = save(Image.fromarray(cells[idx][0]), 'ledge_' + theme)
    props = manifest.setdefault('props', {'jungle': ['prop_fern', 'prop_rock', 'prop_crate']})
    for idx, height in PROP_HEIGHT.items():
        if idx not in cells:
            continue
        theme, key = PROP_THEME[idx // COLS], 'prop_' + str(idx)
        img = Image.fromarray(cells[idx][0])
        manifest['images'][key] = save(img, key)
        manifest['scale'][key] = round(height / img.height, 4)
        props.setdefault(theme, []).append(key)
    print('  Steel Yard + Frozen Pass terrain and props:', len(cells), 'sprites')



# ------------------------------------------------------------------------------------ season 2: pixel-art agents, UI, ability effects
AGENT_IDS = ['razor', 'nova', 'kite', 'brick', 'volt']
# Which sheet row holds each agent's first row (run forward + standing) and second row (diagonal runs, prone,
# jump, death). The sheet made on 2026-10-01 has 8 rows: Kite only got her first row and Volt only his second,
# so the missing poses borrow that agent's nearest frames (see AGENT_FALLBACK) until a fixed sheet arrives.
AGENT_ROWS = {'razor': (0, 1), 'nova': (2, 3), 'kite': (4, None), 'brick': (5, 6), 'volt': (None, 7)}
# pose name: (row 'A' or 'B', sprites, how to line it up, aim direction for the muzzle)
AGENT_POSES = [
    ('run_fwd', 'A', [0, 1, 2, 3, 4, 5], 'feet', (1, 0)),
    ('stand_fwd', 'A', [6], 'feet', (1, 0)), ('stand_up', 'A', [7], 'feet', (0, -1)),
    ('stand_dup', 'A', [8], 'feet', (1, -1)), ('stand_ddown', 'A', [9], 'feet', (1, 1)),
    ('run_dup', 'B', [0, 1, 2], 'feet', (1, -1)), ('run_ddown', 'B', [3, 4, 5], 'feet', (1, 1)),
    ('prone', 'B', [6], 'feet', (1, 0)), ('ball', 'B', [7, 8], 'mid', None), ('death', 'B', [9], 'mid', None),
]
# agents2.png (10x8): four more agents, two rows each. Its bottom row (Atlas's second row) was cut off at the
# bottom edge of the image, so from that row only the prone pose is used (AGENT_ONLY); the rest borrow his own
# first-row frames like any missing row.
AGENT_IDS2 = ['ghost', 'hammer', 'viper', 'atlas']
AGENT_ROWS2 = {'ghost': (0, 1), 'hammer': (2, 3), 'viper': (4, 5), 'atlas': (6, 7)}
AGENT_ONLY = {'atlas': {'B': ['prone']}}
# stand-ins for a missing row: pose -> (row, sprites)
AGENT_FALLBACK = {
    'B': {'run_dup': ('A', [0, 1, 2]), 'run_ddown': ('A', [3, 4, 5]), 'prone': ('A', [9]),
          'ball': ('A', [4]), 'death': ('A', [6])},
    'A': {'run_fwd': ('B', [3, 4, 5]), 'stand_fwd': ('B', [3]), 'stand_up': ('B', [0]),
          'stand_dup': ('B', [0]), 'stand_ddown': ('B', [4])},
}


def sprite_rows(a, thr=30):
    """Splits a sheet into rows (bands with empty space between them) and the sprites in each row, left to
    right. Returns [[(crop, x0, y0), ...], ...] with pixels copied untouched."""
    m = a[..., 3] > thr
    proj = m.sum(1)
    bands, start = [], None
    for y, v in enumerate(proj):
        if v and start is None:
            start = y
        if not v and start is not None:
            bands.append((start, y)); start = None
    if start is not None:
        bands.append((start, len(proj)))
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=2))
    rows = []
    for b0, b1 in bands:
        sub = lab[b0:b1]
        sprites = []
        for i, sl in enumerate(ndimage.find_objects(sub)):
            if sl is None:
                continue
            part = (sub[sl] == i + 1) & m[b0:b1][sl]
            if part.sum() < 150:
                continue
            y0, x0 = b0 + sl[0].start, sl[1].start
            crop = a[y0:y0 + part.shape[0], x0:x0 + part.shape[1]].copy()
            crop[~part] = 0
            sprites.append((crop, x0, y0))
        rows.append(sorted(sprites, key=lambda s: s[1]))
    return [r for r in rows if r]


def build_agents():
    a = load('agents.png')
    if a is None:
        return
    rows = sprite_rows(a)
    print('  agents: sprites per row', [len(r) for r in rows])
    main_cw = a.shape[1] / 10
    srcs = [(r, main_cw, 1.0) for r in rows]            # (sprites, cell width, draw-scale relative to agents.png)
    layout = dict(AGENT_ROWS)
    # agents_fix.png (10x2): row 1 = Kite's second row, row 2 = Volt's first row. Drawn at its own size, so its
    # frames get their own draw scale (the cell width of agents.png over the cell width of this sheet).
    if os.path.exists(os.path.join(ROOT, 'assets', 'agents_fix.png')):
        f = load('agents_fix.png')
        frows = sprite_rows(f)
        print('  agents_fix: sprites per row', [len(r) for r in frows])
        if len(frows) >= 2 and len(frows[0]) >= 10 and len(frows[1]) >= 10:
            fcw = f.shape[1] / 10
            srcs += [(frows[0], fcw, main_cw / fcw), (frows[1], fcw, main_cw / fcw)]
            layout['kite'] = (AGENT_ROWS['kite'][0], len(srcs) - 2)
            layout['volt'] = (len(srcs) - 1, AGENT_ROWS['volt'][1])
    ids = list(AGENT_IDS)
    if os.path.exists(os.path.join(ROOT, 'assets', 'agents2.png')):
        a2 = load('agents2.png')
        rows2 = sprite_rows(a2)
        print('  agents2: sprites per row', [len(r) for r in rows2])
        if len(rows2) >= 8 and all(len(r) >= 10 for r in rows2[:8]):
            cw2 = a2.shape[1] / 10
            base = len(srcs)
            srcs += [(r, cw2, main_cw / cw2) for r in rows2[:8]]
            for aid in AGENT_IDS2:
                layout[aid] = (base + AGENT_ROWS2[aid][0], base + AGENT_ROWS2[aid][1])
                ids.append(aid)
    frames, agents = [], {}
    stand_h = rows[0][6][0].shape[0]
    for aid in ids:
        ra, rb = layout[aid]
        have = {'A': srcs[ra] if ra is not None else None, 'B': srcs[rb] if rb is not None else None}
        anims, tips, spin = {}, {}, False
        only = AGENT_ONLY.get(aid, {})
        for name, row, idxs, mode, aim in AGENT_POSES:
            src_row, src_idx = row, idxs
            if have[row] is None or (row in only and name not in only[row]):
                src_row, src_idx = AGENT_FALLBACK[row][name]
                if name == 'ball':
                    spin = True                      # no curled-up frames: the game spins a crouching frame instead
                    mode = 'mid'
            start = len(frames)
            sprites, cw, rel = have[src_row]
            for k in src_idx:
                crop, x0, _ = sprites[k]
                h, w = crop.shape[:2]
                x = OX + x0 - (k + 0.5) * cw          # keep each sprite where the artist put it in its cell
                y = BASE - h if mode == 'feet' else BASE - stand_h / rel / 2 - h / 2
                if mode == 'mid':
                    x = OX - w / 2
                frames.append((crop, round(x), round(y)))
                if aim and k == src_idx[0]:          # rifle tip = the solid pixel furthest along the aim
                    ys, xs = np.nonzero(crop[..., 3] > 150)
                    i = int(np.argmax(xs * aim[0] + ys * aim[1]))
                    tips[name] = [round((round(x) + xs[i] - OX) * rel), round((round(y) + ys[i] - BASE) * rel)]
            anims[name] = [start, len(frames) - 1, round(rel, 4)]
        agents[aid] = {'anims': anims, 'muzzle': {k: tips[v] for k, v in MUZZLE.items()}, 'spin': spin,
                       'partial': None in layout[aid]}
    # 14 frames wide keeps the sheet under 4096 x 4096, the largest image many phones can load
    cols = 14
    sheet = Image.new('RGBA', (cols * CELL, -(-len(frames) // cols) * CELL), (0, 0, 0, 0))
    for i, (crop, x, y) in enumerate(frames):
        cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
        cell.paste(Image.fromarray(crop), (x, y))
        sheet.paste(cell, ((i % cols) * CELL, (i // cols) * CELL))
    if sheet.width > 4096 or sheet.height > 4096:
        print('  WARNING: agents sheet is', sheet.size, '- too big for some phones')
    manifest['sheets']['agents'] = {'path': save(sheet, 'agents'), 'fw': CELL, 'fh': CELL}
    manifest['agents'] = agents
    manifest['agentScale'] = round(140 / stand_h, 4)
    manifest['agentOriginY'] = BASE / CELL
    manifest.setdefault('pixel', []).append('agents')
    print('  agents:', len(frames), 'frames, standing height', stand_h, 'px')


# agents_ui.png, 10x5 grid: (cell, key, width drawn in game; 0 = only used by the menus)
UI_ITEMS = [(i, 'portrait_' + n, 0) for i, n in enumerate(AGENT_IDS)] + \
           [(5 + i, 'portrait_' + n + '_off', 0) for i, n in enumerate(AGENT_IDS)] + \
           [(10 + i, 'ab_' + n, 64) for i, n in enumerate(AGENT_IDS)] + \
           [(15 + i, 'ab_' + n + '_off', 64) for i, n in enumerate(AGENT_IDS)] + [
    (20, 'pk_heal', 58), (21, 'pk_heal_big', 76), (22, 'pk_teamlife', 52), (23, 'pk_life', 52),
    (24, 'pk_rapid', 84), (25, 'pk_spread', 84), (26, 'pk_barrier', 84), (27, 'e_flyer', 110),
    (28, 'pk_ammo', 70), (29, 'flare', 40),
    (30, 'hud_heart', 26), (31, 'hud_heart_empty', 26), (32, 'life', 40), (33, 'hud_skull', 30), (34, 'hud_crown', 30),
    (35, 'dot_0', 0), (36, 'dot_1', 0), (37, 'dot_2', 0), (38, 'dot_3', 0), (39, 'dot_4', 0),
    (40, 'ic_friends', 0), (41, 'ic_party', 0), (42, 'ic_queue', 0), (43, 'ic_invite', 0), (44, 'ic_settings', 0),
    (45, 'ic_admin', 0), (46, 'ic_bot', 0), (47, 'ic_key', 0), (48, 'ic_trophy', 0), (49, 'ic_exit', 0),
]


def build_agents_ui():
    a = load('agents_ui.png')
    if a is None:
        return
    cells = cut_cells(a)
    for idx, key, width in UI_ITEMS:
        if idx not in cells:
            continue
        img = Image.fromarray(cells[idx][0])
        manifest['images'][key] = save(img, key)
        manifest['scale'][key] = round((width or img.width) / img.width, 4)
        manifest.setdefault('pixel', []).append(key)
    print('  agents UI:', len(cells), 'items')


# ability_fx.png, 10x5 grid: (key, cells, how frames line up: 'c' centred, 'b' bottom, 'l' left edge)
FX = [
    ('fx_storm', [0, 1, 2, 3], 'l'), ('fx_tracer', [4, 5, 6], 'c'), ('fx_shells', [7, 8, 9], 'c'),
    ('fx_mend', [10, 11, 12, 13, 14], 'b'), ('fx_plus', [15, 16, 17, 18, 19], 'c'),
    ('fx_dash', [20, 21, 22, 23], 'c'), ('fx_blink', [24, 25, 26], 'c'), ('fx_slash', [27, 28, 29], 'c'),
    ('fx_dome', [30, 31, 32, 33, 34, 35], 'b'), ('fx_dome_break', [36, 37, 38, 39], 'b'),
    ('fx_arc', [40, 41, 42, 43], 'c'), ('fx_spark', [44, 45, 46], 'c'), ('fx_charge', [47, 48, 49], 'c'),
]


def build_ability_fx():
    a = load('ability_fx.png')
    if a is None:
        return
    cells = cut_cells(a)
    for key, idxs, mode in FX:
        crops = [cells[k][0] for k in idxs if k in cells]
        if len(crops) != len(idxs):
            continue
        fw, fh = max(c.shape[1] for c in crops) + 2, max(c.shape[0] for c in crops) + 2
        img = Image.new('RGBA', (fw * len(crops), fh), (0, 0, 0, 0))
        for i, c in enumerate(crops):
            h, w = c.shape[:2]
            x = 0 if mode == 'l' else (fw - w) // 2
            y = fh - h if mode == 'b' else (fh - h) // 2
            img.paste(Image.fromarray(c), (i * fw + x, y))
        manifest['sheets'][key] = {'path': save(img, key), 'fw': fw, 'fh': fh}
        manifest.setdefault('pixel', []).append(key)
    print('  ability effects:', len(cells), 'frames')


# backgrounds.png: nine full-width strips, (sky, far, near) for jungle, base and snow. The sheet made on
# 2026-10-01 has no transparency: some far/near strips have plain white painted above their shapes, and those
# can't be layered over a sky, so they are left out (the code-drawn layer stays). Strips are cut, never erased.
BG_THEMES = ['jungle', 'base', 'snow']
BG_LAYERS = ['sky', 'far', 'near']


def build_backgrounds():
    p = os.path.join(ROOT, 'assets', 'backgrounds.png')
    if not os.path.exists(p):
        return
    a = np.array(Image.open(p).convert('RGBA'))
    H = a.shape[0]
    rgb = a[..., :3].astype(int)
    jump = np.abs(np.diff(rgb.mean(1), axis=0)).sum(1)
    cuts = [0]
    for k in range(1, 9):                       # each boundary: the sharpest change near k/9 of the height
        lo, hi = int(k * H / 9 - H / 28), int(k * H / 9 + H / 28)
        cuts.append(lo + int(np.argmax(jump[lo:hi])) + 1)
    cuts.append(H)
    out = {}
    for i in range(9):
        theme, layer = BG_THEMES[i // 3], BG_LAYERS[i % 3]
        strip_ = a[cuts[i] + 1:cuts[i + 1] - 1]
        h = strip_.shape[0]
        white = (strip_[:max(1, h // 5), :, :3].min(2) > 235).mean()
        if layer != 'sky' and (white > 0.3 or (strip_[..., 3] < 20).mean() > 0.9):
            print('  backgrounds:', theme, layer, 'has a filled background above it - not used')
            continue
        key = 'bgp_' + layer + '_' + theme
        manifest['images'][key] = save(Image.fromarray(strip_), key)
        out.setdefault(theme, {})[layer] = key
        manifest.setdefault('pixel', []).append(key)
    manifest['backgrounds'] = out
    print('  backgrounds:', {t: sorted(v) for t, v in out.items()})


# backgrounds15.png: 15 full background scenes in a 3x5 grid with black gaps between them (season 3).
# Each panel is cut out along the gaps (nothing erased) and becomes bg15_<n> (1..15, reading order).
def runs(mask):
    """[(start, end), ...] of consecutive True values."""
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        if not v and start is not None:
            out.append((start, i)); start = None
    if start is not None:
        out.append((start, len(mask)))
    return out


def build_backgrounds15():
    p = os.path.join(ROOT, 'assets', 'backgrounds15.png')
    if not os.path.exists(p):
        return
    a = np.array(Image.open(p).convert('RGBA'))
    lum = a[..., :3].astype(int).sum(2)
    bright = lum > 75
    rows = [r for r in runs(bright.mean(1) > 0.25) if r[1] - r[0] > 40]
    keys = []
    for y0, y1 in rows:
        cols = [c for c in runs(bright[y0:y1].mean(0) > 0.25) if c[1] - c[0] > 60]
        for x0, x1 in cols:
            k = 'bg15_' + str(len(keys) + 1)
            # trim 2 pixels so no gap colour is left on the edges
            manifest['images'][k] = save(Image.fromarray(a[y0 + 2:y1 - 2, x0 + 2:x1 - 2]), k)
            manifest.setdefault('pixel', []).append(k)
            keys.append(k)
    manifest['bg15'] = keys
    print('  backgrounds15:', len(keys), 'scenes', [len([1 for c in runs(bright[y0:y1].mean(0) > 0.25) if c[1] - c[0] > 60]) for y0, y1 in rows])


# cover50.png (10x5 grid): fifty pieces of pixel-art cover. Each cell becomes cv50_<cell>; COVER_SETS says which
# ones each stage theme uses (low and medium pieces with solid, blocky shapes — the tall ones and odd shapes like
# the hut on legs are left out so soldiers can still hop over everything).
COVER_SETS = {
    'jungle': [0, 1, 4, 5, 6, 10, 13, 15, 16, 14],
    'base':   [20, 21, 22, 23, 24, 25, 26, 27, 3, 7],
    'snow':   [30, 31, 32, 33, 34, 35, 36, 37],
}
COVER_SCALE = 1.0          # drawn at the sheet's own size (a low sandbag is about a third of a soldier tall)


def build_cover50():
    a = load('cover50.png')
    if a is None:
        return
    cells = cut_cells(a)
    for idx, (crop, _, _) in cells.items():
        k = 'cv50_' + str(idx)
        manifest['images'][k] = save(Image.fromarray(crop), k)
        manifest['scale'][k] = COVER_SCALE
        manifest.setdefault('pixel', []).append(k)
    manifest['cover50'] = {t: ['cv50_' + str(i) for i in ids if i in cells] for t, ids in COVER_SETS.items()}
    print('  cover50:', len(cells), 'objects')


# powerups.png (10x2): pick-up badges and the four new agents' ability icons. (cell, key, width drawn in game)
POWERUP_ITEMS = [
    (0, 'pk_pierce', 84), (1, 'pk_blast', 84), (2, 'pk_double', 84), (3, 'pk_ice', 84), (4, 'pk_fire', 84),
    (5, 'pk_shock', 84), (6, 'pk_magnet', 84), (7, 'pk_slowmo', 84), (8, 'pk_boots', 84), (9, 'pk_bigheal', 84),
    (10, 'ab_ghost', 64), (11, 'ab_hammer', 64), (12, 'ab_viper', 64), (13, 'ab_atlas', 64), (14, 'pk_autoaim', 84),
    (15, 'pk_longer', 84), (16, 'pk_armor', 84), (17, 'pk_dcoins', 84), (18, 'pk_danger', 84), (19, 'pk_overdrive', 110),
]


def build_powerups():
    a = load('powerups.png')
    if a is None:
        return
    rows = sprite_rows(a)
    sprites = [s for r in rows for s in r]
    print('  powerups: sprites per row', [len(r) for r in rows])
    for idx, key, width in POWERUP_ITEMS:
        if idx >= len(sprites):
            continue
        img = Image.fromarray(sprites[idx][0])
        manifest['images'][key] = save(img, key)
        manifest['scale'][key] = round(width / img.width, 4)
        manifest.setdefault('pixel', []).append(key)

def blocky(img, target):
    """The user asked for these slices at high resolution: every pixel becomes an exact square block (whole-number
    nearest-neighbour enlargement to about `target` px tall) — no smoothing, no new detail, still crisp pixel art."""
    k = max(1, round(target / img.height))
    return img if k == 1 else img.resize((img.width * k, img.height * k), Image.NEAREST)


# idle.png: ONE ROW PER AGENT, in this order. In each row the first 3 sprites are the breathing loop, the rest
# (up to 7) a short special move the menus play now and then. Rows after these are ignored (room for later art).
IDLE_ORDER = ['razor', 'nova', 'kite', 'brick', 'volt', 'ghost', 'hammer', 'viper', 'atlas', 'jax', 'duke']
IDLE_LOOP = 3
IDLE_GROUPS = [('idle1.png', ['razor', 'nova', 'kite']), ('idle2.png', ['brick', 'volt', 'ghost']),
               ('idle3.png', ['hammer', 'viper', 'atlas']), ('idle4.png', ['jax', 'duke'])]
# rows to leave out (an agent then keeps its standing frame in the menus)
IDLE_SKIP = set()


def build_idle():
    a = load('idle.png')
    rows = sprite_rows(a) if a is not None else []
    if rows:
        print('  idle: sprites per row', [len(r) for r in rows], '(expected 11 rows of up to 10)')
    out = {}
    by_agent = dict(zip(IDLE_ORDER, rows))
    # prompt 16: three agents per image, one row each (assets/idle/idle1.png ... idle4.png); a row there wins over the
    # agent's row in idle.png — fewer agents per image come back at a much higher resolution
    # These sheets are cut along their grid (10 columns, one row per agent), but each cut is moved to the emptiest
    # column (row) near the grid line, so a pose that leans over the line is not sliced: effects drawn apart from the
    # body (sparks, gas, a grenade in the air) stay in their frame, and nothing is cut off. Each frame keeps its place
    # relative to its grid cell, so the animation does not jitter and a hop stays a hop.
    def cuts(proj, n, size):
        out = [0]
        for k in range(1, n):
            c, r = int(k * size), int(size * 0.3)
            lo, hi = max(1, c - r), min(len(proj) - 1, c + r)
            out.append(lo + int(np.argmin(proj[lo:hi])))
        out.append(len(proj))
        return out
    cells_of = {}
    for name, ids in IDLE_GROUPS:
        g = load(os.path.join('idle', name))
        if g is None:
            continue
        m = g[..., 3] > 30
        ch = g.shape[0] / len(ids)
        ys = cuts(m.sum(1), len(ids), ch)
        for r, aid in enumerate(ids):
            band = g[ys[r]:ys[r + 1]]
            # trim the empty space above the tallest pose and below the feet (the same for every frame of the row)
            rows_on = np.nonzero((band[..., 3] > 30).sum(1) > 2)[0]
            if len(rows_on):
                band = band[max(0, rows_on[0] - 2):rows_on[-1] + 3]
            cw = band.shape[1] / 10
            xs = cuts((band[..., 3] > 30).sum(0), 10, cw)
            fr = []
            for c in range(10):
                piece = band[:, xs[c]:xs[c + 1]]
                if (piece[..., 3] > 30).sum() < 200:
                    continue
                fr.append((piece, xs[c] - int(c * cw), 0))
            print('  idle/' + name + ' ' + aid + ':', len(fr), 'frames')
            if fr:
                cells_of[aid] = (fr, int(cw), int(ch))
    for aid, (fr, cw, ch) in cells_of.items():
        # a frame is never smaller than what is drawn in it: a pose that pokes past its grid cell makes every frame of
        # that agent a little bigger instead of being clipped (nothing may be cut off)
        left = max([0] + [-dx for _, dx, _ in fr])                     # room for pieces that start before their cell
        cw = max(cw, max(dx + left + c.shape[1] for c, dx, _ in fr))
        top = max([0] + [-dy for _, _, dy in fr])
        ch = max(dy + top + c.shape[0] for c, _, dy in fr)                # as tall as the poses, no empty headroom
        sheet = Image.new('RGBA', (cw * len(fr), ch), (0, 0, 0, 0))
        for i, (crop, dx, dy) in enumerate(fr):
            sheet.alpha_composite(Image.fromarray(crop), (i * cw + dx + left, dy + top))
        k = 1                                          # kept at the sheet's own size: big enough, and light for phones
        # how tall the body is in the breathing frames (bh): the menus size the agent by that, so a grenade thrown high
        # in the emote rises above the agent instead of shrinking it
        al = np.array(sheet)[..., 3] > 30
        tops = [np.nonzero(al[:, i * cw:(i + 1) * cw].any(1))[0] for i in range(min(IDLE_LOOP, len(fr)))]
        bh = int(ch - min(t[0] for t in tops if len(t))) if any(len(t) for t in tops) else ch
        out[aid] = {'path': save(blocky(sheet, ch * k), 'idle_' + aid), 'fw': cw * k, 'fh': ch * k, 'bh': bh * k, 'n': len(fr), 'loop': min(IDLE_LOOP, len(fr))}
        by_agent.pop(aid, None)
    for aid, fr in by_agent.items():
        if len(fr) < 2 or aid in IDLE_SKIP:
            continue
        # one strip per agent: every frame in an equal cell, feet on the same line (pixels copied untouched)
        fw = max(f[0].shape[1] for f in fr)
        fh = max(f[0].shape[0] for f in fr)
        sheet = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
        for i, (crop, _, _) in enumerate(fr):
            img = Image.fromarray(crop)
            sheet.paste(img, (i * fw + (fw - img.width) // 2, fh - img.height))
        key = 'idle_' + aid
        k = max(1, round(512 / fh))
        sheet = blocky(sheet, fh * k)
        out[aid] = {'path': save(sheet, key), 'fw': fw * k, 'fh': fh * k, 'n': len(fr), 'loop': min(IDLE_LOOP, len(fr))}
    manifest['idle'] = out


# ui_icons.png: 4 x 4 interface icons, in this order
UI_ICONS = ['fire', 'jump', 'dash', 'skill', 'pause', 'story', 'duels', 'custom',
            'crown', 'bot', 'invite', 'coin', 'trophy', 'locker', 'shop', 'friends']


def build_ui_icons():
    a = load('ui_icons.png')
    if a is None:
        return
    # each painted shape goes to the grid cell its middle is in (cut_cells), so a piece that pokes over a grid
    # line (the fire icon's bullet) stays with its own icon; pixels copied untouched
    global COLS, ROWS
    keep = (COLS, ROWS)
    COLS, ROWS = 4, 4
    try:
        cells = cut_cells(a, grow=6)
    finally:
        COLS, ROWS = keep
    out = {}
    for i, name in enumerate(UI_ICONS):
        if i in cells:
            out[name] = save(blocky(Image.fromarray(cells[i][0]), 192), 'ui_' + name)
    print('  ui_icons:', len(out), 'icons')
    manifest['ui'] = out


if __name__ == '__main__':
    print('Slicing art from', os.path.join(ROOT, 'assets'))
    a = load('commandos.png')
    if a is not None:
        build_commandos(a)
    a = load('enemies_tiles.png')
    if a is not None:
        build_enemies(a)
    a = load('terrain2.png')
    if a is not None:
        build_terrain2(a)
    build_agents()
    build_agents_ui()            # after the commandos: its pixel-art pick-ups replace the painted ones
    build_ability_fx()
    build_backgrounds()
    build_backgrounds15()
    build_cover50()
    build_powerups()
    build_idle()
    build_ui_icons()
    with open(os.path.join(ROOT, 'src', 'art.gen.js'), 'w', encoding='utf-8') as f:
        f.write('// GENERATED by tools/build_art.py — do not edit by hand.\n')
        f.write('CG.DATA.art = ' + json.dumps(manifest, indent=1) + ';\n')
    print('Wrote src/art.gen.js')
