import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Search, Check, AtSign } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface WorkspaceTreePickerProps {
  selectedFileIds: string[];
  onToggleFile: (fileId: string) => void;
  onClose?: () => void;
}

export const WorkspaceTreePicker: React.FC<WorkspaceTreePickerProps> = ({
  selectedFileIds,
  onToggleFile,
  onClose,
}) => {
  const { folders, files, activeWorkspace } = useWorkspace();
  const [search, setSearch] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const activeFolders = folders.filter(
    (f) => f.workspaceId === activeWorkspace.id && !f.deletedAt
  );
  const activeFiles = files.filter(
    (f) => f.workspaceId === activeWorkspace.id && !f.deletedAt
  );

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const filteredFiles = activeFiles.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Recursive tree renderer
  const renderFolderTree = (parentId: string | null = null, depth = 0) => {
    const currentFolders = activeFolders.filter((f) => f.parentId === parentId);
    const currentFiles = activeFiles.filter((f) => f.parentId === parentId);

    return (
      <div className="space-y-0.5">
        {currentFolders.map((folder) => {
          const isCollapsed = collapsedFolders[folder.id];
          return (
            <div key={folder.id} className="select-none">
              <div
                onClick={() => toggleFolder(folder.id)}
                className="flex items-center gap-1.5 px-2 py-1 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg cursor-pointer text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <Folder className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </div>

              {!isCollapsed && renderFolderTree(folder.id, depth + 1)}
            </div>
          );
        })}

        {currentFiles.map((file) => {
          const isSelected = selectedFileIds.includes(file.id);
          return (
            <div
              key={file.id}
              onClick={() => onToggleFile(file.id)}
              className={`flex items-center justify-between px-2 py-1 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 rounded-lg cursor-pointer text-xs transition-colors ${
                isSelected
                  ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
              style={{ paddingLeft: `${depth * 12 + 20}px` }}
            >
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">@{file.name.replace(/\.md$/, '')}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0 stroke-[3]" />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl max-h-64 overflow-y-auto space-y-2 text-xs select-none">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search files in workspace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
        />
      </div>

      {search.trim() ? (
        <div className="space-y-1">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);
            return (
              <div
                key={file.id}
                onClick={() => onToggleFile(file.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="truncate">@{file.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      ) : (
        renderFolderTree(null, 0)
      )}
    </div>
  );
};
