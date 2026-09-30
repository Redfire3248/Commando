// On-screen controls for phones/tablets. Writes into GH.Touch.s, which Controls.js merges with keyboard + gamepad.
(function () {
  const T = GH.Touch = {
    enabled: false,
    s: { left: false, right: false, up: false, down: false, jump: false, shoot: false, slash: false, dash: false, lock: false, next: false },
  };
  const root = document.getElementById('touch');
  function enable() {
    if (T.enabled) return;
    T.enabled = true;
    root.classList.remove('hidden');
  }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) enable();
  window.addEventListener('touchstart', enable, { passive: true, once: true });

  // ---- floating joystick: appears where the left thumb lands, snaps to 8 directions ----
  const zone = document.getElementById('stick-zone');
  const stick = document.getElementById('stick');
  const knob = document.getElementById('knob');
  const R = 60, DEAD = 18;
  let sid = null, ox = 0, oy = 0;

  function setDir(dx, dy) {
    const s = T.s;
    s.left = s.right = s.up = s.down = false;
    if (Math.hypot(dx, dy) < DEAD) return;
    const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));   // -4..4, 0 = right, 2 = down
    s.right = oct >= -1 && oct <= 1;
    s.left = oct >= 3 || oct <= -3;
    s.down = oct >= 1 && oct <= 3;
    s.up = oct <= -1 && oct >= -3;
  }
  function move(e) {
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setDir(dx, dy);
  }
  zone.addEventListener('pointerdown', (e) => {
    if (sid !== null) return;
    sid = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    const r = zone.getBoundingClientRect();
    ox = e.clientX; oy = e.clientY;
    stick.style.left = (e.clientX - r.left - 75) + 'px';
    stick.style.top = (e.clientY - r.top - 75) + 'px';
    stick.style.bottom = 'auto';
    move(e);
    e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === sid) move(e); });
  const end = (e) => {
    if (e.pointerId !== sid) return;
    sid = null;
    knob.style.transform = '';
    stick.style.left = stick.style.top = stick.style.bottom = '';
    setDir(0, 0);
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);

  // ---- buttons ----
  document.querySelectorAll('#btns button').forEach((b) => {
    const k = b.dataset.btn;
    const on = (e) => {
      e.preventDefault();
      T.s[k] = true;
      b.classList.add('on');
      if (b.setPointerCapture) b.setPointerCapture(e.pointerId);
    };
    const off = () => { T.s[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
})();

if (!GH.CONFIG.GUNS) document.body.classList.add('no-guns');
