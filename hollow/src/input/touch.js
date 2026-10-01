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
