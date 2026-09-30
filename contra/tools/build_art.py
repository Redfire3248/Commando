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


if __name__ == '__main__':
    print('Slicing art from', os.path.join(ROOT, 'assets'))
    a = load('commandos.png')
    if a is not None:
        build_commandos(a)
    with open(os.path.join(ROOT, 'src', 'art.gen.js'), 'w', encoding='utf-8') as f:
        f.write('// GENERATED by tools/build_art.py — do not edit by hand.\n')
        f.write('CG.DATA.art = ' + json.dumps(manifest, indent=1) + ';\n')
    print('Wrote src/art.gen.js')
