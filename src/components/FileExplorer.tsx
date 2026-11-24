import React, { useState, useMemo, useRef } from 'react';
import {
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  Plus,
  FolderPlus,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Search,
  CheckSquare,
  Square,
  Copy,
  Trash2,
  FolderInput,
  Edit2,
  Files,
  Home,
  PanelLeftClose,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { isCapacitor, isTauri } from '../utils/permissions';
import { useTheme } from '../context/ThemeContext';
import { Folder, FileItem } from '../types';

interface FileExplorerProps {
  onSelectTemplate: () => void;
  onOpenFile?: () => void;
  onToggleCollapse?: () => void;
}

type ContextItem = { id: string; type: 'file' | 'folder'; name: string; parentId: string | null };

export const FileExplorer: React.FC<FileExplorerProps> = ({ onSelectTemplate, onOpenFile, onToggleCollapse }) => {
  const {
    folders,
    files,
    activeWorkspaceId,
    activeFileId,
    openFileInTab,
    createFile,
    createFolder,
    renameFile,
    renameFolder,
    moveFile,
    moveFolder,
    duplicateFile,
    softDeleteFile,
    softDeleteFolder,
    bulkMove,
    bulkDelete,
    setItemToMove,
    setIsMoveDialogOpen,
  } = useWorkspace();
  const { activeAccentHex } = useTheme();

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  // In-line creation & renaming state
  const [creatingInParentId, setCreatingInParentId] = useState<string | null | 'root'>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creationName, setCreationName] = useState('');

  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renamingItemType, setRenamingItemType] = useState<'file' | 'folder' | null>(null);
  const [renamingName, setRenamingName] = useState('');

  // Creation menu toggle
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isRootCreateMenuOpen, setIsRootCreateMenuOpen] = useState(false);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ContextItem } | null>(null);

  // Mobile long-press opens the same menu as desktop right-click.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startLongPress = (e: React.TouchEvent, item: ContextItem) => {
    if (!isCapacitor()) return; // real mobile app only (not web, not desktop)
    clearLongPress();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      suppressClickRef.current = true;
      setContextMenu({ x, y, item });
    }, 500);
  };

  const cancelLongPress = () => clearLongPress();

  const consumeSuppressedClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'root'>(null);

  // Filtered files & folders
  const activeFolders = useMemo(
    () => folders.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt),
    [folders, activeWorkspaceId]
  );

  const activeFiles = useMemo(
    () => files.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt),
    [files, activeWorkspaceId]
  );

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Submit creation
  const handleConfirmCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creationName.trim() || !creatingType) return;
    const parentId = creatingInParentId === 'root' ? null : creatingInParentId;

    if (creatingType === 'file') {
      createFile(creationName.trim(), parentId);
    } else {
      createFolder(creationName.trim(), parentId);
      if (parentId) {
        setExpandedFolderIds((prev) => new Set([...prev, parentId]));
      }
    }

    setCreatingInParentId(null);
    setCreatingType(null);
    setCreationName('');
  };

  // Submit renaming
  const handleConfirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingName.trim() || !renamingItemId || !renamingItemType) return;

    if (renamingItemType === 'file') {
      renameFile(renamingItemId, renamingName.trim());
    } else {
      renameFolder(renamingItemId, renamingName.trim());
    }

    setRenamingItemId(null);
    setRenamingItemType(null);
    setRenamingName('');
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, id: string, type: 'file' | 'folder') => {
    e.stopPropagation();
    setDraggedItem({ id, type });
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
  };

  // Handle Drop on a folder (or Root)
  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'file') {
      moveFile(draggedItem.id, targetFolderId);
    } else if (draggedItem.type === 'folder') {
      moveFolder(draggedItem.id, targetFolderId);
    }

    setDraggedItem(null);
  };

  // Handle copy wiki link
  const copyInternalLink = (fileName: string) => {
    const cleanTitle = fileName.replace(/\.md$/, '');
    navigator.clipboard.writeText(`[[${cleanTitle}]]`);
  };

  // Bulk Selection
  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectFolder = (id: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Move ${selectedFileIds.size} files and ${selectedFolderIds.size} folders to Trash?`
      )
    ) {
      bulkDelete(Array.from(selectedFileIds), Array.from(selectedFolderIds));
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  // Render tree node recursive
  const renderFolderHierarchy = (parentId: string | null = null, depth = 0) => {
    const currentFolders = activeFolders.filter((f) => f.parentId === parentId);
    const currentFiles = activeFiles.filter((f) => f.parentId === parentId);

    // Apply search filter if active
    const filteredFolders = filterQuery
      ? currentFolders.filter((f) => f.name.toLowerCase().includes(filterQuery.toLowerCase()))
      : currentFolders;

    const filteredFiles = filterQuery
      ? currentFiles.filter((f) => f.name.toLowerCase().includes(filterQuery.toLowerCase()))
      : currentFiles;

    return (
      <div className="space-y-0.5">
        {/* Child Folders */}
        {filteredFolders.map((folder) => {
          const isExpanded = expandedFolderIds.has(folder.id);
          const isDragTarget = dragOverFolderId === folder.id;
          const isSelected = selectedFolderIds.has(folder.id);

          return (
            <div key={folder.id} className="relative">
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => handleDropOnFolder(e, folder.id)}
                className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
                  isDragTarget
                    ? 'bg-sky-100 dark:bg-sky-950/60 ring-1 ring-sky-500'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                } ${isSelected ? 'bg-sky-50 dark:bg-sky-950/30' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => {
                  if (consumeSuppressedClick()) return;
                  toggleFolder(folder.id);
                }}
                onTouchStart={(e) => startLongPress(e, { id: folder.id, type: 'folder', name: folder.name, parentId: folder.parentId })}
                onTouchMove={cancelLongPress}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onContextMenu={(e) => {
                  if (!isTauri()) return; // mobile uses long-press instead
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    item: { id: folder.id, type: 'folder', name: folder.name, parentId: folder.parentId },
                  });
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isMultiSelectMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectFolder(folder.id);
                      }}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <span className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>

                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  ) : (
                    <FolderIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  )}

                  {renamingItemId === folder.id ? (
                    <form onSubmit={handleConfirmRename} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={renamingName}
                        onChange={(e) => setRenamingName(e.target.value)}
                        onBlur={() => setRenamingItemId(null)}
                        className="px-1 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-sky-500 rounded focus:outline-none"
                      />
                    </form>
                  ) : (
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {folder.name}
                    </span>
                  )}
                </div>

                {/* Hover Action icons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreatingInParentId(folder.id);
                      setCreatingType('file');
                      setCreationName('');
                      setExpandedFolderIds((prev) => new Set([...prev, folder.id]));
                    }}
                    title="New File in Folder"
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        item: { id: folder.id, type: 'folder', name: folder.name, parentId: folder.parentId },
                      });
                    }}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Inline file/folder creation inside this folder */}
              {creatingInParentId === folder.id && (
                <div
                  className="px-2 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
                >
                  <form onSubmit={handleConfirmCreation} className="flex items-center gap-1.5">
                    {creatingType === 'file' ? (
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    ) : (
                      <FolderPlus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    )}
                    <input
                      type="text"
                      autoFocus
                      placeholder={creatingType === 'file' ? 'Note name...' : 'Folder name...'}
                      value={creationName}
                      onChange={(e) => setCreationName(e.target.value)}
                      onBlur={() => setCreatingInParentId(null)}
                      className="w-full px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-sky-500 rounded focus:outline-none"
                    />
                  </form>
                </div>
              )}

              {/* Subtree */}
              {isExpanded && renderFolderHierarchy(folder.id, depth + 1)}
            </div>
          );
        })}

        {/* Files at this level */}
        {filteredFiles.map((file) => {
          const isActive = file.id === activeFileId;
          const isSelected = selectedFileIds.has(file.id);

          return (
            <div
              key={file.id}
              draggable
              onDragStart={(e) => handleDragStart(e, file.id, 'file')}
              onClick={() => {
                if (consumeSuppressedClick()) return;
                openFileInTab(file.id);
                onOpenFile?.();
              }}
              onTouchStart={(e) => startLongPress(e, { id: file.id, type: 'file', name: file.name, parentId: file.parentId })}
              onTouchMove={cancelLongPress}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onContextMenu={(e) => {
                if (!isTauri()) return;
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  item: { id: file.id, type: 'file', name: file.name, parentId: file.parentId },
                });
              }}
              style={{
                paddingLeft: `${depth * 12 + 18}px`,
                ...(isActive ? { backgroundColor: `${activeAccentHex}15`, color: activeAccentHex } : {}),
              }}
              className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition-colors text-xs select-none ${
                isActive
                  ? 'font-medium'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              } ${isSelected ? 'bg-sky-100 dark:bg-sky-950/40' : ''}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isMultiSelectMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectFile(file.id);
                    }}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <FileText
                  className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'text-neutral-400'}`}
                  style={isActive ? { color: activeAccentHex } : undefined}
                />

                {renamingItemId === file.id ? (
                  <form onSubmit={handleConfirmRename} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onBlur={() => setRenamingItemId(null)}
                      className="px-1 py-0.5 text-xs bg-white dark:bg-neutral-900 border border-sky-500 rounded focus:outline-none"
                    />
                  </form>
                ) : (
                  <span className="truncate">{file.name.replace(/\.md$/, '')}</span>
                )}
              </div>

              {/* Hover actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyInternalLink(file.name);
                  }}
                  title="Copy link [[Note]]"
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      item: { id: file.id, type: 'file', name: file.name, parentId: file.parentId },
                    });
                  }}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 w-full select-none">
      {/* Top Header of File Explorer */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Files & Folders
          </span>

          <div className="flex items-center gap-1">
            {/* New File at Root with Options */}
            <div className="relative">
              <button
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 border ${
                  isCreateMenuOpen
                    ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/20'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-sky-500/50'
                }`}
                title="Create new..."
              >
                <Plus className={`w-4 h-4 transition-transform duration-300 ${isCreateMenuOpen ? 'rotate-45' : ''}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">Create</span>
              </button>

              {isCreateMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCreateMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 mb-1">
                       <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">New Entry</span>
                    </div>
                    <button
                      onClick={() => {
                        setCreatingInParentId('root');
                        setCreatingType('file');
                        setCreationName('');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-[12px] text-neutral-700 dark:text-neutral-200 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                         <span className="font-bold">New Blank Note</span>
                         <span className="text-[9px] text-neutral-400">Start from scratch</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        onSelectTemplate();
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-[12px] text-neutral-700 dark:text-neutral-200 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Files className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                         <span className="font-bold">From Template</span>
                         <span className="text-[9px] text-neutral-400">Use pre-defined structure</span>
                      </div>
                    </button>
                    <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800 my-1" />
                    <button
                      onClick={() => {
                        setCreatingInParentId('root');
                        setCreatingType('folder');
                        setCreationName('');
                        setIsCreateMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-[12px] text-neutral-700 dark:text-neutral-200 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FolderPlus className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                         <span className="font-bold">New Folder</span>
                         <span className="text-[9px] text-neutral-400">Organize your files</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>


            {/* Multi-select toggle */}
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedFileIds(new Set());
                setSelectedFolderIds(new Set());
              }}
              className={`p-1 rounded transition-colors ${
                isMultiSelectMode
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
              title="Multi-select mode"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search / Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Multi-select Action Bar */}
        {isMultiSelectMode && (selectedFileIds.size > 0 || selectedFolderIds.size > 0) && (
          <div className="flex items-center justify-between p-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 rounded-md text-xs">
            <span className="text-sky-800 dark:text-sky-200 font-medium">
              {selectedFileIds.size + selectedFolderIds.size} selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-950 rounded"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Hierarchical Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Explicit Root Drop Target */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverFolderId('root');
          }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={(e) => handleDropOnFolder(e, null)}
          className={`px-2 py-1.5 rounded-md flex items-center justify-between text-xs transition-colors ${
            dragOverFolderId === 'root'
              ? 'bg-sky-100 dark:bg-sky-950/80 ring-1 ring-sky-500'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
            <Home className="w-3.5 h-3.5 text-sky-500" />
            <span>Root (/)</span>
          </div>
          
          <div className="flex items-center gap-1">
             <span className="text-[10px] text-neutral-400 mr-1">
               {activeFiles.filter((f) => f.parentId === null).length} items
             </span>
             
             {/* Inline Create Button for Root */}
             <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRootCreateMenuOpen(!isRootCreateMenuOpen);
                  }}
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-400 hover:text-sky-500 transition-colors"
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform ${isRootCreateMenuOpen ? 'rotate-45 text-sky-500' : ''}`} />
                </button>
                
                {isRootCreateMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsRootCreateMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                      <button
                        onClick={() => {
                          setCreatingInParentId('root');
                          setCreatingType('file');
                          setCreationName('');
                          setIsRootCreateMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-500" />
                        <span>New Blank Note</span>
                      </button>
                      <button
                        onClick={() => {
                          onSelectTemplate();
                          setIsRootCreateMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-200"
                      >
                        <Files className="w-3.5 h-3.5 text-emerald-500" />
                        <span>From Template</span>
                      </button>
                      <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800 my-1" />
                      <button
                        onClick={() => {
                          setCreatingInParentId('root');
                          setCreatingType('folder');
                          setCreationName('');
                          setIsRootCreateMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-200"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                        <span>New Folder</span>
                      </button>
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Creation Input at Root */}
        {creatingInParentId === 'root' && (
          <div className="px-2 py-1">
            <form onSubmit={handleConfirmCreation} className="flex items-center gap-1.5">
              {creatingType === 'file' ? (
                <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              ) : (
                <FolderPlus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              )}
              <input
                type="text"
                autoFocus
                placeholder={creatingType === 'file' ? 'New Note in Root...' : 'New Folder in Root...'}
                value={creationName}
                onChange={(e) => setCreationName(e.target.value)}
                onBlur={() => setCreatingInParentId(null)}
                className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-900 border border-sky-500 rounded focus:outline-none"
              />
            </form>
          </div>
        )}

        {/* Tree elements starting from Root */}
        {renderFolderHierarchy(null, 0)}
      </div>

      {/* Footer Quick Action: Note from Template (Hidden on mobile as it's now an option in the header) */}
      <div className="hidden lg:block p-2 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={onSelectTemplate}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md text-xs font-medium transition-colors border border-neutral-200 dark:border-neutral-800"
        >
          <Files className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
          <span>New from Template</span>
        </button>
      </div>

      {/* Context Menu Modal / Popup */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 text-xs"
            style={{
              top: `${Math.min(window.innerHeight - 200, contextMenu.y)}px`,
              left: `${Math.min(window.innerWidth - 200, contextMenu.x)}px`,
            }}
          >
            <button
              onClick={() => {
                if (contextMenu.item.type === 'file') {
                  openFileInTab(contextMenu.item.id);
                  onOpenFile?.();
                } else {
                  toggleFolder(contextMenu.item.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Open</span>
            </button>

            {contextMenu.item.type === 'file' && (
              <button
                onClick={() => {
                  copyInternalLink(contextMenu.item.name);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link [[Note]]</span>
              </button>
            )}

            <button
              onClick={() => {
                setItemToMove(contextMenu.item);
                setIsMoveDialogOpen(true);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Move to...</span>
            </button>

            <button
              onClick={() => {
                setRenamingItemId(contextMenu.item.id);
                setRenamingItemType(contextMenu.item.type);
                setRenamingName(contextMenu.item.name.replace(/\.md$/, ''));
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>

            {contextMenu.item.type === 'file' && (
              <button
                onClick={() => {
                  duplicateFile(contextMenu.item.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
              >
                <Files className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}

            <div className="h-[1px] bg-neutral-200 dark:bg-neutral-800 my-1" />

            <button
              onClick={() => {
                if (contextMenu.item.type === 'file') {
                  softDeleteFile(contextMenu.item.id);
                } else {
                  softDeleteFolder(contextMenu.item.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move to Trash</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
