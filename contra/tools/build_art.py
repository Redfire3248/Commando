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
            manifest['images'][key] = save(Image.fromarray(solid_square(cells[idx][0])), key)
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
            manifest['images'][key] = save(Image.fromarray(solid_square(crop)), key)
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
    with open(os.path.join(ROOT, 'src', 'art.gen.js'), 'w', encoding='utf-8') as f:
        f.write('// GENERATED by tools/build_art.py — do not edit by hand.\n')
        f.write('CG.DATA.art = ' + json.dumps(manifest, indent=1) + ';\n')
    print('Wrote src/art.gen.js')
