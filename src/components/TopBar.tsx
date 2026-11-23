import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Moon,
  Sun,
  Plus,
  Trash2,
  GitBranch,
  Calendar,
  FileText,
  Download,
  Settings,
  Layers,
  ChevronDown,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Edit2,
  Check,
  History,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { StorageLocationPicker } from './StorageLocationPicker';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  onOpenWorkspaceSheet?: () => void;
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isDarkMode,
  setIsDarkMode,
  onOpenSettings,
  onOpenTrash,
  onOpenWorkspaceSheet,
  isLeftSidebarOpen = true,
  onToggleLeftSidebar,
  isRightSidebarOpen = true,
  onToggleRightSidebar,
}) => {
  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    createWorkspace,
    updateWorkspace,
    activeView,
    setActiveView,
    setIsQuickSwitcherOpen,
    activeFile,
    saveState,
    undoLastOperation,
    canUndo,
    exportWorkspaceAsMarkdownZip,
    refreshStorageRoot,
    language,
    setLanguage,
  } = useWorkspace();

  const { activeAccentHex } = useTheme();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState('');
  const [newWsName, setNewWsName] = useState('');

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName.trim());
    setNewWsName('');
    setIsCreatingWs(false);
    setIsWorkspaceMenuOpen(false);
  };

  const handleStartRenameWs = (e: React.MouseEvent, ws: any) => {
    e.stopPropagation();
    setEditingWsId(ws.id);
    setEditingWsName(ws.name);
  };

  const handleSaveRenameWs = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editingWsName.trim()) {
      updateWorkspace(id, { name: editingWsName.trim() });
    }
    setEditingWsId(null);
  };

  const handleWorkspaceButtonClick = () => {
    if (onOpenWorkspaceSheet && (typeof window === 'undefined' || window.innerWidth < 1024)) {
      onOpenWorkspaceSheet();
    } else {
      setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
    }
  };

  return (
    <header className="relative z-50 h-12 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 shadow-xs">
      {/* Zone 1: Left Sidebar Toggle (Extreme Left) & Brand/Workspace Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
            title={isLeftSidebarOpen ? 'Collapse left sidebar' : 'Expand left sidebar'}
            aria-label={isLeftSidebarOpen ? 'Collapse left sidebar' : 'Expand left sidebar'}
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-display font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block shadow-xs"
              style={{ backgroundColor: activeAccentHex }}
            />
            Mythos
          </span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700 shrink-0" />

        {/* Workspace Dropdown / Mobile Sheet Trigger */}
        <div className="relative min-w-0">
          <button
            onClick={handleWorkspaceButtonClick}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700/60 transition-colors max-w-[130px] sm:max-w-[190px] md:max-w-[240px]"
            title="Switch or create workspace"
          >
            <FolderKanban
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: activeAccentHex }}
            />
            <span className="truncate">{activeWorkspace.name}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
          </button>

          {/* Desktop dropdown menu only (on desktop >= 768px) */}
          {isWorkspaceMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 hidden md:block"
                onClick={() => {
                  setIsWorkspaceMenuOpen(false);
                  setIsCreatingWs(false);
                }}
              />
              <div className="hidden md:block absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
                  Workspaces
                </div>

                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group ${
                      ws.id === activeWorkspace.id
                        ? 'font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {editingWsId === ws.id ? (
                      <form
                        onSubmit={(e) => handleSaveRenameWs(e, ws.id)}
                        className="flex items-center gap-1.5 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingWsName}
                          onChange={(e) => setEditingWsName(e.target.value)}
                          className="flex-1 px-1.5 py-0.5 text-xs bg-white dark:bg-neutral-950 border border-sky-500 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 bg-sky-500 text-white rounded hover:bg-sky-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setActiveWorkspaceId(ws.id);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className="flex-1 text-left truncate pr-2"
                        >
                          {ws.name}
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {ws.id === activeWorkspace.id && (
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 px-1 py-0.2 bg-sky-500/10 rounded">
                              Active
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleStartRenameWs(e, ws)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-sky-500 rounded transition-opacity"
                            title="Rename workspace"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <div className="h-[1px] bg-neutral-200 dark:bg-neutral-800 my-1" />

                {!isCreatingWs ? (
                  <button
                    onClick={() => setIsCreatingWs(true)}
                    className="w-full text-left px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-500" />
                    <span>Create New Workspace</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreateWorkspace} className="p-2 space-y-2">
                    <StorageLocationPicker onChanged={refreshStorageRoot} />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Workspace name..."
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatingWs(false)}
                        className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Breadcrumb / Active File indicator (Desktop only) */}
        {activeFile && (
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 min-w-0">
            <span>/</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[160px]">
              {activeFile.name}
            </span>
            <span className="text-[11px] text-neutral-400 shrink-0">
              · {saveState === 'saving' ? 'Saving...' : 'Saved'}
            </span>
          </div>
        )}
      </div>

      {/* Zone 2: Desktop View Switcher Nav Links (hidden on mobile, mobile uses bottom tab bar) */}
      <nav className="hidden lg:flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg shrink-0">
        <button
          onClick={() => setActiveView('editor')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'editor'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setActiveView('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'timeline'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveView('graph')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'graph'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Graph</span>
        </button>

        <button
          onClick={() => setActiveView('templates')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'templates'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={() => setActiveView('sessions')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            activeView === 'sessions'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-sky-500" />
          <span>AI Sessions</span>
        </button>
      </nav>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Undo Move button (Desktop) */}
        {canUndo && (
          <button
            onClick={() => undoLastOperation()}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded transition-colors"
            title="Undo last move operation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Undo</span>
          </button>
        )}

        {/* Quick Switcher Button */}
        <button
          onClick={() => setIsQuickSwitcherOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700/60 transition-colors"
          title="Search files (Ctrl+O)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden lg:inline px-1 py-0.2 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px] font-mono">
            Ctrl+O
          </kbd>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Export Workspace (Desktop) */}
        <button
          onClick={exportWorkspaceAsMarkdownZip}
          className="hidden md:flex p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Export Workspace (.md)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Trash (Desktop) */}
        <button
          onClick={onOpenTrash}
          className="hidden md:flex p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Trash & Deleted Files"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title="Workspace Settings & AI Instructions"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
          className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 shadow-2xs"
          title="สลับภาษา (Switch Language: TH / EN)"
        >
          <span>🌐</span>
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Dark/Light Mode */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Right Sidebar Toggle (Extreme Right) */}
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0 ml-1"
            title={isRightSidebarOpen ? 'Collapse right sidebar' : 'Expand right sidebar'}
            aria-label={isRightSidebarOpen ? 'Collapse right sidebar' : 'Expand right sidebar'}
          >
            {isRightSidebarOpen ? (
              <PanelRightClose className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
