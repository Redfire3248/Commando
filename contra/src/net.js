// Online layer (Firebase): an account per player, a friend code, friend requests, who is online, best scores.
// Does nothing until firebase-config.js has real keys. Data layout (Realtime Database):
//   users/{uid}           { name, code, best, online, lastSeen }
//   codes/{CODE}          uid                       (friend code -> player)
//   requests/{to}/{from}  { name, at }              (pending friend requests)
//   friends/{uid}/{fid}   true                      (written on both sides when a request is accepted)
CG.Net = {
  state: 'off',            // off | loading | ready | error
  error: '',
  uid: null, profile: null, requests: {}, friends: {},
  VERSION: '10.12.2',

  init() {
    const cfg = window.CG_FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf('PASTE') === 0) return;
    this.state = 'loading';
    const base = 'https://www.gstatic.com/firebasejs/' + this.VERSION + '/firebase-';
    const load = (name) => new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = base + name + '-compat.js'; s.onload = ok; s.onerror = () => bad(new Error('Could not load Firebase'));
      document.head.appendChild(s);
    });
    load('app').then(() => load('auth')).then(() => load('database')).then(() => this.start(cfg)).catch((e) => this.fail(e));
  },

  fail(e) {
    this.state = 'error';
    this.error = (e && e.message) || String(e);
    console.warn('[online]', this.error);
    CG.UI.refreshFriends();
  },

  start(cfg) {
    firebase.initializeApp(cfg);
    this.db = firebase.database();
    this.auth = firebase.auth();
    this.auth.onAuthStateChanged((u) => {
      if (!u) { this.auth.signInAnonymously().catch((e) => this.fail(e)); return; }
      this.uid = u.uid;
      this.setup().catch((e) => this.fail(e));
    });
  },

  async setup() {
    const uid = this.uid, ref = this.db.ref('users/' + uid);
    let p = (await ref.get()).val();
    if (!p) {
      p = { name: CG.UI.localName(), code: await this.newCode(), best: CG.UI.localBest() };
      await ref.set(p);
    }
    this.profile = p;
    ref.on('value', (s) => { if (s.val()) { this.profile = s.val(); CG.UI.refreshFriends(); } });

    // presence: mark online now, and offline automatically when the connection drops
    this.db.ref('.info/connected').on('value', (s) => {
      if (!s.val()) return;
      ref.child('online').onDisconnect().set(false);
      ref.child('lastSeen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
      ref.child('online').set(true);
    });

    this.db.ref('requests/' + uid).on('value', (s) => { this.requests = s.val() || {}; CG.UI.refreshFriends(); });
    const watching = {};
    this.db.ref('friends/' + uid).on('value', (s) => {
      const ids = s.val() || {};
      for (const fid in watching) if (!ids[fid]) { watching[fid].off(); delete watching[fid]; delete this.friends[fid]; }
      for (const fid in ids) {
        if (watching[fid]) continue;
        watching[fid] = this.db.ref('users/' + fid);
        watching[fid].on('value', (fs) => { this.friends[fid] = fs.val() || { name: '?' }; CG.UI.refreshFriends(); });
      }
      CG.UI.refreshFriends();
    });

    this.state = 'ready';
    CG.UI.refreshFriends();
  },

  // a 6-character code nobody else has (no 0/O/1/I so it is easy to read out)
  async newCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let tries = 0; tries < 8; tries++) {
      let code = '';
      for (let i = 0; i < 6; i++) code += abc[Math.floor(Math.random() * abc.length)];
      const res = await this.db.ref('codes/' + code).transaction((cur) => (cur === null ? this.uid : undefined));
      if (res.committed) return code;
    }
    throw new Error('Could not make a friend code');
  },

  async setName(name) {
    name = name.trim().slice(0, 16);
    if (!name) throw new Error('Type a name first');
    await this.db.ref('users/' + this.uid + '/name').set(name);
    return name;
  },

  async sendRequest(code) {
    code = code.trim().toUpperCase();
    if (code.length !== 6) throw new Error('A friend code has 6 characters');
    const s = await this.db.ref('codes/' + code).get();
    if (!s.exists()) throw new Error('No player has that code');
    const to = s.val();
    if (to === this.uid) throw new Error('That is your own code');
    if (this.friends[to]) throw new Error('You are already friends');
    await this.db.ref('requests/' + to + '/' + this.uid).set({ name: this.profile.name, at: firebase.database.ServerValue.TIMESTAMP });
  },

  accept(from) {
    const up = {};
    up['friends/' + this.uid + '/' + from] = true;
    up['friends/' + from + '/' + this.uid] = true;
    up['requests/' + this.uid + '/' + from] = null;
    return this.db.ref().update(up);
  },
  decline(from) { return this.db.ref('requests/' + this.uid + '/' + from).remove(); },
  unfriend(fid) {
    const up = {};
    up['friends/' + this.uid + '/' + fid] = null;
    up['friends/' + fid + '/' + this.uid] = null;
    return this.db.ref().update(up);
  },

  submitScore(score) {
    if (this.state !== 'ready' || !this.profile || score <= (this.profile.best || 0)) return;
    this.db.ref('users/' + this.uid + '/best').set(score).catch(() => {});
  },

  // Anonymous accounts live in this browser only. Linking Google keeps the same account on any device.
  async linkGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await this.auth.currentUser.linkWithPopup(provider);
    } catch (e) {
      if (e.code === 'auth/credential-already-in-use' && e.credential) await this.auth.signInWithCredential(e.credential);
      else throw e;
    }
  },
};
