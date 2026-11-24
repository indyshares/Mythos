import React, { useState, useEffect } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { TopBar } from './components/TopBar';
import { FileExplorer } from './components/FileExplorer';
import { TabsBar } from './components/TabsBar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { RightSidebar } from './components/RightSidebar';
import { TimelineView } from './components/TimelineView';
import { GraphView } from './components/GraphView';
import { TemplatesView } from './components/TemplatesView';
import { QuickSwitcherModal } from './components/QuickSwitcherModal';
import { MoveDialog } from './components/MoveDialog';
import { TrashModal } from './components/TrashModal';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal';
import { MobileInspectorSheet } from './components/MobileInspectorSheet';
import { MobileQuickActionFAB } from './components/MobileQuickActionFAB';
import { MobileAIView } from './components/MobileAIView';
import { MobileMoreSheet } from './components/MobileMoreSheet';
import { MobileWorkspaceSheet } from './components/MobileWorkspaceSheet';
import { MobileSwipeLayout, MobileSwipeLayoutHandle } from './components/MobileSwipeLayout';
import { MobileDockBar } from './components/MobileDockBar';
import { AISessionHistoryView } from './components/AISessionHistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Calendar,
  Folder,
  Bot,
  MoreHorizontal,
  X,
} from 'lucide-react';

function WorkspaceApp() {
  const { activeView, setActiveView, openFileInTab, isTrashOpen, setIsTrashOpen } = useWorkspace();
  const { isDarkMode, setIsDarkMode } = useTheme();
  
  const swipeRef = React.useRef<MobileSwipeLayoutHandle>(null);
  const skipInitialNavRef = React.useRef(true);
  const handleNavigate = (index: number) => {
    swipeRef.current?.scrollToIndex(index);
  };

  useEffect(() => {
    // On mount mobile stays on the leftmost panel; only react to later view changes.
    if (skipInitialNavRef.current) {
      skipInitialNavRef.current = false;
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      if (activeView === 'ai') {
        handleNavigate(2);
      } else if (['sessions', 'editor', 'templates', 'timeline', 'graph'].includes(activeView)) {
        handleNavigate(1);
      }
    }
  }, [activeView]);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mobile Bottom Sheets & Dialogs
  const [isWorkspaceSheetOpen, setIsWorkspaceSheetOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Auto-collapse sidebar on smaller screens or window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsLeftSidebarOpen(false);
      }
    };

    const handleOpenSettingsEvent = () => {
      setIsSettingsOpen(true);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('open-workspace-settings', handleOpenSettingsEvent);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('open-workspace-settings', handleOpenSettingsEvent);
    };
  }, []);

  const handleToggleLeftSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileMenuOpen((prev) => !prev);
    } else {
      setIsLeftSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Top Bar (Header with z-50 so dropdown and controls are always properly accessible) */}
      <div className="hidden lg:block">
        <TopBar
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTrash={() => setIsTrashOpen(true)}
          onOpenWorkspaceSheet={() => setIsWorkspaceSheetOpen(true)}
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={handleToggleLeftSidebar}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        />
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 overflow-hidden relative">
          {/* Left Sidebar: File Explorer */}
          {isLeftSidebarOpen && (
            <aside className="w-64 shrink-0 bg-neutral-50 dark:bg-neutral-950 flex flex-col border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200">
              <FileExplorer
                onSelectTemplate={() => setActiveView('templates')}
              />
            </aside>
          )}

          {/* Center Canvas */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-white dark:bg-neutral-900">
            {activeView === 'editor' && <MarkdownEditor />}
            {activeView === 'ai' && <MobileAIView onOpenFile={openFileInTab} />}
            {activeView === 'timeline' && (
              <TimelineView onNavigateToEditor={() => setActiveView('editor')} />
            )}
            {activeView === 'graph' && <GraphView />}
            {activeView === 'templates' && (
              <TemplatesView onNavigateToEditor={() => setActiveView('editor')} />
            )}
            {activeView === 'sessions' && <AISessionHistoryView />}
          </main>

          {/* Right Sidebar: AI Assistant, Backlinks & Inspector */}
          {isRightSidebarOpen && (
            <aside className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-800 transition-all duration-200">
              <RightSidebar />
            </aside>
          )}
        </div>

        {/* Mobile Layout (Swipeable) */}
        <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
          <MobileSwipeLayout ref={swipeRef}>
            {/* Left Panel: Files & Settings & Navigation */}
            <div className="w-screen h-full bg-neutral-50 dark:bg-neutral-950 flex flex-col">
              <TopBar
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenTrash={() => setIsTrashOpen(true)}
                onOpenWorkspaceSheet={() => setIsWorkspaceSheetOpen(true)}
                onOpenMore={() => setIsMoreMenuOpen(true)}
                isLeftSidebarOpen={true}
              />
              <div className="flex-1 min-h-0">
                <FileExplorer 
                  onSelectTemplate={() => {
                    setActiveView('templates');
                    handleNavigate(1);
                  }}
                  onOpenFile={() => {
                    setActiveView('editor');
                    handleNavigate(1);
                  }}
                />
              </div>
              <MobileDockBar onNavigate={handleNavigate} />
            </div>

            {/* Center Panel: Dynamic Multi-View (Editor, Timeline, Graph, etc.) */}
            <div className="w-screen h-full bg-white dark:bg-neutral-900 flex flex-col relative">
              {activeView === 'editor' && (
                <MarkdownEditor onOpenInspector={() => setIsInspectorOpen(true)} />
              )}
              {activeView === 'timeline' && (
                <TimelineView
                  onNavigateToEditor={() => {
                    setActiveView('editor');
                    handleNavigate(1);
                  }}
                />
              )}
              {activeView === 'graph' && <GraphView />}
              {activeView === 'templates' && (
                <TemplatesView
                  onNavigateToEditor={() => {
                    setActiveView('editor');
                    handleNavigate(1);
                  }}
                />
              )}
              {activeView === 'sessions' && <AISessionHistoryView />}
              
              {/* Fallback if activeView is 'ai' (which is on panel 2), show editor or something useful */}
              {activeView === 'ai' && (
                 <MarkdownEditor onOpenInspector={() => setIsInspectorOpen(true)} />
              )}
            </div>

            {/* Right Panel: AI Chat Assistant */}
            <div className="w-screen h-full bg-white dark:bg-neutral-900 flex flex-col">
              <MobileAIView onOpenFile={(fileId) => {
                openFileInTab(fileId);
                setActiveView('editor');
                handleNavigate(1);
              }} />
            </div>
          </MobileSwipeLayout>
        </div>
      </div>



      {/* Modals & Bottom Sheets */}
      <QuickSwitcherModal />
      <MoveDialog />
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <MobileInspectorSheet
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
      <MobileMoreSheet
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <MobileWorkspaceSheet
        isOpen={isWorkspaceSheetOpen}
        onClose={() => setIsWorkspaceSheetOpen(false)}
      />

      {/* Network Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <WorkspaceApp />
      </WorkspaceProvider>
    </ThemeProvider>
  );
}
