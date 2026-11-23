import React, { useState } from 'react';
import { X, FolderKanban, Plus, Check, Trash2, ArrowRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { StorageLocationPicker } from './StorageLocationPicker';

interface MobileWorkspaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileWorkspaceSheet: React.FC<MobileWorkspaceSheetProps> = ({ isOpen, onClose }) => {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, createWorkspace, updateWorkspace, refreshStorageRoot } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState('');
  const [newWsName, setNewWsName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim());
    setNewWsName('');
    setIsCreating(false);
    onClose();
  };

  const handleSaveRename = (e: React.FormEvent, wsId: string) => {
    e.preventDefault();
    if (editingWsName.trim()) {
      updateWorkspace(wsId, { name: editingWsName.trim() });
    }
    setEditingWsId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-5 z-10 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-sky-500" />
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
              Switch Workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace List */}
        <div className="space-y-2">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeWorkspace.id;
            const isEditingThis = editingWsId === ws.id;

            return (
              <div
                key={ws.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  isActive
                    ? 'border-sky-500/60 bg-sky-500/10 dark:bg-sky-500/15 text-neutral-900 dark:text-white font-medium shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                }`}
              >
                {isEditingThis ? (
                  <form
                    onSubmit={(e) => handleSaveRename(e, ws.id)}
                    className="flex items-center gap-2 w-full"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingWsName}
                      onChange={(e) => setEditingWsName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-sky-500 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-sky-500 text-white font-semibold rounded-xl text-xs"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        onClose();
                      }}
                      className="min-w-0 pr-3 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{ws.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10">
                            Active
                          </span>
                        )}
                      </div>
                      {ws.description && (
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{ws.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWsId(ws.id);
                          setEditingWsName(ws.name);
                        }}
                        className="px-2.5 py-1 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 rounded-lg font-medium"
                      >
                        Rename
                      </button>
                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Workspace */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 text-sky-500" />
              <span>Create New Workspace</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-2">
              <StorageLocationPicker onChanged={refreshStorageRoot} />
              <input
                type="text"
                autoFocus
                placeholder="Workspace name..."
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-sky-500 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg text-xs"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
