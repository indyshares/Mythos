import React, { useState } from 'react';
import { Home, Folder, X, Check, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export const MoveDialog: React.FC = () => {
  const {
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    itemToMove,
    setItemToMove,
    folders,
    activeWorkspaceId,
    moveFile,
    moveFolder,
  } = useWorkspace();

  const [selectedDestinationParentId, setSelectedDestinationParentId] = useState<
    string | null
  >(null);

  if (!isMoveDialogOpen || !itemToMove) return null;

  const activeFolders = folders.filter(
    (f) => f.workspaceId === activeWorkspaceId && !f.deletedAt && f.id !== itemToMove.id
  );

  const handleConfirmMove = () => {
    if (itemToMove.type === 'file') {
      moveFile(itemToMove.id, selectedDestinationParentId);
    } else {
      moveFolder(itemToMove.id, selectedDestinationParentId);
    }
    setIsMoveDialogOpen(false);
    setItemToMove(null);
  };

  const getFolderPath = (folderId: string): string => {
    const f = folders.find((item) => item.id === folderId);
    if (!f) return '';
    if (!f.parentId) return `/${f.name}`;
    return `${getFolderPath(f.parentId)}/${f.name}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div
        className="fixed inset-0"
        onClick={() => {
          setIsMoveDialogOpen(false);
          setItemToMove(null);
        }}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Move {itemToMove.type === 'file' ? 'File' : 'Folder'}
            </h3>
            <p className="text-xs text-neutral-500 truncate max-w-xs">
              "{itemToMove.name}"
            </p>
          </div>
          <button
            onClick={() => {
              setIsMoveDialogOpen(false);
              setItemToMove(null);
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Picker */}
        <div className="p-3 max-h-72 overflow-y-auto space-y-1 text-xs">
          <span className="text-[10px] uppercase font-semibold text-neutral-400 px-2">
            Select Destination Folder:
          </span>

          {/* Root Choice */}
          <div
            onClick={() => setSelectedDestinationParentId(null)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedDestinationParentId === null
                ? 'bg-sky-500 text-white font-medium shadow-xs'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Workspace Root (/)</span>
            </div>
            {selectedDestinationParentId === null && <Check className="w-4 h-4" />}
          </div>

          {/* All Folders */}
          {activeFolders.map((folder) => {
            const isSelected = selectedDestinationParentId === folder.id;
            const fullPath = getFolderPath(folder.id);
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedDestinationParentId(folder.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-sky-500 text-white font-medium shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="truncate">{fullPath}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setIsMoveDialogOpen(false);
              setItemToMove(null);
            }}
            className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmMove}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Move to Destination</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
