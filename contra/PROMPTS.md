# COMMANDO — AI art prompts

Every sheet is 10 columns × 5 rows (50 cells), background removed (transparent PNG). Paste one block per
image, aspect ratio 2:1, largest size the tool offers. Save the result into `contra/assets/` under the
name given, then run `python contra/tools/build_art.py`.

## 1 — Commandos, gun, bullet → `commandos.png`

**Attach:** nothing

```
Hand-painted 2D game art for a side-scrolling run-and-gun action game. Gritty 1980s action-movie look: muscular commandos, jungle-war colours, bold readable silhouettes, strong rim lighting from the upper right, crisp painted edges, subtle brush texture, no photorealism, no pixel art. Strict orthographic side view, no perspective, no camera tilt.

GRID: a single sprite sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one sprite in every cell, 10 sprites in every row. Frames read left to right, top row first. Each sprite sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. Both characters are drawn at exactly the same size in every cell — never smaller, never larger. Standing and running poses are centered horizontally and stand on the same baseline 24 pixels above the bottom of the cell.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. The background must be fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor line, no cast shadows, no white fog, no haze, no glow box behind any sprite. No grid lines, no borders, no frames, no text, no letters, no numbers, no labels, no watermark. No stray marks: no dust puffs, no smudges, no speed lines.

COMMANDO A: a muscular soldier about three heads tall with short dark hair, a BLUE headband with two short tails, a white sleeveless shirt, blue camouflage trousers, black combat boots and fingerless gloves. COMMANDO B: the same build and the same poses, with blond hair, a RED headband, a bare chest crossed by one ammunition belt, red camouflage trousers and black combat boots. Both face RIGHT in every frame. Each character looks exactly the same in every one of their cells.

GUN: both commandos carry the same single weapon in every frame, held in both hands: a chunky assault rifle with a black steel body, a short thick barrel, a wooden stock and a small glowing orange energy cell on the side. The rifle is exactly the same design and size in every cell, and its barrel points exactly in the direction named for each frame. No muzzle flash and no bullets in the character frames.

LEGS: the two legs must clearly alternate. The NEAR leg (closer to the viewer) is drawn slightly lighter and the FAR leg slightly darker, so it is always obvious which is which. In every run frame both legs are in clearly different positions from the frame before.

ROW 1 — COMMANDO A
Cells 1 to 6 — RUN, rifle aimed straight FORWARD, a full six-step cycle, body leaning forward. Cell 1: NEAR leg stretched far forward with the heel touching down, FAR leg stretched far behind on its toe, legs wide apart. Cell 2: NEAR foot flat under the body with the knee bent, body at its lowest, FAR foot lifting off behind. Cell 3: standing on the NEAR leg, FAR leg swinging forward with the knee raised high. Cell 4: FAR leg stretched far forward with the heel touching down, NEAR leg stretched far behind on its toe. Cell 5: FAR foot flat under the body, NEAR foot lifting off behind. Cell 6: standing on the FAR leg, NEAR leg swinging forward with the knee raised high.
Cell 7 — STANDING still, feet apart, rifle aimed straight FORWARD.
Cell 8 — STANDING still, rifle aimed STRAIGHT UP.
Cell 9 — STANDING still, rifle aimed DIAGONALLY UP, 45 degrees up and forward.
Cell 10 — STANDING still, rifle aimed DIAGONALLY DOWN, 45 degrees down and forward.

ROW 2 — COMMANDO A
Cells 1 to 3 — RUN with the rifle aimed DIAGONALLY UP. Cell 1: NEAR leg far forward, FAR leg far behind. Cell 2: legs passing under the body, one knee raised. Cell 3: FAR leg far forward, NEAR leg far behind.
Cells 4 to 6 — RUN with the rifle aimed DIAGONALLY DOWN, the same three steps.
Cell 7 — PRONE: lying flat on the stomach along the baseline, propped on the elbows, rifle aimed straight FORWARD.
Cells 8, 9 — SOMERSAULT JUMP: curled into a tight ball with knees to chest, rifle tucked in. Cell 8: head at the top. Cell 9: the same ball rotated half a turn, head at the bottom.
Cell 10 — DEATH: knocked backwards through the air, back arched, arms thrown wide, rifle slipping from the hand.

ROW 3 — COMMANDO B: exactly the same ten poses as ROW 1, in the same order.
ROW 4 — COMMANDO B: exactly the same ten poses as ROW 2, in the same order.

ROW 5 — ITEMS, each centered in its cell
Cell 1: the rifle on its own, side view, pointing right.
Cell 2: the BULLET — a small round glowing orange-white energy bullet with a short bright tail, flying right.
Cell 3: a small yellow-white muzzle flash pointing right.
Cell 4: a larger orange muzzle flash pointing right.
Cell 5: a small bullet-impact spark burst.
Cell 6: a larger bullet-impact spark burst with a few embers.
Cell 7: a steel winged badge with a lightning bolt in the middle.
Cell 8: a steel winged badge with a shield in the middle.
Cell 9: a gold medal with a star on a short ribbon.
Cell 10: a flying metal capsule pod with two small wings and a glowing orange window.
```

Note: in the sheet made on 2026-09-30, rows 2 and 4 came out with only 2 diagonal-down run frames, the
prone pose in cell 6 and cell 7 empty. `tools/build_art.py` is set up for that sheet; a regenerated sheet
needs its cell numbers (the `POSES` list) checked.

## 2 — Enemies, effects and tiles → `enemies_tiles.png`

**Attach:** `commandos.png` (style reference)

```
Hand-painted 2D game art for a side-scrolling run-and-gun action game, in exactly the same art style as the attached sprite sheet. Gritty 1980s action-movie look, jungle-war colours, bold readable silhouettes, strong rim lighting from the upper right, crisp painted edges, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

GRID: a single sprite sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one sprite in every cell, 10 sprites in every row, no empty cells. Cells read left to right, top row first. In rows 1 to 4 each sprite sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. Soldiers are the same size as the commandos in the attached sheet and stand on the same baseline 24 pixels above the bottom of the cell.

BACKGROUND, ROWS 1 TO 4: REMOVE THE BACKGROUND COMPLETELY. Fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor line, no cast shadows, no fog, no haze, no glow box behind any sprite.
ROW 5 IS DIFFERENT: every cell in row 5 is a solid SQUARE terrain tile that fills 100% of its cell, edge to edge, fully opaque, with no transparency and no gaps.
EVERYWHERE: no grid lines, no borders, no frames, no text, no letters, no numbers, no labels, no watermark, no stray marks.

LEGS: in the run frames the two legs must clearly alternate. The NEAR leg (closer to the viewer) is drawn slightly lighter and the FAR leg slightly darker. Both legs are in clearly different positions from the frame before.

ROW 1 — ENEMY RUNNER: a lean enemy soldier in a grey-green uniform, steel helmet and black boots, carrying NO weapon, fists clenched, facing RIGHT.
Cells 1 to 6 — RUN cycle. Cell 1: NEAR leg stretched far forward with the heel touching down, FAR leg far behind on its toe. Cell 2: NEAR foot flat under the body, FAR foot lifting off behind. Cell 3: standing on the NEAR leg, FAR knee raised high. Cell 4: FAR leg stretched far forward, NEAR leg far behind. Cell 5: FAR foot flat under the body, NEAR foot lifting. Cell 6: standing on the FAR leg, NEAR knee raised high.
Cells 7, 8 — JUMP: leaping with knees tucked, then legs reaching down to land.
Cells 9, 10 — DEATH: knocked backwards through the air with arms thrown wide, then lying flat on the back.

ROW 2 — ENEMY RIFLEMAN: an enemy soldier in a brown uniform with a red beret, holding a long grey rifle in both hands, facing RIGHT, feet planted.
Cell 1: standing, rifle aimed straight FORWARD. Cell 2: rifle aimed DIAGONALLY UP. Cell 3: rifle aimed STRAIGHT UP. Cell 4: rifle aimed DIAGONALLY DOWN. Cell 5: rifle aimed STRAIGHT DOWN. Cell 6: firing forward, rifle kicking back. Cell 7: kneeling on one knee, rifle aimed FORWARD.
Cells 8 to 10 — DEATH: hit and bending backwards, falling, then lying flat on the back.

ROW 3 — MACHINES, each centered in its cell.
Cell 1: a ground gun turret BASE with no barrel — a squat armoured steel dome on a riveted plate with a glowing red sensor.
Cell 2: the turret BARREL on its own — a short thick steel cannon barrel pointing RIGHT, drawn perfectly horizontal.
Cell 3: the same turret destroyed — a smoking blackened wreck.
Cell 4: a large wall-mounted cannon HOUSING with no barrel — a heavy round armoured mount with bolts and a glowing red core.
Cell 5: the large cannon BARREL on its own — a long heavy barrel pointing RIGHT, perfectly horizontal.
Cell 6: the fortress CORE, intact — a tall armoured steel door frame with a large glowing red reactor in the middle.
Cell 7: the same core damaged — cracked armour, sparks, the reactor flickering orange.
Cell 8: the same core destroyed — a blackened, broken frame with the reactor dark.
Cell 9: an enemy bullet — a small round glowing red-white orb.
Cell 10: a fortress wall panel — a square riveted steel plate with a warning stripe.

ROW 4 — EFFECTS AND PROPS, each centered in its cell.
Cells 1 to 4 — EXPLOSION animation: a white flash, an orange fireball, a larger fireball breaking into smoke, thinning dark smoke.
Cells 5, 6 — WATER SPLASH: a tall splash rising, then falling droplets.
Cell 7: a jungle fern bush. Cell 8: a mossy boulder. Cell 9: a wooden ammunition crate.
Cell 10: a LEDGE piece — a flat slab of earth with thick grass on top and hanging roots underneath, flat level top, running the full width of its cell and about one fifth of the cell tall.

ROW 5 — TERRAIN TILES. Every cell is a solid opaque square filled edge to edge. All ten tiles share the same earth colour and lighting so they sit together seamlessly.
Cells 1 to 3 — JUNGLE GROUND SURFACE: a thick band of bright green grass runs straight across the TOP edge, about one fifth of the cell tall and perfectly level; below it is brown earth with stones and roots down to the bottom edge. Three variations.
Cells 4, 5 — INNER EARTH: brown earth and rock with no grass, seamless on all four sides. Two variations.
Cell 6 — LEFT CLIFF: grass band along the top edge and a rough rock face running down the LEFT edge.
Cell 7 — RIGHT CLIFF: grass band along the top edge and a rough rock face running down the RIGHT edge.
Cell 8 — WATER SURFACE: bright ripples and foam along the top edge, deep blue water below.
Cell 9 — DEEP WATER: dark blue water with faint light streaks, seamless on all four sides.
Cell 10 — FORTRESS WALL: dark riveted steel plating, seamless on all four sides.
```
