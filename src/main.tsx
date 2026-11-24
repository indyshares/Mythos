import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { isWeb } from './utils/permissions';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Native apps must never be controlled by a stale PWA service worker: it can
// serve an old index.html that references a removed JS chunk -> black screen.
if (!isWeb() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => void reg.unregister());
  }).catch(() => {});
}

if (isWeb()) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, reloading...');
    },
    onOfflineReady() {
      console.log('Mythos PWA ready to work offline');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Starting screen for web, Capacitor and Tauri — removed once React has mounted.
const splashStartedAt = Date.now();
const splash = document.getElementById('app-splash');
window.setTimeout(() => {
  if (!splash) return;
  splash.style.opacity = '0';
  window.setTimeout(() => splash.remove(), 250);
}, Math.max(0, 700 - (Date.now() - splashStartedAt)));

// If a module/script fails before React mounts, never leave a permanently dark screen.
function revealFatalError(message: string): void {
  splash?.remove();
  const root = document.getElementById('root');
  if (!root || root.childElementCount > 0) return;
  root.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = 'min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#090d16;color:#f4f4f5;font-family:system-ui,sans-serif;padding:24px';
  const card = document.createElement('div');
  card.style.cssText = 'max-width:420px;width:100%;border:1px solid #3f3f46;border-radius:16px;padding:24px;background:#18181b';
  const title = document.createElement('h1');
  title.textContent = 'Mythos failed to start';
  const detail = document.createElement('pre');
  detail.style.cssText = 'white-space:pre-wrap;word-break:break-word;color:#fca5a5;font-size:12px';
  detail.textContent = message;
  const btn = document.createElement('button');
  btn.textContent = 'Reload';
  btn.style.cssText = 'margin-top:16px;padding:10px 18px;border-radius:10px;background:#0ea5e9;color:#fff;border:0;font-weight:700;cursor:pointer';
  btn.onclick = () => window.location.reload();
  card.append(title, detail, btn);
  box.appendChild(card);
  root.appendChild(box);
}
window.addEventListener('error', (e) => revealFatalError(e.message || 'Unknown startup error'));
window.addEventListener('unhandledrejection', (e) =>
  revealFatalError(String((e.reason as { message?: string })?.message || e.reason))
);

