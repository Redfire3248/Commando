// Input for up to five players on one machine: two keyboard layouts, gamepads, and the touch screen.
// read() returns one state per player: { left, right, up, down, shoot, jump, jumpPressed }
(function () {
  // ---- on-screen controls (touch devices) feed the touch player ----
  // Left side: movement — a floating joystick (appears where the thumb lands) or a fixed D-pad, chosen in
  // Settings. Right side: FIRE, JUMP and SKILL. Every finger is tracked on its own and a finger can slide from
  // one button to another, so presses never get stuck or lost. Settings live in CG.Touch.opts.
  // ---- keyboard bindings for the one-keyboard player (Settings → Controls); saved on this device
  const K0 = { left: [[37, '←'], [65, 'A']], right: [[39, '→'], [68, 'D']], up: [[38, '↑'], [87, 'W']], down: [[40, '↓'], [83, 'S']],
    shoot: [[88, 'X'], [74, 'J'], [70, 'F']], jump: [[90, 'Z'], [75, 'K'], [71, 'G'], [32, 'SPACE']], ability: [[67, 'C'], [69, 'E']], dash: [[16, 'SHIFT'], [86, 'V']] };
  CG.Keys = {
    ACTIONS: [['left', 'Move left'], ['right', 'Move right'], ['up', 'Aim up / climb'], ['down', 'Aim down / crouch'], ['shoot', 'Shoot'],
      ['jump', 'Jump'], ['ability', 'Ability'], ['dash', 'Dash (Kite)']],
    get() {
      let m = null;
      try { m = JSON.parse(localStorage.getItem('commando.keys')); } catch (e) { /* defaults */ }
      return Object.assign({}, K0, m || {});
    },
    // one key for this action, in place of its defaults
    set(action, code, label) {
      const m = this.get();
      m[action] = [[code, label]];
      try { localStorage.setItem('commando.keys', JSON.stringify(m)); } catch (e) { /* */ }
    },
    reset() { try { localStorage.removeItem('commando.keys'); } catch (e) { /* */ } },
    label(action) { return this.get()[action].map((k) => k[1]).join(' / '); },
  };

  const T = CG.Touch = {
    enabled: false,
    s: { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false, dash: false },
    opts: { style: 'dpad', size: 1, autofire: false, pos: {} },          // pos: where each button was moved to (Settings)
  };
  try { Object.assign(T.opts, JSON.parse(localStorage.getItem('commando.touch')) || {}); } catch (e) { /* defaults */ }
  T.save = () => { try { localStorage.setItem('commando.touch', JSON.stringify(T.opts)); } catch (e) { /* */ } T.apply(); };
  const root = document.getElementById('touch');
  function enable() { T.enabled = true; }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enable();
  window.addEventListener('touchstart', enable, { passive: true, once: true });
  T.show = (on) => { T.shown = !!(on && T.enabled); root.classList.toggle('hidden', !(on && T.enabled)); if (!on) releaseAll(); };
  // control size: the chosen size, a bit smaller on short phone screens so the buttons leave room to see
  T.apply = () => {
    root.classList.toggle('dpad-mode', T.opts.style === 'dpad');
    const fit = Math.max(0.62, Math.min(1, window.innerHeight / 520));
    root.style.setProperty('--ts', (T.opts.size * fit).toFixed(3));
    // buttons the player moved: placed by their centre, as a share of the screen
    const pos = T.opts.pos || {};
    document.querySelectorAll('#btns [data-btn], #b-pause').forEach((b) => {
      const id = b.dataset.btn || 'pause', at = pos[id];
      if (at) Object.assign(b.style, { left: 'calc(' + (at.x * 100).toFixed(2) + 'vw - ' + b.offsetWidth / 2 + 'px)', top: 'calc(' + (at.y * 100).toFixed(2) + 'vh - ' + b.offsetHeight / 2 + 'px)', right: 'auto', bottom: 'auto', marginLeft: '0' });
      else Object.assign(b.style, { left: '', top: '', right: '', bottom: '', marginLeft: '' });
    });
  };
  // Settings → MOVE BUTTONS: the controls show over a dimmed screen and each one can be dragged to a new place
  T.editing = false;
  T.edit = (on) => {
    T.editing = on;
    root.classList.toggle('editing', on);
    root.classList.toggle('hidden', !on && !T.shown);
    if (on) { root.classList.remove('hidden'); T.apply(); }
  };
  T.apply();
  window.addEventListener('resize', T.apply);

  const stick = document.getElementById('stick'), knob = document.getElementById('knob');
  const pad = document.getElementById('dpad');
  const arrows = { up: pad.querySelector('.up'), down: pad.querySelector('.down'), left: pad.querySelector('.left'), right: pad.querySelector('.right') };
  const btns = {};
  document.querySelectorAll('#btns [data-btn]').forEach((b) => { btns[b.dataset.btn] = b; });
  let movePid = null, mx0 = 0, my0 = 0;
  const fingers = new Map();                          // pointerId -> button name it is on (right side)

  function setDir(dx, dy, radius) {
    const s = T.s;
    s.left = s.right = s.up = s.down = false;
    if (Math.hypot(dx, dy) > radius * 0.28) {
      const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));      // 8 directions, 0 = right, 2 = down
      s.right = oct >= -1 && oct <= 1; s.left = oct >= 3 || oct <= -3;
      s.down = oct >= 1 && oct <= 3; s.up = oct <= -1 && oct >= -3;
    }
    for (const k in arrows) arrows[k].classList.toggle('on', s[k]);
  }
  // both the joystick and the D-pad appear under the thumb, wherever it lands on the left half
  function moveStart(e) {
    movePid = e.pointerId;
    mx0 = e.clientX; my0 = e.clientY;
    if (T.opts.style === 'stick') {
      stick.style.left = mx0 + 'px'; stick.style.top = my0 + 'px';
      stick.classList.add('on');
    } else {
      const half = pad.offsetWidth / 2;
      mx0 = Math.max(half + 6, Math.min(window.innerWidth * 0.5 - half, mx0));
      my0 = Math.max(half + 6, Math.min(window.innerHeight - half - 6, my0));
      pad.style.left = (mx0 - half) + 'px'; pad.style.top = (my0 - half) + 'px'; pad.style.bottom = 'auto';
      pad.classList.add('on');
    }
    moveTo(e);
  }
  function moveTo(e) {
    if (T.opts.style === 'stick') {
      const R = 70 * T.opts.size;
      let dx = e.clientX - mx0, dy = e.clientY - my0;
      const d = Math.hypot(dx, dy);
      if (d > R * 1.6) { mx0 = e.clientX - dx / d * R * 1.6; my0 = e.clientY - dy / d * R * 1.6; stick.style.left = mx0 + 'px'; stick.style.top = my0 + 'px'; dx = e.clientX - mx0; dy = e.clientY - my0; }
      const k = Math.min(1, R / Math.max(1, Math.hypot(dx, dy)));
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      setDir(dx, dy, R);
    } else {
      setDir(e.clientX - mx0, e.clientY - my0, pad.offsetWidth / 2);
    }
  }
  function moveEnd() {
    movePid = null;
    setDir(0, 0, 1);
    stick.classList.remove('on');
    knob.style.transform = '';
    pad.classList.remove('on');
    pad.style.left = pad.style.top = pad.style.bottom = '';           // back to its resting place
  }
  // which button is under this point (a little forgiving around the edges)
  function buttonAt(x, y) {
    let best = null, bd = Infinity;
    for (const k in btns) {
      const r = btns[k].getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy) / (r.width / 2);
      if (d < 1.25 && d < bd) { bd = d; best = k; }
    }
    return best;
  }
  function syncButtons() {
    const held = new Set(fingers.values());
    for (const k in btns) { T.s[k] = held.has(k) || (k === 'shoot' && T.opts.autofire); btns[k].classList.toggle('on', held.has(k)); }
  }
  function releaseAll() { fingers.clear(); moveEnd(); syncButtons(); }

  // dragging a button while the layout is being edited
  let drag = null;
  root.addEventListener('pointerdown', (e) => {
    if (!T.editing) return;
    const b = e.target.closest('#btns [data-btn], #b-pause');
    if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    drag = { b, id: b.dataset.btn || 'pause', pid: e.pointerId };
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* */ }
  }, true);
  root.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    e.stopImmediatePropagation();
    T.opts.pos = T.opts.pos || {};
    T.opts.pos[drag.id] = { x: Math.max(0.03, Math.min(0.97, e.clientX / innerWidth)), y: Math.max(0.05, Math.min(0.95, e.clientY / innerHeight)) };
    T.apply();
  }, true);
  root.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.pid) { drag = null; T.save(); e.stopImmediatePropagation(); } }, true);
  root.addEventListener('pointerdown', (e) => {
    if (T.editing) return;
    if (e.target.closest('#b-pause')) return;
    e.preventDefault();
    const leftSide = e.clientX < window.innerWidth * 0.45;
    const b = buttonAt(e.clientX, e.clientY);
    if (b) fingers.set(e.pointerId, b);
    else if (leftSide && movePid === null) moveStart(e);
    else return;
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* fine without */ }
    syncButtons();
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerId === movePid) { moveTo(e); return; }
    if (fingers.has(e.pointerId)) {
      const b = buttonAt(e.clientX, e.clientY);
      if (b && b !== fingers.get(e.pointerId)) { fingers.set(e.pointerId, b); syncButtons(); }
    }
  });
  const up = (e) => {
    if (e.pointerId === movePid) moveEnd();
    if (fingers.delete(e.pointerId)) syncButtons();
  };
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
  root.addEventListener('lostpointercapture', up);
  root.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
  T.syncButtons = syncButtons;
  // the SKILL button shows its cooldown (called by the game every frame)
  // The SKILL button shows the agent's ability icon, its cooldown sweep and the seconds left; DASH shows its cooldown.
  // FIRE / JUMP / DASH (and SKILL without an ability icon) show the icons from ui_icons.png when it is in
  const UIICON = (CG.DATA.art && CG.DATA.art.ui) || {};
  [['shoot', 'fire'], ['jump', 'jump'], ['dash', 'dash']].forEach(([k, name]) => {
    const b = btns[k];
    if (b && UIICON[name]) { b.classList.add('ico'); b.style.setProperty('--ico', 'url("' + new URL(UIICON[name], document.baseURI).href + '")'); }
  });
  T.setAbility = (agent) => {
    const b = btns.ability, icon = (CG.ABICONS && CG.ABICONS[agent.id]) || UIICON.skill;
    if (!b) return;
    b.style.backgroundImage = icon ? `conic-gradient(rgba(0,0,0,.72) calc(var(--cd) * 360deg), transparent 0), url("${icon}")` : '';
    b.style.borderColor = agent.color;
    b.classList.toggle('has-icon', !!icon);
    b.textContent = icon ? '' : 'SKILL';
  };
  let lastSecs = -1;
  T.cooldown = (f, msLeft, dashF) => {
    const b = btns.ability;
    if (b) {
      b.style.setProperty('--cd', Math.max(0, Math.min(1, f)).toFixed(3));
      const secs = msLeft > 0 ? Math.ceil(msLeft / 1000) : 0;
      if (secs !== lastSecs && b.classList.contains('has-icon')) { b.textContent = secs ? secs : ''; lastSecs = secs; }
      b.classList.toggle('ready', !(msLeft > 0));
    }
    if (btns.dash && dashF !== undefined) btns.dash.style.setProperty('--cd', Math.max(0, Math.min(1, dashF)).toFixed(3));
  };

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
        kbA: mk({ left: [K.A], right: [K.D], up: [K.W], down: [K.S], shoot: [K.F], jump: [K.G], ability: [K.H], dash: [K.T] }),
        kbB: mk({ left: [K.LEFT], right: [K.RIGHT], up: [K.UP], down: [K.DOWN], shoot: [K.K], jump: [K.L], ability: [K.O], dash: [K.I] }),
        // the one-keyboard player's keys come from Settings → Controls (CG.Keys)
        kbAll: mk(Object.fromEntries(Object.entries(CG.Keys.get()).map(([a, keys]) => [a, keys.map((k) => k[0])]))),
      };
      this.prevJump = devices.map(() => false);
      this.prevAbility = devices.map(() => false);
      this.prevDash = devices.map(() => false);
      this.botMem = devices.map(() => ({}));
    }

    readKeys(type) {
      const s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false, dash: false };
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
      s.jump = s.jump || B(0); s.shoot = s.shoot || B(2) || B(7); s.ability = s.ability || B(3) || B(5); s.dash = s.dash || B(1) || B(4);
    }

    read() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      return this.devices.map((d, i) => {
        let s = { left: false, right: false, up: false, down: false, shoot: false, jump: false, ability: false, dash: false };
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
        s.dashPressed = s.dash && !this.prevDash[i];
        this.prevDash[i] = s.dash;
        this.prevAbility[i] = s.ability;
        return s;
      });
    }
  };
})();
