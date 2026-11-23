import { useState } from 'react';
import { getPlatform } from '../utils/permissions';
import {
  chooseDesktopFolder,
  getStorageRoot,
  sanitizeName,
  setStorageRoot,
  type StorageRoot,
} from '../utils/storage/nativeStore';

/** Choose where native apps keep the real workspace folders/.md files. */
export function StorageLocationPicker({
  onChanged,
  onWorkspaceFolderChosen,
}: {
  onChanged: () => void;
  onWorkspaceFolderChosen?: (parent: string, name: string) => void;
}) {
  const platform = getPlatform();
  const [root, setRoot] = useState<StorageRoot>(() => getStorageRoot());
  const [folderName, setFolderName] = useState(() => getStorageRoot().path);
  const [busy, setBusy] = useState(false);

  if (platform === 'web') return null;

  const apply = (next: StorageRoot) => {
    setStorageRoot(next);
    setRoot(next);
    onChanged();
  };

  const chooseFolder = async () => {
    setBusy(true);
    try {
      const chosen = await chooseDesktopFolder();
      if (!chosen) return; // cancelled — leave everything untouched
      const root: StorageRoot = {
        directory: 'documents',
        path: chosen.parent,
        label: chosen.parent,
        singleWorkspace: chosen.name,
      };
      setStorageRoot(root);
      setRoot(root);
      setFolderName(chosen.name);
      onWorkspaceFolderChosen?.(chosen.parent, chosen.name);
    } finally {
      setBusy(false);
    }
  };

  const chooseAndroid = (directory: StorageRoot['directory'], label: string) => {
    const name = sanitizeName(folderName) || 'Mythos';
    apply({ directory, path: name, label: `${label}/${name}` });
  };

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-2 space-y-2 text-[11px]">
      <div className="font-medium text-neutral-600 dark:text-neutral-300">Storage location</div>
      <div className="text-neutral-500 dark:text-neutral-400 truncate" title={root.label}>
        Current: {root.label}
      </div>

      {platform === 'tauri' ? (
        <button
          type="button"
          disabled={busy}
          onClick={chooseFolder}
          className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-500 hover:text-white transition-colors disabled:opacity-50"
        >
          {busy ? 'Choosing…' : 'Choose folder…'}
        </button>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
          />
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['documents', 'Documents'],
                ['externalstorage', 'External storage'],
                ['data', 'App private'],
              ] as const
            ).map(([directory, label]) => (
              <button
                key={directory}
                type="button"
                onClick={() => chooseAndroid(directory, label)}
                className={`px-2 py-1 rounded border transition-colors ${
                  root.directory === directory
                    ? 'border-sky-500 text-sky-500'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StorageLocationPicker;
