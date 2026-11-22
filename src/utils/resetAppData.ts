/**
 * Clears Mythos data stored in the browser (PWA / Capacitor WebView / Tauri webview).
 *
 * Usage:
 *   import { clearLocalAppData } from './utils/resetAppData';
 *   await clearLocalAppData();          // clears storage and reloads
 *   await clearLocalAppData(false);     // clears storage without reload
 *
 * Server-side JSON storage (mythos_storage.json, data/chat_history.json) is not
 * touched — reset those files separately in the repository.
 */

const MYTHOS_PREFIX = 'mythos_';
const IDB_STORE = 'keyval-store'; // idb-keyval default database

export async function clearLocalAppData(reload = true): Promise<void> {
  if (typeof window === 'undefined') return;

  // All Mythos localStorage keys (workspaces, files, sessions, providers, theme, ...)
  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(MYTHOS_PREFIX));
  keys.forEach((key) => window.localStorage.removeItem(key));

  // idb-keyval holds API keys and DB config under the `mythos_secure_` prefix.
  if ('indexedDB' in window) {
    await new Promise<void>((resolve) => {
      const request = window.indexedDB.deleteDatabase(IDB_STORE);
      request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
  }

  // Workbox / PWA precache (so a stale cached bundle does not restore old state).
  if ('caches' in window) {
    const names = await window.caches.keys();
    await Promise.all(
      names
        .filter((name) => name.includes('workbox') || name.includes('mythos'))
        .map((name) => window.caches.delete(name))
    );
  }

  if (reload) window.location.reload();
}
