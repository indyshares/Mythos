import React, { useState, useEffect } from 'react';
import { Search, FileText, ArrowRight, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export const QuickSwitcherModal: React.FC = () => {
  const {
    isQuickSwitcherOpen,
    setIsQuickSwitcherOpen,
    files,
    activeWorkspaceId,
    openFileInTab,
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Listen for global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'k')) {
        e.preventDefault();
        setIsQuickSwitcherOpen(true);
      }
      if (e.key === 'Escape' && isQuickSwitcherOpen) {
        setIsQuickSwitcherOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSwitcherOpen, setIsQuickSwitcherOpen]);

  const activeFiles = files.filter(
    (f) => f.workspaceId === activeWorkspaceId && !f.deletedAt
  );

  const filteredFiles = activeFiles.filter((f) => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    return (
      f.name.toLowerCase().includes(lower) ||
      (f.content || '').toLowerCase().includes(lower)
    );
  });

  const handleSelect = (fileId: string) => {
    openFileInTab(fileId);
    setIsQuickSwitcherOpen(false);
    setQuery('');
  };

  if (!isQuickSwitcherOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={() => setIsQuickSwitcherOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[480px]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search notes by name or content..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter' && filteredFiles[selectedIndex]) {
                e.preventDefault();
                handleSelect(filteredFiles[selectedIndex].id);
              }
            }}
            className="w-full text-sm bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
          <button
            onClick={() => setIsQuickSwitcherOpen(false)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching notes found in this workspace.
            </div>
          ) : (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.id}
                  onClick={() => handleSelect(file.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 font-medium'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{file.name.replace(/\.md$/, '')}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {file.content.length} chars
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Navigate with ↑ ↓, press Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
