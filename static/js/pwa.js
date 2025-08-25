// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/static/service-worker.js').catch(() => {});
  });
}

// Install Prompt (Android/Chromium)
let deferredPrompt = null;
const banner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const dismissBtn = document.getElementById('dismiss-install');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Don't show if already installed / standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) return;

  banner.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  banner.hidden = true;
});

dismissBtn?.addEventListener('click', () => {
  banner.hidden = true;
});
