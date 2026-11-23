/**
 * Native Markdown storage for Tauri (desktop) and Capacitor (Android).
 *
 * Layout under Documents/Mythos:
 *   <workspace name>/<folder>/<note>.md
 *   <workspace name>/.trash/<original path>   (soft-deleted items)
 *
 * Workspace content is real folders and real .md files. Metadata that is not
 * document content (icons, sessions, templates, keys) remains in app state.
 */
import type { Workspace, Folder, FileItem, FrontmatterProperties } from '../../types';
import { getPlatform } from '../permissions';
import { parseMarkdown } from '../markdownParser';

const ROOT_NAME = 'Mythos';
const TRASH = '.trash';
const ROOT_STORAGE_KEY = 'mythos_native_root';

export type StorageRoot = {
  /** Android base directory; ignored on desktop. */
  directory: 'documents' | 'externalstorage' | 'data';
  /** Absolute path on desktop, relative path under the base directory on Android. */
  path: string;
  label: string;
};

export type NativeTree = {
  workspaces: Workspace[];
  folders: Folder[];
  files: FileItem[];
};

type Entry = { name: string; isDirectory: boolean; isFile: boolean };

const DEFAULT_ROOT: StorageRoot = {
  directory: 'documents',
  path: ROOT_NAME,
  label: `Documents/${ROOT_NAME}`,
};

let cachedBase: string | null = null;
let rootOverride: StorageRoot | null = null;

export function getStorageRoot(): StorageRoot {
  if (rootOverride) return rootOverride;
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(ROOT_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as StorageRoot;
    } catch {
      // ignore malformed setting
    }
  }
  return DEFAULT_ROOT;
}

/** Persist a chosen storage root and clear cached paths. */
export function setStorageRoot(root: StorageRoot | null): void {
  rootOverride = root;
  cachedBase = null;
  if (typeof localStorage === 'undefined') return;
  if (root) localStorage.setItem(ROOT_STORAGE_KEY, JSON.stringify(root));
  else localStorage.removeItem(ROOT_STORAGE_KEY);
}

/** Desktop: ask the user for a folder. Android uses the in-app location picker. */
export async function chooseDesktopRoot(): Promise<StorageRoot | null> {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Choose Mythos storage folder',
  });
  if (typeof selected !== 'string') return null;
  return { directory: 'documents', path: selected, label: selected };
}

function isTauri(): boolean {
  return getPlatform() === 'tauri';
}

async function baseDir(): Promise<string> {
  if (cachedBase) return cachedBase;
  const root = getStorageRoot();
  if (isTauri()) {
    if (root.path && root.path !== ROOT_NAME) {
      cachedBase = root.path; // user-chosen absolute folder
    } else {
      const { documentDir, join } = await import('@tauri-apps/api/path');
      cachedBase = await join(await documentDir(), ROOT_NAME);
    }
  } else {
    cachedBase = root.path || ROOT_NAME;
  }
  return cachedBase;
}

async function fullPath(rel: string): Promise<string> {
  if (isTauri()) {
    const { join } = await import('@tauri-apps/api/path');
    return join(await baseDir(), rel);
  }
  const root = getStorageRoot().path || ROOT_NAME;
  return rel ? `${root}/${rel}` : root;
}

function capacitorDir() {
  // Dynamic import avoids loading the native plugins in the web bundle.
  return import('@capacitor/filesystem');
}

async function capacitorFs() {
  const mod = await capacitorDir();
  const root = getStorageRoot();
  const Directory =
    root.directory === 'externalstorage'
      ? mod.Directory.ExternalStorage
      : root.directory === 'data'
        ? mod.Directory.Data
        : mod.Directory.Documents;
  return { ...mod, Directory };
}

export function sanitizeName(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
      .replace(/^\.+/, '')
      .trim() || 'untitled'
  );
}

async function mkdirRel(rel: string): Promise<void> {
  if (isTauri()) {
    const { mkdir } = await import('@tauri-apps/plugin-fs');
    await mkdir(await fullPath(rel), { recursive: true });
  } else {
    const { Filesystem, Directory } = await capacitorFs();
    await Filesystem.mkdir({ path: await fullPath(rel), directory: Directory, recursive: true });
  }
}

async function readDirRel(rel: string): Promise<Entry[]> {
  if (isTauri()) {
    const { readDir } = await import('@tauri-apps/plugin-fs');
    const entries = await readDir(await fullPath(rel));
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory,
      isFile: e.isFile,
    }));
  }
  const { Filesystem, Directory } = await capacitorFs();
  const result = await Filesystem.readdir({ path: await fullPath(rel), directory: Directory });
  return result.files.map((f) => ({
    name: f.name,
    isDirectory: f.type === 'directory',
    isFile: f.type === 'file',
  }));
}

async function readTextRel(rel: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return readTextFile(await fullPath(rel));
  }
  const { Filesystem, Directory, Encoding } = await capacitorFs();
  const result = await Filesystem.readFile({
    path: await fullPath(rel),
    directory: Directory,
    encoding: Encoding.UTF8,
  });
  return String(result.data);
}

async function writeTextRel(rel: string, content: string): Promise<void> {
  const parent = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  if (parent) await mkdirRel(parent);
  if (isTauri()) {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    await writeTextFile(await fullPath(rel), content);
  } else {
    const { Filesystem, Directory, Encoding } = await capacitorFs();
    await Filesystem.writeFile({
      path: await fullPath(rel),
      directory: Directory,
      data: content,
      encoding: Encoding.UTF8,
    });
  }
}

async function removeRel(rel: string): Promise<void> {
  if (isTauri()) {
    const { remove } = await import('@tauri-apps/plugin-fs');
    await remove(await fullPath(rel), { recursive: true });
  } else {
    const { Filesystem, Directory } = await capacitorFs();
    await Filesystem.deleteFile({ path: await fullPath(rel), directory: Directory });
  }
}

/** Create root on first launch and request file permission on Android. */
export async function ensureNativeRoot(): Promise<void> {
  await mkdirRel('');
  if (!isTauri()) {
    const { Filesystem } = await capacitorDir();
    try {
      await Filesystem.requestPermissions();
    } catch {
      // Permission may already be granted.
    }
    await mkdirRel('');
  }
}

/* ------------------------------- Read -------------------------------- */

async function walk(rel: string, out: string[]): Promise<void> {
  let entries: Entry[];
  try {
    entries = await readDirRel(rel);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory) {
      out.push(child);
      await walk(child, out);
    } else if (entry.isFile && entry.name.toLowerCase().endsWith('.md')) {
      out.push(child);
    }
  }
}

/** Build workspace/folder/file state from the real directory tree. */
export async function readNativeTree(existingWorkspaces: Workspace[] = []): Promise<NativeTree> {
  await ensureNativeRoot();
  const workspaces: Workspace[] = [];
  const folders: Folder[] = [];
  const files: FileItem[] = [];
  const now = new Date().toISOString();

  let roots: Entry[] = [];
  try {
    roots = await readDirRel('');
  } catch {
    return { workspaces, folders, files };
  }

  for (const rootEntry of roots) {
    if (!rootEntry.isDirectory || rootEntry.name.startsWith('.')) continue;
    const wsRel = rootEntry.name;
    const previous = existingWorkspaces.find((w) => w.name === rootEntry.name);
    const wsId = previous?.id || sanitizeName(rootEntry.name);
    workspaces.push(
      previous || {
        id: wsId,
        name: rootEntry.name,
        description: '',
        icon: 'Folder',
        createdAt: now,
        updatedAt: now,
      }
    );

    const paths: string[] = [];
    await walk(wsRel, paths);
    const dirs = new Set<string>();
    for (const p of paths) {
      const parts = p.split('/');
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
    }

    for (const dirRel of dirs) {
      const parentRel = dirRel.includes('/') ? dirRel.slice(0, dirRel.lastIndexOf('/')) : '';
      folders.push({
        id: `f:${wsId}:${dirRel}`,
        workspaceId: wsId,
        parentId: parentRel ? `f:${wsId}:${parentRel}` : null,
        name: dirRel.split('/').pop() || dirRel,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const fileRel of paths) {
      if (dirs.has(fileRel)) continue;
      const parentRel = fileRel.includes('/') ? fileRel.slice(0, fileRel.lastIndexOf('/')) : '';
      const name = fileRel.split('/').pop() || fileRel;
      let content = '';
      try {
        content = await readTextRel(fileRel);
      } catch {
        continue;
      }
      const parsed = parseMarkdown(content);
      const frontmatter = parsed.frontmatter as FrontmatterProperties;
      files.push({
        id: `file:${wsId}:${fileRel}`,
        workspaceId: wsId,
        parentId: parentRel ? `f:${wsId}:${parentRel}` : null,
        name,
        extension: '.md',
        content,
        size: content.length,
        version: 1,
        createdAt: frontmatter.created_at || now,
        updatedAt: frontmatter.updated_at || now,
        frontmatter,
      });
    }

    // Soft-deleted items live under .trash/<original path> and come back with deletedAt.
    const trashedPaths: string[] = [];
    await walk(`${wsRel}/${TRASH}`, trashedPaths);
    const trashPrefix = `${wsRel}/${TRASH}/`;
    const trashedDirs = new Set<string>();
    for (const p of trashedPaths) {
      const originalRel = p.startsWith(trashPrefix) ? p.slice(trashPrefix.length) : p;
      const parts = originalRel.split('/');
      for (let i = 1; i < parts.length; i++) trashedDirs.add(parts.slice(0, i).join('/'));
    }
    for (const dirRel of trashedDirs) {
      const parentRel = dirRel.includes('/') ? dirRel.slice(0, dirRel.lastIndexOf('/')) : '';
      folders.push({
        id: `f:${wsId}:.trash/${dirRel}`,
        workspaceId: wsId,
        parentId: parentRel ? `f:${wsId}:.trash/${parentRel}` : null,
        name: dirRel.split('/').pop() || dirRel,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      });
    }
    for (const p of trashedPaths) {
      const originalRel = p.startsWith(trashPrefix) ? p.slice(trashPrefix.length) : p;
      if (trashedDirs.has(originalRel)) continue;
      const parentRel = originalRel.includes('/') ? originalRel.slice(0, originalRel.lastIndexOf('/')) : '';
      const name = originalRel.split('/').pop() || originalRel;
      let content = '';
      try {
        content = await readTextRel(p);
      } catch {
        continue;
      }
      const parsed = parseMarkdown(content);
      const frontmatter = parsed.frontmatter as FrontmatterProperties;
      files.push({
        id: `file:${wsId}:.trash/${originalRel}`,
        workspaceId: wsId,
        parentId: parentRel ? `f:${wsId}:.trash/${parentRel}` : null,
        name,
        extension: '.md',
        content,
        size: content.length,
        version: 1,
        createdAt: frontmatter.created_at || now,
        updatedAt: frontmatter.updated_at || now,
        deletedAt: now,
        frontmatter,
      });
    }
  }

  return { workspaces, folders, files };
}

/* ------------------------------- Write ------------------------------- */

function folderPath(wsName: string, folderId: string | null, folders: Folder[]): string {
  if (!folderId) return '';
  const byId = new Map(folders.map((f) => [f.id, f]));
  const parts: string[] = [];
  let current = byId.get(folderId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    parts.unshift(sanitizeName(current.name));
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts.join('/');
}

/**
 * Reconcile disk with in-memory state. Active items are written to their real
 * paths; soft-deleted items go under `.trash/`; stale .md files are removed.
 */
export async function writeNativeTree(tree: NativeTree): Promise<void> {
  await ensureNativeRoot();
  const workspaceNames = new Map(tree.workspaces.map((w) => [w.id, sanitizeName(w.name)]));
  const desiredFiles = new Set<string>();
  const desiredDirs = new Set<string>();

  for (const ws of tree.workspaces) {
    const wsRel = workspaceNames.get(ws.id)!;
    desiredDirs.add(wsRel);
  }

  const fileWsName = (file: FileItem) => workspaceNames.get(file.workspaceId);
  const folderWsName = (folder: Folder) => workspaceNames.get(folder.workspaceId);

  for (const folder of tree.folders) {
    const wsRel = folderWsName(folder);
    if (!wsRel) continue;
    const rel = folderPath(folder.workspaceId, folder.id, tree.folders);
    if (!rel) continue;
    const cleanRel = rel.replace(new RegExp(`^${TRASH}/`), '');
    const target = folder.deletedAt ? `${wsRel}/${TRASH}/${cleanRel}` : `${wsRel}/${rel}`;
    desiredDirs.add(target);
  }

  for (const file of tree.files) {
    const wsRel = fileWsName(file);
    if (!wsRel) continue;
    const folderRel = folderPath(file.workspaceId, file.parentId, tree.folders);
    const rel = folderRel ? `${folderRel}/${sanitizeName(file.name)}` : sanitizeName(file.name);
    const cleanRel = rel.replace(new RegExp(`^${TRASH}/`), '');
    const target = file.deletedAt ? `${wsRel}/${TRASH}/${cleanRel}` : `${wsRel}/${rel}`;
    desiredFiles.add(target);
    await writeTextRel(target, file.content);
  }

  for (const dir of desiredDirs) await mkdirRel(dir);

  // Remove .md files that no longer exist in state.
  let roots: Entry[] = [];
  try {
    roots = await readDirRel('');
  } catch {
    return;
  }
  for (const rootEntry of roots) {
    if (!rootEntry.isDirectory) continue;
    const found: string[] = [];
    await walk(`${rootEntry.name}`, found);
    const trashed: string[] = [];
    await walk(`${rootEntry.name}/${TRASH}`, trashed);
    trashed.forEach((rel) => found.push(`${TRASH}/${rel}`));
    for (const rel of found) {
      if (!rel.toLowerCase().endsWith('.md')) continue;
      if (!desiredFiles.has(rel)) {
        try {
          await removeRel(rel);
        } catch {
          // best-effort cleanup
        }
      }
    }
  }
}

export function nativeStorageEnabled(): boolean {
  const platform = getPlatform();
  return platform === 'tauri' || platform === 'capacitor';
}
