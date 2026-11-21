import React from 'react';
import { X, FileText } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';

export const TabsBar: React.FC = () => {
  const { tabs, activeFileId, openFileInTab, closeTab, files } = useWorkspace();
  const { activeAccentHex } = useTheme();

  if (tabs.length === 0) return null;

  return (
    <div className="h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-950 flex items-center overflow-x-auto px-2 gap-1 shrink-0 select-none no-scrollbar">
      {tabs.map((tab) => {
        const file = files.find((f) => f.id === tab.fileId);
        if (!file) return null;

        const isActive = tab.fileId === activeFileId;

        return (
          <div
            key={tab.fileId}
            onClick={() => openFileInTab(tab.fileId)}
            style={isActive ? { borderColor: activeAccentHex } : undefined}
            className={`group h-7 px-2.5 rounded-t-md flex items-center gap-1.5 text-xs cursor-pointer border-t-2 transition-colors shrink-0 max-w-[180px] ${
              isActive
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-medium shadow-xs'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <FileText
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'text-neutral-400'}`}
              style={isActive ? { color: activeAccentHex } : undefined}
            />
            <span className="truncate">{file.name.replace(/\.md$/, '')}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.fileId);
              }}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity"
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
