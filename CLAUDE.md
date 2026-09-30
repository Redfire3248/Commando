# GUNHOLLOW — project notes

Two HTML5 games in one project, both Phaser 3.80.1 from CDN with Arcade physics, both plain `<script>` tags with no build step.

| Folder | Game | Global namespace |
|---|---|---|
| `hollow/` | Hollow Knight style: sword, dash, wall-jump, benches | `GH` |
| `contra/` | Contra style run-and-gun "COMMANDO": one-hit deaths, lives, 1-5 local players, pixel art drawn in code, Firebase friends | `CG` |

`index.html` at the root is only a game picker. `server/dev-server.js` serves the root; games live at `/hollow/` and `/contra/`. Each game is self-contained (own `assets/`, own `tools/build_art.py`, own generated `art.gen.js`). Nothing is shared between them on purpose.

## COMMANDO (`contra/`)

- `src/level.js` holds the stages as data in `CG.DATA.levels` (theme, ground pieces, ledges, enemy and capsule spawns, boss type); the Game scene points `CG.DATA.level` at the one being played and cycles through them, harder each lap. `CG.Level.check()` warns in the console about any enemy placed with nothing under it. Themes (`jungle`, `base`, `snow`) are defined by `THEMES` in `src/art.js`; terrain and background textures are keyed `<name>_<theme>`. Bosses: fortress (cannons + core), tank, gunship — an enemy type with `final: true` clears the stage when destroyed. Falling projectiles (grenades, bombs) live in `scene.ebombs`. `src/sfx.js` synthesises all sound with Web Audio (no files). `src/entities.js` has `CG.Player` and `CG.Enemy` (behaviour chosen by the `ai` field in `TYPES`). `src/scenes.js` has Boot, the menu backdrop, and the Game scene. `src/ui.js` is the DOM menu flow. `src/net.js` is the Firebase layer.
- The camera only scrolls right and locks at the fortress. One hit kills; falling in water kills even with the shield. Clearing the core restarts the stage one difficulty higher with score and lives carried over.
- Firebase is optional: `contra/firebase-config.js` ships with `PASTE_` placeholders and the game stays offline until they are replaced. Setup steps and the database rules are in `contra/FIREBASE.md`. Online co-op play is NOT built — only accounts, friend codes, requests, presence and best scores.
- Input keys are added with capture off (`addKey(code, false)`) so typing in the friends form works.
- Art: everything is pixel art drawn in code by `src/art.js` (tiny canvases scaled up with hard edges; soldiers come from one procedural `soldier()` renderer with run phase + aim direction, so player sheets for all five colours share the frame layout in `CG.Art.PIX`). No image files are needed. The user ran out of image-generation quota, so keep new art in this style unless they supply sheets again. `CONFIG.SHEET_ART` is `true` (the user asked for their painted commandos back): players, bullet, flash, badges and capsule come from `contra/assets/commandos.png`, sliced by `contra/tools/build_art.py`; players 3-5 are hue-shifted copies of commando A made at boot (`CG.Art.recolourCommandos`). Enemies, terrain and the fortress stay code-drawn pixel art. Set it to `false` for all-pixel-art.
- Players: 1 to 5 on one machine. `src/ui.js` has a join screen that collects devices (`kbA`, `kbB`, `pad` + index, `touch`); a lone keyboard player becomes `kbAll`. `CG.Input` reads one state per device; gamepads are read straight from `navigator.getGamepads()`. The fortress HP scales with player count.
- The game auto-pauses when the tab is hidden, which also happens in the hidden Browser pane: click Resume (or call the resume action) before driving it with `CG.game.loop.step(t)`; inject input through `CG.Touch.s`.

## HOLLOW (`hollow/`) — everything below this line is about this game; paths are relative to `hollow/`

## Conventions

- **No build step.** Plain `<script>` tags in `index.html`, everything on the global `GH` namespace. A new file must be added to `index.html` in dependency order. No ES modules, no `fetch` of local JSON. Art is loaded by Phaser's loader, so the game must be served over http (not opened as a file).
- **Data-driven.** Content lives in `data/*.js` (`GH.DATA.weapons`, `.enemies`, `.abilities`, `.rooms`). The HUD and the planned admin panel read these lists, so new content should need a data entry, not new code.
- **Resolution** is 1920×1080 internal, `Scale.FIT`. Tiles are 64 px. Rooms are defined in tile coordinates as rectangles (`data/rooms.js`).
- **Art**: AI sheets are 8×4 grids of 256 px (or 512 px) cells with the background removed (transparent PNG). Every art prompt must tell the image tool to remove the background; no magenta key colour. See `tools/prompts.md`. Raw sheets go in `assets/sheets/` (or `assets/`). `python tools/build_art.py` slices and aligns them into `assets/atlas/` — slicing ONLY: pixels are copied untouched at the sheet's own resolution, with no background removal, alpha clean-up or resizing (the user's sheets are already transparent; the game scales frames at draw time using the scales in the manifest) — and writes `data/art.gen.js`; `BootScene.preload` loads that list. `src/art/placeholders.js` draws any texture key that real art did not provide, so real art must reuse the same keys (`player`, `w_<id>`, `b_<id>`, `eb`, `flash`, `guns_held`, `fx_impact`, `fx_explosion`, `tiles`, `props`, `tile_plat`, `spikes`, `bench`). Re-run the build after adding or replacing a sheet. The held-gun sheet pivots each gun on its firing line; don't move the shoulder height without checking shots still hit low enemies.
- **Player physics** sits on an invisible zone (`player.phys`); the sprite is visual only. Don't scale physics sprites — Arcade resizes the body with them.
- Arcade collision callbacks don't guarantee argument order; use the `mover/terrain/other` helpers in `GameScene.setupColliders`.
- Destroying objects inside a physics callback: disable now, `destroy()` via `time.delayedCall(0, …)`.

## Current direction

Sword-first, Hollow Knight style, with parkour (pits in the floor, fast movement). `GH.CONFIG.GUNS` is `false`: no gun sprite, no shooting, no weapon pickups, no weapon HUD. Guns come back later by setting it to `true`. The hero comes from one 10×5 sheet (`assets/hero_sword.png` or `30_hero_sword.png`, 50 frames, always holding a sword); `build_hero()` in `tools/build_art.py` cuts it sprite by sprite (the AI does not keep an exact grid) and `HERO_LAYOUT` maps animations to (row, position-in-row); a regenerated sheet can have a different sprite count per row, so check the printed "sprites per row" and the layout after every new sheet. It falls back to the old 01/02 sheets if the hero sheet is missing. Physics runs one variable step per frame (`fixedStep: false`) — a fixed 120 Hz step made movement stutter.

## Fairness rules (design constraint)

Multiplayer will be server-authoritative. Admin panel is single-player or private-lobby host only, and any admin use flags the save so it is excluded from leaderboards.

## Run / test

`node server/dev-server.js` (from the project root) → http://localhost:8080/hollow/ (`?reset` wipes the save). PWA install only works over localhost/https.

When the browser pane is hidden, `requestAnimationFrame` stops; drive the game with `GH.game.loop.step(t)` and inject input through `GH.Touch.s` to test.
