"""Slices the raw AI sheets into game-ready art.

    python tools/build_art.py

Reads the 8x4 sheets from assets/sheets/ (or assets/) and cuts them into frames. It ONLY slices:
every pixel is copied exactly as it is in your sheet — no background removal, no resizing, no
clean-up. The game scales the full-resolution frames when it draws them.

Writes:
    assets/atlas/*.png     sprite sheets + single images, named after the texture keys the game uses
    data/art.gen.js        the list the game loads at boot (frame sizes, draw scales, gun pivots)

Sheets that are missing are skipped; the game keeps its code-drawn placeholder for those.
Needs: pip install pillow numpy scipy
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'assets', 'atlas')
COLS, ROWS = 8, 4

# Order of the guns in 03_weapons / 03b_weapons_held, row 1. Later rows are future weapons.
WEAPON_IDS = ['pistol', 'spread', 'laser', 'flame', 'homing', 'shotgun', 'rail', 'smg']
# Order of the projectiles in 04_projectiles_vfx row 1, with the width each is DRAWN at in game.
BULLETS = [('b_pistol', 46), ('b_spread', 40), ('b_laser', 110), ('b_flame', 56),
           ('b_homing', 60), ('b_shotgun', 34), ('b_rail', 170), ('eb', 44)]
# Names for the 32 cells of 07b_props_cave, and which ones hang from above.
PROPS = ['ledge_stone', 'plank', 'plank_end', 'ledge_stone2', 'plank2', 'plank_end2', 'spikes_up', 'spikes_down',
         'spikes_left', 'spikes_right', 'chain', 'lantern_hang', 'lantern_post', 'bench', 'signpost', 'grave',
         'moss', 'vine', 'crystal', 'crystal_small', 'bones', 'skull', 'stalactite', 'stalagmite',
         'rubble', 'pillar', 'urn', 'cage', 'cobweb', 'mushrooms', 'roots', 'shield']
HANGING = {'spikes_down', 'chain', 'lantern_hang', 'vine', 'stalactite', 'cobweb'}

manifest = {'images': {}, 'sheets': {}, 'scale': {}}


def find(name):
    for d in ('sheets', ''):
        p = os.path.join(ROOT, 'assets', d, name)
        if os.path.exists(p):
            return p
    return None


def load(name):
    p = find(name)
    if not p:
        print('  (missing, skipped)', name)
        return None
    return np.array(Image.open(p).convert('RGBA'))


def save(img, key):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, key + '.png'))
    return 'assets/atlas/' + key + '.png'


def cut_cells(a, cols=COLS, rows=ROWS, thr=30, grow=6, min_area=40):
    """Works out which cell every painted pixel belongs to by following connected shapes, so a sprite
    that strays over a grid line still comes out whole. Pixels are copied untouched.
    Returns {cell index: (RGBA array, x0, y0)}."""
    H, W = a.shape[:2]
    cw, ch = W / cols, H / rows
    mask = a[..., 3] > thr
    lab, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=grow))
    owner = np.full((H, W), -1, int)
    gx = np.minimum(cols - 1, (np.arange(W) // cw).astype(int))[None, :].repeat(H, 0)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if sl is None:
            continue
        part = lab[sl] == i + 1
        if (part & mask[sl]).sum() < min_area:
            continue
        ys, xs = np.nonzero(part)
        cy, cx = ys.mean() + sl[0].start, xs.mean() + sl[1].start
        row = min(rows - 1, int(cy // ch))
        if sl[1].stop - sl[1].start > 1.45 * cw:       # shapes from two cells touch: split on the grid line
            owner[sl][part] = (row * cols + gx[sl])[part]
        else:
            owner[sl][part] = row * cols + min(cols - 1, int(cx // cw))
    cells = {}
    for idx in range(cols * rows):
        m = (owner == idx) & (a[..., 3] > 0)
        if not m.any():
            continue
        ys, xs = np.nonzero(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = a[y0:y1, x0:x1].copy()
        crop[~m[y0:y1, x0:x1]] = 0
        cells[idx] = (crop, x0, y0)
    return cells


def grid_cell(a, idx):
    """Plain grid crop (used for glow effects, whose halos run into each other)."""
    H, W = a.shape[:2]
    cw, ch = W / COLS, H / ROWS
    r, c = divmod(idx, COLS)
    return a[round(r * ch):round((r + 1) * ch), round(c * cw):round((c + 1) * cw)].copy()


def eyes(crop):
    """The hero's glowing eyes: the front-most (right-most) bright cyan pixels next to the dark face.
    Only used to line frames up with each other."""
    r, g, b, al = (crop[..., i].astype(int) for i in range(4))
    dark = ndimage.binary_dilation((r + g + b < 90) & (al > 200), iterations=5)
    ys, xs = np.nonzero((r < 150) & (g > 190) & (b > 215) & (al > 200) & dark)
    if len(xs) < 4:
        return None
    front = xs > xs.max() - 22
    return xs[front].mean(), ys[front].mean()


# ------------------------------------------------------------------------------------ player
P_CELL = 288                  # frame size in the atlas
P_OX, P_BASE = 144, 240       # the point in a frame that sits on the player's feet (game origin)
P_EYE_DX = 26                 # eyes are this far in front of the body centre (sheet 01 pixels)
P_EYE_H = 134                 # and this far above the feet when standing
ACTION_SCALE = 1.18           # sheet 02 was drawn smaller than sheet 01; the game draws it this much larger


def build_player():
    core, action = load('01_player_core.png'), load('02_player_action.png')
    if core is None:
        return
    frames = []                                          # (crop, draw scale, mode)
    cc = cut_cells(core)
    for i in range(32):
        frames.append((cc[i][0], 1.0, 'feet'))
    # name: [first frame, last frame, fps, draw scale]
    anims = {'idle': [0, 7, 7, 1], 'run': [8, 15, 14, 1], 'jump': [16, 23, 0, 1], 'land': [24, 26, 18, 1],
             'crouch': [29, 31, 5, 1]}
    if action is not None:
        ac = cut_cells(action)

        def add(name, cells, mode, fps):
            anims[name] = [len(frames), len(frames) + len(cells) - 1, fps, ACTION_SCALE]
            for c in cells:
                frames.append((ac[c][0], ACTION_SCALE, mode))
        add('dash', [1, 2, 3], 'feet', 20)
        add('hurt', [4, 5], 'feet', 8)
        add('death', [6, 7], 'center', 6)
        add('slash_fwd', [8, 9, 10, 11], 'feet', 16)
        add('slash_up', [12, 13, 14, 15], 'feet', 16)
        add('slash_down', [16, 17, 18, 19], 'air', 16)
        add('rest', [24, 25, 26, 27], 'feet', 4)
        add('triumph', [28, 29, 30, 31], 'feet', 8)

    cols = 7
    rows = -(-len(frames) // cols)
    sheet = Image.new('RGBA', (cols * P_CELL, rows * P_CELL), (0, 0, 0, 0))
    for i, (crop, s, mode) in enumerate(frames):
        e = eyes(crop)
        h, w = crop.shape[:2]
        # Positions are worked out so that, once the game scales the frame by `s` around its feet,
        # the head ends up in the same place in every frame.
        if mode == 'center' or e is None:
            x, y = P_OX - w / 2, P_BASE - h
        elif mode == 'air':                              # no feet on the ground: line up by the eyes
            x, y = P_OX + P_EYE_DX / s - e[0], P_BASE - P_EYE_H / s - e[1]
        else:
            x, y = P_OX + P_EYE_DX / s - e[0], P_BASE - h
        sheet.paste(Image.fromarray(crop), ((i % cols) * P_CELL + round(x), (i // cols) * P_CELL + round(y)))
    manifest['sheets']['player'] = {'path': save(sheet, 'player'), 'fw': P_CELL, 'fh': P_CELL}
    manifest['player'] = {'originY': P_BASE / P_CELL, 'scale': 0.74, 'anims': anims}
    print('  player:', len(frames), 'frames')


# ------------------------------------------------------------------------------------ sword hero (one 10x5 sheet)
HERO_FILES = ['hero_v2.png', '30_hero_sword.png', 'hero_sword.png']   # first one found wins
HERO_COLS, HERO_ROWS = 10, 5
# The AI does not keep to an exact grid, so the hero sheet is cut sprite by sprite: each row of the
# sheet is read left to right and the sprites are numbered 0, 1, 2... in the order they appear.
# animation name: (row, [sprites in that row], frames per second, how to line the frame up)
#   feet   = feet on the ground line, head lined up by the eyes
#   air    = lined up by the eyes only (airborne attack frames whose swing arc hangs below the feet)
#   mid    = centred on the body (the double-jump flip)
#   center = centred left-right, standing on the ground line (death burst)
#   back   = back edge flush with the back of the hitbox (wall slide, so he touches the wall)
# This matches the sheet generated on 2026-09-30. If a new sheet comes out with a different number of
# sprites in a row, run the script, read the "sprites per row" line it prints, and adjust the numbers here.
HERO_LAYOUT = [
    ('idle', 0, [0, 1, 2, 3], 6, 'feet'), ('run', 0, [4, 5, 6, 7, 8, 9], 13, 'feet'),
    ('jump', 1, [0, 1, 2, 3], 0, 'feet'),            # launch, rising, apex, falling
    ('flip', 1, [5], 1, 'mid'),                      # sprite 4 in this row has a white box painted behind it: not used
    ('crouch', 1, [6], 1, 'feet'), ('land', 1, [6], 10, 'feet'), ('slide', 1, [7, 8], 6, 'feet'),
    ('dash', 2, [0, 1, 2], 20, 'feet'), ('wall', 2, [3, 4], 6, 'back'), ('wallkick', 2, [5], 1, 'feet'),
    ('hurt', 2, [6, 7], 8, 'feet'), ('death', 2, [8, 9, 10], 6, 'center'),
    ('slash_fwd', 3, [0, 1, 2], 14, 'feet'),       # sprite 3 (follow-through) was drawn at a smaller size: not used
    ('slash_up', 3, [4, 5, 6], 14, 'feet'),
    ('slash_down', 3, [7, 8, 9], 14, 'air'),
    ('slash_air', 4, [0, 1, 2], 14, 'air'), ('rest', 4, [3, 4], 2, 'feet'), ('triumph', 4, [5, 6], 4, 'feet'),
    ('focus', 4, [7, 8, 9], 5, 'feet'),
]
# hero_v2.png: the sheet from the "Hero v2" prompt in tools/prompts.md (8-frame run on row 1).
HERO_LAYOUT_V2 = [
    ('run', 0, [0, 1, 2, 3, 4, 5, 6, 7], 14, 'feet'), ('idle', 0, [8, 9], 3, 'feet'),
    ('jump', 1, [0, 1, 2, 3], 0, 'feet'), ('land', 1, [4], 10, 'feet'), ('flip', 1, [5, 6], 12, 'mid'),
    ('crouch', 1, [7], 1, 'feet'), ('slide', 1, [8, 9], 6, 'feet'),
    ('dash', 2, [0, 1, 2], 20, 'feet'), ('wall', 2, [3, 4], 6, 'back'), ('wallkick', 2, [5], 1, 'feet'),
    ('hurt', 2, [6, 7], 8, 'feet'), ('death', 2, [8, 9], 5, 'center'),
    ('slash_fwd', 3, [0, 1, 2, 3], 18, 'feet'), ('slash_up', 3, [4, 5, 6], 14, 'feet'),
    ('slash_down', 3, [7, 8, 9], 14, 'air'),
    ('slash_air', 4, [0, 1, 2], 14, 'air'), ('rest', 4, [3, 4], 2, 'feet'), ('triumph', 4, [5, 6], 4, 'feet'),
    ('focus', 4, [7, 8, 9], 5, 'feet'),
]


def cut_rows(a, cols, rows):
    """Finds every sprite on the sheet and returns them row by row, left to right.
    Pixels are copied untouched. Returns [[RGBA array, ...], ...]."""
    H, W = a.shape[:2]
    cw, ch = W / cols, H / rows
    mask = a[..., 3] > 30

    def split(m, x0, y0):                                # two sprites stuck together: cut at the thinnest point
        ys, xs = np.nonzero(m)
        if not len(xs):
            return []
        m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        x0, y0 = x0 + xs.min(), y0 + ys.min()
        h, w = m.shape
        if h > 1.45 * ch:
            cut = int(h * 0.3) + int(np.argmin(m.sum(1)[int(h * 0.3):int(h * 0.7)]))
            return split(m[:cut], x0, y0) + split(m[cut:], x0, y0 + cut)
        if w > 1.45 * cw:
            cut = int(w * 0.3) + int(np.argmin(m.sum(0)[int(w * 0.3):int(w * 0.7)]))
            return split(m[:, :cut], x0, y0) + split(m[:, cut:], x0 + cut, y0)
        return [[x0, y0, m]]

    lab, _ = ndimage.label(ndimage.binary_dilation(mask, iterations=5))
    pieces = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        part = lab[sl] == i + 1
        if (part & mask[sl]).sum() >= 20:
            pieces += split(part, sl[1].start, sl[0].start)

    def box(pc):
        return pc[0], pc[1], pc[0] + pc[2].shape[1], pc[1] + pc[2].shape[0]

    def join(p, q):                                      # one piece covering both
        x0, y0 = min(p[0], q[0]), min(p[1], q[1])
        x1, y1 = max(box(p)[2], box(q)[2]), max(box(p)[3], box(q)[3])
        m = np.zeros((y1 - y0, x1 - x0), bool)
        for pc in (p, q):
            m[pc[1] - y0:pc[1] - y0 + pc[2].shape[0], pc[0] - x0:pc[0] - x0 + pc[2].shape[1]] |= pc[2]
        return [x0, y0, m]

    def gap(p, q):                                       # distance between two pieces' boxes
        a0, b0 = box(p), box(q)
        dx = max(0, max(a0[0], b0[0]) - min(a0[2], b0[2]))
        dy = max(0, max(a0[1], b0[1]) - min(a0[3], b0[3]))
        return max(dx, dy)

    # a swing arc or a loose shard that floats next to its sprite belongs to that sprite
    big = np.median([pc[2].sum() for pc in pieces]) * 0.35
    merged = True
    while merged:
        merged = False
        for i in range(len(pieces)):
            for j in range(len(pieces)):
                if i == j:
                    continue
                p, q = pieces[i], pieces[j]
                both = join(p, q)
                small = q[2].sum() < big
                if both[2].shape[1] <= 1.3 * cw and both[2].shape[0] <= 1.3 * ch and gap(p, q) <= (40 if small else 0):
                    pieces[i] = both
                    del pieces[j]
                    merged = True
                    break
            if merged:
                break
    pieces = [pc for pc in pieces if pc[2].sum() >= big]   # anything still tiny and alone is a stray speck

    out = [[] for _ in range(rows)]
    for pc in pieces:
        ys, _ = np.nonzero(pc[2])
        out[min(rows - 1, int((pc[1] + ys.mean()) // ch))].append(pc)
    result = []
    for row in out:
        row.sort(key=lambda pc: pc[0] + pc[2].shape[1] / 2)
        crops = []
        for x0, y0, m in row:
            crop = a[y0:y0 + m.shape[0], x0:x0 + m.shape[1]].copy()
            crop[~m] = 0
            crops.append(crop)
        result.append(crops)
    return result


def build_hero():
    a = None
    for name in HERO_FILES:
        if find(name):
            a = load(name)
            break
    if a is None:
        return False
    layout = HERO_LAYOUT_V2 if name == 'hero_v2.png' else HERO_LAYOUT
    rows = cut_rows(a, HERO_COLS, HERO_ROWS)
    print('  hero sheet:', name, '- sprites per row', [len(r) for r in rows])
    for name, r, ks, _, _ in layout:
        if max(ks) >= len(rows[r]):
            print('  hero sheet: row', r, 'has too few sprites for', name, '- fix HERO_LAYOUT; hero skipped')
            return False

    # measure the standing pose once: how tall he is, and where the eyes sit relative to the feet
    idle_r, idle_ks = next((r, ks) for n, r, ks, _, _ in layout if n == 'idle')
    idle = rows[idle_r][idle_ks[0]]
    stand_h = idle.shape[0]
    ys, xs = np.nonzero(idle[..., 3] > 100)
    ex, ey = eyes(idle)
    eye_dx, eye_h = ex - xs[ys > ys.max() - 0.12 * stand_h].mean(), stand_h - ey

    CELL, OX, BASE = 288, 144, 232
    frames, anims = [], {}
    for name, r, ks, fps, mode in layout:
        anims[name] = [len(frames), len(frames) + len(ks) - 1, fps, 1]
        frames += [(rows[r][k], mode) for k in ks]
    cols = 8
    sheet = Image.new('RGBA', (cols * CELL, -(-len(frames) // cols) * CELL), (0, 0, 0, 0))
    for i, (crop, mode) in enumerate(frames):
        h, w = crop.shape[:2]
        e = eyes(crop)
        if mode == 'mid':
            x, y = OX - w / 2, BASE - stand_h / 2 - h / 2
        elif mode == 'back':
            x, y = OX - 30 * stand_h / 132, BASE - h      # 30 game px behind centre = just past the hitbox edge
        elif mode == 'center' or e is None:
            x, y = OX - w / 2, BASE - h
        elif mode == 'air':
            x, y = OX + eye_dx - e[0], BASE - eye_h - e[1]
        else:
            x, y = OX + eye_dx - e[0], BASE - h
        cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
        cell.paste(Image.fromarray(crop), (round(x), round(y)))
        sheet.paste(cell, ((i % cols) * CELL, (i // cols) * CELL))
    manifest['sheets']['player'] = {'path': save(sheet, 'player'), 'fw': CELL, 'fh': CELL}
    manifest['player'] = {'originY': BASE / CELL, 'scale': round(132 / stand_h, 4), 'anims': anims}
    if layout is HERO_LAYOUT_V2:
        manifest['player']['pixel'] = True       # pixel-art hero: drawn with hard edges, no smoothing
    print('  sword hero:', len(frames), 'frames, standing height', stand_h, 'px')
    return True


# ------------------------------------------------------------------------------------ weapons
def build_weapons():
    icons = load('03_weapons.png')
    if icons is not None:
        cells = cut_cells(icons)
        for i, wid in enumerate(WEAPON_IDS):
            if i in cells:
                manifest['images']['w_' + wid] = save(Image.fromarray(cells[i][0]), 'w_' + wid)
        print('  weapon icons:', len(WEAPON_IDS))

    held = load('03b_weapons_held.png')
    if held is not None:
        CW, CH, PX = 256, 256, 20                        # frame size; the pivot sits at (PX, CH/2)
        cells = cut_cells(held)
        sheet = Image.new('RGBA', (COLS * CW, ROWS * CH), (0, 0, 0, 0))
        info = {}
        for idx, (crop, _, _) in cells.items():
            ys, xs = np.nonzero(crop[..., 3] > 150)
            x0 = xs.min()
            tip = xs > xs.max() - 8                      # muzzle = the far right end
            # Pivot = elbow end of the sleeve, at the height of the barrel, so the gun turns around
            # its own firing line and bullets leave along it.
            py = ys[tip].mean()
            mx = xs.max() - (x0 + 7)
            sheet.paste(Image.fromarray(crop),
                        ((idx % COLS) * CW + round(PX - (x0 + 7)), (idx // COLS) * CH + round(CH / 2 - py)))
            if idx < len(WEAPON_IDS):
                info[WEAPON_IDS[idx]] = {'frame': idx, 'mx': round(float(mx), 1), 'my': 0}
        manifest['sheets']['guns_held'] = {'path': save(sheet, 'guns_held'), 'fw': CW, 'fh': CH}
        manifest['held'] = {'originX': PX / CW, 'scale': 0.45, 'guns': info}
        print('  held guns:', len(cells))


# ------------------------------------------------------------------------------------ bullets + effects
def build_vfx():
    a = load('04_projectiles_vfx.png')
    if a is None:
        return
    for i, (key, width) in enumerate(BULLETS):
        crop = grid_cell(a, i)
        ys, xs = np.nonzero(crop[..., 3] > 110)          # frame the bright core plus some of its glow
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        pad = round(0.22 * max(x1 - x0, y1 - y0))
        h, w = crop.shape[:2]
        img = Image.fromarray(crop).crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))
        manifest['images'][key] = save(img, key)
        manifest['scale'][key] = round(width / img.width, 4)

    # muzzle flash: frame it from just past the little barrel stub the AI drew
    crop = grid_cell(a, 9)
    r, g, b, al = (crop[..., i].astype(int) for i in range(4))
    ys, xs = np.nonzero((r + g + b < 200) & (al > 200))
    crop = crop[:, (xs.max() + 1 if len(xs) else 0):]
    ys, xs = np.nonzero(crop[..., 3] > 60)
    img = Image.fromarray(crop).crop((0, ys.min(), xs.max() + 1, ys.max() + 1))
    manifest['images']['flash'] = save(img, 'flash')
    manifest['scale']['flash'] = round(96 / img.width, 4)

    for key, row in (('fx_impact', 2), ('fx_explosion', 3)):
        S = 224
        strip = Image.new('RGBA', (8 * S, S), (0, 0, 0, 0))
        for c in range(8):
            img = Image.fromarray(grid_cell(a, row * COLS + c))
            strip.paste(img, (c * S + (S - img.width) // 2, (S - img.height) // 2))
        manifest['sheets'][key] = {'path': save(strip, key), 'fw': S, 'fh': S}
    print('  bullets, flash, impact, explosion')


# ------------------------------------------------------------------------------------ terrain
def build_tiles():
    p = find('07_tiles_cave.png')
    if not p:
        print('  (missing, skipped) 07_tiles_cave.png')
        return
    src = Image.open(p).convert('RGBA')
    cw, ch = src.width / COLS, src.height / ROWS
    S = int(min(cw, ch)) - 8                             # cut just inside the dark line around each tile
    sheet = Image.new('RGBA', (COLS * S, ROWS * S))
    for r in range(ROWS):
        for c in range(COLS):
            x, y = round(c * cw + cw / 2 - S / 2), round(r * ch + ch / 2 - S / 2)
            sheet.paste(src.crop((x, y, x + S, y + S)), (c * S, r * S))
    manifest['sheets']['tiles'] = {'path': save(sheet, 'tiles'), 'fw': S, 'fh': S}
    # which frames to use for which kind of tile (see 07 in tools/prompts.md)
    manifest['tiles'] = {'top': list(range(0, 8)), 'inner': list(range(8, 16)), 'left': [16, 17, 18, 19],
                         'right': [20, 21, 22, 23], 'topLeft': [24, 25], 'topRight': [26, 27],
                         'bottom': [28, 29, 30, 31]}
    print('  tiles: 32 at', S, 'px')


def build_props():
    a = load('07b_props_cave.png')
    if a is None:
        return
    cells = cut_cells(a)
    S = 232
    sheet = Image.new('RGBA', (COLS * S, ROWS * S), (0, 0, 0, 0))
    frames = {}
    for idx, (crop, _, _) in cells.items():
        name = PROPS[idx]
        h, w = crop.shape[:2]
        y = 0 if name in HANGING else S - h              # hanging things touch the top, the rest stand on the bottom
        sheet.paste(Image.fromarray(crop), ((idx % COLS) * S + (S - w) // 2, (idx // COLS) * S + y))
        frames[name] = {'frame': idx, 'w': int(w), 'h': int(h), 'hang': name in HANGING}
    manifest['sheets']['props'] = {'path': save(sheet, 'props'), 'fw': S, 'fh': S}
    manifest['props'] = frames
    # pieces the level is built from get their own tightly-cut image
    for key, name in (('tile_plat', 'plank'), ('spikes', 'spikes_up'), ('bench', 'bench')):
        idx = PROPS.index(name)
        if idx in cells:
            manifest['images'][key] = save(Image.fromarray(cells[idx][0]), key)
    print('  props:', len(cells))



# ------------------------------------------------------------------------------------ v2 sheets (10x5)
# enemies_v2.png: one enemy per row. (texture key, row, height drawn in game, flies?, [(anim, cells, fps)])
ENEMY_ROWS = {
    'crawler':  (0, 84, False, [('walk', [0, 1, 2, 3, 4, 5], 10), ('hurt', [6], 1), ('death', [7, 8, 9], 8)]),
    'hopper':   (1, 92, False, [('idle', [0, 1], 3), ('crouch', [2], 1), ('leap', [3, 4], 6), ('land', [5], 1),
                                ('hurt', [6], 1), ('death', [7, 8, 9], 8)]),
    'turret':   (2, 104, True, [('idle', [0, 1, 2, 3], 6), ('charge', [4, 5], 8), ('hurt', [7], 1), ('death', [8, 9], 6)]),
    'brute':    (3, 220, False, [('walk', [0, 1, 2, 3], 6), ('windup', [4], 1), ('smash', [5, 6], 10), ('hurt', [7], 1),
                                 ('death', [8, 9], 4)]),
    'vengefly': (4, 88, True, [('idle', [0, 1, 2, 3], 14), ('dive', [4, 5], 10), ('hurt', [6], 1), ('death', [7, 8], 6)]),
}


def pack(crops, fly):
    """Puts frames of different sizes into one strip of equal cells: centred left-right, standing on the
    bottom edge (or centred, for flyers). Pixels are copied untouched."""
    fw = max(c.shape[1] for c in crops) + 4
    fh = max(c.shape[0] for c in crops) + 4
    strip = Image.new('RGBA', (fw * len(crops), fh), (0, 0, 0, 0))
    for i, c in enumerate(crops):
        h, w = c.shape[:2]
        y = (fh - h) // 2 if fly else fh - h
        strip.paste(Image.fromarray(c), (i * fw + (fw - w) // 2, y))
    return strip, fw, fh


def build_enemies_v2():
    a = load('enemies_v2.png')
    if a is None:
        return
    cells = cut_cells(a, 10, 5)
    manifest['enemies'] = {}
    for name, (row, height, fly, anims) in ENEMY_ROWS.items():
        crops, out = [], {}
        for anim, ks, fps in anims:
            out[anim] = [len(crops), len(crops) + len(ks) - 1, fps]
            crops += [cells[row * 10 + k][0] for k in ks]
        strip, fw, fh = pack(crops, fly)
        key = 'en_' + name
        manifest['sheets'][key] = {'path': save(strip, key), 'fw': fw, 'fh': fh}
        stand = crops[0].shape[0]
        # flyers are centred in their frame, so their origin is the middle; walkers stand on the bottom edge
        manifest['enemies'][name] = {'key': key, 'scale': round(height / stand, 4), 'anims': out, 'fly': fly}
    print('  enemies v2:', ', '.join(ENEMY_ROWS))


# boss_warden_v2.png: the AI did not keep the rows evenly spaced, so sprites are found one by one and given
# to the row whose ground line they stand on (or hang above). (anim, row, sprites in that row, fps)
BOSS_LAYOUT = [
    ('idle', 0, [0, 1, 2, 3], 5), ('walk', 0, [4, 5, 6, 7, 8, 9], 8),
    ('lift', 1, [0, 1, 2], 8), ('smash', 1, [3], 1), ('buried', 1, [4], 1), ('pull', 1, [5, 6], 6),
    ('crouch', 2, [0, 1], 6), ('air', 2, [2, 3], 6), ('fall', 2, [4], 1), ('land', 2, [5], 1),
    ('charge', 2, [6, 7, 8], 10),
    ('roar', 3, [0, 1], 4), ('stagger', 3, [2, 3, 4], 6), ('sweep', 3, [5, 6, 7, 8], 12),
    ('death', 4, [0, 1, 2, 3, 4, 5], 5), ('cage', 4, [6, 7, 8, 9], 5),
]
BOSS_HEIGHT = 300          # standing height in game pixels


def boss_sprites(a):
    """Returns the sheet's sprites grouped into rows by the ground line they stand on."""
    m = a[..., 3] > 10
    proj = m.sum(1)
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=4))
    pieces = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        part = (lab[sl] == i + 1) & m[sl]
        if part.sum() < 300:                                   # loose specks
            continue
        y0, x0 = sl[0].start, sl[1].start
        h = part.shape[0]
        if h > 250:                                            # two sprites from neighbouring rows touch: cut between them
            rows = part.sum(1)
            cut = int(h * 0.3) + int(np.argmin(rows[int(h * 0.3):int(h * 0.7)]))
            halves = [(part[:cut], y0), (part[cut:], y0 + cut)]
        else:
            halves = [(part, y0)]
        for p, py in halves:
            ys, xs = np.nonzero(p)
            if len(xs) < 300:
                continue
            pieces.append((py + ys.min(), py + ys.max() + 1, x0 + xs.min(), x0 + xs.max() + 1, p, py, x0))
    # ground lines: the bottom edge shared by most sprites in each horizontal band
    bottoms = sorted(p[1] for p in pieces)
    lines = []
    for b in bottoms:
        if not lines or b - lines[-1][-1] > 40:
            lines.append([b])
        else:
            lines[-1].append(b)
    ground = [max(l) for l in lines if len(l) >= 3]
    rows = [[] for _ in ground]
    for y0, y1, x0, x1, p, py, px in pieces:
        r = next((i for i, g in enumerate(ground) if g >= y1 - 8), len(ground) - 1)
        crop = a[y0:y1, x0:x1].copy()
        keep = np.zeros(crop.shape[:2], bool)
        keep[:, :] = p[y0 - py:y1 - py, x0 - px:x1 - px]
        crop[~keep] = 0
        rows[r].append((x0, crop))
    return [[c for _, c in sorted(r, key=lambda t: t[0])] for r in rows]


def build_boss_v2():
    a = load('boss_warden_v2.png')
    if a is None:
        return
    rows = boss_sprites(a)
    print('  boss: sprites per row', [len(r) for r in rows])
    for name, r, ks, _ in BOSS_LAYOUT:
        if r >= len(rows) or max(ks) >= len(rows[r]):
            print('  boss: row', r, 'has too few sprites for', name, '- fix BOSS_LAYOUT; boss skipped')
            return
    crops, anims = [], {}
    for name, r, ks, fps in BOSS_LAYOUT:
        anims[name] = [len(crops), len(crops) + len(ks) - 1, fps]
        crops += [rows[r][k] for k in ks]
    strip, fw, fh = pack(crops, False)
    manifest['sheets']['boss_warden'] = {'path': save(strip, 'boss_warden'), 'fw': fw, 'fh': fh}
    # the shockwave (row 2, last three sprites) is its own little strip
    waves = rows[1][7:10]
    if len(waves) == 3:
        ws, wfw, wfh = pack(waves, False)
        manifest['sheets']['boss_wave'] = {'path': save(ws, 'boss_wave'), 'fw': wfw, 'fh': wfh}
    stand = crops[0].shape[0]
    manifest['boss'] = {'scale': round(BOSS_HEIGHT / stand, 4), 'anims': anims}
    print('  boss: %d frames' % len(crops))


def build_tiles_v2():
    """tiles_v2.png came back without real transparency (a grey-and-white checkerboard is painted in), so only
    the parts that are solid all the way across are used: the square tiles, and the straight middle ledge
    pieces cut just inside their edges. Nothing is erased; every used pixel is copied as it is."""
    p = find('tiles_v2.png')
    if not p:
        return False
    a = np.array(Image.open(p).convert('RGBA'))
    rgb = a[..., :3].astype(int)
    checker = (rgb.min(2) > 195) & (rgb.max(2) - rgb.min(2) < 14)
    solid = ~checker & (a[..., 3] > 200)
    lab, _ = ndimage.label(ndimage.binary_opening(solid, iterations=2))
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if h * w > 4000:
            boxes.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop))
    # the AI squashed the sheet, so the tiles are rectangles; the game draws each one 64x64 anyway
    squares = [b for b in boxes if b[1] - b[0] > 120 and 0.85 < (b[3] - b[2]) / (b[1] - b[0]) < 1.5]
    ledges = [b for b in boxes if (b[3] - b[2]) > 2.2 * (b[1] - b[0])]
    if len(squares) < 6:
        print('  tiles_v2: found only', len(squares), 'square tiles - skipped')
        return False

    FW = min(b[3] - b[2] for b in squares) - 10
    FH = min(b[1] - b[0] for b in squares) - 10
    S = FH
    # group squares into rows by their top edge
    squares.sort(key=lambda b: (b[0], b[2]))
    rows = []
    for b in squares:
        if rows and abs(b[0] - rows[-1][0][0]) < 40:
            rows[-1].append(b)
        else:
            rows.append([b])
    for r in rows:
        r.sort(key=lambda b: b[2])

    def top(b):          # first row that is solid all the way across (grass tips stick up into the checkerboard)
        cx = (b[2] + b[3]) // 2
        y = b[0]
        while y < b[0] + 30 and not solid[y, cx - FW // 2:cx - FW // 2 + FW].all():
            y += 1
        return y

    FH = min(b[1] - top(b) for b in squares) - 2

    def crop(b):         # centred left-right, from the first fully solid row (keeps the grass band)
        cx, y = (b[2] + b[3]) // 2, top(b)
        return a[y:y + FH, cx - FW // 2:cx - FW // 2 + FW]

    def mossy(c):        # teal grass along the top
        t = c[:S // 8, :, :3].astype(int)
        return (t[..., 1] - t[..., 0]).mean() > 30

    def rim_side(c):     # the lighter worn rim: which edge is it on?
        g = c[..., :3].astype(int).sum(2)
        lft, rgt, mid = g[:, :FW // 10].mean(), g[:, -FW // 10:].mean(), g[:, FW // 3:-FW // 3].mean()
        if max(lft, rgt) < mid * 1.12:
            return None
        return 'left' if lft > rgt else 'right'

    sets = {k: [] for k in ('top', 'inner', 'left', 'right', 'topLeft', 'topRight', 'bottom')}
    frames = []
    for r in rows:
        for b in r:
            c = crop(b)
            side, moss = rim_side(c), mossy(c)
            kind = ('topLeft' if side == 'left' else 'topRight' if side == 'right' else 'top') if moss \
                else (side or 'inner')
            sets[kind].append(len(frames))
            frames.append(c)
    # fill gaps: no ceiling tiles are square on this sheet; a missing corner uses a plain surface tile
    if not sets['bottom']:
        sets['bottom'] = sets['inner']
    for k, fb in (('topLeft', 'top'), ('topRight', 'top'), ('left', 'inner'), ('right', 'inner')):
        if not sets[k]:
            sets[k] = sets[fb]
    cols = 10
    sheet = Image.new('RGBA', (cols * FW, -(-len(frames) // cols) * FH))
    for i, c in enumerate(frames):
        sheet.paste(Image.fromarray(c), ((i % cols) * FW, (i // cols) * FH))
    manifest['sheets']['tiles'] = {'path': save(sheet, 'tiles'), 'fw': FW, 'fh': FH}
    manifest['tiles'] = sets

    # ledges: the straight middle pieces, cut to the rows and columns that are solid all the way across
    best = {}
    for y0, y1, x0, x1 in ledges:
        x0, x1 = x0 + 4, x1 - 4
        full = solid[y0:y1, x0:x1].all(1)
        ys = np.nonzero(full)[0]
        if not len(ys):
            continue
        # longest run of solid rows
        runs, start = [], ys[0]
        for k in range(1, len(ys) + 1):
            if k == len(ys) or ys[k] != ys[k - 1] + 1:
                runs.append((start, ys[k - 1] + 1))
                if k < len(ys):
                    start = ys[k]
        r0, r1 = max(runs, key=lambda t: t[1] - t[0])
        h = r1 - r0
        if h < 0.22 * (x1 - x0):            # rounded end pieces lose too much: not used
            continue
        c = a[y0 + r0:y0 + r1, x0:x1]
        wood = (c[..., 0].astype(int) - c[..., 2].astype(int)).mean() > 25
        k = 'wood' if wood else 'stone'
        if k not in best or h * (x1 - x0) > best[k].shape[0] * best[k].shape[1]:
            best[k] = c
    if 'stone' in best:
        manifest['images']['tile_plat'] = save(Image.fromarray(best['stone']), 'tile_plat')
    if 'wood' in best:
        manifest['images']['tile_plank'] = save(Image.fromarray(best['wood']), 'tile_plank')
    print('  tiles_v2:', {k: len(v) for k, v in sets.items()}, 'at %dx%d px; ledges' % (FW, FH), list(best))
    return True

if __name__ == '__main__':
    print('Slicing art from', os.path.join(ROOT, 'assets'))
    if not build_hero():          # the one-sheet sword hero replaces the older 01 + 02 sheets
        build_player()
    build_weapons()
    build_vfx()
    build_props()
    if not build_tiles_v2():       # tiles_v2.png replaces the 07 tiles and the ledge piece
        build_tiles()
    build_enemies_v2()
    build_boss_v2()
    with open(os.path.join(ROOT, 'data', 'art.gen.js'), 'w', encoding='utf-8') as f:
        f.write('// GENERATED by tools/build_art.py — do not edit by hand.\n')
        f.write('GH.DATA.art = ' + json.dumps(manifest, indent=1) + ';\n')
    print('Wrote data/art.gen.js and', len(os.listdir(OUT)), 'files in assets/atlas')
