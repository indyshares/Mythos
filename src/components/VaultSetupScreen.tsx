import { useState } from 'react';
import { FolderPlus, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { StorageLocationPicker } from './StorageLocationPicker';

/** Obsidian-style first-run screen: create the first vault before entering the app. */
export function VaultSetupScreen() {
  const { createWorkspace, refreshStorageRoot, t } = useWorkspace();
  const { activeAccentHex } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(false);
    try {
      // Do not reset the storage root: the user may have just chosen it below.
      createWorkspace(clean, description.trim());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${activeAccentHex}20`, color: activeAccentHex }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{t('onboarding.title')}</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('onboarding.subtitle')}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 p-3">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{t('onboarding.storageHint')}</p>
          <div className="mt-2">
            <StorageLocationPicker onChanged={refreshStorageRoot} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t('onboarding.nameLabel')}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workspace.namePlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t('onboarding.descLabel')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{t('onboarding.error')}</p>}
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            {busy ? t('onboarding.creating') : t('onboarding.create')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VaultSetupScreen;
