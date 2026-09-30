# GUNHOLLOW — AI art prompt pack

Every sheet is **8 columns × 4 rows = 32 cells** with the **background removed (transparent PNG)**.

| Cell size | Sheet size | Use when |
|---|---|---|
| **256 × 256** | **2048 × 1024** | Default. Most image tools can output this (2:1). |
| **512 × 512** | **4096 × 2048** | Your tool supports 4K, or you upscale a 2048 × 1024 sheet 2×. |

Save finished sheets as `assets/sheets/<name>.png` using the file names below.

## How to use

1. Each block is a complete prompt. Paste one block per image.
2. Set the aspect ratio to **2:1**, the largest size the tool offers, and turn on **transparent background** if the tool has that setting.
3. If the tool has a negative-prompt box, paste **NEGATIVE** there.
4. For every sheet after the first, attach `01_player_core.png` as a style/character reference so the look stays the same.
5. If a row comes out wrong, regenerate the whole sheet — don't mix rows from different runs.
6. Check the result really is transparent. If the tool painted a white, grey or checkerboard background instead, run the image through a background remover before saving it.

For 512 px cells, change `256×256` to `512×512` and `2048×1024` to `4096×2048` in the prompt.

## NEGATIVE

```
background, scenery, backdrop, white background, grey background, checkerboard pattern, floor, ground shadow, text, letters, numbers, labels, watermark, signature, grid lines, borders, frames, cropped subject, overlapping cells, merged cells, inconsistent scale, inconsistent character design, 3D render, photo, blurry, perspective view
```

---

## 01 — `01_player_core.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

SUBJECT: the hero, a small hooded gunner — deep navy tattered cloak, tall pointed hood with a pitch-black face opening and two glowing cyan eyes, a long crimson scarf trailing behind, dark boots. Faces RIGHT in every frame. Arms are tucked inside the cloak and NO weapon is drawn (the gun is a separate sprite).
Row 1 (8 frames): idle breathing loop, scarf swaying gently.
Row 2 (8 frames): run cycle, cloak and scarf streaming behind.
Row 3 (8 frames): jump — crouch, launch, rising, rising, apex, falling, falling fast, about to land.
Row 4 (8 frames): landing squash (3 frames), crouching down (2 frames), crouched idle (3 frames).
```

## 02 — `02_player_action.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

SUBJECT: the same small hooded gunner as the reference image — deep navy tattered cloak, tall pointed hood, pitch-black face with two glowing cyan eyes, long crimson scarf. Identical design and scale, faces RIGHT, no gun drawn.
Row 1 (8 frames): dash — 4 frames of a low horizontal burst with a cyan afterimage, then 2 frames hit and recoiling, then 2 frames shattering into cyan shards (death).
Row 2 (8 frames): forward melee slash with a pale blade, 4 frames; upward slash, 4 frames. Each slash includes a white crescent swing arc.
Row 3 (8 frames): downward slash while airborne, 4 frames; sliding down a wall on the right side of the cell, 2 frames; kicking off the wall, 2 frames.
Row 4 (8 frames): sitting down and resting, 4 frames; holding up a glowing item in triumph, 4 frames.
```

## 03 — `03_weapons.png`

Guns on their own, used for pickups, the HUD and the admin panel.

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: 32 different handheld guns, one per cell, each shown in clean side profile pointing RIGHT. Dark iron and brass with one glowing accent colour each. Same scale and same lighting for all.
Row 1: a rusty revolver-pistol with a warm yellow glow; a three-barrel spread gun with red glow; a sleek laser rifle with a cyan energy cell; a flamethrower with an orange fuel tank; a boxy twin missile launcher with violet windows; a double-barrel shotgun with a wooden stock; a long railgun with violet coil rings; a compact thorn-covered submachine gun with green glow.
Row 2: a bone crossbow; a heavy iron minigun; a lightning coil gun with blue sparks; a bubbling acid sprayer; a frost cannon with ice crystals; a grenade launcher with a drum; a saw-blade launcher; a small twin-pistol pair.
Row 3: a lantern-shaped soul cannon; a harpoon gun with chain; a crystal beam emitter; a blunderbuss with a flared muzzle; a scythe-rifle hybrid; a spore launcher with mushrooms; a mirror-plated reflector gun; a tiny derringer.
Row 4: a gold-trimmed legendary hand cannon; a void-black rifle leaking purple smoke; a molten lava gun; a bell-shaped sonic blaster; a spider-leg needle gun; a bone-white sniper rifle; a clockwork repeater with gears; a cracked ancient relic gun glowing white.
```

## 03b — `03b_weapons_held.png`

Optional: the same guns held in the hero's hands, so the gun looks attached when the game pins it to the shoulder.

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: 32 different handheld guns, one per cell, each HELD by the hero's arms and pointing RIGHT in clean side profile: two forearms in deep navy cloak sleeves with dark gloved hands, one hand on the grip and one supporting the barrel. The sleeves come in from the left and end cleanly at the elbow — no body, no head, no shoulders. The rear hand on the grip is at the same spot in every cell: 64 pixels from the left edge, vertically centered. Dark iron and brass guns with one glowing accent colour each. Same scale and same lighting for all.
Row 1: a rusty revolver-pistol with a warm yellow glow; a three-barrel spread gun with red glow; a sleek laser rifle with a cyan energy cell; a flamethrower with an orange fuel tank; a boxy twin missile launcher with violet windows; a double-barrel shotgun with a wooden stock; a long railgun with violet coil rings; a compact thorn-covered submachine gun with green glow.
Row 2: a bone crossbow; a heavy iron minigun; a lightning coil gun with blue sparks; a bubbling acid sprayer; a frost cannon with ice crystals; a grenade launcher with a drum; a saw-blade launcher; a small twin-pistol pair.
Row 3: a lantern-shaped soul cannon; a harpoon gun with chain; a crystal beam emitter; a blunderbuss with a flared muzzle; a scythe-rifle hybrid; a spore launcher with mushrooms; a mirror-plated reflector gun; a tiny derringer.
Row 4: a gold-trimmed legendary hand cannon; a void-black rifle leaking purple smoke; a molten lava gun; a bell-shaped sonic blaster; a spider-leg needle gun; a bone-white sniper rifle; a clockwork repeater with gears; a cracked ancient relic gun glowing white.
```

## 04 — `04_projectiles_vfx.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: glowing projectiles and effects with bright cores and soft glow, flying to the RIGHT. The glow fades out to full transparency, not to black.
Row 1 (8 different projectiles): small yellow bullet; red round spread-shot orb; long cyan laser bolt; orange fire puff; small violet missile with flame trail; white shotgun pellet; long violet-white rail beam segment; magenta cursed enemy orb with a dark core.
Row 2 (8 frames): muzzle flash animation, 4 frames of a yellow-white burst pointing right, then 4 frames of a larger orange burst.
Row 3 (8 frames): bullet impact spark animation, from a bright star to fading embers.
Row 4 (8 frames): explosion animation, from a white flash to orange fireball to dark smoke.
```

## 05 — `05_enemies_a.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

SUBJECT: two enemies. All face RIGHT.
Rows 1–2: "Husk Crawler" — a low armoured beetle with a rust-orange segmented shell, a pale bone mask for a face with empty black eyes, six short dark legs.
Row 1 (8 frames): walk cycle.
Row 2 (8 frames): 2 frames flinching when hit, then 6 frames dying — flipping over, shell cracking, collapsing into husks.
Rows 3–4: "Mire Hopper" — a round moss-green frog-like creature with two small horns, long bent legs and one large pale eye.
Row 3 (8 frames): idle (2), crouching to leap (2), leaping with legs extended (2), landing (2).
Row 4 (8 frames): 2 frames flinching when hit, then 6 frames dying — bursting into green mist.
```

## 06 — `06_enemies_b.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered horizontally. Frames read left to right, top row first.

SUBJECT: two enemies. All face RIGHT.
Rows 1–2: "Watcher" — a floating dark violet sphere with one huge glowing magenta eye and three short tentacles hanging below. It flies, so it is centered vertically in its cell.
Row 1 (8 frames): hovering loop, tentacles drifting.
Row 2 (8 frames): 4 frames charging a shot (eye glows brighter) and firing, then 4 frames dying — the eye cracks and the body dissolves.
Rows 3–4: "Carapace Brute" — a hulking two-legged armoured knight-beetle with a heavy club arm, slate-grey shell with ember cracks. It stands on a baseline 24 pixels above the bottom of the cell.
Row 3 (8 frames): heavy walk cycle.
Row 4 (8 frames): 4 frames overhead club smash, then 4 frames collapsing in death.
```

## 07 — `07_tiles_cave.png`

Solid ground only. Every cell is a full square of rock, so this sheet has NO transparency and needs no background removal.

```
A flat 2D tileset texture atlas for a side-scrolling platformer game, in the style of a classic hand-painted tileset. Dark gothic cavern rock: desaturated slate blue and charcoal stone with fine cracks, teal moss, a few warm ember-orange flecks (#ff9a3c). Crisp painted edges, even flat lighting, no photorealism. Every tile is seen perfectly straight-on as a flat cross-section — no perspective, no depth, no scene.

A single tile sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. EVERY cell is a solid SQUARE BLOCK OF ROCK that fills 100% of its cell, edge to edge and corner to corner. The whole image is fully opaque rock texture with no gaps between cells. There is NO background of any kind: no cave, no sky, no black areas, no empty space, no transparency, no floating islands, no ledges hanging in the air, no shadows cast onto a background. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. All 32 tiles use the same rock colour, the same crack size and the same lighting, so any tile can be placed next to any other and the rock continues seamlessly across the shared edge. Cells read left to right, top row first.

SUBJECT: 32 square rock tiles. An "open" side of a tile is shown only as a band painted along that edge of the square; the rest of the square is always solid rock.
Row 1 (8 tiles): GROUND SURFACE. A thick band of teal moss and short grass runs straight across the TOP edge of the square, about one fifth of its height, perfectly level from the left edge to the right edge. Below the band is solid rock down to the bottom edge. Eight variations of the same tile.
Row 2 (8 tiles): INNER ROCK. Plain solid rock with cracks, no moss at all, seamless on all four sides. Eight variations.
Row 3 (8 tiles): WALL FACES. Cells 1 to 4: a thin worn, slightly lighter rim with a little moss runs straight down the LEFT edge of the square; everything else is solid rock. Cells 5 to 8: the same with the rim on the RIGHT edge.
Row 4 (8 tiles): Cells 1 and 2: moss band along the TOP edge and worn rim down the LEFT edge, meeting in the top-left corner. Cells 3 and 4: moss band along the TOP edge and worn rim down the RIGHT edge, meeting in the top-right corner. Cells 5 to 8: CEILING UNDERSIDE — a darker, rougher band with tiny stone nubs runs straight across the BOTTOM edge of the square; above it is solid rock.
```

## 07b — `07b_props_cave.png`

Ledges, spikes and decorations, each on a transparent background.

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first. The background must NOT be white, NOT grey and NOT a checkerboard pattern — it must be real transparency.

SUBJECT: 32 separate cavern props, one per cell. Each is a single object with nothing around it.
Row 1: a thin flat stone ledge in three pieces — left end, middle piece, right end — purple-grey stone, flat level top, about one fifth of the cell tall, the middle piece running the full width of its cell; the same three pieces made of old wooden planks bound with iron; a row of sharp bone spikes pointing UP with a flat base; a row of sharp bone spikes pointing DOWN with a flat top.
Row 2: bone spikes pointing LEFT; bone spikes pointing RIGHT; a hanging rusted chain; a hanging iron lantern with a warm glow; a standing iron lantern post; a stone resting bench with two lantern posts; a crooked wooden signpost; a tilted stone grave marker.
Row 3: moss clump; hanging vine; glowing cyan crystal cluster; small cyan crystal; pile of bones; single skull; small stalactite; small stalagmite.
Row 4: pile of rubble; broken stone pillar stump; cracked clay urn; iron cage; cobweb; glowing mushroom cluster; tangled roots; old shield and sword leaning together.
```

## 08 — `08_items_pickups.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: collectible items, each with a soft glow that fades out to full transparency.
Row 1 (8 frames): a cyan crystal shard spinning through one full turn.
Row 2 (8 items): ability orbs — cyan orb with a double-arrow dash symbol; amber orb with a wing symbol; green orb with three claw marks; violet orb with an anchor-hook symbol; white orb with a lantern symbol; red orb with a fist symbol; blue orb with a water-drop symbol; gold orb with a crown symbol.
Row 3 (8 items): small health vial; large health flask; hooded-mask health piece; iron key; gold key; ornate boss key; rolled map; sealed letter.
Row 4 (8 cells): stone resting bench with two lantern posts; save lantern; a dark swirling orb holding cyan shards shown as a 4-frame loop across 4 cells; closed iron chest; open iron chest spilling light.
```

## 09 — `09_charms.png`

```
Dark gothic hand-painted 2D game art. Desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, crisp painted edges, no photorealism. Flat front view.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: 32 different small equippable charms — round or shield-shaped metal badges about the size of a coin, each with one clear emblem. Tarnished silver, brass and bone with coloured enamel.
Row 1 (offence): crossed bullets; flame; lightning bolt; skull; spiral drill; fang; bursting star; crosshair.
Row 2 (defence): shield; heart; turtle shell; thorn ring; iron mask; hourglass; anchor; feather.
Row 3 (movement): wing; boot; wind swirl; claw; spring; arrow; shadow figure; comet.
Row 4 (utility): coin; magnet; eye; key; lantern; compass; four-leaf clover; crown.
```

## 10 — `10_ui_icons.png`

```
Flat game-interface icon set in a dark gothic style: pale bone-white line art with cyan glow accents (#6ff3ff), all icons the same stroke weight and size, simple and readable at small sizes.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale and centered in their cell both horizontally and vertically. Cells read left to right, top row first.

SUBJECT: 32 icons.
Row 1: full hooded-mask health icon; empty hooded-mask health icon; the mask cracking and breaking shown in 3 frames; crystal shard currency icon; ammo icon; timer icon.
Row 2 (menu tabs): gun; backpack; charm badge; monster face; hooded player; globe; group of three players; gear.
Row 3 (actions): plus; minus; trash bin; search magnifier; teleport swirl; heart refill; skull; lightning bolt.
Row 4 (controls): jump arrow; fire burst; sword slash; dash arrows; swap arrows; aim crosshair; pause bars; fullscreen corners.
```

## 11 — `11_boss_warden.png`

Use 512 px cells for this one if your tool can (4096×2048).

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 512×512 pixels, total image exactly 4096×2048 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 32 pixels above the bottom of the cell. Frames read left to right, top row first.

SUBJECT: one boss, "The Hollow Warden" — a towering armoured knight made of cracked stone and chains, a cage for a helmet with a cyan flame inside, wielding a huge lantern-mace. Faces LEFT. The boss nearly fills each cell.
Row 1 (8 frames): idle, chains swaying, flame flickering.
Row 2 (8 frames): slow heavy walk.
Row 3 (8 frames): 4 frames overhead mace slam; 4 frames sweeping chain attack.
Row 4 (8 frames): 3 frames staggered; 5 frames death — flame goes out, armour falls apart.
```

---

## Backgrounds (not grids)

Generate each as one wide image, **2048 × 1024**, that repeats seamlessly left to right.

### Far layer — `bg_far.png`

This is the back wall of the scene, so it stays a full opaque picture.

```
Dark gothic hand-painted 2D game background. Distant silhouettes of colossal cavern pillars and stalactites, very dark blue-grey (#111828) shapes on a flat darker backdrop, soft fog at the bottom, no detail, no characters, no text. Wide 2:1 image, seamless horizontally so the left and right edges match.
```

### Mid layer — `bg_mid.png`

```
Dark gothic hand-painted 2D game background layer. Closer hanging stalactites, broken arches and rusted chains, near-black (#0a0e18) silhouettes with a faint cyan rim light. REMOVE THE BACKGROUND COMPLETELY: everything behind the silhouettes is fully transparent (PNG with alpha channel), no background colour, no checkerboard pattern, no sky, no fog. No characters, no text. Wide 2:1 image, seamless horizontally so the left and right edges match.
```

### Foreground layer — `bg_fore.png`

```
Dark gothic hand-painted 2D game foreground layer. Blurred black roots, chains and rock edges framing the top and bottom of the image only, the centre left completely empty. REMOVE THE BACKGROUND COMPLETELY: everything behind the shapes is fully transparent (PNG with alpha channel), no background colour, no checkerboard pattern. No characters, no text. Wide 2:1 image, seamless horizontally so the left and right edges match.
```

---

## Hero with the weapon drawn in (baked sheets)

The hero is drawn holding a plain white sword in every animation. The white sword is a stand-in: to make a
weapon's sheets, feed the finished sheet plus a picture of the weapon to the image tool and have it swap the
sword for that weapon (prompt W below).

| Sheet | Attach | Save as |
|---|---|---|
| H1 core | `01_player_core.png` | `30_hero_core.png` |
| H2 moves + aiming | `01_player_core.png`, then `30_hero_core.png` | `31_hero_moves.png` |
| H3 sword attacks | `01_player_core.png`, then `30_hero_core.png` | `32_hero_sword.png` |
| W weapon swap (core) | `30_hero_core.png`, then the weapon picture | `40_<weapon>_core.png` |
| W weapon swap (moves) | `31_hero_moves.png`, then the weapon picture | `41_<weapon>_moves.png` |

The single-weapon pictures are in `assets/atlas/`: `w_pistol.png`, `w_spread.png`, `w_laser.png`, `w_flame.png`,
`w_homing.png`, `w_shotgun.png`, `w_rail.png`, `w_smg.png`. H3 is never swapped: melee always uses the sword.

### H1 — core → `30_hero_core.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

REFERENCE: the attached image is the character sheet for this hero. Draw EXACTLY the same character in exactly the same art style, proportions, colours and size as the attached sheet: a small hooded figure in a deep navy tattered cloak, tall pointed hood, pitch-black face opening with two glowing cyan eyes, long crimson scarf, dark boots. Do not redesign the character. Do not add armour, belts, straps or a visible body under the cloak. Faces RIGHT in every frame.

WEAPON: in every frame the hero holds one plain white sword — a simple straight blade, flat solid white with a thin light-grey outline and a plain white hilt. No glow, no decoration, no colour on the sword. One dark gloved hand comes out from under the cloak at chest height to hold it. In EVERY frame of this sheet the sword is held level and points straight FORWARD (to the right), like a weapon held ready. The sword is about half as long as the hero is tall and is the same size in every frame. No swing arcs, no effects.

Row 1 (8 frames): idle breathing loop, scarf swaying gently, sword held level pointing forward.
Row 2 (8 frames): walk cycle, slow and steady, sword held level pointing forward.
Row 3 (8 frames): run cycle, cloak and scarf streaming behind, sword held level pointing forward.
Row 4 (8 frames): jump — crouch, launch, rising, rising, apex, falling, falling fast, about to land — sword held level pointing forward throughout.
```

### H2 — moves + aiming → `31_hero_moves.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

REFERENCE: the attached images are character sheets for this hero. Draw EXACTLY the same character in exactly the same art style, proportions, colours and size as the attached sheets: a small hooded figure in a deep navy tattered cloak, tall pointed hood, pitch-black face opening with two glowing cyan eyes, long crimson scarf, dark boots. Do not redesign the character. Do not add armour, belts, straps or a visible body under the cloak. Faces RIGHT in every frame.

WEAPON: in every frame the hero holds one plain white sword — a simple straight blade, flat solid white with a thin light-grey outline and a plain white hilt. No glow, no decoration, no colour on the sword. One dark gloved hand comes out from under the cloak at chest height to hold it. The sword is held straight like a pointed weapon and points EXACTLY in the direction named for each frame. The sword is about half as long as the hero is tall and is the same size in every frame. No swing arcs, no afterimages, no speed lines, no effects.

Row 1: cells 1, 2, 3 — landing from a jump, squashing down then rising, sword pointing FORWARD. Cells 4, 5 — crouching down. Cells 6, 7, 8 — crouched low and still, sword pointing FORWARD.
Row 2: cells 1, 2, 3 — dash: a low fast forward lunge, cloak and scarf streaming back, sword tucked in close pointing FORWARD. Cells 4, 5 — hit and recoiling backwards. Cells 6, 7 — wall slide: back pressed against an invisible wall behind the hero on the left side of the cell, feet braced against it, sword pointing FORWARD; DO NOT draw any wall. Cell 8 — pushing off that invisible wall, leaping up and to the right.
Row 3: cells 1 to 4 — run cycle (4 key frames) with the sword pointing DIAGONALLY UP, 45 degrees up and forward. Cells 5 to 8 — run cycle (4 key frames) with the sword pointing DIAGONALLY DOWN, 45 degrees down and forward.
Row 4: cell 1 — standing still, sword pointing DIAGONALLY UP. Cell 2 — standing still, sword pointing STRAIGHT UP. Cell 3 — standing still, sword pointing DIAGONALLY DOWN. Cell 4 — standing still and braced, sword pointing FORWARD. Cell 5 — in the air with legs tucked, sword pointing DIAGONALLY UP. Cell 6 — in the air, sword pointing STRAIGHT UP. Cell 7 — in the air, sword pointing DIAGONALLY DOWN. Cell 8 — in the air, sword pointing STRAIGHT DOWN.
```

### H3 — sword attacks → `32_hero_sword.png`

```
Dark gothic hand-painted 2D game art for a side-scrolling action game. Moody underground kingdom: desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle texture, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

A single sprite sheet laid out as a strict grid: EXACTLY 8 columns and 4 rows, 32 cells, each cell exactly 256×256 pixels, total image exactly 2048×1024 pixels. REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows behind or under the subjects. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Each subject sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. All subjects are drawn at the same scale, centered horizontally, standing on the same baseline 24 pixels above the bottom of the cell. Frames read left to right, top row first.

REFERENCE: the attached images are character sheets for this hero. Draw EXACTLY the same character in exactly the same art style, proportions, colours and size as the attached sheets: a small hooded figure in a deep navy tattered cloak, tall pointed hood, pitch-black face opening with two glowing cyan eyes, long crimson scarf, dark boots. Do not redesign the character. Do not add armour, belts, straps or a visible body under the cloak. Faces RIGHT in every frame.

WEAPON: in every frame the hero holds one plain white sword — a simple straight blade, flat solid white with a thin light-grey outline and a plain white hilt. No glow, no decoration, no colour on the sword. One dark gloved hand comes out from under the cloak to hold it. The sword is about half as long as the hero is tall and is the same size in every frame. The only effects allowed are plain white crescent swing arcs in the slash frames and cyan shards in the death frames.

Row 1: cells 1 to 4 — forward slash: wind-up, swing, full extension, follow-through, with a white crescent arc in front. Cells 5 to 8 — upward slash, the same four steps, with the arc above the head.
Row 2: cells 1 to 4 — downward slash while airborne: legs tucked, sword swinging down, arc below the feet. Cells 5 to 8 — death: staggering, collapsing, breaking apart, then only scattered cyan shards.
Row 3: cells 1 to 4 — crouching slash: a low sweep along the ground with the arc in front. Cells 5 to 8 — dash slash: lunging forward with the sword thrust out, a long white streak along the blade.
Row 4: cells 1 to 4 — sitting down and resting with the sword laid across the knees. Cells 5 to 8 — raising the sword overhead in triumph.
```

### W — weapon swap → `40_<weapon>_core.png` and `41_<weapon>_moves.png`

Run it twice per weapon: once with `30_hero_core.png`, once with `31_hero_moves.png`.

```
Edit the FIRST attached image, which is a finished sprite sheet. Keep it EXACTLY as it is: the same strict grid of 8 columns and 4 rows, the same 32 poses in the same cells, the same character, the same art style, the same positions and sizes, the same total image size of 2048×1024 pixels.

THE ONLY CHANGE: in every one of the 32 cells, replace the plain white sword with the weapon shown in the SECOND attached image. Draw exactly that weapon — the same shape, colours, details and glow. It is held by the same gloved hand in the same place, with its grip where the sword hilt was, and its barrel points in exactly the same direction the sword pointed in that cell. If the weapon is long or heavy, add a second dark gloved hand from under the cloak supporting it. The weapon is about half as long as the hero is tall and is the same size in all 32 cells. No white sword may remain anywhere.

Do not change the hero: a small hooded figure in a deep navy tattered cloak, tall pointed hood, pitch-black face opening with two glowing cyan eyes, long crimson scarf, dark boots, facing RIGHT. Do not add muzzle flashes, bullets, smoke or any other effects.

REMOVE THE BACKGROUND COMPLETELY: the background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor and no shadows. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. Every subject stays completely inside its own cell.
```

---

## Sword hero — everything in one sheet (50 frames, written from scratch)

One prompt, 10 columns × 5 rows. The cloak is short so both legs show, and the run is described leg by leg.

**Attach:** `01_player_core.png` only (not an earlier sword sheet, so its mistakes are not copied)
**Save as:** `hollow/assets/hero_sword.png` (overwrite)

After a new sheet arrives, run `python hollow/tools/build_art.py`, read the "sprites per row" line it prints,
and check `HERO_LAYOUT` in that script against the new sheet — the AI does not always draw 10 sprites per row.

```
Dark gothic hand-painted 2D game art for a side-scrolling action game in the spirit of a moody hand-drawn metroidvania. Desaturated slate blues and charcoal, with warm ember-orange accents (#ff9a3c) and cyan soul-glow (#6ff3ff). Clean readable silhouettes, soft rim lighting from the upper right, crisp painted edges, subtle brush texture, no photorealism, no pixel art. Strict orthographic side view, no perspective, no camera tilt.

GRID: a single sprite sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one sprite in every cell, 10 sprites in every row, no empty cells and no extra sprites. Frames read left to right, top row first. Each sprite sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell — this includes the scarf, the sword, the slash arcs and the death shards. The hero is drawn at exactly the same size in all 50 cells — never smaller, never larger. Grounded poses are centered horizontally and stand on the same baseline 24 pixels above the bottom of the cell; airborne poses float above it.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. The background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor line, no cast shadows, no white fog, no mist, no haze and no pale box behind any sprite. No grid lines, no borders, no frames, no text, no numbers, no labels, no watermark. No stray marks anywhere: no dust puffs, no smudges, no speed lines, no afterimages, no loose specks.

CHARACTER: a small hooded swordsman about two and a half heads tall, facing RIGHT in every frame. A tall pointed navy hood with the tip curling slightly back; a pitch-black face opening with two glowing cyan oval eyes; a long crimson scarf wrapped at the neck with two tails that trail behind and react to motion. The navy cloak is SHORT — it ends at mid-thigh with a ragged hem — so the two legs below it are fully visible at all times: dark grey trousers and brown leather boots. No armour, no belts, no straps. If an image is attached, match its hood, face, scarf and colours exactly, but keep the short cloak and the visible legs described here.

LEGS: the two legs must clearly alternate — never one leg moving while the other stays still. The NEAR leg (closer to the viewer) is drawn slightly lighter and the FAR leg slightly darker, so it is always obvious which is which. In every moving frame both legs are in clearly different positions from the frame before.

SWORD: in every one of the 50 cells the hero holds the same sword in one dark gloved hand. It is a slender straight longsword about half as long as the hero is tall: a pale silver-white steel blade with a narrow groove down its centre, a bright highlight along the edge and a sharp tapered point; a small dark iron crossguard with slightly curled tips; a grip wrapped in dark leather; a round iron pommel set with a tiny glowing cyan gem. Exactly the same design and size in every cell. When not attacking, the sword is held low at the side with the blade angled down and back.

SLASH ARCS: every slash frame that names an arc includes a crescent swing arc following the blade — a bright white core, a pale cyan glow along the outer edge, thin white streak lines inside the curve, tips that taper to fine points, the tail fading to transparent, and two or three tiny sparks at the leading tip. The arc stays close to the hero and inside the cell.

ROW 1
Cells 1 to 4 — IDLE breathing loop. Cell 1: standing relaxed, feet slightly apart. Cell 2: chest and hood rise a little, scarf tails lift. Cell 3: highest point of the breath. Cell 4: settling down.
Cells 5 to 10 — RUN, a full six-step cycle, body leaning forward, cloak and scarf streaming back. Cell 5: NEAR leg stretched far forward with the heel touching down, FAR leg stretched far behind on its toe, legs wide apart like open scissors. Cell 6: NEAR foot flat under the body with the knee bent, body at its lowest, FAR foot lifting off behind. Cell 7: standing on the NEAR leg, FAR leg swinging forward with the knee raised high, body at its highest. Cell 8: FAR leg stretched far forward with the heel touching down, NEAR leg stretched far behind on its toe. Cell 9: FAR foot flat under the body with the knee bent, NEAR foot lifting off behind. Cell 10: standing on the FAR leg, NEAR leg swinging forward with the knee raised high.

ROW 2
Cells 1 to 4 — JUMP. Cell 1: launch, knees deeply bent, pushing off the toes. Cell 2: rising, body stretched tall, legs trailing straight down. Cell 3: apex, knees tucked up, cloak flared. Cell 4: falling, legs reaching down, cloak and scarf blown upward.
Cell 5 — LANDING: knees deeply bent, body low, one hand toward the ground.
Cells 6, 7 — DOUBLE-JUMP FLIP: curled into a tight ball. Cell 6: hood pointing right. Cell 7: the same ball turned upside down, hood pointing down.
Cell 8 — CROUCH: squatting very low and still, sword held across the front.
Cells 9, 10 — SLIDE. Cell 9: sliding forward on one knee with the other leg stretched out in front, body leaning back. Cell 10: lower still, almost lying back.

ROW 3
Cells 1 to 3 — DASH. Cell 1: coiling, body lowering. Cell 2: full lunge, body stretched almost horizontal, both legs kicked straight out behind, sword trailing. Cell 3: easing out, front foot reaching for the ground.
Cells 4, 5 — WALL SLIDE: clinging to an invisible vertical wall directly behind the back at the LEFT side of the cell, body upright, both boots braced against it, still facing right; the two cells differ slightly. DO NOT draw the wall.
Cell 6 — WALL KICK: springing off that invisible wall up and to the right, back leg fully extended.
Cells 7, 8 — HURT. Cell 7: struck, head snapped back, body bent backwards. Cell 8: staggering back, off balance.
Cells 9, 10 — DEATH. Cell 9: collapsing to the knees, the cloak cracking apart with cyan light. Cell 10: only a tight burst of cyan crystal shards, all well inside the cell.

ROW 4
Cells 1 to 4 — FORWARD SLASH on the ground. Cell 1: wind-up, sword drawn back over the shoulder, no arc. Cell 2: mid-swing, stepping forward, arc beginning. Cell 3: full extension, deep lunge, the largest arc in front. Cell 4: follow-through, sword low in front, thin fading arc, hero the same size as in cell 3.
Cells 5 to 7 — UPWARD SLASH. Cell 5: wind-up, sword low behind the hip, no arc. Cell 6: sword sweeping straight up, large arc above the head. Cell 7: follow-through, thin fading arc.
Cells 8 to 10 — DOWNWARD SLASH in mid-air, knees tucked. Cell 8: sword raised overhead, no arc. Cell 9: sword thrust straight down with a large arc beneath the feet. Cell 10: follow-through, thin fading arc below.

ROW 5
Cells 1 to 3 — FORWARD SLASH in mid-air, knees tucked. Cell 1: wind-up, no arc. Cell 2: full extension with a large arc in front. Cell 3: follow-through, thin fading arc.
Cells 4, 5 — REST. Cell 4: lowering to sit. Cell 5: sitting cross-legged, head bowed, sword across the knees.
Cells 6, 7 — TRIUMPH. Cell 6: raising the sword. Cell 7: sword held straight up overhead.
Cells 8 to 10 — FOCUS. Cell 8: dropping to one knee. Cell 9: kneeling with the sword planted point-down, both hands on the hilt. Cell 10: the same pose with faint cyan light rising from the blade.
```
