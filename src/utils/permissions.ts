/**
 * Cross-platform permission helpers for Mythos (web / Capacitor / Tauri v2).
 *
 * Usage (short):
 *   import { getPlatform, requestPermission, checkPermission, pickDirectory } from './utils/permissions';
 *
 *   if ((await checkPermission('files')) !== 'granted') {
 *     const result = await requestPermission('files');
 *     if (result !== 'granted') return; // user denied / unsupported
 *   }
 *   const dir = await pickDirectory(); // web: File System Access, mobile: Filesystem, desktop: dialog
 *
 *   const notifications = await requestPermission('notifications');
 *
 * Notes:
 * - Detection is runtime, so the same bundle works on all three targets.
 * - Tauri grants filesystem access via `src-tauri/capabilities/default.json`, not a runtime prompt.
 * - Capacitor needs the permissions declared in `android/app/src/main/AndroidManifest.xml`.
 * - Web file access uses the File System Access API (Chromium); other browsers return 'unsupported'.
 */

export type Platform = 'web' | 'capacitor' | 'tauri';
export type PermissionName = 'files' | 'notifications';
export type PermissionResult = 'granted' | 'denied' | 'prompt' | 'unsupported';

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

let cachedPlatform: Platform | null = null;

/** Detect the active runtime once and cache the result. */
export function getPlatform(): Platform {
  if (cachedPlatform) return cachedPlatform;
  if (typeof window === 'undefined') {
    cachedPlatform = 'web';
    return cachedPlatform;
  }

  // Tauri v2 injects __TAURI_INTERNALS__; v1 used __TAURI_IPC__.
  if ('__TAURI_INTERNALS__' in window || '__TAURI_IPC__' in window) {
    cachedPlatform = 'tauri';
  } else {
    const capacitor = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor;
    const isNative = capacitor?.isNativePlatform?.() ?? false;
    cachedPlatform = isNative ? 'capacitor' : 'web';
  }
  return cachedPlatform;
}

export const isWeb = () => getPlatform() === 'web';
export const isCapacitor = () => getPlatform() === 'capacitor';
export const isTauri = () => getPlatform() === 'tauri';

function normalize(state: string | undefined): PermissionResult {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  if (state === 'prompt' || state === 'default' || state === 'prompt-with-rationale') return 'prompt';
  return 'unsupported';
}

/* ----------------------------- Files ----------------------------- */

async function checkFilesWeb(): Promise<PermissionResult> {
  if (typeof window === 'undefined') return 'unsupported';
  const w = window as Window & {
    showDirectoryPicker?: () => Promise<unknown>;
    showOpenFilePicker?: () => Promise<unknown>;
  };
  return typeof w.showDirectoryPicker === 'function' || typeof w.showOpenFilePicker === 'function'
    ? 'prompt'
    : 'unsupported';
}

async function requestFilesWeb(): Promise<PermissionResult> {
  if (typeof window === 'undefined') return 'unsupported';
  const w = window as Window & {
    showDirectoryPicker?: () => Promise<unknown>;
    showOpenFilePicker?: () => Promise<unknown>;
  };
  try {
    if (typeof w.showDirectoryPicker === 'function') {
      await w.showDirectoryPicker();
      return 'granted';
    }
    if (typeof w.showOpenFilePicker === 'function') {
      await w.showOpenFilePicker();
      return 'granted';
    }
  } catch {
    return 'denied';
  }
  return 'unsupported';
}

async function checkFilesCapacitor(): Promise<PermissionResult> {
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const status = await Filesystem.checkPermissions();
    return normalize(status.publicStorage);
  } catch {
    return 'unsupported';
  }
}

async function requestFilesCapacitor(): Promise<PermissionResult> {
  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    const status = await Filesystem.requestPermissions();
    return normalize(status.publicStorage);
  } catch {
    return 'unsupported';
  }
}

async function checkFilesTauri(): Promise<PermissionResult> {
  // Tauri file access is capability-driven; no OS prompt exists to check.
  try {
    const fs = await import('@tauri-apps/plugin-fs');
    return typeof fs.readTextFile === 'function' ? 'granted' : 'unsupported';
  } catch {
    return 'unsupported';
  }
}

async function requestFilesTauri(): Promise<PermissionResult> {
  return checkFilesTauri();
}

/* -------------------------- Notifications ------------------------- */

async function checkNotificationsWeb(): Promise<PermissionResult> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return normalize(Notification.permission);
}

async function requestNotificationsWeb(): Promise<PermissionResult> {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return normalize(await Notification.requestPermission());
  } catch {
    return 'denied';
  }
}

async function checkNotificationsCapacitor(): Promise<PermissionResult> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.checkPermissions();
    return normalize(status.display);
  } catch {
    return 'unsupported';
  }
}

async function requestNotificationsCapacitor(): Promise<PermissionResult> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const status = await LocalNotifications.requestPermissions();
    return normalize(status.display);
  } catch {
    return 'unsupported';
  }
}

async function checkNotificationsTauri(): Promise<PermissionResult> {
  try {
    const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
    return (await isPermissionGranted()) ? 'granted' : 'prompt';
  } catch {
    return 'unsupported';
  }
}

async function requestNotificationsTauri(): Promise<PermissionResult> {
  try {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    if (await isPermissionGranted()) return 'granted';
    return normalize(await requestPermission());
  } catch {
    return 'unsupported';
  }
}

/* ------------------------------ API ------------------------------- */

/** Check a permission without prompting. */
export async function checkPermission(name: PermissionName): Promise<PermissionResult> {
  const platform = getPlatform();
  if (name === 'notifications') {
    if (platform === 'tauri') return checkNotificationsTauri();
    if (platform === 'capacitor') return checkNotificationsCapacitor();
    return checkNotificationsWeb();
  }
  if (platform === 'tauri') return checkFilesTauri();
  if (platform === 'capacitor') return checkFilesCapacitor();
  return checkFilesWeb();
}

/** Ask for a permission. May trigger a native/OS dialog. */
export async function requestPermission(name: PermissionName): Promise<PermissionResult> {
  const platform = getPlatform();
  if (name === 'notifications') {
    if (platform === 'tauri') return requestNotificationsTauri();
    if (platform === 'capacitor') return requestNotificationsCapacitor();
    return requestNotificationsWeb();
  }
  if (platform === 'tauri') return requestFilesTauri();
  if (platform === 'capacitor') return requestFilesCapacitor();
  return requestFilesWeb();
}

/**
 * Let the user pick a folder, or return null if cancelled/unsupported.
 * Web: File System Access API. Capacitor: public storage path. Tauri: dialog plugin.
 */
export async function pickDirectory(): Promise<string | null> {
  const platform = getPlatform();
  if (platform === 'tauri') {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false });
      return typeof selected === 'string' ? selected : null;
    } catch {
      return null;
    }
  }
  if (platform === 'capacitor') {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const result = await Filesystem.readdir({ path: '', directory: Directory.Documents });
      return result.files.length ? 'Documents' : null;
    } catch {
      return null;
    }
  }
  try {
    const w = window as Window & { showDirectoryPicker?: () => Promise<{ name: string }> };
    if (typeof w.showDirectoryPicker !== 'function') return null;
    return (await w.showDirectoryPicker()).name;
  } catch {
    return null;
  }
}
