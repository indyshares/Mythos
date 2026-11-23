import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, reloading...');
  },
  onOfflineReady() {
    console.log('Mythos PWA ready to work offline');
  },
});

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

