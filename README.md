# GUNHOLLOW

Two browser games in one project. Both run on PC, phone and tablet.

| Folder | Game |
|---|---|
| `hollow/` | **HOLLOW** — sword, dash and wall-jump through a cavern (Hollow Knight style) |
| `contra/` | **COMMANDO** — run-and-gun, one hit kills, 1 or 2 players, friends list (Contra style) |

## Play

Double-click **`PLAY.bat`**. It starts a small local server and opens <http://localhost:8080>, where you pick a game.

Or from a terminal:

```bash
node server/dev-server.js
```

The terminal also prints a Wi-Fi address — open that on a phone on the same network to play with touch controls.

## COMMANDO controls

Up to 5 players on one screen. On the join screen everyone presses their FIRE button: two players can share the keyboard and the rest use gamepads (or one uses a touch screen).

| | Alone | Keyboard 1 | Keyboard 2 | Gamepad |
|---|---|---|---|---|
| Move / aim | Arrows or WASD | W A S D | Arrows | Stick / D-pad |
| Shoot | X, J or click | F | K | X or RT |
| Jump | Z, K or Space | G | L | A |

Hold down on the ground to lie flat. Down + Jump drops through a ledge. Esc or P pauses.

The players are the painted commandos from `contra/assets/commandos.png` (players 3 to 5 are the blue one recoloured). Enemies, terrain and the fortress are pixel art drawn by the game's own code (`contra/src/art.js`). Setting `SHEET_ART: false` in `contra/src/config.js` makes the players pixel art too.

Friends and online scores need a free Firebase project: follow `contra/FIREBASE.md`.

## HOLLOW controls

| Action | Arrow-key layout | WASD layout | Gamepad |
|---|---|---|---|
| Move | ← → | A D | Stick / D-pad |
| Jump | Z | Space | A |
| Attack | X | Left click (or J) | X |
| Dash | C | Shift / Right click (or K) | B / RT |
| Strike up / down | hold ↑ / ↓ while attacking | hold W / S while attacking | Stick up / down |
| Slide | tap ↓ while running | tap S while running | Stick down |
| Rest at a bench | ↑ | W | ↑ |
| Drop through a ledge | ↓ + Z | S + Space | ↓ + A |

Open `http://localhost:8080/hollow/?reset` to wipe the HOLLOW save. HOLLOW can be installed as an app from Chrome (the Install button at the top of the game).

## Adding art

Each game has its own `assets/` folder and its own slicer. The slicers only cut the sheets up — pixels are never changed.

| Game | Put sheets in | Prompts | Then run |
|---|---|---|---|
| HOLLOW | `hollow/assets/` | `hollow/tools/prompts.md` | `python hollow/tools/build_art.py` |
| COMMANDO | `contra/assets/` | `contra/PROMPTS.md` | `python contra/tools/build_art.py` |

The slicers need Python with `pillow`, `numpy` and `scipy`. Anything without a sheet keeps its code-drawn placeholder.
