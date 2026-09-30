// Input for up to five players on one machine: two keyboard layouts, gamepads, and the touch screen.
// read() returns one state per player: { left, right, up, down, shoot, jump, jumpPressed }
(function () {
  // ---- on-screen controls (touch devices) feed player 1 ----
  const T = CG.Touch = { enabled: false, s: { left: false, right: false, up: false, down: false, shoot: false, jump: false } };
  const root = document.getElementById('touch');
  function enable() { T.enabled = true; }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enable();
  window.addEventListener('touchstart', enable, { passive: true, once: true });
  T.show = (on) => root.classList.toggle('hidden', !(on && T.enabled));

  const zone = document.getElementById('stick-zone'), stick = document.getElementById('stick'), knob = document.getElementById('knob');
  let sid = null, ox = 0, oy = 0;
  function setDir(dx, dy) {
    const s = T.s;
    s.left = s.right = s.up = s.down = false;
    if (Math.hypot(dx, dy) < 18) return;
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    s.right = oct >= -1 && oct <= 1; s.left = oct >= 3 || oct <= -3;
    s.down = oct >= 1 && oct <= 3; s.up = oct <= -1 && oct >= -3;
  }
  function move(e) {
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > 60) { dx *= 60 / d; dy *= 60 / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setDir(dx, dy);
  }
  zone.addEventListener('pointerdown', (e) => {
    if (sid !== null) return;
    sid = e.pointerId; zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    ox = e.clientX; oy = e.clientY;
    stick.style.left = (e.clientX - r.left - 75) + 'px'; stick.style.top = (e.clientY - r.top - 75) + 'px'; stick.style.bottom = 'auto';
    move(e); e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === sid) move(e); });
  const end = (e) => {
    if (e.pointerId !== sid) return;
    sid = null; knob.style.transform = ''; stick.style.left = stick.style.top = stick.style.bottom = ''; setDir(0, 0);
  };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
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
  //   { type: 'touch' }            the on-screen stick and buttons
  CG.Input = class {
    constructor(scene, devices) {
      this.scene = scene; this.devices = devices;
      const K = Phaser.Input.Keyboard.KeyCodes, kb = scene.input.keyboard;
      // capture is off so typing a name in the friends menu still works
      const mk = (m) => { const o = {}; for (const a in m) o[a] = m[a].map((c) => kb.addKey(c, false)); return o; };
      this.maps = {
        kbA: mk({ left: [K.A], right: [K.D], up: [K.W], down: [K.S], shoot: [K.F], jump: [K.G] }),
        kbB: mk({ left: [K.LEFT], right: [K.RIGHT], up: [K.UP], down: [K.DOWN], shoot: [K.K], jump: [K.L] }),
        kbAll: mk({
          left: [K.LEFT, K.A], right: [K.RIGHT, K.D], up: [K.UP, K.W], down: [K.DOWN, K.S],
          shoot: [K.X, K.J, K.F], jump: [K.Z, K.K, K.G, K.SPACE],
        }),
      };
      this.prevJump = devices.map(() => false);
    }

    read() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      return this.devices.map((d, i) => {
        const s = { left: false, right: false, up: false, down: false, shoot: false, jump: false };
        if (this.maps[d.type]) {
          const m = this.maps[d.type];
          for (const a in m) s[a] = m[a].some((k) => k.isDown);
          const p = this.scene.input.activePointer;
          if (d.type === 'kbAll' && p && p.isDown && !p.wasTouch && p.leftButtonDown()) s.shoot = true;
        } else if (d.type === 'touch') {
          Object.assign(s, CG.Touch.s);
        } else if (d.type === 'pad') {
          const pad = pads[d.index];
          if (pad) {
            const B = (b) => !!(pad.buttons[b] && pad.buttons[b].pressed);
            const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
            s.left = ax < -0.35 || B(14); s.right = ax > 0.35 || B(15);
            s.up = ay < -0.5 || B(12); s.down = ay > 0.5 || B(13);
            s.jump = B(0); s.shoot = B(2) || B(7);
          }
        }
        s.jumpPressed = s.jump && !this.prevJump[i];
        this.prevJump[i] = s.jump;
        return s;
      });
    }
  };
})();
