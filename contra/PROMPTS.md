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

# Season 2 — pixel art (matches the game's themes)

Everything below is **16-bit pixel art** in the style of the game's jungle, Steel Yard and Frozen Pass stages.
Every agent carries the **same rifle**; agents differ only by look and ability. **Attach nothing.**
Save each result into `contra/assets/` under the name given and tell me; I slice it.

## 5 — All five agents → `agents.png` (10 × 10, two rows per agent)
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: do not ask for one, create everything from scratch.

16-BIT PIXEL ART sprite sheet for a side-scrolling run-and-gun game, an original retro 16-bit look with chunky square pixels. Every character is drawn on a tiny canvas about 48 art-pixels tall, then scaled up exactly 4 times with hard nearest-neighbour edges, so every art-pixel is a crisp 4×4 block of ONE flat colour. Limited palette, flat colours with 2- or 3-step shading, a 1-pixel dark outline around every character. NO anti-aliasing, NO blur, NO soft edges, NO gradients, NO glow, NO painterly brush strokes, NO high-detail illustration. Strict side view, no perspective.

GRID: one square sprite sheet laid out as a strict grid: EXACTLY 10 columns and 10 rows, 100 cells, each cell exactly 256×256 pixels, total image exactly 2560×2560 pixels. EXACTLY one sprite in every cell, 10 in every row, no empty cells. Cells read left to right, top row first. Each sprite sits completely inside its own cell with plenty of empty space around it, never touching a neighbouring cell. Every agent is the same size (about 192 pixels tall standing = 48 art-pixels) on the same pixel scale in every cell. Standing and running poses are centred and stand on the same baseline 20 pixels above the bottom of the cell. Everyone faces RIGHT.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, no white, no grey, NO CHECKERBOARD PATTERN, no scenery, no floor line, no shadows. No grid lines, no borders, no text, no letters, no numbers, no names, no labels, no watermark, no muzzle flashes, no bullets, no stray pixels.

THE RIFLE — ALL FIVE AGENTS CARRY THE SAME GUN in both hands in every frame: a chunky assault rifle with a black steel body, a short thick barrel, a brown wooden stock and a small orange energy cell on the side. Exactly the same rifle, same size, for every agent. The barrel points exactly in the direction named for each frame.

LEGS: the NEAR leg is one shade lighter than the FAR leg; in every run frame both legs are in clearly different positions from the frame before.

THE FIVE AGENTS (each one clearly different in shape and colours, so they are easy to tell apart at a glance):
ROWS 1–2 — RAZOR (man): the biggest and broadest, shaved head, black beard, ORANGE headband with two tails, olive tank top, brass ammo belt across the chest, tan camouflage trousers, black boots.
ROWS 3–4 — NOVA (woman): athletic, dark brown skin, short curly black hair, WHITE headband with a red cross, TEAL vest over a black shirt, grey trousers, black boots.
ROWS 5–6 — KITE (woman): slim and quick, bright red ponytail, GREEN bandana, short black jacket, green camouflage trousers, light brown boots.
ROWS 7–8 — BRICK (man): bulky and armoured, steel helmet with the visor up, STEEL-BLUE armour plates on chest and shoulders, dark grey trousers with knee pads, heavy black boots, a small round shield on the left forearm.
ROWS 9–10 — VOLT (man): wiry, spiky white-blond hair, brass goggles on the forehead, long PURPLE coat with tails flaring behind, black harness, black trousers and boots.

THE 20 POSES — every agent, in this order, across their two rows:
FIRST ROW: Cells 1 to 6 — RUN with the rifle aimed straight FORWARD, a six-step cycle: (1) near leg far forward, far leg far behind; (2) near foot under the body, knee bent, body 1 art-pixel lower; (3) standing on the near leg, far knee raised; (4) far leg far forward, near leg far behind; (5) far foot under the body, body lower; (6) standing on the far leg, near knee raised. Cell 7 — STANDING, rifle aimed FORWARD. Cell 8 — STANDING, rifle aimed STRAIGHT UP. Cell 9 — STANDING, rifle aimed DIAGONALLY UP. Cell 10 — STANDING, rifle aimed DIAGONALLY DOWN.
SECOND ROW: Cells 1 to 3 — RUN with the rifle aimed DIAGONALLY UP (three steps). Cells 4 to 6 — RUN with the rifle aimed DIAGONALLY DOWN (three steps). Cell 7 — PRONE: lying flat on the stomach on the baseline, rifle aimed FORWARD. Cells 8, 9 — SOMERSAULT JUMP: a tight ball, head at the top in cell 8 and at the bottom in cell 9. Cell 10 — DEATH: knocked backwards through the air, arms thrown wide.
```

## 6 — Portraits, ability icons, pick-ups, HUD → `agents_ui.png` (10 × 5)
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: do not ask for one, create everything from scratch.

16-BIT PIXEL ART for a side-scrolling run-and-gun game, an original retro 16-bit look with chunky square pixels. Everything is drawn small and scaled up exactly 4 times with hard nearest-neighbour edges, so every art-pixel is a crisp 4×4 block of one flat colour. Limited palette, flat colours with simple shading, a 1-pixel dark outline. NO anti-aliasing, NO blur, NO gradients, NO glow, NO painterly detail.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one item in every cell, centred, with empty space around it.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no scenery, no shadows. No grid lines, no borders, no text, no letters, no numbers, no labels, no watermark.

THE FIVE AGENTS: RAZOR — big bearded man, shaved head, orange headband, olive tank top, brass ammo belt. NOVA — woman with dark brown skin, short curly black hair, white headband with a red cross, teal vest. KITE — slim woman, bright red ponytail, green bandana, black jacket. BRICK — armoured man, steel helmet with visor up, steel-blue armour plates. VOLT — wiry man, spiky white-blond hair, brass goggles, purple coat.

ROW 1 — PORTRAITS, head and shoulders facing right, filling most of the cell, 64×64 art-pixels scaled up: cells 1 to 5 RAZOR, NOVA, KITE, BRICK, VOLT. Cells 6 to 10: the same five portraits in dark grey tones (already picked by another player).
ROW 2 — ABILITY ICONS, a chunky symbol inside a round dark metal badge with a coloured rim: cell 1 RAZOR "Bullet Storm" three bullets fanning out, orange; cell 2 NOVA "Mend" a plus sign inside a ring, teal; cell 3 KITE "Phase Dash" a running figure with speed lines, green; cell 4 BRICK "Aegis" a round shield in front of a dome, steel blue; cell 5 VOLT "Chain Arc" a forked lightning bolt between three dots, purple. Cells 6 to 10: the same five icons in grey (cooling down).
ROW 3 — PICK-UPS: cell 1 a small first-aid kit (white box, red cross); cell 2 a big olive medkit with a red cross; cell 3 a red heart dog-tag (team life); cell 4 a gold medal with a star; cell 5 a steel winged badge with an R; cell 6 a steel winged badge with an S; cell 7 a steel winged badge with a shield; cell 8 a flying metal capsule with small wings and an orange window; cell 9 an ammo crate; cell 10 a small red flare.
ROW 4 — HUD: cell 1 a full red heart; cell 2 an empty heart outline; cell 3 a pair of dog tags; cell 4 a small skull; cell 5 a gold crown; cells 6 to 10 five small round colour dots: blue, red, green, yellow, purple.
ROW 5 — MENU ICONS, white symbols on a round dark badge: two people (friends); three people (party); an hourglass (queue); an envelope (invite); a gear (settings); a wrench (admin); a robot head (bot); a key (sign in); a trophy; an exit door.
```

## 7 — Ability effects → `ability_fx.png` (10 × 5)
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: do not ask for one, create everything from scratch.

16-BIT PIXEL ART effects for a side-scrolling run-and-gun game, an original retro 16-bit look with chunky square pixels. Drawn small and scaled up exactly 4 times with hard nearest-neighbour edges, so every art-pixel is a crisp 4×4 block of one flat colour. Bright flat colours with a few shades, NO soft glow, NO blur, NO gradients, NO anti-aliasing, NO painterly detail.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one effect frame in every cell, centred.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no black box behind the effects. No grid lines, no borders, no text, no numbers, no labels, no watermark.

ROW 1 — BULLET STORM (orange): cells 1 to 4 a big blocky orange-and-yellow muzzle burst pointing right, four flicker frames; cells 5 to 7 a short orange tracer bullet flying right, three frames; cells 8 to 10 small brass shell casings tumbling, three frames.
ROW 2 — MEND (teal): cells 1 to 5 a teal ring on the ground growing from small to large and breaking up into pixels; cells 6 to 10 small teal plus signs rising and fading, five frames.
ROW 3 — PHASE DASH (green): cells 1 to 4 a long green afterimage streak pointing right, from solid to broken up; cells 5 to 7 a green pixel burst where the runner reappears; cells 8 to 10 a small green slash mark.
ROW 4 — AEGIS (steel blue): cells 1 to 3 a blocky blue shield dome forming (small, half, full); cells 4 to 6 the full dome flickering; cells 7 to 10 the dome cracking into pieces and vanishing.
ROW 5 — CHAIN ARC (purple): cells 1 to 4 a long jagged purple-and-white lightning bolt running from the left edge of the cell to the right edge, four different shapes; cells 5 to 7 a purple spark burst; cells 8 to 10 purple sparks gathering into a point.
```

## 8 — All backgrounds → `backgrounds.png` (9 strips in one image)
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: create everything from scratch.

An original retro 16-bit PIXEL ART background sheet for a side-scrolling action game: chunky square pixels with hard edges, a limited colour palette, flat colour bands with simple dithering, no blur, no smooth gradients, no glow. Everything is seen straight from the side, like a flat stage set. No people, no animals, no text, no labels, no borders, no watermark.

One SQUARE image split into NINE equal horizontal STRIPS stacked from top to bottom. Every strip runs the full width of the image and is one ninth of its height. Each strip's picture stays inside its own strip. Every strip repeats seamlessly left to right: its left edge continues into its right edge at the same height.

Strips 1, 4 and 7 are skies and are filled completely. In all the other strips the shapes rise from the bottom of the strip, the bottom edge is fully covered, and everything above and between the shapes is TRANSPARENT (real transparency, no colour fill, no checkerboard pattern).

JUNGLE
1. Sunset sky in horizontal colour bands: dark teal at the top, then blue, purple, orange and yellow at the bottom, a few flat clouds, a big pixel sun low on the left.
2. Distant blue-green jungle mountains with two thin waterfalls, peaks two thirds of the strip high.
3. A dense row of dark green palm trees and jungle trees with hanging vines, dark undergrowth along the bottom.

MILITARY BASE AT NIGHT
4. Navy-to-black night sky bands, an orange glow along the bottom, a few single-pixel stars, two pale searchlight beams.
5. A distant dark blue-grey skyline of radar dishes, smokestacks with red lights, hangars, cranes and water towers with tiny yellow windows.
6. Close chain-link fences with barbed wire, guard towers, stacked shipping containers, fuel tanks and floodlight poles, dark grey with orange highlights, a concrete wall along the bottom.

SNOWY MOUNTAINS
7. Pale grey-blue winter sky bands with heavy flat snow clouds and scattered white snowflake pixels.
8. Distant jagged white and icy-blue mountain peaks.
9. A dense row of dark blue-green pine trees with snow on the branches, snowy ground along the bottom.
```

## 9 — Trees and scenery → `scenery.png` (10 × 5)
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: do not ask for one, create everything from scratch.

16-BIT PIXEL ART scenery for a side-scrolling run-and-gun game, an original retro 16-bit look with chunky square pixels. Everything is drawn small and scaled up exactly 4 times with hard nearest-neighbour edges, so every art-pixel is a crisp 4×4 block of one flat colour. Limited palette, flat colours with 2- or 3-step shading, a 1-pixel dark outline. NO anti-aliasing, NO blur, NO gradients, NO glow, NO painterly detail. Strict side view.

GRID: one sheet laid out as a strict grid: EXACTLY 10 columns and 5 rows, 50 cells, each cell exactly 256×256 pixels, total image exactly 2560×1280 pixels. EXACTLY one object in every cell, standing on the same baseline 12 pixels above the bottom of its cell, centred left to right. Trees and towers fill most of the cell height.

BACKGROUND: REMOVE THE BACKGROUND COMPLETELY. Fully transparent PNG with a real alpha channel — no background colour, NO CHECKERBOARD PATTERN, no ground strip, no shadows. No grid lines, no borders, no text, no numbers, no labels, no watermark.

ROW 1 — JUNGLE TREES: tall palm tree; leaning palm tree; two palm trees together; broad jungle tree; tree with hanging vines; burnt dead tree; banana plant; bamboo cluster; giant fern; tree stump with mushrooms.
ROW 2 — JUNGLE SCENERY: thick bush; flowering bush; mossy boulder; fallen log; stone idol; wooden watchtower; straw hut; rope-and-plank fence; sandbag wall; broken jeep.
ROW 3 — STEEL YARD: floodlight tower; radio mast; stack of oil barrels; shipping container; fuel tank on legs; sandbag gun nest; chain-link fence with barbed wire; concrete barrier; stack of tyres; crashed helicopter wreck.
ROW 4 — FROZEN PASS: tall snowy pine; small snowy pine; bare frozen tree; snow-covered boulder; ice crystal cluster; snowdrift; snowy tent; frozen supply crate; broken snowy fence; frozen lantern post.
ROW 5 — BATTLEFIELD: blank wooden warning sign; barbed-wire tangle; shell crater rim; tank trap; stack of ammo crates; broken stone wall; flag pole with a torn blank flag; burning oil drum; field radio on a crate; skull on a stick.
```

---

# Season 3

## 10 — Fifteen stage backgrounds in one grid → `backgrounds15.png`
Full scenes (no transparency needed). Each panel becomes one stage's backdrop, repeated sideways behind the ground.
```
GENERATE THIS IMAGE NOW from the description below. There is NO reference image: create everything from scratch.

An original retro 16-bit PIXEL ART sheet of FIFTEEN different background scenes for a side-scrolling action game. Chunky square pixels with hard edges, a limited colour palette per scene, flat colour areas with simple dithering for skies and haze, no blur, no smooth gradients, no glow, no painterly brush strokes. Everything seen straight from the side like a flat stage set, no perspective. No people, no animals, no vehicles, no text, no labels, no numbers, no watermark.

LAYOUT: one image laid out as a strict grid of EXACTLY 3 columns and 5 rows = 15 panels. Every panel is the same wide landscape rectangle (16:9). Between the panels there is a straight, even, PLAIN BLACK gap about 16 pixels wide; nothing crosses a gap. Panels read left to right, top row first.

EVERY PANEL: a complete, fully painted scene filling its whole rectangle: sky at the top, far scenery in the middle, nearer scenery lower down, and a plain dark band along the bottom tenth of the panel (the game draws its own ground there). There is NO ground floor, no path and no platforms in the scenes. Each panel REPEATS SEAMLESSLY LEFT TO RIGHT: what touches its left edge continues exactly into its right edge at the same height. Nothing important is cut in half at the edges.

THE 15 SCENES:
1. JUNGLE DAY — bright blue sky, white clouds, green jungle mountains, palm trees.
2. JUNGLE SUNSET — orange and purple sky, low red sun, dark green jungle silhouettes, waterfalls.
3. JUNGLE NIGHT — deep blue sky, big pale moon, fireflies, black-green jungle silhouettes.
4. RIVER DELTA — misty morning, wide brown river in the distance, stilt huts, reeds.
5. MILITARY BASE NIGHT — navy sky with searchlight beams, radar dishes, smokestacks with red lights, hangars.
6. MILITARY BASE DAY — grey-blue sky, concrete bunkers, fences, watchtowers, a parked cargo plane far away.
7. DESERT CANYON — hot yellow sky, red rock mesas and canyon walls, heat haze.
8. SANDSTORM RUINS — dusty orange sky, half-buried stone ruins and broken pillars.
9. FROZEN PASS — pale grey sky, falling snow, jagged white mountains, snowy pine forest.
10. ICE FORTRESS — dark teal night sky with green aurora, an ice fortress on a far cliff.
11. VOLCANO — black-red sky, an erupting volcano with lava rivers, ash clouds.
12. CITY RUINS — smoky grey-brown sky, ruined skyscrapers with broken windows, fires far away.
13. HARBOUR DOCKS — sunset sea, cranes, cargo ships and stacked containers far away.
14. SWAMP — green fog, dead trees with hanging moss, murky water far away.
15. ENEMY HQ — blood-red sky, a giant steel fortress tower with glowing windows and cannons.
```

## 11 — Fifty cover and floor objects → `cover50.png`
Simple solid things that sit on the ground. The game uses them as cover: they stop bullets, you can hide behind them or stand on them.
```
Create this image from scratch using only the description below. Do not ask for a reference image; none is needed.

An original retro 16-bit PIXEL ART sprite sheet of fifty simple objects for a side-scrolling action game. Chunky square pixels with hard edges, a limited colour palette, flat colours with simple shading, a dark outline around each object. No blur, no smooth gradients, no glow. Every object is seen straight from the side.

LAYOUT: one wide image laid out as a grid of 10 columns and 5 rows, 50 equal cells, one object centred in each cell, with empty space between neighbours. Every object sits flat on the ground: its bottom edge is a straight horizontal line, and all objects in a row stand on the same invisible floor line near the bottom of their cells. Objects are simple, chunky, solid blocks with clear shapes: no thin poles, no wires, no loose bits, nothing floating.

BACKGROUND: transparent PNG (real transparency) around the objects. No background colour, no white, no grey, no checkerboard pattern, no floor strip, no shadows. No grid lines, no borders, no text, no numbers, no labels, no watermark.

SIZES: in every row the first 4 objects are LOW (about a quarter of a cell tall and as wide as the cell), objects 5 to 8 are MEDIUM (about half a cell tall), objects 9 and 10 are TALL (about three quarters of a cell tall).

ROW 1, any stage: low sandbag wall; low row of ammo crates; low concrete curb; low steel plate barricade; medium sandbag wall; medium wooden crate stack; medium concrete barrier; medium pair of oil drums; tall stacked sandbag bunker; tall stack of steel crates.
ROW 2, jungle: low mossy log; low pile of stone rubble; low bamboo fence; low rock; medium fallen tree trunk; medium mossy boulder; medium stone ruin block; medium wooden barricade; tall ancient stone pillar stump; tall wooden hut base.
ROW 3, military base: low yellow-and-black striped barrier; low stack of pipes; low metal crate; low pile of tyres; medium shipping crate; medium stack of fuel drums; medium generator box; medium steel blast shield; tall shipping container end; tall concrete bunker block.
ROW 4, snow: low snowbank; low ice block; low frozen log; low snowy rock; medium snow-covered sandbags; medium ice wall; medium frozen supply crate; medium snowy boulder; tall ice pillar; tall snowy rock wall.
ROW 5, desert, volcano and city: low sandstone block; low broken brick wall; low black lava rock; low rusty car door; medium sandstone ruin; medium broken brick wall; medium lava boulder; medium wrecked car; tall broken concrete wall; tall rusty steel wall.
```

## 12 — Four more agents → `agents2.png` (10 columns × 8 rows, two rows per agent)
**Attach:** `agents.png` (style reference). Rewritten after the first try came back with a painted checkerboard,
Hammer missing a row and mixed-up first rows: every row is now spelled out cell by cell.
```
Create a NEW sprite sheet. The attached image is ONLY a style reference: match its 16-bit pixel-art style exactly (chunky square pixels with hard edges, limited palette, dark outlines, the same character size and pixel scale). Do not copy its characters. No anti-aliasing, no blur, no gradients, no glow.

TRANSPARENT BACKGROUND: the PNG must have real transparency (an alpha channel). Do NOT draw a checkerboard pattern, do NOT fill the background with white, grey or any colour, no floor line, no shadows. Only the characters are visible. No grid lines, no borders, no text, no numbers, no labels.

GRID: exactly 10 columns and 8 rows, 80 cells, one sprite centred in each cell, never touching a neighbour. All four characters are the same size. Standing and running poses stand on the same floor line near the bottom of their cells. Everyone faces RIGHT and holds the same rifle as in the reference (black steel body, short thick barrel, brown wooden stock, small orange energy cell), pointing exactly where each cell says.

THE CHARACTERS:
GHOST (woman, stealth sniper): slim, black hooded cloak, white half-mask over mouth and nose, red goggles, grey-and-black urban camouflage, black boots.
HAMMER (man, demolition expert): the biggest, bald with a thick moustache, yellow hard hat, orange hazard vest over a grey shirt, brown work trousers, heavy brown boots.
VIPER (woman, toxic specialist): pale skin, black bob haircut with a lime-green streak, gas mask hanging at her neck, olive jacket with lime-green trim, black trousers, black boots.
ATLAS (man, cyborg soldier): grey metal robotic left arm, steel plate over half his face with a small flat blue eye light, white-and-blue armoured suit, dark grey trousers, steel boots.

EVERY CHARACTER HAS EXACTLY TWO ROWS, ALWAYS IN THIS ORDER:
"A" ROW (10 cells): 1–6 running with the rifle aimed straight forward (six clearly different leg positions); 7 standing, rifle forward; 8 standing, rifle straight up; 9 standing, rifle diagonally up; 10 standing, rifle diagonally down. No jumping, no lying down, no death in an A row.
"B" ROW (10 cells): 1–3 running with the rifle aimed diagonally up; 4–6 running with the rifle aimed diagonally down; 7 lying flat on the stomach, rifle forward; 8 curled into a tight ball (head at the top); 9 the same ball turned upside down (head at the bottom); 10 knocked backwards through the air, arms thrown wide (death).

ROW BY ROW:
Row 1 = GHOST A row. Row 2 = GHOST B row.
Row 3 = HAMMER A row. Row 4 = HAMMER B row.
Row 5 = VIPER A row. Row 6 = VIPER B row.
Row 7 = ATLAS A row. Row 8 = ATLAS B row.
```

## 13 — Power-up badges → `powerups.png` (10 columns × 2 rows)
**Attach:** `agents_ui.png` (style reference for the badges).
```
Use the attached image as the style reference and match its pick-up badges exactly: the same original 16-bit pixel-art style, chunky square pixels with hard edges, a limited palette, dark outlines, steel wings either side of a round coloured badge. No anti-aliasing, no blur, no gradients, no glow.

Make a NEW sheet laid out as a grid of 10 columns and 2 rows, 20 badges, each centred in its own cell with empty space around it, all the same size.

BACKGROUND: transparent PNG (real transparency). No background colour, no white, no grey, no checkerboard pattern, no shadows. No grid lines, no borders, no text, no labels, no watermark. Use simple pictures on the badges, not letters.

ROW 1 — steel-winged badges, each with a coloured centre and a simple picture: 1 light blue with an arrow passing through two circles (piercing rounds); 2 orange with a round black bomb (explosive rounds); 3 pink-red with two bullets side by side (double damage); 4 pale blue with a snowflake (ice rounds); 5 red with a flame (fire rounds); 6 purple with a lightning bolt (shock rounds); 7 gold with a horseshoe magnet (coin magnet); 8 teal with an hourglass (slow time); 9 green with a winged boot (jump boots); 10 white with a heart and a plus (big heal).
ROW 2 — 1 to 9: the same ten-style badges for: a ghost silhouette (cloak), a hammer (ground pound), a gas mask (toxic cloud), a small flying drone (sentry drone), a crosshair (auto aim), a clock with a plus (longer power-ups), a shield with a plus (armour), a coin stack (double coins), a skull (danger mode). 10: a special ADMIN badge, bigger than the others: a gold badge with a crown on top and red wings, a bright gold centre with a red star.
```

## 14 — Lobby idle animations, FRONT VIEW, one row per agent → `idle.png` (10 columns × 11 rows)
**Attach:** `agents.png`, `agents2.png` and `commandos.png` (the player sheets) so the characters match.
Front view (facing the camera, like a lobby). Cells 1–3 = breathing loop, cells 4–10 = a playful emote the menus
play every 7–13 s. The slicer reads the first 11 rows by the empty space between sprites; later rows are free.
```
Create a NEW sprite sheet. The attached sheets show the characters and the art style: keep exactly the same 16-bit pixel art (chunky square pixels, hard edges, limited palette, dark outlines, same pixel scale) and the same faces, hair, clothes, colours and rifle (black steel body, short thick barrel, brown wooden stock, small orange energy cell). Do not invent new designs. No anti-aliasing, no blur, no gradients, no glow.

TRANSPARENT BACKGROUND — VERY IMPORTANT: the PNG must have a real alpha channel. Do NOT draw a checkerboard pattern (no grey-and-white or black-and-grey squares anywhere), do NOT fill the background with any colour, no floor line, no shadows, no grid lines, no borders, no text, no names, no numbers. Only the characters are visible.

FRONT VIEW: every character faces the viewer STRAIGHT ON — chest and face toward the camera, both eyes visible, standing like a character waiting in a game lobby. NOT a side view. The rifle is held across the body (barrel pointing up and to the side) or resting on a shoulder.

LAYOUT: 10 columns and 11 rows. EVERY CHARACTER GETS EXACTLY ONE ROW. One sprite per cell with clear empty space around it, never touching a neighbour. Everyone stands on the same floor line in their row, all at the same size.

EVERY ROW:
Cells 1–3: BREATHING IDLE — relaxed stance; cell 2 chest rises and shoulders lift one pixel; cell 3 back down. Feet planted.
Cells 4–10: A FUN EMOTE that shows the character's personality (like the quirky lobby emotes in mobile shooters), playing smoothly from cell to cell, starting from and ending in the idle pose. Big readable poses, but no effects that fill the cell, no muzzle flash, no extra objects bigger than the character.

ROW 1 — RAZOR: flexes one arm, kisses his bicep, grins, back to idle.
ROW 2 — NOVA: twirls a syringe between her fingers like a pen, winks, tucks it away.
ROW 3 — KITE: a big yawn and a stretch, then a quick double hop and a thumbs-up.
ROW 4 — BRICK: knocks twice on his own helmet, it rings, he shakes his head dizzily.
ROW 5 — VOLT: static makes his spiky hair stand straight up, he pats it back down.
ROW 6 — GHOST: tilts her head, raises a finger to her mask in a "shh", fades a little and comes back.
ROW 7 — HAMMER: pulls a sandwich from his vest, takes a big bite, chews happily.
ROW 8 — VIPER: puts her gas mask on, takes a deep breath, a small green puff, pulls it down and coughs.
ROW 9 — ATLAS: his robot arm glitches and waves on its own, he slaps it with the other hand to stop it.
ROW 10 — JAX (muscular man, short dark hair, BLUE headband with two short tails, white sleeveless shirt, blue camouflage trousers, black boots, fingerless gloves): tosses a grenade up, catches it behind his back, pockets it.
ROW 11 — DUKE (muscular man, blond hair, RED headband, bare chest crossed by one ammunition belt, red camouflage trousers, black boots): cracks his knuckles, does a double bicep flex, laughs.
```

## 15 — Interface icons → `ui_icons.png` (4 × 4)
Touch buttons (FIRE, JUMP, DASH, SKILL), the mode cards, the top tabs, crown / bot / invite on the home screen.
```
Create this image from scratch. Do not ask for a reference image — everything you need is described below.

A set of 16 game interface ICONS in 16-bit PIXEL ART: chunky square pixels with hard edges, bold simple shapes that read at a glance even when small, a dark one-pixel outline, two or three flat shades per colour, a military look to match a jungle run-and-gun game. No anti-aliasing, no blur, no gradients, no glow, no text, no letters, no numbers.

REMOVE THE BACKGROUND: a PNG with real transparency. No background colour, no white, no grey, NO checkerboard pattern, no circles or frames behind the icons (the game draws its own buttons), no grid lines, no borders.

LAYOUT: 4 columns and 4 rows, one icon in the middle of each cell, every icon about the same size, clear empty space between icons, never touching.

ROW 1: (1) FIRE — a crosshair with a small orange bullet flying out to the right; (2) JUMP — a thick upward chevron arrow above a small boot; (3) DASH — a green arrow shooting to the right with three speed lines behind it; (4) SKILL — a bold yellow lightning bolt.
ROW 2: (5) PAUSE — two thick vertical bars; (6) STORY — a green jungle palm tree in front of a mountain; (7) DUELS — two crossed rifles; (8) CUSTOM — a gear with a small slider beside it.
ROW 3: (9) CROWN — a gold crown with three points; (10) BOT — a small robot head with a visor and an antenna; (11) INVITE — a thick white plus sign; (12) COIN — a gold coin with a star on it.
ROW 4: (13) TROPHY — a gold cup; (14) LOCKER — a military dog tag on a chain; (15) SHOP — a canvas supply bag with a coin; (16) FRIENDS — two soldier heads in helmets side by side.
```

## 16 — High-res lobby idles, THREE AGENTS PER IMAGE → `assets/idle/idle1.png` … `idle4.png` (10 columns, one row per agent)
Fewer agents per image come back much sharper than eleven in one. Four prompts; attach the sheets named on each.
Save each result in `contra/assets/idle/` with the name shown and run `python tools/build_art.py` (a row here
replaces that agent's row in `idle.png`).

### Prompt 1 → `assets/idle/idle1.png` · attach **agents.png**
```
Create this image from scratch as a NEW sprite sheet. The attached sheets only show what the characters look like and the art style — do not copy any of their frames and do not ask for anything else.

STYLE: detailed 16-bit pixel art like a modern premium pixel game: crisp square pixels with hard edges, a rich but limited palette with 3 to 4 shades per colour, a dark 1-pixel outline, a warm rim light from the upper right, clear readable faces (eyes, eyebrows, mouth), visible small details (straps, buckles, pouches, stitching, scuffs on boots). No anti-aliasing, no blur, no gradients, no glow, no painterly brush strokes.

VIEW: FRONT VIEW — every character faces the viewer straight on, chest and face toward the camera, both eyes visible, like heroes waiting in a game lobby. Not a side view.

THE RIFLE (everyone has the same one): a chunky assault rifle with a black steel body, a short thick barrel, a brown wooden stock and a small glowing-orange energy cell on its side, held across the body or resting on a shoulder.

TRANSPARENT BACKGROUND — VERY IMPORTANT: a PNG with a real alpha channel. NO checkerboard pattern anywhere, no background colour, no floor, no shadow, no grid lines, no borders, no text, no numbers, no names, no watermark.

LAYOUT: exactly 10 columns and 3 rows. EACH CHARACTER GETS EXACTLY ONE ROW of 10 frames, read left to right. Every pose stands alone in its own cell with clear empty space around it, never touching a neighbour. Draw the characters BIG: each one fills most of its row's height, the same size in all 10 frames, standing on the same floor line across the row.

EVERY ROW, THE SAME PLAN:
Frames 1–3 — BREATHING IDLE LOOP: relaxed lobby stance, weight on one leg. Frame 2: chest rises, shoulders lift one pixel, a slight blink. Frame 3: back to the pose of frame 1. Feet stay planted.
Frames 4–10 — THAT CHARACTER'S EMOTE (described below), a playful, personality-filled lobby animation like the quirky emotes in mobile battle games, smooth from frame to frame, big readable poses, starting from and ending in the exact pose of frame 1. No effects that fill the cell, no muzzle flash, no extra objects bigger than the character.

THE CHARACTERS, ONE PER ROW:
ROW 1 — RAZOR — the heavy gunner. A huge, broad-shouldered man, the biggest of the squad. Shaved head, thick black beard, heavy eyebrows, a confident grin. A bright ORANGE headband tied at the back with two tails. Olive-green tank top, a brass ammunition belt across the chest, fingerless black gloves, tan desert-camouflage trousers with knee pads, black combat boots. Rifle rests on his right shoulder.
EMOTE: 4 lowers the rifle and plants it butt-down beside him; 5 raises his left arm and flexes a huge bicep; 6 leans in and kisses the bicep; 7 grins at the viewer with a thumbs-up; 8 cracks his neck to one side; 9 swings the rifle back up; 10 back to the idle pose.
ROW 2 — NOVA — the medic. A tall, athletic woman with dark brown skin and short curly black hair, calm warm eyes, a small smile. A WHITE headband with a red cross. A TEAL tactical vest over a black long-sleeve shirt, a white medkit pouch with a red cross on her belt, grey cargo trousers, black boots. Rifle held low across her body.
EMOTE: 4 slips one hand to the medkit pouch; 5 pulls out a small syringe; 6 twirls it between her fingers like a pen; 7 taps it twice, eyebrow raised; 8 winks at the viewer; 9 tucks it back into the pouch; 10 back to the idle pose.
ROW 3 — KITE — the scout. A slim, quick young woman with freckles and a bright RED high ponytail, sharp green eyes, a cheeky expression. A GREEN bandana around her head, a short black bomber jacket with rolled sleeves, a green camouflage crop top, green camouflage trousers, light brown lace-up boots. Rifle held loosely in one hand.
EMOTE: 4 a huge yawn, one hand over her mouth; 5 stretches both arms high above her head; 6 bounces on her toes; 7 a quick hop, ponytail flying; 8 lands and tightens the knot of her bandana; 9 a playful salute; 10 back to the idle pose.
```

### Prompt 2 → `assets/idle/idle2.png` · attach **agents.png and agents2.png**
```
Create this image from scratch as a NEW sprite sheet. The attached sheets only show what the characters look like and the art style — do not copy any of their frames and do not ask for anything else.

STYLE: detailed 16-bit pixel art like a modern premium pixel game: crisp square pixels with hard edges, a rich but limited palette with 3 to 4 shades per colour, a dark 1-pixel outline, a warm rim light from the upper right, clear readable faces (eyes, eyebrows, mouth), visible small details (straps, buckles, pouches, stitching, scuffs on boots). No anti-aliasing, no blur, no gradients, no glow, no painterly brush strokes.

VIEW: FRONT VIEW — every character faces the viewer straight on, chest and face toward the camera, both eyes visible, like heroes waiting in a game lobby. Not a side view.

THE RIFLE (everyone has the same one): a chunky assault rifle with a black steel body, a short thick barrel, a brown wooden stock and a small glowing-orange energy cell on its side, held across the body or resting on a shoulder.

TRANSPARENT BACKGROUND — VERY IMPORTANT: a PNG with a real alpha channel. NO checkerboard pattern anywhere, no background colour, no floor, no shadow, no grid lines, no borders, no text, no numbers, no names, no watermark.

LAYOUT: exactly 10 columns and 3 rows. EACH CHARACTER GETS EXACTLY ONE ROW of 10 frames, read left to right. Every pose stands alone in its own cell with clear empty space around it, never touching a neighbour. Draw the characters BIG: each one fills most of its row's height, the same size in all 10 frames, standing on the same floor line across the row.

EVERY ROW, THE SAME PLAN:
Frames 1–3 — BREATHING IDLE LOOP: relaxed lobby stance, weight on one leg. Frame 2: chest rises, shoulders lift one pixel, a slight blink. Frame 3: back to the pose of frame 1. Feet stay planted.
Frames 4–10 — THAT CHARACTER'S EMOTE (described below), a playful, personality-filled lobby animation like the quirky emotes in mobile battle games, smooth from frame to frame, big readable poses, starting from and ending in the exact pose of frame 1. No effects that fill the cell, no muzzle flash, no extra objects bigger than the character.

THE CHARACTERS, ONE PER ROW:
ROW 1 — BRICK — the tank. A huge, bulky man in armour, square jaw, short stubble, serious face. A STEEL helmet with the visor pushed up, STEEL-BLUE armour plates on his chest and shoulders, dark grey trousers with knee pads, heavy black boots, a small round steel shield strapped to his left forearm. Rifle held at the ready in his right hand.
EMOTE: 4 raises his fist; 5 knocks twice on his own helmet (it clangs); 6 a little dizzy wobble, eyes crossed; 7 shakes his head to clear it; 8 bangs the shield against his chest; 9 a firm nod; 10 back to the idle pose.
ROW 2 — VOLT — the electric specialist. A wiry man with wild spiky WHITE-BLOND hair, brass goggles pushed up on his forehead, a mischievous grin. A long PURPLE coat with the tails hanging behind, a black leather harness across the chest, black trousers, black boots with brass buckles. Rifle held in one hand, barrel pointing up.
EMOTE: 4 rubs his fingers together; 5 a tiny blue spark jumps between his fingers; 6 static makes his spiky hair stand straight up; 7 a surprised face; 8 pats his hair back down with both hands; 9 pulls the goggles over his eyes and grins; 10 back to the idle pose.
ROW 3 — GHOST — the stealth sniper. A slim, quiet woman, mostly hidden: a BLACK hooded cloak, a white half-mask over her mouth and nose, glowing RED goggles. Grey-and-black urban camouflage underneath, black gloves, black boots. Rifle held close to her body.
EMOTE: 4 tilts her head to one side; 5 raises one finger to her mask in a "shh"; 6 her body turns half see-through; 7 almost invisible, only the red goggles show; 8 she fades back in; 9 pulls the hood a little lower; 10 back to the idle pose.
```

### Prompt 3 → `assets/idle/idle3.png` · attach **agents2.png**
```
Create this image from scratch as a NEW sprite sheet. The attached sheets only show what the characters look like and the art style — do not copy any of their frames and do not ask for anything else.

STYLE: detailed 16-bit pixel art like a modern premium pixel game: crisp square pixels with hard edges, a rich but limited palette with 3 to 4 shades per colour, a dark 1-pixel outline, a warm rim light from the upper right, clear readable faces (eyes, eyebrows, mouth), visible small details (straps, buckles, pouches, stitching, scuffs on boots). No anti-aliasing, no blur, no gradients, no glow, no painterly brush strokes.

VIEW: FRONT VIEW — every character faces the viewer straight on, chest and face toward the camera, both eyes visible, like heroes waiting in a game lobby. Not a side view.

THE RIFLE (everyone has the same one): a chunky assault rifle with a black steel body, a short thick barrel, a brown wooden stock and a small glowing-orange energy cell on its side, held across the body or resting on a shoulder.

TRANSPARENT BACKGROUND — VERY IMPORTANT: a PNG with a real alpha channel. NO checkerboard pattern anywhere, no background colour, no floor, no shadow, no grid lines, no borders, no text, no numbers, no names, no watermark.

LAYOUT: exactly 10 columns and 3 rows. EACH CHARACTER GETS EXACTLY ONE ROW of 10 frames, read left to right. Every pose stands alone in its own cell with clear empty space around it, never touching a neighbour. Draw the characters BIG: each one fills most of its row's height, the same size in all 10 frames, standing on the same floor line across the row.

EVERY ROW, THE SAME PLAN:
Frames 1–3 — BREATHING IDLE LOOP: relaxed lobby stance, weight on one leg. Frame 2: chest rises, shoulders lift one pixel, a slight blink. Frame 3: back to the pose of frame 1. Feet stay planted.
Frames 4–10 — THAT CHARACTER'S EMOTE (described below), a playful, personality-filled lobby animation like the quirky emotes in mobile battle games, smooth from frame to frame, big readable poses, starting from and ending in the exact pose of frame 1. No effects that fill the cell, no muzzle flash, no extra objects bigger than the character.

THE CHARACTERS, ONE PER ROW:
ROW 1 — HAMMER — the demolition expert. The biggest of the squad, bald with a thick brown moustache and a big friendly face. A YELLOW hard hat, an ORANGE hazard vest with reflective silver stripes over a grey work shirt, a tool belt, brown work trousers, heavy brown steel-toe boots. Rifle slung over his back, hands free.
EMOTE: 4 reaches into his vest; 5 pulls out a huge sandwich; 6 takes a big bite; 7 chews happily, cheeks full; 8 a satisfied pat on his belly; 9 tucks the sandwich away and pushes his hard hat up; 10 back to the idle pose.
ROW 2 — VIPER — the toxic specialist. A pale woman with a sharp black bob haircut and one LIME-GREEN streak, smoky eyes, a sly smirk. A gas mask hanging at her neck, an OLIVE jacket with lime-green trim, green toxic canisters clipped to her belt, black trousers, black boots. Rifle held low.
EMOTE: 4 lifts the gas mask to her face; 5 takes a deep breath through it; 6 a small puff of green gas around the filter; 7 pulls the mask down; 8 a short comic cough, eyes watering; 9 waves the last of the gas away and smirks; 10 back to the idle pose.
ROW 3 — ATLAS — the cyborg. A strong man, half machine: his LEFT arm is a grey metal robotic arm with visible joints and pistons, a steel plate over the left half of his face with a small glowing BLUE eye. A white-and-blue armoured suit, dark grey trousers, steel boots. Rifle held in his human right hand.
EMOTE: 4 the robot arm twitches; 5 it waves on its own; 6 he stares at it, annoyed; 7 it pokes him in the cheek; 8 he slaps it with his human hand; 9 the blue eye light blinks twice; 10 back to the idle pose.
```

### Prompt 4 → `assets/idle/idle4.png` · attach **commandos.png**
```
Create this image from scratch as a NEW sprite sheet. The attached sheets only show what the characters look like and the art style — do not copy any of their frames and do not ask for anything else.

STYLE: detailed 16-bit pixel art like a modern premium pixel game: crisp square pixels with hard edges, a rich but limited palette with 3 to 4 shades per colour, a dark 1-pixel outline, a warm rim light from the upper right, clear readable faces (eyes, eyebrows, mouth), visible small details (straps, buckles, pouches, stitching, scuffs on boots). No anti-aliasing, no blur, no gradients, no glow, no painterly brush strokes.

VIEW: FRONT VIEW — every character faces the viewer straight on, chest and face toward the camera, both eyes visible, like heroes waiting in a game lobby. Not a side view.

THE RIFLE (everyone has the same one): a chunky assault rifle with a black steel body, a short thick barrel, a brown wooden stock and a small glowing-orange energy cell on its side, held across the body or resting on a shoulder.

TRANSPARENT BACKGROUND — VERY IMPORTANT: a PNG with a real alpha channel. NO checkerboard pattern anywhere, no background colour, no floor, no shadow, no grid lines, no borders, no text, no numbers, no names, no watermark.

LAYOUT: exactly 10 columns and 2 rows. EACH CHARACTER GETS EXACTLY ONE ROW of 10 frames, read left to right. Every pose stands alone in its own cell with clear empty space around it, never touching a neighbour. Draw the characters BIG: each one fills most of its row's height, the same size in all 10 frames, standing on the same floor line across the row.

EVERY ROW, THE SAME PLAN:
Frames 1–3 — BREATHING IDLE LOOP: relaxed lobby stance, weight on one leg. Frame 2: chest rises, shoulders lift one pixel, a slight blink. Frame 3: back to the pose of frame 1. Feet stay planted.
Frames 4–10 — THAT CHARACTER'S EMOTE (described below), a playful, personality-filled lobby animation like the quirky emotes in mobile battle games, smooth from frame to frame, big readable poses, starting from and ending in the exact pose of frame 1. No effects that fill the cell, no muzzle flash, no extra objects bigger than the character.

THE CHARACTERS, ONE PER ROW:
ROW 1 — JAX — the grenadier, one of the two original commandos. A muscular man, short dark brown hair, determined face, a little stubble. A BLUE headband with two short tails, a white sleeveless shirt, blue camouflage trousers, black combat boots, fingerless black gloves, grenades clipped to his belt. Rifle held across his chest. Draw him in the same pixel style as the others.
EMOTE: 4 unclips a grenade; 5 tosses it up in the air; 6 watches it fly; 7 spins around; 8 catches it behind his back; 9 clips it back on his belt with a smug look; 10 back to the idle pose.
ROW 2 — DUKE — the brawler, the other original commando. A muscular man with spiky blond hair, a cocky grin. A RED headband, bare chest crossed by one brass ammunition belt, red camouflage trousers, black combat boots, wrist wraps. Rifle resting on his shoulder. Draw him in the same pixel style as the others.
EMOTE: 4 lowers the rifle; 5 cracks his knuckles; 6 a double-biceps flex; 7 turns the flex toward the viewer; 8 laughs with his head thrown back; 9 swings the rifle back onto his shoulder; 10 back to the idle pose.
```
