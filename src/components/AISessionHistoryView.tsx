import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Bot,
  Hammer,
  Clock,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Copy,
  Database,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { AISession } from '../types';

export const AISessionHistoryView: React.FC = () => {
  const {
    aiSessions,
    activeWorkspace,
    activeSessionId,
    setActiveSessionId,
    startNewAISession,
    createAISession,
    deleteAISession,
    renameAISession,
    setActiveView,
    dbConfig,
    syncToDatabase,
    isTrashOpen,
    setIsTrashOpen,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'ask' | 'build'>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState<string | null>(null);

  // Filter sessions by current active workspace and ensure only active (non-deleted) sessions with messages are shown
  const workspaceSessions = useMemo(() => {
    return aiSessions.filter(
      (s) => s.workspaceId === activeWorkspace.id && s.messages && s.messages.length > 0 && !s.deletedAt
    );
  }, [aiSessions, activeWorkspace.id]);

  // Trashed sessions count in this workspace
  const trashedSessionsCount = useMemo(() => {
    return aiSessions.filter((s) => s.workspaceId === activeWorkspace.id && Boolean(s.deletedAt)).length;
  }, [aiSessions, activeWorkspace.id]);

  // Apply search query and mode filter
  const filteredSessions = useMemo(() => {
    return workspaceSessions.filter((session) => {
      // Mode filter
      if (modeFilter === 'ask' && session.agentMode !== 'ask' && session.agentMode !== undefined) return false;
      if (modeFilter === 'build' && session.agentMode !== 'build') return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = session.title.toLowerCase().includes(q);
      const messageMatch = session.messages.some((m) => m.content.toLowerCase().includes(q));
      return titleMatch || messageMatch;
    });
  }, [workspaceSessions, modeFilter, searchQuery]);

  const handleStartRename = (e: React.MouseEvent, session: AISession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    renameAISession(sessionId, editingTitle.trim());
    setEditingSessionId(null);
  };

  const handleContinueSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setActiveView('ai');
  };

  const handleCreateNewSession = (mode: 'ask' | 'build' = 'ask') => {
    startNewAISession(mode);
    setActiveView('ai');
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const res = await syncToDatabase();
      alert(res.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 select-none">
      {/* View Header */}
      <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs shrink-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-display font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    AI Session History (ประวัติการใช้งาน AI)
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    จัดการและใช้งานต่อจากประวัติการสนทนาในเวิร์กสเปซ{' '}
                    <span className="font-semibold text-sky-500">{activeWorkspace.name}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">

              <button
                type="button"
                onClick={() => {
                  if (workspaceSessions.length === 0) return;
                  workspaceSessions.forEach(s => deleteAISession(s.id));
                  setDeletedNotice(`ย้ายประวัติ ${workspaceSessions.length} เซสชันไปยัง Trash & Recovery แล้ว`);
                  setTimeout(() => setDeletedNotice(null), 3500);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title="ย้ายประวัติทั้งหมดไปถังขยะ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ย้ายไปถังขยะทั้งหมด</span>
              </button>

              <button
                onClick={() => handleCreateNewSession('ask')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-black rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>เริ่มเซสชันใหม่</span>
              </button>
            </div>
          </div>

          {/* Deleted Notice Banner */}
          {deletedNotice && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-xl text-xs shadow-lg animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400 dark:text-red-600 shrink-0" />
                <span className="font-medium">{deletedNotice}</span>
              </div>
              <button
                onClick={() => setIsTrashOpen(true)}
                className="underline font-bold hover:text-sky-400 dark:hover:text-sky-600 ml-3 shrink-0"
              >
                เปิดดูใน Trash & Recovery
              </button>
            </div>
          )}

          {/* Search Bar & Mode Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเซสชันหรือเนื้อหาแชท..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-sky-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Mode Buttons - Horizontally Scrollable on Mobile */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs overflow-x-auto no-scrollbar shrink-0 self-start sm:self-auto max-w-full">
              <button
                onClick={() => setModeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  modeFilter === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด ({workspaceSessions.length})
              </button>

              <button
                onClick={() => setModeFilter('ask')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  modeFilter === 'ask'
                    ? 'bg-white dark:bg-neutral-900 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5 shrink-0" />
                <span>Ask AI</span>
              </button>

              <button
                onClick={() => setModeFilter('build')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  modeFilter === 'build'
                    ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 shrink-0" />
                <span>Build Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <History className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-base text-neutral-800 dark:text-neutral-200">
                  {searchQuery ? 'ไม่พบเซสชันที่ตรงกัน' : 'ยังไม่มีประวัติแชท'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {searchQuery
                    ? 'ลองปรับคำค้นหาหรือเปลี่ยนฟิลเตอร์ของคุณ'
                    : 'เริ่มสนทนากับ AI เพื่อวิจัยข้อมูล, ปรับแต่งเนื้อหา หรือสร้างเทมเพลตโน้ต'}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => handleCreateNewSession('ask')}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>เริ่มเซสชันแรก</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isBuildMode = session.agentMode === 'build';
                const msgCount = session.messages.length;
                const lastMessage = session.messages[session.messages.length - 1];
                const isEditingThis = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-neutral-900 ${
                      isActive
                        ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-sky-400/60 hover:shadow-md'
                    }`}
                  >
                    {/* Top Meta Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {/* Mode Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isBuildMode
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {isBuildMode ? (
                            <>
                              <Hammer className="w-3 h-3 shrink-0" /> Build
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 shrink-0" /> Ask AI
                            </>
                          )}
                        </span>

                        {/* Active Badge / Delete Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <span className="text-[10px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-md whitespace-nowrap">
                              Active
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAISession(session.id);
                              setDeletedNotice(`ย้าย "${session.title || 'เซสชัน'}" ไปยัง Trash & Recovery แล้ว`);
                              setTimeout(() => setDeletedNotice(null), 3500);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="ย้ายไปที่ Trash & Recovery (สามารถกู้คืนได้)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title Header */}
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 border border-sky-400 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(session.id)}
                            className="p-1.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-1.5 group/title">
                          <h3
                            onClick={() => handleContinueSession(session.id)}
                            className="font-display font-bold text-sm text-neutral-900 dark:text-neutral-100 hover:text-sky-500 cursor-pointer line-clamp-1 flex-1"
                          >
                            {session.title || 'Untitled Session'}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(e, session)}
                            className="p-1 text-neutral-400 hover:text-sky-500 sm:opacity-0 sm:group-hover/title:opacity-100 transition-opacity rounded shrink-0"
                            title="Rename session"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Message Snippet */}
                      <div className="pt-0.5">
                        {lastMessage ? (
                          <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                            <div className="flex items-center gap-1 font-semibold text-[10px] text-neutral-400 uppercase">
                              <MessageSquare className="w-3 h-3 text-sky-500 shrink-0" />
                              <span>Last Message ({lastMessage.role}):</span>
                            </div>
                            <p className="line-clamp-2 leading-relaxed font-mono text-[11px]">
                              {lastMessage.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-400 italic py-2">
                            No messages recorded in this session yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata & Continue Button */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-[11px] text-neutral-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{msgCount}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(session.updatedAt || session.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>

                      <button
                        onClick={() => handleContinueSession(session.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-500 hover:text-white text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <span>ทำต่อ</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
