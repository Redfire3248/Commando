// Online layer (Firebase): Google accounts, friends, party invites, parties, the queue and who is online.
// The match itself (moving players, enemies, shots) is in online.js. Does nothing until firebase-config.js has
// real keys. Realtime Database layout:
//   users/{uid}             { name, username, photo, code, best, coins, owned: { item: true }, online, lastSeen, party }
//   usernames/{lowercase}   uid                         callsigns are unique
//   shop/items/{id}         { name, desc, price, kind, effect, icon, order, off }   (only the admin can change it)
//   codes/{CODE}            uid                         friend code -> player
//   requests/{to}/{from}    { name, at }                pending friend requests
//   friends/{uid}/{fid}     true                        written on both sides when a request is accepted
//   invites/{to}/{party}    { from, name, at }          "come and join my party"
//   parties/{pid}           { leader, state: lobby | queue | match, match, bots, members: { uid: { name, agent, at } } }
//   queue/{pid}             { size, leader, at }        parties looking for more players
//   matches/{mid}/...       see online.js
CG.Net = {
  state: 'off',            // off | loading | signedout | ready | error
  error: '',
  uid: null, profile: null, requests: {}, friends: {}, invites: {},
  partyId: null, party: null,
  VERSION: '10.12.2',
  MAX: 5,
  ADMIN_EMAILS: ['redjai1981@gmail.com'],

  // the admin panel is only for the owner's Google account (and for test players on a local dev server)
  get isAdmin() {
    if (this.devGuest && /[?&]fakedb/.test(location.search)) return true;
    const u = this.user;
    return !!(u && !u.isAnonymous && u.email && this.ADMIN_EMAILS.includes(u.email.toLowerCase()) && u.emailVerified !== false);
  },
  get needsUsername() { return this.online && this.profile && !this.profile.username; },

  init() {
    const cfg = window.CG_FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf('PASTE') === 0) return;
    this.state = 'loading';
    // local testing without Firebase: two tabs on the dev server with ?fakedb play against each other
    if (this.devGuest && /[?&]fakedb/.test(location.search)) {
      const s = document.createElement('script');
      s.src = 'src/fakedb.js'; s.onload = () => this.start(cfg);
      document.head.appendChild(s);
      return;
    }
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
    CG.UI.netChanged();
  },

  get online() { return this.state === 'ready'; },
  // test accounts on a local dev server: open the game with ?guest (each browser tab can use ?guest=2, ...)
  get devGuest() { return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]guest/.test(location.search); },

  start(cfg) {
    firebase.initializeApp(cfg);
    this.db = firebase.database();
    this.auth = firebase.auth();
    if (this.devGuest) this.auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(() => {});
    this.auth.getRedirectResult().catch((e) => { CG.UI.loginMessage(e.message); });
    this.auth.onAuthStateChanged((u) => {
      if (!u) {
        if (this.devGuest) { this.auth.signInAnonymously().catch((e) => this.fail(e)); return; }
        this.stopWatching();
        this.uid = null; this.profile = null; this.state = 'signedout';
        CG.UI.netChanged();
        return;
      }
      // accounts are Google accounts; an old anonymous sign-in from an earlier version is signed out
      if (u.isAnonymous && !this.devGuest) { this.auth.signOut(); return; }
      this.user = u;
      this.uid = u.uid;
      this.setup().catch((e) => this.fail(e));
    });
  },

  async signInGoogle() {
    if (!this.auth) throw new Error(this.state === 'error' ? 'Could not reach the server: ' + this.error : 'Online features are not set up');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await this.auth.signInWithPopup(provider);
    } catch (e) {
      // phones and some browsers block popups: go to Google and come back
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') await this.auth.signInWithRedirect(provider);
      else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
    }
  },

  async signOut() {
    try { await this.leaveParty(); } catch (e) { /* already gone */ }
    if (this.uid) await this.db.ref('users/' + this.uid + '/online').set(false).catch(() => {});
    await this.auth.signOut();
  },

  watching: [],
  watch(ref, ev, fn) { ref.on(ev, fn); this.watching.push(() => ref.off(ev, fn)); return ref; },
  stopWatching() { this.watching.forEach((f) => f()); this.watching = []; this.friendRefs = {}; this.friends = {}; this.requests = {}; this.invites = {}; },

  async setup() {
    this.stopWatching();
    const uid = this.uid, ref = this.db.ref('users/' + uid), u = this.user;
    let p = (await ref.get()).val();
    const gname = (u.displayName || '').split(' ')[0].slice(0, 16);
    if (!p || !p.code) {
      p = Object.assign({ name: gname || CG.UI.localName(), best: CG.UI.localBest(), coins: 0 }, p || {}, { code: await this.newCode() });
      if (u.photoURL) p.photo = u.photoURL;
      await ref.update(p);
    } else if (u.photoURL && p.photo !== u.photoURL) {
      await ref.child('photo').set(u.photoURL);
    }
    this.profile = p;
    this.watch(ref, 'value', (s) => { if (s.val()) { this.profile = s.val(); CG.UI.netChanged(); } });

    // presence: online now, offline (and out of any party) automatically when the connection drops
    this.watch(this.db.ref('.info/connected'), 'value', (s) => {
      if (!s.val()) return;
      ref.child('online').onDisconnect().set(false);
      ref.child('lastSeen').onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
      ref.child('online').set(true);
      if (this.partyId) this.db.ref('parties/' + this.partyId + '/members/' + uid).onDisconnect().remove();
    });

    this.watch(this.db.ref('requests/' + uid), 'value', (s) => { this.requests = s.val() || {}; CG.UI.netChanged(); });
    this.watch(this.db.ref('shop/items'), 'value', (s) => { CG.Shop.db = s.val(); CG.UI.netChanged(); });
    this.watch(this.db.ref('invites/' + uid), 'value', (s) => {
      const before = Object.keys(this.invites);
      this.invites = s.val() || {};
      for (const pid in this.invites) if (!before.includes(pid)) CG.UI.toast(this.invites[pid].name + ' invited you to their party');
      CG.UI.netChanged();
    });
    this.friendRefs = {};
    this.watch(this.db.ref('friends/' + uid), 'value', (s) => {
      const ids = s.val() || {};
      for (const fid in this.friendRefs) if (!ids[fid]) { this.friendRefs[fid](); delete this.friendRefs[fid]; delete this.friends[fid]; }
      for (const fid in ids) {
        if (this.friendRefs[fid]) continue;
        const r = this.db.ref('users/' + fid), fn = (fs) => { this.friends[fid] = fs.val() || { name: '?' }; CG.UI.netChanged(); };
        r.on('value', fn);
        this.friendRefs[fid] = () => r.off('value', fn);
        this.watching.push(() => r.off('value', fn));
      }
      CG.UI.netChanged();
    });

    this.state = 'ready';
    CG.UI.netChanged();
    // back into the party we were in (if it still exists)
    if (p.party) {
      const ps = await this.db.ref('parties/' + p.party).get();
      if (ps.exists() && ps.val().members && ps.val().members[uid]) this.watchParty(p.party);
      else ref.child('party').remove();
    }
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

  // a callsign: 3-16 letters, numbers or _, nobody else may have it (case does not matter)
  async claimUsername(name) {
    name = (name || '').trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw new Error('Use 3 to 16 letters, numbers or _');
    const key = name.toLowerCase(), old = this.profile && this.profile.username;
    if (old && old.toLowerCase() === key) {                // only the capitals changed
      await this.db.ref('users/' + this.uid).update({ username: name, name });
      Object.assign(this.profile, { username: name, name });
      return name;
    }
    const res = await this.db.ref('usernames/' + key).transaction((cur) => (cur === null || cur === this.uid ? this.uid : undefined));
    if (!res.committed) throw new Error('That callsign is taken');
    await this.db.ref('users/' + this.uid).update({ username: name, name });
    if (old) await this.db.ref('usernames/' + old.toLowerCase()).remove().catch(() => {});
    Object.assign(this.profile, { username: name, name });          // the listener catches up a moment later
    if (this.partyId) await this.db.ref('parties/' + this.partyId + '/members/' + this.uid + '/name').set(name).catch(() => {});
    return name;
  },

  // ---------------------------------------------------------------- coins and the shop
  async addCoins(n) {
    if (!this.online || !n) return;
    await this.db.ref('users/' + this.uid + '/coins').transaction((c) => (c || 0) + n);
  },
  async buy(item) {
    if (!this.online) throw new Error('Sign in first');
    let why = '';
    const res = await this.db.ref('users/' + this.uid).transaction((u) => {
      if (!u) return u;
      u.owned = u.owned || {};
      if (u.owned[item.id]) { why = 'You already have it'; return undefined; }
      if ((u.coins || 0) < item.price) { why = 'Not enough coins'; return undefined; }
      u.coins = (u.coins || 0) - item.price;
      u.owned[item.id] = true;
      return u;
    });
    if (!res.committed) throw new Error(why || 'Could not buy that');
  },

  // ---------------------------------------------------------------- admin tools (the database rules check the email too)
  adminSetItem(id, data) { return this.db.ref('shop/items/' + id).set(data); },
  adminRemoveItem(id) { return this.db.ref('shop/items/' + id).remove(); },
  adminResetShop() { return this.db.ref('shop/items').set(CG.Shop.DEFAULTS); },
  async adminGiveCoins(uid, n) { await this.db.ref('users/' + uid + '/coins').transaction((c) => Math.max(0, (c || 0) + n)); },
  async adminUsers() { return (await this.db.ref('users').get()).val() || {}; },

  // ---------------------------------------------------------------- friends
  // who has this friend code or callsign? (uid or null)
  async findPlayer(text) {
    text = (text || '').trim();
    if (!text) return null;
    if (text.length === 6) {
      const s = await this.db.ref('codes/' + text.toUpperCase()).get();
      if (s.exists()) return s.val();
    }
    const s = await this.db.ref('usernames/' + text.toLowerCase()).get();
    return s.exists() ? s.val() : null;
  },

  async sendRequest(text) {
    const to = await this.findPlayer(text);
    if (!to) throw new Error('No player has that code or callsign');
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
    if (!this.online || !this.profile || score <= (this.profile.best || 0)) return;
    this.db.ref('users/' + this.uid + '/best').set(score).catch(() => {});
  },

  // ---------------------------------------------------------------- party
  get isLeader() { return !!(this.party && this.party.leader === this.uid); },
  partySize(p) { p = p || this.party; return p ? Object.keys(p.members || {}).length + (p.bots || []).length : 0; },

  me() { return { name: this.profile.username || this.profile.name, agent: CG.UI.myAgent(), at: firebase.database.ServerValue.TIMESTAMP }; },

  async createParty() {
    if (this.partyId) return this.partyId;
    const ref = this.db.ref('parties').push();
    await ref.set({ leader: this.uid, state: 'lobby', members: { [this.uid]: this.me() } });
    await this.db.ref('users/' + this.uid + '/party').set(ref.key);
    this.watchParty(ref.key);
    return ref.key;
  },

  watchParty(pid) {
    if (this.partyRef) this.partyRef.off();
    this.partyId = pid;
    const memberRef = this.db.ref('parties/' + pid + '/members/' + this.uid);
    memberRef.onDisconnect().remove();
    this.partyRef = this.db.ref('parties/' + pid);
    this.partyRef.on('value', (s) => {
      const p = s.val();
      if (!p || !p.members || !p.members[this.uid]) { this.dropParty(); return; }
      // the leader left: the longest-standing member takes over
      if (!p.members[p.leader]) {
        const next = Object.keys(p.members).sort((a, b) => (p.members[a].at || 0) - (p.members[b].at || 0))[0];
        if (next === this.uid) this.partyRef.child('leader').set(this.uid);
      }
      const was = this.party;
      this.party = p;
      if (p.state === 'match' && p.match && (!was || was.match !== p.match)) CG.Online.join(p.match);
      if (this.isLeader && p.state === 'queue') CG.Queue.watch();
      CG.UI.netChanged();
    });
  },

  dropParty() {
    if (this.partyRef) this.partyRef.off();
    this.partyRef = null; this.partyId = null; this.party = null;
    CG.Queue.stop();
    if (this.uid) this.db.ref('users/' + this.uid + '/party').remove().catch(() => {});
    CG.UI.netChanged();
  },

  async invite(fid) {
    const pid = await this.createParty();
    if (this.partySize() >= this.MAX) throw new Error('The party is full');
    await this.db.ref('invites/' + fid + '/' + pid).set({ from: this.uid, name: this.profile.name, at: firebase.database.ServerValue.TIMESTAMP });
  },

  async acceptInvite(pid) {
    await this.db.ref('invites/' + this.uid + '/' + pid).remove();
    const s = await this.db.ref('parties/' + pid).get();
    if (!s.exists()) throw new Error('That party has broken up');
    if (this.partySize(s.val()) >= this.MAX) throw new Error('That party is full');
    if (this.partyId && this.partyId !== pid) await this.leaveParty();
    await this.db.ref('parties/' + pid + '/members/' + this.uid).set(this.me());
    await this.db.ref('users/' + this.uid + '/party').set(pid);
    this.watchParty(pid);
  },
  declineInvite(pid) { return this.db.ref('invites/' + this.uid + '/' + pid).remove(); },

  async leaveParty() {
    const pid = this.partyId, p = this.party;
    if (!pid) return;
    await CG.Queue.cancel();
    const others = Object.keys((p && p.members) || {}).filter((u) => u !== this.uid);
    if (!others.length) await this.db.ref('parties/' + pid).remove();
    else {
      const up = {};
      up['members/' + this.uid] = null;
      if (p.leader === this.uid) up.leader = others[0];
      await this.db.ref('parties/' + pid).update(up);
    }
    this.dropParty();
  },

  setAgent(id) {
    if (this.partyId) this.db.ref('parties/' + this.partyId + '/members/' + this.uid + '/agent').set(id).catch(() => {});
  },
  setBots(list) {
    if (this.partyId && this.isLeader) return this.db.ref('parties/' + this.partyId + '/bots').set(list.length ? list : null);
  },

  // the leader starts a match for the party (and any parties the queue matched it with)
  async startMatch(pids) {
    pids = pids || [this.partyId];
    const players = [];
    let botN = 0;
    for (const pid of pids) {
      const p = pid === this.partyId ? this.party : (await this.db.ref('parties/' + pid).get()).val();
      if (!p) continue;
      Object.keys(p.members || {}).sort((a, b) => (p.members[a].at || 0) - (p.members[b].at || 0)).forEach((uid) => {
        players.push({ id: uid, owner: uid, name: p.members[uid].name, agent: p.members[uid].agent || 'razor' });
      });
      (p.bots || []).forEach((agent) => { botN++; players.push({ id: 'bot' + botN, owner: this.uid, name: 'BOT ' + botN, agent, bot: true }); });
    }
    const ref = this.db.ref('matches').push();
    await ref.child('info').set({ host: this.uid, players: players.slice(0, this.MAX), parties: pids, at: firebase.database.ServerValue.TIMESTAMP });
    const up = {};
    pids.forEach((pid) => { up['parties/' + pid + '/state'] = 'match'; up['parties/' + pid + '/match'] = ref.key; up['queue/' + pid] = null; });
    await this.db.ref().update(up);
    return ref.key;
  },

  // after a match: the party is back in its lobby
  backToLobby() {
    if (!this.partyId) return;
    const up = { state: 'lobby', match: null };
    this.db.ref('parties/' + this.partyId).update(up).catch(() => {});
  },
};

// ---------------------------------------------------------------- matchmaking queue
// Party leaders who press FIND PLAYERS add their party to queue/. The leader whose party has waited longest
// gathers the oldest parties that fit in one team of five and starts the match for all of them. Nobody else
// after 30 seconds: the party starts on its own (bots fill in if the leader added some).
CG.Queue = {
  ref: null, since: 0, timer: null,

  async join() {
    const N = CG.Net;
    if (!N.isLeader) throw new Error('Only the party leader can queue');
    await N.db.ref('queue/' + N.partyId).set({ size: N.partySize(), leader: N.uid, at: firebase.database.ServerValue.TIMESTAMP });
    await N.db.ref('parties/' + N.partyId + '/state').set('queue');
    this.watch();
  },

  watch() {
    if (this.ref) return;
    const N = CG.Net;
    this.since = Date.now();
    this.ref = N.db.ref('queue').orderByChild('at').limitToFirst(20);
    this.ref.on('value', (s) => this.check(s.val() || {}));
    this.timer = setInterval(() => this.ref && this.ref.once('value', (s) => this.check(s.val() || {})), 3000);
  },

  async check(q) {
    const N = CG.Net, mine = N.partyId;
    if (!mine || !q[mine] || this.busy) return;
    const order = Object.keys(q).sort((a, b) => (q[a].at || 0) - (q[b].at || 0));
    if (order[0] !== mine) return;                   // an older party gathers the team
    let size = 0;
    const pick = [];
    for (const pid of order) if (size + (q[pid].size || 1) <= N.MAX) { pick.push(pid); size += q[pid].size || 1; }
    const waited = Date.now() - this.since;
    if (pick.length > 1 || size >= N.MAX || waited > 30000) {
      this.busy = true;
      try { await N.startMatch(pick); } finally { this.busy = false; this.stop(); }
    }
  },

  async cancel() {
    const N = CG.Net;
    this.stop();
    if (N.partyId && N.party && N.party.state === 'queue') {
      await N.db.ref('queue/' + N.partyId).remove().catch(() => {});
      await N.db.ref('parties/' + N.partyId + '/state').set('lobby').catch(() => {});
    }
  },

  stop() {
    if (this.ref) this.ref.off();
    this.ref = null;
    clearInterval(this.timer);
  },
};
