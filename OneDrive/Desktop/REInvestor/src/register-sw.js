export function registerSW() {
  if ('serviceWorker' in navigator) {
    const base = window.__GH_BASE__ || '/';
    navigator.serviceWorker.register(base + 'sw.js').catch(console.error);
  }
}

let _deferredPrompt = null;
export function wireInstallButton(buttonEl) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    if (buttonEl) buttonEl.style.display = 'inline-flex';
  });

  buttonEl?.addEventListener('click', async () => {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    if (buttonEl) buttonEl.style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    if (buttonEl) buttonEl.style.display = 'none';
  });
}