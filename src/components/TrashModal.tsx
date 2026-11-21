import React, { useState } from 'react';
import { Trash2, RotateCcw, X, FileText, Folder, Bot } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const {
    files,
    folders,
    aiSessions,
    activeWorkspaceId,
    restoreFile,
    restoreFolder,
    permanentDeleteFile,
    permanentDeleteFolder,
    restoreAISession,
    permanentDeleteAISession,
  } = useWorkspace();

  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (!isOpen) return null;

  const trashedFiles = files.filter(
    (f) => f.workspaceId === activeWorkspaceId && Boolean(f.deletedAt)
  );

  const trashedFolders = folders.filter(
    (f) => f.workspaceId === activeWorkspaceId && Boolean(f.deletedAt)
  );

  const trashedSessions = aiSessions.filter(
    (s) => s.workspaceId === activeWorkspaceId && Boolean(s.deletedAt)
  );

  const totalTrashed = trashedFiles.length + trashedFolders.length + trashedSessions.length;

  const handleEmptyTrash = () => {
    trashedFiles.forEach((f) => permanentDeleteFile(f.id));
    trashedFolders.forEach((f) => permanentDeleteFolder(f.id));
    trashedSessions.forEach((s) => permanentDeleteAISession(s.id));
    setConfirmEmpty(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[540px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Trash & Recovery (ถังขยะและกู้คืน)
              </h3>
              <p className="text-xs text-neutral-500">
                {trashedFiles.length} files, {trashedFolders.length} folders, {trashedSessions.length} AI sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalTrashed > 0 && (
              confirmEmpty ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-[11px] text-red-500 font-bold hidden sm:inline">ลบถาวรทั้งหมด?</span>
                  <button
                    onClick={handleEmptyTrash}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-xs"
                  >
                    ยืนยันล้างถังขยะ
                  </button>
                  <button
                    onClick={() => setConfirmEmpty(false)}
                    className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEmpty(true)}
                  className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded border border-red-200 dark:border-red-900 transition-colors"
                >
                  Empty Trash
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trashed Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {totalTrashed === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-1">
              <p className="font-medium text-neutral-600 dark:text-neutral-300">Trash is empty</p>
              <p className="text-[11px] text-neutral-500">
                Deleted notes, folders, and AI sessions are stored here before being permanently purged.
              </p>
            </div>
          ) : (
            <>
              {/* Trashed AI Sessions */}
              {trashedSessions.length > 0 && (
                <div className="space-y-1.5 pb-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-sky-500 px-1 pt-1">
                    AI Sessions ({trashedSessions.length})
                  </div>
                  {trashedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:border-sky-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Bot className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {session.title || 'Untitled AI Session'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-bold shrink-0 uppercase">
                          {session.agentMode === 'build' ? 'BUILD' : 'ASK'}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {session.messages?.length || 0} ข้อความ
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0 hidden sm:inline">
                          ลบเมื่อ {session.deletedAt ? new Date(session.deletedAt).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => restoreAISession(session.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded font-semibold transition-colors"
                          title="กู้คืนเซสชันนี้กลับไปยังประวัติ"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>กู้คืน</span>
                        </button>
                        <button
                          onClick={() => permanentDeleteAISession(session.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="ลบถาวร (Permanent Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trashed Folders */}
              {trashedFolders.length > 0 && (
                <div className="space-y-1.5 pb-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-500 px-1 pt-1">
                    Folders ({trashedFolders.length})
                  </div>
                  {trashedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {folder.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          Deleted {new Date(folder.deletedAt!).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => restoreFolder(folder.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded font-semibold transition-colors"
                          title="Restore folder and all items"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => permanentDeleteFolder(folder.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Permanent delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trashed Files */}
              {trashedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-1 pt-1">
                    Notes ({trashedFiles.length})
                  </div>
                  {trashedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="text-neutral-800 dark:text-neutral-200 truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          Deleted {new Date(file.deletedAt!).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => restoreFile(file.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded font-semibold transition-colors"
                          title="Restore note"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => permanentDeleteFile(file.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Permanent delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
