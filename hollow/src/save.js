// Local save. Open the game with ?reset in the URL to wipe it.
GH.Save = {
  KEY: 'gunhollow.save.v1',
  load() {
    try {
      if (/[?&]reset\b/.test(location.search)) localStorage.removeItem(this.KEY);
      return JSON.parse(localStorage.getItem(this.KEY)) || null;
    } catch (e) { return null; }
  },
  write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  },
};
