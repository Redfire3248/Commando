// "Install App" button + offline support.
// Chrome only offers installation when the game is served from http://localhost or https:// (not file://).
(function () {
  const installBtn = document.getElementById('install-btn');
  const fsBtn = document.getElementById('fs-btn');
  let deferred = null;

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // keep Chrome's mini-bar away; we show our own button
    deferred = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    installBtn.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));

  // Fullscreen (and lock to landscape on phones where the browser allows it)
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    const el = document.documentElement;
    if (!el.requestFullscreen) return;
    el.requestFullscreen().then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => {});
  });
  fsBtn.addEventListener('keydown', (e) => e.preventDefault());   // Space must not re-trigger it mid-game
  installBtn.addEventListener('keydown', (e) => e.preventDefault());
})();
