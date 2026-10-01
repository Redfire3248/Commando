// A stand-in for Firebase, for testing online play on one computer: open the game in two tabs of the same
// browser with ?fakedb (on the local dev server). The "database" is a JSON tree in localStorage that the tabs
// share; changes are announced to the other tabs through a BroadcastChannel. Only the small part of the
// Firebase API that net.js and online.js use is here. Never used by the real game.
(function () {
  const KEY = 'fakedb.tree', chan = new BroadcastChannel('fakedb');
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let tree = load();
  const listeners = new Set();
  const disconnect = [];
  const split = (p) => String(p).split('/').filter(Boolean);
  const getAt = (path) => split(path).reduce((n, k) => (n && typeof n === 'object' ? n[k] : undefined), tree);
  const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
  const stamp = (v) => {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      const o = Array.isArray(v) ? [] : {};
      for (const k in v) { const x = stamp(v[k]); if (x !== null && x !== undefined) o[k] = x; }
      return Object.keys(o).length ? o : null;
    }
    return v;
  };
  function setAt(path, value) {
    const keys = split(path);
    value = stamp(clone(value));
    if (!keys.length) { tree = value || {}; return; }
    let n = tree;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!n[keys[i]] || typeof n[keys[i]] !== 'object') n[keys[i]] = {};
      n = n[keys[i]];
    }
    const last = keys[keys.length - 1];
    if (value === null || value === undefined) delete n[last]; else n[last] = value;
    // tidy empty parents
    const prune = (node, ks) => {
      if (!ks.length || !node) return;
      prune(node[ks[0]], ks.slice(1));
      if (node[ks[0]] && typeof node[ks[0]] === 'object' && !Object.keys(node[ks[0]]).length) delete node[ks[0]];
    };
    prune(tree, keys.slice(0, -1));
  }
  function commit() {
    try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) { /* full */ }
    chan.postMessage(1);
    notify();
  }
  chan.onmessage = () => { tree = load(); notify(); };
  let pending = false;
  function notify() {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; listeners.forEach((l) => l.check()); }, 0);
  }

  class Snap {
    constructor(key, v, ref) { this.key = key; this.v = v === undefined ? null : v; this.ref = ref; }
    val() { return clone(this.v); }
    exists() { return this.v !== null && this.v !== undefined; }
  }

  let pushN = 0;
  class Ref {
    constructor(path, q) { this.path = split(path).join('/'); this.q = q || null; }
    get key() { const k = split(this.path); return k[k.length - 1] || null; }
    get ref() { return this; }
    child(p) { return new Ref(this.path + '/' + p); }
    value() {
      if (this.path === '.info/connected') return true;
      let v = clone(getAt(this.path));
      if (this.q && v && typeof v === 'object') {
        let keys = Object.keys(v);
        if (this.q.order) keys.sort((a, b) => ((v[a] || {})[this.q.order] || 0) - ((v[b] || {})[this.q.order] || 0));
        if (this.q.first) keys = keys.slice(0, this.q.first);
        if (this.q.last) keys = keys.slice(-this.q.last);
        const o = {};
        keys.forEach((k) => { o[k] = v[k]; });
        v = o;
      }
      return v;
    }
    orderByChild(k) { return new Ref(this.path, Object.assign({}, this.q, { order: k })); }
    limitToFirst(n) { return new Ref(this.path, Object.assign({}, this.q, { first: n })); }
    limitToLast(n) { return new Ref(this.path, Object.assign({}, this.q, { last: n })); }
    push(v) {
      const key = Date.now().toString(36) + (pushN++).toString(36) + Math.random().toString(36).slice(2, 7);
      const r = new Ref(this.path + '/' + key);
      if (v !== undefined) { const p = r.set(v); p.key = key; return p; }
      return r;
    }
    // re-read the shared tree first, so a write never undoes another tab's newer one
    set(v) { tree = load(); setAt(this.path, v); commit(); return Promise.resolve(); }
    update(o) { tree = load(); for (const k in o) setAt(this.path + '/' + k, o[k]); commit(); return Promise.resolve(); }
    remove() { return this.set(null); }
    get() { return Promise.resolve(new Snap(this.key, this.value())); }
    once(ev, cb) { const s = new Snap(this.key, this.value()); if (cb) cb(s); return Promise.resolve(s); }
    transaction(fn) {
      tree = load();
      const cur = clone(getAt(this.path)), next = fn(cur);
      if (next === undefined) return Promise.resolve({ committed: false, snapshot: new Snap(this.key, cur) });
      return this.set(next).then(() => ({ committed: true, snapshot: new Snap(this.key, next) }));
    }
    on(ev, cb) {
      const self = this, l = { ref: this, ev, cb, last: undefined, known: null };
      l.check = function () {
        const v = self.value();
        if (ev === 'value') {
          const j = JSON.stringify(v);
          if (j !== l.last) { l.last = j; cb(new Snap(self.key, v)); }
        } else if (ev === 'child_added') {
          const keys = v && typeof v === 'object' ? Object.keys(v) : [];
          if (!l.known) l.known = new Set();
          keys.forEach((k) => { if (!l.known.has(k)) { l.known.add(k); cb(new Snap(k, v[k], new Ref(self.path + '/' + k))); } });
        }
      };
      listeners.add(l);
      setTimeout(() => l.check(), 0);
      return cb;
    }
    off(ev, cb) { listeners.forEach((l) => { if (l.ref.path === this.path && (!ev || l.ev === ev) && (!cb || l.cb === cb)) listeners.delete(l); }); }
    onDisconnect() {
      const path = this.path;
      return {
        set: (v) => { disconnect.push([path, v]); return Promise.resolve(); },
        remove: () => { disconnect.push([path, null]); return Promise.resolve(); },
      };
    }
  }
  window.addEventListener('pagehide', () => { disconnect.forEach(([p, v]) => setAt(p, v)); try { localStorage.setItem(KEY, JSON.stringify(tree)); } catch (e) { /* */ } chan.postMessage(1); });

  const tab = Math.random().toString(36).slice(2, 8);
  const user = { uid: 'tester-' + tab, isAnonymous: true, displayName: 'Tester ' + tab.slice(0, 3).toUpperCase(), photoURL: null };
  const db = { ref: (p) => new Ref(p || '') };
  const auth = {
    onAuthStateChanged(cb) { setTimeout(() => cb(user), 50); },
    setPersistence: () => Promise.resolve(),
    getRedirectResult: () => Promise.resolve(null),
    signInAnonymously: () => Promise.resolve({ user }),
    signOut: () => Promise.resolve(),
  };
  window.firebase = {
    initializeApp() {},
    database: Object.assign(() => db, { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } } }),
    auth: Object.assign(() => auth, { Auth: { Persistence: { NONE: 'none' } }, GoogleAuthProvider: function () { this.setCustomParameters = () => {}; } }),
  };
  window.CG_FAKEDB = true;
})();
