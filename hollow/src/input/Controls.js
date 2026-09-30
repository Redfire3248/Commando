// One input state for keyboard + mouse + gamepad + touch.
//   held[action]    true while the button is down
//   pressed[action] true only on the frame it went down
//   slot            0-7 when a number key was just pressed, else -1
//
// Two keyboard layouts work at the same time, no setting needed:
//   Arrow keys + Z X C        (the Hollow Knight layout: Z jump, X attack, C dash)
//   WASD + Space, mouse       (left click attack, right click or Shift dash)
GH.Controls = class {
  constructor(scene) {
    this.scene = scene;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const map = {
      left: [K.LEFT, K.A], right: [K.RIGHT, K.D], up: [K.UP, K.W], down: [K.DOWN, K.S],
      jump: [K.Z, K.SPACE], slash: [K.X, K.J], dash: [K.C, K.SHIFT, K.K],
      shoot: [K.F], lock: [K.R], prev: [K.Q], next: [K.E],      // gun controls, used when GH.CONFIG.GUNS is on
    };
    this.keys = {};
    for (const act in map) this.keys[act] = map[act].map((c) => scene.input.keyboard.addKey(c));
    this.num = [K.ONE, K.TWO, K.THREE, K.FOUR, K.FIVE, K.SIX, K.SEVEN, K.EIGHT].map((c) => scene.input.keyboard.addKey(c));
    if (scene.input.mouse) scene.input.mouse.disableContextMenu();   // right click is dash, not a menu
    this.held = {};
    this.pressed = {};
    this.slot = -1;
  }

  update() {
    const t = GH.Touch ? GH.Touch.s : {};
    const h = {};
    for (const act in this.keys) h[act] = this.keys[act].some((k) => k.isDown) || !!t[act];

    // mouse (ignored on touch screens, where the on-screen buttons do this job)
    const m = this.scene.input.activePointer;
    if (m && m.isDown && !m.wasTouch) {
      h.slash = h.slash || m.leftButtonDown();
      h.dash = h.dash || m.rightButtonDown();
    }

    const pad = this.scene.input.gamepad ? this.scene.input.gamepad.pad1 : null;
    if (pad) {
      const ax = pad.leftStick.x, ay = pad.leftStick.y;
      const B = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
      h.left = h.left || ax < -0.35 || B(14);
      h.right = h.right || ax > 0.35 || B(15);
      h.up = h.up || ay < -0.5 || B(12);
      h.down = h.down || ay > 0.5 || B(13);
      h.jump = h.jump || B(0);          // A
      h.slash = h.slash || B(2);        // X
      h.dash = h.dash || B(1) || B(7);  // B / RT
      h.shoot = h.shoot || B(3);        // Y
      h.prev = h.prev || B(4);          // LB
      h.next = h.next || B(5);          // RB
      h.lock = h.lock || B(6);          // LT
    }

    for (const a in h) this.pressed[a] = h[a] && !this.held[a];
    this.held = h;

    this.slot = -1;
    this.num.forEach((k, i) => { if (Phaser.Input.Keyboard.JustDown(k)) this.slot = i; });
  }
};
