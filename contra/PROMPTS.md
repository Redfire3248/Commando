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

## 3 — New enemies and the two new bosses → `enemies2.png`

**Attach:** `commandos.png` and `enemies_tiles.png` (style reference)

```
Hand-painted 2D game art for a side-scrolling run-and-gun action game, in exactly the same art style, size and lighting as the attached sprite sheets. Gritty 1980s action-movie look, bold readable silhouettes, strong rim lighting from the upper right, crisp painted edges, no photorealism. Strict orthographic side view, no perspective, no camera tilt.

GRID: a single sprite sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one sprite in every cell, 10 sprites in every row, no empty cells. Cells read left to right, top row first. Each sprite sits completely inside its own cell with at least 16 pixels of empty transparent space on every side, never touching or crossing into a neighbouring cell. Soldiers are the same size as the soldiers in the attached sheets and stand on the same baseline 24 pixels above the bottom of the cell. Vehicles fill most of their cell.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent (PNG with alpha channel) — no background colour, no checkerboard pattern, no gradient, no scenery, no floor line, no cast shadows, no fog, no haze, no glow box behind any sprite. No grid lines, no borders, no frames, no text, no letters, no numbers, no labels, no watermark, no stray marks.

ROW 1 — GRENADIER: an enemy soldier in a dark blue-grey uniform and dark blue helmet, a belt of grenades across the chest, NO rifle, facing RIGHT.
Cell 1: standing ready, a grenade in one hand. Cell 2: winding up, throwing arm pulled far back. Cell 3: throwing, arm swinging forward over the head. Cell 4: follow-through, arm forward and empty. Cells 5, 6: hit and staggering back. Cells 7 to 9: death — knocked backwards, falling, lying flat on the back. Cell 10: a single round grenade with a short fuse, on its own.

ROW 2 — DRONE: a small flying enemy drone, a dark steel body the size of a large backpack, two spinning rotors on short arms, one glowing red eye, a small gun underneath, seen from the side, facing LEFT.
Cells 1 to 4: hovering, the rotors in four different blur positions. Cell 5: firing, a small flash under the gun. Cells 6, 7: hit, sparking, tilting. Cell 8: falling, trailing smoke. Cell 9: a broken wreck. Cell 10: a small falling bomb.

ROW 3 — TANK (stage 2 boss): a heavy olive-green battle tank with wide tracks and a rounded turret, facing LEFT, drawn WITHOUT its gun barrel.
Cells 1 to 4: driving, the tracks and wheels in four different positions. Cell 5: the tank's long gun barrel on its own, pointing RIGHT, perfectly horizontal. Cell 6: the tank damaged, smoking, armour dented. Cell 7: the tank destroyed, a burning blackened wreck. Cell 8: a tank shell flying right. Cell 9: a large muzzle blast. Cell 10: a burst of black smoke.

ROW 4 — GUNSHIP (stage 3 boss): an armoured olive-green attack helicopter with a glass cockpit and a gun under the nose, facing LEFT, seen from the side.
Cells 1 to 4: flying, the main rotor and tail rotor in four different blur positions. Cell 5: firing, a flash at the nose gun. Cell 6: dropping a bomb from its belly. Cell 7: damaged, smoking, tilted. Cell 8: falling, on fire. Cell 9: a burning wreck on the ground. Cell 10: a falling bomb.

ROW 5 — PICK-UPS AND EXTRAS, each centred in its cell.
Cells 1, 2: a flying metal power-up capsule with two small wings and a glowing orange window, wings up then wings down. Cell 3: a steel winged badge with three small arrows fanning out (spread shot). Cell 4: a steel winged badge with a lightning bolt (rapid fire). Cell 5: a steel winged badge with a shield (barrier). Cell 6: a gold medal with a star on a ribbon (extra life). Cell 7: a sandbag wall. Cell 8: an oil barrel. Cell 9: a barbed-wire fence piece. Cell 10: a wooden warning sign with no writing.
```

## 4 — Steel Yard and Frozen Pass terrain → `terrain2.png`

**Attach:** `enemies_tiles.png` (style reference)

```
Hand-painted 2D game art for a side-scrolling run-and-gun action game, in exactly the same art style and lighting as the attached sprite sheet. Crisp painted edges, no photorealism. Strict orthographic side view, every tile seen perfectly straight-on.

GRID: a single sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one item in every cell. Cells read left to right, top row first.
ROWS 1 AND 3 ARE TILES: every cell is a solid opaque SQUARE that fills 100% of its cell, edge to edge, with no transparency and no gaps. Tiles in the same row share the same colours and lighting so they sit together seamlessly.
ROWS 2, 4 AND 5 ARE OBJECTS: REMOVE THE BACKGROUND COMPLETELY — each object sits inside its cell with at least 16 pixels of margin on a fully transparent background (PNG with alpha channel), no background colour, no checkerboard pattern, no shadows.
EVERYWHERE: no grid lines, no borders, no frames, no text, no letters, no numbers, no labels, no watermark.

ROW 1 — STEEL YARD TILES (a night-time military base). Cells 1 to 3: STEEL FLOOR SURFACE — a yellow-and-black hazard stripe band runs straight across the TOP edge, about one fifth of the cell tall and perfectly level; below it is grey concrete and riveted steel down to the bottom edge; three variations. Cells 4, 5: INNER CONCRETE, seamless on all four sides, two variations. Cell 6: LEFT EDGE — the surface tile with a torn steel edge down the LEFT side. Cell 7: RIGHT EDGE — the same with the torn edge on the RIGHT side. Cell 8: TOXIC SLUDGE SURFACE — glowing green ripples and bubbles along the top edge, dark green sludge below. Cell 9: DEEP SLUDGE, seamless on all four sides. Cell 10: dark riveted fortress steel, seamless on all four sides.

ROW 2 — STEEL YARD OBJECTS. Cell 1: a LEDGE — a flat steel catwalk with a hazard-striped top and a railing underneath, flat level top, running the full width of its cell and about one fifth of the cell tall. Cell 2: a stack of oil barrels. Cell 3: a steel shipping crate. Cell 4: a sandbag wall. Cell 5: a searchlight on a stand. Cell 6: a coil of pipes. Cell 7: a radio mast section. Cell 8: a metal warning sign with no writing. Cell 9: a broken jeep. Cell 10: a stack of tyres.

ROW 3 — FROZEN PASS TILES (a snowy mountain pass). Cells 1 to 3: SNOW SURFACE — a thick band of fresh white snow runs straight across the TOP edge, about one fifth of the cell tall and perfectly level; below it is frozen grey-blue rock and earth down to the bottom edge; three variations. Cells 4, 5: INNER FROZEN ROCK, seamless on all four sides, two variations. Cell 6: LEFT EDGE — the snow surface tile with an icy rock face down the LEFT side. Cell 7: RIGHT EDGE — the same with the rock face on the RIGHT side. Cell 8: ICY WATER SURFACE — floating ice and white foam along the top edge, dark blue water below. Cell 9: DEEP ICY WATER, seamless on all four sides. Cell 10: frosted fortress steel, seamless on all four sides.

ROW 4 — FROZEN PASS OBJECTS. Cell 1: a LEDGE — a flat slab of snow-covered rock with icicles hanging underneath, flat level top, running the full width of its cell and about one fifth of the cell tall. Cell 2: a snowy pine sapling. Cell 3: a snow-covered boulder. Cell 4: a frozen supply crate. Cell 5: an ice crystal cluster. Cell 6: a snowdrift. Cell 7: a broken wooden fence with snow on it. Cell 8: a frozen lantern post. Cell 9: a tent covered in snow. Cell 10: a pile of frozen logs.

ROW 5 — JUNGLE EXTRAS. Cell 1: a palm tree trunk with fronds. Cell 2: a bamboo cluster. Cell 3: hanging vines. Cell 4: a wooden watchtower. Cell 5: a rope bridge section, flat level top. Cell 6: a stone idol. Cell 7: a jungle flower bush. Cell 8: a fallen log. Cell 9: a wooden bunker entrance. Cell 10: a camouflage net.
```

---

# Season 2 — agents, backgrounds, scenery, abilities

All of these match the look of `commandos.png` (gritty painted 1980s action-movie art). **Attach nothing.**
Save each result into `contra/assets/` under the name given and tell me, then I slice it.

## 5 — All five agents in one sheet → `agents.png` (10 columns × 10 rows, 2 rows per agent)

**Attach:** nothing. Every agent has the same 20 poses in the same cells, so they all animate the same way.

```
Hand-painted 2D game art for a side-scrolling run-and-gun action game. Gritty 1980s action-movie look: bold readable silhouettes, strong rim lighting from the upper right, crisp painted edges, subtle brush texture, no photorealism, no pixel art. Strict orthographic side view, no perspective, no camera tilt.

GRID: one square sprite sheet laid out as a strict grid: EXACTLY 10 columns and 10 rows, 100 cells, each cell exactly 256×256 pixels, total image exactly 2560×2560 pixels. EXACTLY one sprite in every cell, 10 sprites in every row, no empty cells. Cells read left to right, top row first. Each sprite sits completely inside its own cell with at least 12 pixels of empty space on every side, never touching or crossing into a neighbouring cell. Every agent is drawn at the same scale, about 190 pixels tall when standing, and looks exactly the same in all of their cells. Standing and running poses are centred and stand on the same baseline 20 pixels above the bottom of the cell. Every agent faces RIGHT in every frame.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, no white, no grey, NO CHECKERBOARD PATTERN, no gradient, no scenery, no floor line, no shadows, no glow box behind any sprite. No grid lines, no borders, no text, no letters, no numbers, no names, no labels, no watermark, no dust, no speed lines, no muzzle flashes, no bullets.

LEGS: the NEAR leg is painted slightly lighter and the FAR leg slightly darker; in every run frame both legs are in clearly different positions from the frame before.

THE FIVE AGENTS — each holds their own gun in both hands in every one of their frames, the same design and size every time, with the barrel pointing exactly in the direction named for the frame:
ROWS 1–2 — RAZOR (male heavy gunner): a huge broad-shouldered man, shaved head, thick black beard, ORANGE headband with two short tails, olive-green sleeveless tank top, brass ammunition belt across the chest, desert-tan camouflage cargo trousers, black combat boots, fingerless gloves. GUN: a heavy six-barrel rotary minigun, black steel, round ammo drum underneath, orange stripe.
ROWS 3–4 — NOVA (female field medic): an athletic woman with dark brown skin and short curly black hair, WHITE headband with a small red cross, TEAL tactical vest over a black long-sleeve shirt, medical pouch on the hip, grey camouflage trousers, black combat boots. GUN: a compact white-and-grey pulse rifle with a glowing teal energy cell.
ROWS 5–6 — KITE (female scout): a lean, quick woman with fiery red hair in a high ponytail, GREEN bandana on the forehead, short black tactical jacket with rolled sleeves, green jungle-camouflage trousers, light brown lace-up boots, a knife strapped to the thigh. GUN: a short black submachine gun with a long curved magazine and a green grip.
ROWS 7–8 — BRICK (male breacher): a massive armoured man, dark steel combat helmet with the visor pushed up, square stubbled jaw, thick STEEL-BLUE armour plates on chest and shoulders, dark grey trousers with knee pads, heavy black boots, a small round riot shield strapped to the left forearm. GUN: a pump-action combat shotgun, black steel barrel, ribbed pump grip, blue stripe on the stock.
ROWS 9–10 — VOLT (male tech marksman): a wiry man with spiky white-blond hair, round brass goggles pushed up on the forehead, long PURPLE tactical coat with the tails flaring behind, black utility harness with small battery packs, black trousers and boots. GUN: a long gunmetal rail rifle with two parallel rails along the barrel and three small glowing purple coils.

THE 20 POSES — every agent uses exactly these, in this order, across their two rows:
FIRST ROW OF EACH AGENT
Cells 1 to 6 — RUN, gun aimed straight FORWARD, a full six-step cycle, body leaning forward. Cell 1: near leg stretched far forward with the heel down, far leg stretched far behind on its toe. Cell 2: near foot flat under the body, knee bent, body lowest, far foot lifting behind. Cell 3: standing on the near leg, far knee raised high in front. Cell 4: far leg stretched far forward, near leg far behind on its toe. Cell 5: far foot flat under the body, near foot lifting behind. Cell 6: standing on the far leg, near knee raised high.
Cell 7 — STANDING, feet apart, gun aimed straight FORWARD.
Cell 8 — STANDING, gun aimed STRAIGHT UP.
Cell 9 — STANDING, gun aimed DIAGONALLY UP (45 degrees up and forward).
Cell 10 — STANDING, gun aimed DIAGONALLY DOWN (45 degrees down and forward).
SECOND ROW OF EACH AGENT
Cells 1 to 3 — RUN with the gun aimed DIAGONALLY UP: near leg far forward; legs passing with one knee raised; far leg far forward.
Cells 4 to 6 — RUN with the gun aimed DIAGONALLY DOWN, the same three steps.
Cell 7 — PRONE: lying flat on the stomach along the baseline, propped on the elbows, gun aimed straight FORWARD.
Cells 8, 9 — SOMERSAULT JUMP: curled into a tight ball, knees to chest, gun tucked in; cell 8 head at the top, cell 9 the same ball turned half a turn, head at the bottom.
Cell 10 — DEATH: knocked backwards through the air, back arched, arms thrown wide, gun slipping from the hands.
```

## 6 — Agent portraits, ability icons, pick-ups → `agents_ui.png` (10 × 5)
```
Hand-painted 2D game art for a run-and-gun action game, gritty 1980s action-movie look, bold painted edges, strong rim light from the upper right, no photorealism, no pixel art.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one item in every cell, centred, with at least 12 pixels of empty space on every side.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no gradient, no scenery, no shadows. No grid lines, no borders, no text, no letters, no numbers, no labels, no watermark.

THE FIVE AGENTS (used in rows 1 and 2):
RAZOR — huge bearded man, shaved head, orange headband, olive tank top, brass ammo belt, rotary minigun.
NOVA — athletic woman, dark brown skin, short curly black hair, white headband with a red cross, teal tactical vest, pulse rifle with a teal cell.
KITE — lean woman, red hair in a high ponytail, green bandana, black tactical jacket, small submachine gun.
BRICK — massive armoured man, steel helmet with the visor up, stubble, steel-blue armour plates, round riot shield, pump shotgun.
VOLT — wiry man, spiky white-blond hair, brass goggles on the forehead, long purple coat, rail rifle with purple coils.

ROW 1 — PORTRAITS, head and shoulders, three-quarter view facing right, filling most of the cell: cells 1 to 5 are RAZOR, NOVA, KITE, BRICK, VOLT. Cells 6 to 10: the same five portraits in darker, desaturated colours (locked / taken).
ROW 2 — ABILITY ICONS, each a bold symbol inside a round dark steel badge with a coloured rim: cell 1 RAZOR "Bullet Storm": three bullets fanning out over a spinning barrel, orange. Cell 2 NOVA "Mend": a glowing plus sign with a ring around it, teal. Cell 3 KITE "Phase Dash": a running silhouette with speed streaks, green. Cell 4 BRICK "Aegis": a round shield in front of a dome, steel blue. Cell 5 VOLT "Chain Arc": a forked lightning bolt jumping between three dots, purple. Cells 6 to 10: the same five icons greyed out (on cooldown).
ROW 3 — PICK-UPS: cell 1 a small first-aid kit (white box, red cross); cell 2 a large military medkit (olive case, red cross); cell 3 a red heart-shaped dog tag (team life); cell 4 an ammo crate; cells 5 to 8 four gun pick-ups lying flat, pointing right: a rotary minigun, a pulse rifle, a pump shotgun, a rail rifle; cell 9 a steel winged badge with a lightning bolt; cell 10 a steel winged badge with a shield.
ROW 4 — HUD BITS: cell 1 a small red heart; cell 2 the same heart empty (dark outline only); cell 3 a dog-tag pair (lives); cell 4 a skull (down); cell 5 a crown (party leader); cells 6 to 10 five small round colour badges: blue, red, green, yellow, purple.
ROW 5 — MENU ICONS, white on a round dark badge: friends (two people), party (three people), queue (hourglass), invite (envelope), settings (gear), admin (wrench), bot (robot head), Google-style sign-in (a plain key, no logo), trophy, exit door.
```

## 7 — Ability effects → `ability_fx.png` (10 × 5)
```
Hand-painted 2D game effects for a run-and-gun action game, gritty 1980s action-movie look, crisp painted edges, no photorealism, no pixel art. Effects are bright and readable over a dark jungle background.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one effect frame in every cell, centred, with at least 12 pixels of empty space on every side.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no black box behind the effects, no scenery. No grid lines, no borders, no text, no letters, no numbers, no labels, no watermark.

ROW 1 — RAZOR BULLET STORM: cells 1 to 4 a big orange-white muzzle blast pointing right, four flicker frames; cells 5 to 7 a short hot orange tracer bullet flying right, three frames; cells 8 to 10 spinning brass shell casings, three frames.
ROW 2 — NOVA MEND: cells 1 to 5 a teal healing ring expanding outward along the ground, from small to large and fading; cells 6 to 10 rising teal plus-sign sparkles, five frames.
ROW 3 — KITE PHASE DASH: cells 1 to 4 a long green speed streak / afterimage trail pointing right, from bright to fading; cells 5 to 7 a green burst where she appears; cells 8 to 10 a small green impact slash.
ROW 4 — BRICK AEGIS: cells 1 to 3 a translucent steel-blue energy dome forming (small, half, full); cells 4 to 6 the full dome flickering; cells 7 to 10 the dome cracking and breaking apart.
ROW 5 — VOLT CHAIN ARC: cells 1 to 4 a long horizontal purple-white lightning bolt, four different jagged shapes, each filling the cell from the left edge to the right edge; cells 5 to 7 a purple electric spark burst on impact; cells 8 to 10 a purple charge-up glow gathering into a point.
```

## 8 — All painted backgrounds in one sheet → `backgrounds.png` (9 strips)

**Attach:** nothing. One square image with nine full-width strips: sky, far layer and near layer for each of
the three stages. Each strip scrolls at its own speed in game, so every strip must tile left to right.

```
Hand-painted 2D game background art for a side-scrolling run-and-gun action game. Gritty 1980s action-movie look, painterly brush texture, strong atmospheric perspective, warm rim light, no photorealism, no pixel art. Everything is seen straight from the side, like a stage set: no perspective, no camera tilt, no ground plane, no people, no animals, no vehicles moving, no text.

LAYOUT: one square image, exactly 2560×2560 pixels, divided into NINE horizontal STRIPS stacked from top to bottom. Every strip is the FULL WIDTH of the image (2560 pixels) and exactly one ninth of its height (about 284 pixels tall). The strips never overlap and never bleed into each other: each strip's content stays strictly inside its own band. No borders, no frames, no dividing lines, no grid lines, no labels, no letters, no numbers, no watermark.

EVERY STRIP TILES SEAMLESSLY LEFT TO RIGHT: whatever touches the left edge of a strip continues exactly into its right edge (same colours, same horizon height, same ridge line), so the strip can repeat forever sideways without a visible seam. No single object is cut in half at the left or right edge.

TRANSPARENCY: strips 1, 4 and 7 (the skies) are fully painted from edge to edge with no transparency. In all the other strips (2, 3, 5, 6, 8, 9) REMOVE THE BACKGROUND COMPLETELY above and between the shapes: fully transparent PNG with a real alpha channel — no sky colour, no fog fill, no white, no grey, NO CHECKERBOARD PATTERN. In those strips the shapes rise from the BOTTOM edge of the strip, and the bottom edge of the strip is completely covered by solid painted ground or foliage from the far left to the far right.

STAGE 1 — JUNGLE (strips 1 to 3)
STRIP 1 — JUNGLE SKY: a hot, hazy late-afternoon sky. Warm orange and gold near the bottom of the strip, fading up to deep teal-blue at the top. Long soft streaks of thin cloud lit orange from below, a low hazy sun glow on the left third, faint heat haze. Sky only: no ground, no mountains, no birds, no aircraft.
STRIP 2 — JUNGLE MOUNTAINS (far layer): distant misty jungle mountains and volcanic peaks, blue-green, soft and hazy with distance, two thin white waterfalls, the ridge line rising and falling gently and reaching about two thirds of the way up the strip at its highest peaks. Transparent above the ridge.
STRIP 3 — JUNGLE TREES (near layer): a dense, dark wall of jungle — tall palm trees with drooping fronds, broad-leaf trees, hanging vines and big ferns — dark green with warm orange rim light from the left, treetops reaching almost to the top of the strip in places and dipping to half height in others. Transparent above and between the treetops; the bottom of the strip is solid dark undergrowth.

STAGE 2 — STEEL YARD, a military base at night (strips 4 to 6)
STRIP 4 — NIGHT SKY: deep navy fading to near-black at the top, a dull orange floodlight glow along the bottom of the strip, thin drifting smoke, a few faint stars, two pale searchlight beams crossing diagonally. Sky only.
STRIP 5 — BASE SKYLINE (far layer): a distant dark blue-grey silhouette of a huge military base — radar dishes, tall smokestacks with small red warning lights, hangars, cranes, water towers — with tiny warm lit windows, reaching about two thirds of the way up the strip. Transparent above the skyline.
STRIP 6 — BASE STRUCTURES (near layer): a closer row of chain-link fences topped with barbed wire, guard towers, stacked shipping containers, fuel tanks, pipes and floodlight poles, dark steel grey with orange floodlight rim light, reaching almost to the top of the strip in places. Transparent above and between the structures; the bottom of the strip is solid dark concrete wall and fence base.

STAGE 3 — FROZEN PASS, high snowy mountains (strips 7 to 9)
STRIP 7 — WINTER SKY: a cold pale grey-blue sky with heavy snow clouds, a soft white sun glow behind the clouds, light falling snowflakes. Sky only.
STRIP 8 — SNOW PEAKS (far layer): distant jagged snow-covered mountain peaks, icy blue shadows and bright white snowfields, hazy with distance, reaching about two thirds of the way up the strip at the highest peak. Transparent above the peaks.
STRIP 9 — SNOWY PINES (near layer): a dense line of tall pine trees heavy with snow, dark green-blue under white snow, a few broken trunks and snowy rocks, treetops reaching almost to the top of the strip in places. Transparent above and between the treetops; the bottom of the strip is solid snowy forest floor.
```

## 9 — Trees and scenery → `scenery.png` (10 × 5)
```
Hand-painted 2D game art for a side-scrolling run-and-gun action game, gritty 1980s action-movie look, strong rim lighting from the upper right, crisp painted edges, no photorealism, no pixel art. Strict side view, no perspective.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one object in every cell, each standing on the same baseline 12 pixels above the bottom of its cell, centred left to right, with at least 12 pixels of space at the sides and top. Tall objects (trees, towers) fill most of the cell height.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no gradient, no scenery, no ground strip, no shadows. No grid lines, no borders, no text, no letters, no numbers, no labels, no watermark.

ROW 1 — JUNGLE TREES: a tall palm tree; a leaning palm tree; a pair of palm trees; a broad jungle tree with a thick trunk; a tree with hanging vines; a dead burnt tree; a banana plant; a tall bamboo cluster; a giant fern; a tree stump with mushrooms.
ROW 2 — JUNGLE SCENERY: a thick bush; a flowering bush; a mossy boulder; a fallen log; a stone idol; a wooden watchtower; a straw hut; a rope-and-plank fence; a sandbag wall; a broken jeep.
ROW 3 — STEEL YARD: a floodlight tower; a radio mast; a stack of oil barrels; a shipping container; a fuel tank on legs; a sandbag gun nest; a chain-link fence section with barbed wire; a concrete barrier; a stack of tyres; a crashed helicopter wreck.
ROW 4 — FROZEN PASS: a tall snowy pine; a small snowy pine; a bare frozen tree; a snow-covered boulder; an ice crystal cluster; a snowdrift; a snowy tent; a frozen supply crate; a broken wooden fence with snow; a frozen lantern post.
ROW 5 — BATTLEFIELD (any stage): a wooden warning sign with no writing; a barbed-wire tangle; a shell crater rim; a tank trap; a stack of ammo crates; a broken stone wall; a flag pole with a torn blank flag; a burning oil drum; a field radio on a crate; a skull on a stick.
```
