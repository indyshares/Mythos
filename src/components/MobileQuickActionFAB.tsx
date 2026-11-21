import React, { useState } from 'react';
import { Plus, FileText, Layers, FolderPlus, Search, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface MobileQuickActionFABProps {
  onOpenTemplates: () => void;
}

export const MobileQuickActionFAB: React.FC<MobileQuickActionFABProps> = ({ onOpenTemplates }) => {
  const { createFile, createFolder, setIsQuickSwitcherOpen } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateNote = () => {
    setIsOpen(false);
    const title = prompt('Enter note name:');
    if (!title || !title.trim()) return;
    createFile(title.trim(), null);
  };

  const handleCreateFolder = () => {
    setIsOpen(false);
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;
    createFolder(name.trim(), null);
  };

  return (
    <>
      {/* Floating Action Button in Natural Thumb Reach Zone */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-4 z-30 lg:hidden w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Create Note or Action"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Action Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

          <div className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-5 z-10 space-y-4">
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                Quick Action
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCreateNote}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-start gap-2 hover:border-sky-500 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                    New Blank Note
                  </span>
                  <span className="text-[11px] text-neutral-500">Quick empty document</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenTemplates();
                }}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-start gap-2 hover:border-sky-500 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                    From Template
                  </span>
                  <span className="text-[11px] text-neutral-500">Character, Timeline, Log</span>
                </div>
              </button>

              <button
                onClick={handleCreateFolder}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-start gap-2 hover:border-sky-500 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                    New Folder
                  </span>
                  <span className="text-[11px] text-neutral-500">Organize workspace</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsQuickSwitcherOpen(true);
                }}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-start gap-2 hover:border-sky-500 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 block">
                    Quick Search
                  </span>
                  <span className="text-[11px] text-neutral-500">Jump to any note</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
