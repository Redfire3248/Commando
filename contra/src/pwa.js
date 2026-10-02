// The INSTALL APP buttons (home screen top bar, sign-in card) and the service worker that makes the game installable.
// Chrome / Edge / Android hand us their install prompt; iPhones and other browsers get told how to add it themselves.
// The buttons are hidden when the game is already running as an installed app.
(function () {
  const btns = () => document.querySelectorAll('.install-btn');
  const standalone = () => (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches))
    || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;
  const showButtons = (on) => btns().forEach((b) => b.classList.toggle('hidden', !on));

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    // the page's base is contra/, the worker sits one folder up (the site root) so it covers the page
    navigator.serviceWorker.register(new URL('../sw.js', document.baseURI).href).catch(() => {});
  }
  showButtons(!standalone());

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // no browser mini-bar: our own button asks
    deferred = e;
    showButtons(true);
  });
  window.addEventListener('appinstalled', () => { deferred = null; showButtons(false); CG.UI.toast('COMMANDO installed — open it from your home screen'); });

  document.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-act="install"]')) return;
    if (deferred) {
      deferred.prompt();
      const r = await deferred.userChoice;
      deferred = null;
      if (r && r.outcome === 'accepted') showButtons(false);
      return;
    }
    CG.UI.toast(ios ? 'Tap the Share button, then "Add to Home Screen"'
      : 'Open the browser menu (⋮) and choose "Install COMMANDO" or "Add to Home screen"');
  });
})();
