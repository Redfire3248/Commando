// Input for up to five players on one machine: two keyboard layouts, gamepads, and the touch screen.
// read() returns one state per player: { left, right, up, down, shoot, jump, jumpPressed }
(function () {
  // ---- on-screen controls (touch devices) feed player 1 ----
  const T = CG.Touch = { enabled: false, s: { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false } };
  const root = document.getElementById('touch');
  function enable() { T.enabled = true; }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enable();
  window.addEventListener('touchstart', enable, { passive: true, once: true });
  T.show = (on) => root.classList.toggle('hidden', !(on && T.enabled));

  // ---- D-pad: four arrow buttons on the left. Touching between two arrows presses both (diagonals). ----
  const pad = document.getElementById('dpad');
  const arrows = { up: pad.querySelector('.up'), down: pad.querySelector('.down'), left: pad.querySelector('.left'), right: pad.querySelector('.right') };
  let pid = null;
  function press(e) {
    const r = pad.getBoundingClientRect(), s = T.s;
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    s.left = s.right = s.up = s.down = false;
    if (Math.hypot(dx, dy) > r.width * 0.12) {
      const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));   // 8 directions, 0 = right, 2 = down
      s.right = oct >= -1 && oct <= 1; s.left = oct >= 3 || oct <= -3;
      s.down = oct >= 1 && oct <= 3; s.up = oct <= -1 && oct >= -3;
    }
    for (const k in arrows) arrows[k].classList.toggle('on', s[k]);
  }
  function release(e) {
    if (e.pointerId !== pid) return;
    pid = null;
    T.s.left = T.s.right = T.s.up = T.s.down = false;
    for (const k in arrows) arrows[k].classList.remove('on');
  }
  pad.addEventListener('pointerdown', (e) => {
    if (pid !== null) return;
    pid = e.pointerId;
    press(e);
    try { pad.setPointerCapture(e.pointerId); } catch (err) { /* keeps working without capture */ }
    e.preventDefault();
  });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === pid) press(e); });
  pad.addEventListener('pointerup', release);
  pad.addEventListener('pointercancel', release);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
  document.querySelectorAll('#btns button').forEach((b) => {
    const k = b.dataset.btn;
    const on = (e) => { e.preventDefault(); T.s[k] = true; b.classList.add('on'); if (b.setPointerCapture) b.setPointerCapture(e.pointerId); };
    const off = () => { T.s[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // One entry per player, in join order:
  //   { type: 'kbAll' }            a lone keyboard player: Arrows or WASD, X / J / F / click shoot, Z / K / G / Space jump
  //   { type: 'kbA' }              WASD + F shoot + G jump
  //   { type: 'kbB' }              Arrows + K shoot + L jump
  //   { type: 'pad', index: n }    gamepad n: stick or D-pad, A jump, X or RT shoot
  //   { type: 'touch' }            the on-screen D-pad and buttons
  //   { type: 'bot' }              a computer teammate (CG.Bot)
  // Ability: C / E / right click alone, H on keyboard 1, O on keyboard 2, Y or RB on a gamepad, the ABILITY button.
  CG.Input = class {
    constructor(scene, devices) {
      this.scene = scene; this.devices = devices;
      const K = Phaser.Input.Keyboard.KeyCodes, kb = scene.input.keyboard;
      // capture is off so typing a name in the friends menu still works
      const mk = (m) => { const o = {}; for (const a in m) o[a] = m[a].map((c) => kb.addKey(c, false)); return o; };
      this.maps = {
        kbA: mk({ left: [K.A], right: [K.D], up: [K.W], down: [K.S], shoot: [K.F], jump: [K.G], ability: [K.H] }),
        kbB: mk({ left: [K.LEFT], right: [K.RIGHT], up: [K.UP], down: [K.DOWN], shoot: [K.K], jump: [K.L], ability: [K.O] }),
        kbAll: mk({
          left: [K.LEFT, K.A], right: [K.RIGHT, K.D], up: [K.UP, K.W], down: [K.DOWN, K.S],
          shoot: [K.X, K.J, K.F], jump: [K.Z, K.K, K.G, K.SPACE], ability: [K.C, K.E, K.SHIFT],
        }),
      };
      this.prevJump = devices.map(() => false);
      this.prevAbility = devices.map(() => false);
      this.botMem = devices.map(() => ({}));
    }

    readKeys(type) {
      const s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false };
      const m = this.maps[type];
      for (const a in m) s[a] = m[a].some((k) => k.isDown);
      const p = this.scene.input.activePointer;
      if (type === 'kbAll' && p && p.isDown && !p.wasTouch && p.leftButtonDown()) s.shoot = true;
      if (type === 'kbAll' && p && p.isDown && !p.wasTouch && p.rightButtonDown()) s.ability = true;
      return s;
    }

    readPad(pad, s) {
      const B = (b) => !!(pad.buttons[b] && pad.buttons[b].pressed);
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      s.left = s.left || ax < -0.35 || B(14); s.right = s.right || ax > 0.35 || B(15);
      s.up = s.up || ay < -0.5 || B(12); s.down = s.down || ay > 0.5 || B(13);
      s.jump = s.jump || B(0); s.shoot = s.shoot || B(2) || B(7); s.ability = s.ability || B(3) || B(5);
    }

    read() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      return this.devices.map((d, i) => {
        let s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false };
        if (d.type === 'any') {                     // online: this device's keyboard, mouse, first gamepad and touch screen
          s = Object.assign(this.readKeys('kbAll'), {});
          const t = CG.Touch.s;
          for (const k in s) s[k] = s[k] || !!t[k];
          const pad = pads[0];
          if (pad) this.readPad(pad, s);
        } else if (d.type === 'bot') {
          const p = this.scene.players[i];
          if (p) s = CG.Bot.think(this.scene, p, this.botMem[i]);
        } else if (d.type === 'remote') {
          // an online teammate: their own game moves them, so no input here
        } else if (this.maps[d.type]) {
          s = this.readKeys(d.type);
        } else if (d.type === 'touch') {
          Object.assign(s, CG.Touch.s);
        } else if (d.type === 'pad') {
          const pad = pads[d.index];
          if (pad) this.readPad(pad, s);
        }
        s.jumpPressed = s.jump && !this.prevJump[i];
        this.prevJump[i] = s.jump;
        s.abilityPressed = s.ability && !this.prevAbility[i];
        this.prevAbility[i] = s.ability;
        return s;
      });
    }
  };
})();
