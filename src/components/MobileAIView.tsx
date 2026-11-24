import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Plus,
  RefreshCw,
  AtSign,
  X,
  Edit2,
  Trash2,
  RotateCcw,
  Database,
  Check,
  Sliders,
  Hammer,
  Bookmark,
  Copy,
  Square,
  Clock,
  History,
  Link2,
  ListTree,
  Zap,
  Maximize2,
  Minimize2,
  ListOrdered,
  Ban,
  ChevronUp,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ResponseConciseness } from '../types';
import { WorkspaceTreePicker } from './WorkspaceTreePicker';
import { AIQuickConfigModal } from './AIQuickConfigModal';
import { AIQueueModal, QueueItem } from './AIQueueModal';
import { AIExpandedInputModal } from './AIExpandedInputModal';
import { ChatMessageContent } from './ChatMessageContent';
import { safeFetchJson, formatFriendlyErrorMessage } from '../utils/apiHelper';
import { extractHeadings } from '../utils/markdownParser';

interface MobileAIViewProps {
  onOpenFile: (fileId: string) => void;
}

export const MobileAIView: React.FC<MobileAIViewProps> = ({ onOpenFile }) => {
  const {
    activeFile,
    activeWorkspace,
    workspaceInstructions,
    aiSessions,
    activeSessionId,
    setActiveSessionId,
    draftAgentMode,
    setDraftAgentMode,
    startNewAISession,
    createAISession,
    addAIMessage,
    editAIMessage,
    deleteAIMessage,
    revertAISessionToMessage,
    updateAISessionContextLimit,
    updateAISessionAgentMode,
    compactAISessionContext,
    dbConfig,
    syncToDatabase,
    files,
    manualContextIds,
    toggleManualContextId,
    clearManualContext,
    aiProviders,
    createCustomTemplate,
    setActiveView,
    getBacklinks,
    openFileInTab,
    t,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'ai' | 'links' | 'outline'>('ai');
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [showTreePicker, setShowTreePicker] = useState(false);
  const [showQuickConfigModal, setShowQuickConfigModal] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  // Edit message state & expansion
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Stop controller, message queueing, copy status, active generating tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const [messageQueue, setMessageQueue] = useState<QueueItem[]>([]);
  const [currentlyProcessingMessageId, setCurrentlyProcessingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Model & Conciseness & Focused Files
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');

  useEffect(() => {
    const preferred = aiProviders.find((p) => p.isDefault) || aiProviders.find((p) => p.isConnected) || aiProviders[0];
    if (preferred?.defaultModel && !preferred.availableModels?.includes(selectedModel)) {
      setSelectedModel(preferred.defaultModel);
    }
  }, [aiProviders]);
  const [conciseness, setConciseness] = useState<ResponseConciseness>('balanced');
  const [focusedFileIds, setFocusedFileIds] = useState<string[]>([]);

  // Template builder preview state
  const [builderTemplateTitle, setBuilderTemplateTitle] = useState('Generated Template');
  const [builderTemplateContent, setBuilderTemplateContent] = useState('');

  // Active AI Session (Draft state if activeSessionId is null)
  const currentSession = activeSessionId ? aiSessions.find((s) => s.id === activeSessionId) || null : null;
  const agentMode = currentSession ? currentSession.agentMode : draftAgentMode;
  const contextLimit = currentSession?.contextLimit || 100000;

  const wsActiveFiles = files.filter(
    (f) => f.workspaceId === activeWorkspace.id && !f.deletedAt
  );

  // Links & Outline
  const backlinks = activeFile ? getBacklinks(activeFile.id) : [];
  const headings = activeFile ? extractHeadings(activeFile.content) : [];

  // Copy message text to clipboard
  const handleCopyMessage = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Stop current AI generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsQuerying(false);
    setCurrentlyProcessingMessageId(null);
  };

  // Cancel generation directly from user message
  const handleCancelGeneratingMessage = (messageId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsQuerying(false);
    setCurrentlyProcessingMessageId(null);
    if (currentSession) {
      deleteAIMessage(currentSession.id, messageId);
    }
  };

  // Queue management handlers
  const handleUpdateQueueItem = (id: string, newPrompt: string) => {
    setMessageQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, prompt: newPrompt } : item))
    );
  };

  const handleRemoveQueueItem = (id: string) => {
    setMessageQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReorderQueue = (fromIndex: number, toIndex: number) => {
    setMessageQueue((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleClearQueue = () => {
    setMessageQueue([]);
  };

  const triggerAIGeneration = async (promptText: string, sessionId: string, msgId?: string) => {
    setIsQuerying(true);
    if (msgId) setCurrentlyProcessingMessageId(msgId);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Auto compact context check if estimated tokens > 80% of limit
      if (estimatedTokens > contextLimit * 0.8) {
        compactAISessionContext(sessionId);
      }

      // Find active provider matching selectedModel, fallback to connected or gemini-native
      const activeProvider =
        aiProviders.find((p) => p.availableModels?.includes(selectedModel) || p.defaultModel === selectedModel) ||
        aiProviders.find((p) => p.isConnected && p.customApiKey) ||
        aiProviders[0] || {
          protocol: 'gemini',
          defaultModel: 'gemini-3.5-flash',
        };

      const wsFiles = wsActiveFiles.map((f) => ({
        id: f.id,
        name: f.name,
        path: `/${f.name}`,
        content: f.content,
      }));

      const manualFiles = wsFiles.filter((f) => manualContextIds.includes(f.id));
      const focusedNotes = wsFiles.filter((f) => focusedFileIds.includes(f.id));

      const sess = aiSessions.find((s) => s.id === sessionId) || currentSession;
      const history = sess ? sess.messages.filter((m) => m.content !== promptText) : [];

      const modePrompt =
        agentMode === 'build'
          ? `[AGENT MODE: TEMPLATE BUILDER]\nHelp build, format, and structure a custom note template according to user specifications.\n`
          : '';

      const data = await safeFetchJson<{ reply: string; citations?: any[] }>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          workspaceName: activeWorkspace.name,
          question: `${modePrompt}${promptText}`,
          chatHistory: history,
          workspaceInstructions: workspaceInstructions.content,
          manualContextFiles: manualFiles,
          focusedFiles: focusedNotes,
          conciseness,
          allFiles: wsFiles,
          provider: activeProvider.protocol,
          model: selectedModel || activeProvider.defaultModel,
          customApiKey: activeProvider.customApiKey,
          baseUrl: activeProvider.baseUrl,
        }),
      });

      const aiResponse = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
        model: selectedModel,
      };

      addAIMessage(sessionId, aiResponse);

      if (agentMode === 'build') {
        setBuilderTemplateContent(data.reply);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Cancelled by user
      } else {
        const friendlyMsg = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant' as const,
          content: formatFriendlyErrorMessage(error),
          timestamp: new Date().toISOString(),
          model: selectedModel,
        };
        addAIMessage(sessionId, friendlyMsg);
      }
    } finally {
      abortControllerRef.current = null;
      setIsQuerying(false);
      setCurrentlyProcessingMessageId(null);
    }
  };

  const processNextInQueue = useCallback(async () => {
    if (messageQueue.length === 0 || isQuerying) return;
    const nextItem = messageQueue[0];
    setMessageQueue((prev) => prev.slice(1));

    const userMsgId = `msg-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user' as const,
      content: nextItem.prompt,
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };
    addAIMessage(nextItem.sessionId, userMessage);
    await triggerAIGeneration(nextItem.prompt, nextItem.sessionId, userMsgId);
  }, [messageQueue, isQuerying, addAIMessage, triggerAIGeneration, selectedModel]);

  useEffect(() => {
    if (!isQuerying && messageQueue.length > 0) {
      processNextInQueue();
    }
  }, [isQuerying, messageQueue, processNextInQueue]);

  const estimatedTokens = useMemo(() => {
    if (!currentSession) return 0;
    const msgChars = currentSession.messages.reduce((acc, m) => acc + m.content.length, 0);
    const contextChars = manualContextIds.reduce((acc, id) => {
      const f = files.find((item) => item.id === id);
      return acc + (f ? f.content.length : 0);
    }, 0);
    return Math.round((msgChars + contextChars) / 4);
  }, [currentSession, manualContextIds, files]);

  const tokenPercentage = Math.min(100, Math.round((estimatedTokens / contextLimit) * 100));

  const toggleFocusedFile = (fileId: string) => {
    setFocusedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleManualSyncDb = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncToDatabase();
      alert(res.message);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleRevertToMessage = (messageId: string) => {
    if (!currentSession) return;
    if (confirm('ย้อนประวัติแชทกลับมาที่ข้อความนี้หรือไม่? ข้อความหลังจากนี้จะถูกลบออก')) {
      revertAISessionToMessage(currentSession.id, messageId);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentSession) return;
    if (isQuerying && currentlyProcessingMessageId === messageId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsQuerying(false);
      setCurrentlyProcessingMessageId(null);
    }
    deleteAIMessage(currentSession.id, messageId);
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (resend = false) => {
    if (!currentSession || !editingMessageId || !editingContent.trim()) {
      setEditingMessageId(null);
      setIsEditExpanded(false);
      return;
    }

    const targetMsgId = editingMessageId;
    const newText = editingContent.trim();
    editAIMessage(currentSession.id, targetMsgId, newText);
    setEditingMessageId(null);
    setIsEditExpanded(false);

    if (resend) {
      revertAISessionToMessage(currentSession.id, targetMsgId);
      await triggerAIGeneration(newText, currentSession.id, targetMsgId);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = inputQuery.trim();
    if (!promptText) return;
    setInputQuery('');

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const newSess = createAISession(promptText.slice(0, 30), agentMode);
      targetSessionId = newSess.id;
    }

    if (isQuerying) {
      setMessageQueue((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          prompt: promptText,
          sessionId: targetSessionId!,
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const userMsgId = `msg-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user' as const,
      content: promptText,
      timestamp: new Date().toISOString(),
      model: selectedModel,
    };

    addAIMessage(targetSessionId, userMessage);
    setCurrentlyProcessingMessageId(userMsgId);
    await triggerAIGeneration(promptText, targetSessionId, userMsgId);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 select-none overflow-hidden relative">
      {/* Header Tabs (Image 1 Style) */}
      <div className="h-16 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-10">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
           <button
             onClick={() => {
               if (currentSession) {
                 updateAISessionAgentMode(currentSession.id, 'ask');
               } else {
                 setDraftAgentMode('ask');
               }
             }}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold ${
               agentMode === 'ask' 
                 ? 'bg-white dark:bg-neutral-900 text-sky-500 shadow-sm' 
                 : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
             }`}
           >
             <Bot className="w-4 h-4" />
             <span>Ask AI</span>
           </button>
           <button
             onClick={() => {
               if (currentSession) {
                 updateAISessionAgentMode(currentSession.id, 'build');
               } else {
                 setDraftAgentMode('build');
               }
             }}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold ${
               agentMode === 'build' 
                 ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-sm' 
                 : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
             }`}
           >
             <Hammer className="w-4 h-4" />
             <span>{t('nav.build')}</span>
           </button>
        </div>

        <div className="flex items-center gap-2">
           <button
             onClick={handleManualSyncDb}
             disabled={isSyncingDb}
             className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all"
           >
             <Database className="w-4 h-4" />
             <span className="text-[11px] font-bold hidden sm:inline">Local</span>
           </button>
           <button
             onClick={() => setActiveView('sessions')}
             className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all"
           >
             <History className="w-4 h-4" />
           </button>
           <button
             onClick={() => startNewAISession(agentMode)}
             className="w-10 h-10 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
           >
             <Plus className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Sub-tabs (Links / Outline) */}
      <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 gap-6 shrink-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
         <button onClick={() => setActiveTab('ai')} className={`text-[11px] font-bold transition-all ${activeTab === 'ai' ? 'text-sky-500' : 'text-neutral-400'}`}>Chat</button>
         <button onClick={() => setActiveTab('links')} className={`text-[11px] font-bold transition-all ${activeTab === 'links' ? 'text-sky-500' : 'text-neutral-400'}`}>Links ({backlinks.length})</button>
         <button onClick={() => setActiveTab('outline')} className={`text-[11px] font-bold transition-all ${activeTab === 'outline' ? 'text-sky-500' : 'text-neutral-400'}`}>Outline</button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Context usage bar */}
            <div className="px-4 py-2 bg-neutral-50/50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
               <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
                 <span>Context: {estimatedTokens} / {contextLimit} tokens</span>
                 <span className="font-bold text-sky-500">{tokenPercentage}%</span>
               </div>
               <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                 <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${tokenPercentage}%` }} />
               </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-44">
              {!currentSession || currentSession.messages.length === 0 ? (
                <div className="py-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto text-sky-500 border border-sky-500/20 shadow-2xl">
                     <Sparkles className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-100">Mythos Knowledge AI Assistant</h2>
                    <p className="text-xs text-neutral-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                       แท็กไฟล์ด้วย <strong className="text-sky-500 font-bold">@file</strong> เพื่อโฟกัสและดึงโครงสร้างโฟลเดอร์ใน Workspace!
                    </p>
                  </div>
                </div>
              ) : (
                currentSession.messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const isEditingThis = editingMessageId === msg.id;
                  const isGeneratingThis = isQuerying && currentlyProcessingMessageId === msg.id;

                  const prevMsg = index > 0 ? currentSession.messages[index - 1] : null;
                  const isModelSwitch = Boolean(
                    msg.model &&
                    prevMsg &&
                    prevMsg.model &&
                    msg.model !== prevMsg.model
                  );

                  return (
                    <React.Fragment key={msg.id}>
                      {isModelSwitch && (
                        <div className="w-full flex items-center justify-center my-3 animate-in fade-in duration-200 select-none">
                          <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                          <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                            <Cpu className="w-3 h-3 text-sky-500 stroke-[2.5]" />
                            <span>Switch model to <strong className="text-sky-600 dark:text-sky-400 font-extrabold">{msg.model}</strong></span>
                          </span>
                          <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                        </div>
                      )}

                      <div key={msg.id} className={`flex flex-col space-y-1.5 ${isEditingThis ? 'w-full' : isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-3xl leading-relaxed text-[13px] shadow-sm transition-all ${
                        isEditingThis
                          ? 'w-full bg-white dark:bg-neutral-900 border-2 border-sky-500 text-neutral-900 dark:text-neutral-100'
                          : isUser 
                          ? 'max-w-[90%] bg-sky-500 text-white font-medium shadow-xs border border-sky-400/30' 
                          : 'max-w-[90%] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}>
                        {isEditingThis ? (
                          <div className="w-full space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                              <span className="flex items-center gap-1.5 text-sky-500 font-bold">
                                <Edit2 className="w-4 h-4" /> แก้ไขข้อความแชท
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditExpanded(true)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[11px] font-bold"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>ขยายเต็มจอ</span>
                              </button>
                            </div>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(true);
                                }
                              }}
                              rows={4}
                              className="w-full min-h-[120px] p-3 text-xs leading-relaxed bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl outline-none focus:border-sky-500 font-sans resize-y"
                              placeholder="แก้ไขข้อความ... (Shift+Enter ขึ้นบรรทัดใหม่, Enter เพื่อส่ง)"
                              autoFocus
                            />
                            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                              <span className="text-[10px] text-neutral-400">
                                Shift+Enter ขึ้นบรรทัดใหม่
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(false)}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 font-bold text-xs"
                                >
                                  บันทึก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(true)}
                                  className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-sky-500/20"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>{t('sidebar.new')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <ChatMessageContent content={msg.content} isUser={isUser} onOpenFile={openFileInTab} />
                        )}
                      </div>

                      {/* Dedicated Cancel button directly under user message currently being processed */}
                      {isGeneratingThis && (
                        <div className="flex items-center justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleCancelGeneratingMessage(msg.id)}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-bold rounded-xl border border-red-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                            title="ยกเลิกคำขอนี้และหยุดการสร้างคำตอบ"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{t('common.cancel')}</span>
                          </button>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 px-2 font-bold uppercase tracking-widest">
                           <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <button onClick={() => handleCopyMessage(msg.id, msg.content)} className="hover:text-sky-500">
                              {copiedMessageId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                           </button>
                           {isUser && <button onClick={() => handleStartEdit(msg.id, msg.content)} className="hover:text-sky-500"><Edit2 className="w-3 h-3" /></button>}
                           <button onClick={() => handleRevertToMessage(msg.id)} className="hover:text-sky-500"><RotateCcw className="w-3 h-3" /></button>
                           <button onClick={() => handleDeleteMessage(msg.id)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
                })
              )}

              {isQuerying && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 animate-pulse text-sky-500" />
                      <span className="text-[11px] font-bold text-neutral-500 italic">Thinking...</span>
                   </div>
                   <button onClick={handleStopGeneration} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black transition-all">{t('sidebar.stop')}</button>
                </div>
              )}
            </div>

            {/* Bottom Input Fixed */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pb-safe bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 z-20 space-y-2">
               {/* Queue Status Banner with interactive Manage Queue button */}
               {messageQueue.length > 0 && (
                 <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30">
                   <div className="flex items-center gap-2">
                     <Clock className="w-4 h-4 animate-pulse" />
                     <span>รอในคิว ({messageQueue.length})</span>
                   </div>
                   <button
                     type="button"
                     onClick={() => setShowQueueModal(true)}
                     className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
                   >
                     <ListOrdered className="w-3.5 h-3.5" />
                     <span>จัดการคิว</span>
                   </button>
                 </div>
               )}

               {showTreePicker && (
                 <div className="mb-4 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white dark:bg-neutral-950 animate-in slide-in-from-bottom-4 duration-300">
                   <WorkspaceTreePicker
                     selectedFileIds={focusedFileIds}
                     onToggleFile={toggleFocusedFile}
                     onClose={() => setShowTreePicker(false)}
                   />
                 </div>
               )}

               {/* Mobile Unified Input Bar */}
               <form onSubmit={handleSendMessage} className="w-full">
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-3 shadow-lg focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all flex flex-col gap-2">
                    
                    {/* Textarea */}
                    <textarea
                      rows={2}
                      placeholder={
                        isQuerying
                          ? "พิมพ์ข้อความถัดไป (จะเข้าคิวอัตโนมัติ)..."
                          : agentMode === "build"
                          ? "อธิบายเทมเพลตที่ต้องการ..."
                          : "พิมพ์คำถาม... (Shift+Enter ขึ้นบรรทัดใหม่)"
                      }
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="w-full min-h-[44px] max-h-36 px-1 text-xs leading-relaxed bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none resize-none font-sans"
                    />

                    {/* Integrated Mobile Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                      
                      {/* Left Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowTreePicker(!showTreePicker)}
                          className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all touch-manipulation ${
                            focusedFileIds.length > 0
                              ? "bg-sky-500 text-white shadow-xs"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                          }`}
                          title="แท็กไฟล์ (@file)"
                        >
                          <AtSign className="w-4 h-4" />
                          <span>@file</span>
                          {focusedFileIds.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white text-sky-600 text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                              {focusedFileIds.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsInputExpanded(true)}
                          className="h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-all touch-manipulation"
                          title="พิมพ์แชทเต็มจอ (Expand Fullscreen)"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickConfigModal(true)}
                          className="h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-all touch-manipulation"
                          title="AI Quick Settings"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        {isQuerying ? (
                          <button
                            type="button"
                            onClick={handleStopGeneration}
                            className="h-9 w-9 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all touch-manipulation"
                            title="หยุดการประมวลผล (Stop)"
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={!inputQuery.trim()}
                            className={`h-9 min-w-[36px] px-3.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all touch-manipulation ${
                              !inputQuery.trim() ? "opacity-40 cursor-not-allowed" : ""
                            }`}
                            title="ส่งข้อความ"
                          >
                            <Send className="w-4 h-4 shrink-0" />
                            <span className="hidden xs:inline">ส่ง</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
            </div>
          </div>
        )}

        {activeTab === 'links' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {backlinks.length === 0 ? (
               <div className="py-20 text-center text-neutral-400 italic text-[11px]">No notes link here yet.</div>
             ) : (
               backlinks.map(({ file, snippet }) => (
                 <div key={file.id} onClick={() => { openFileInTab(file.id); setActiveView('editor'); }} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl cursor-pointer hover:border-sky-500 transition-all shadow-sm">
                   <div className="font-black text-sky-500 text-xs mb-2 uppercase tracking-widest">{file.name.replace(/\.md$/, '')}</div>
                   <p className="text-[11px] text-neutral-500 leading-relaxed italic line-clamp-3">{snippet}</p>
                 </div>
               ))
             )}
          </div>
        )}

        {activeTab === 'outline' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
             {headings.length === 0 ? (
               <div className="py-20 text-center text-neutral-400 italic text-[11px]">No headings found.</div>
             ) : (
               headings.map((h, i) => (
                 <div key={i} className="py-3 px-4 hover:bg-sky-500/10 rounded-2xl cursor-pointer text-neutral-700 dark:text-neutral-300 transition-all flex items-center gap-4" style={{ marginLeft: `${(h.level - 1) * 16}px` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                    <span className="font-bold text-[13px]">{h.text}</span>
                 </div>
               ))
             )}
          </div>
        )}
      </div>

      <AIQuickConfigModal
        isOpen={showQuickConfigModal}
        onClose={() => setShowQuickConfigModal(false)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        conciseness={conciseness}
        setConciseness={setConciseness}
        contextLimit={contextLimit}
        setContextLimit={(limit) => {
          if (currentSession) {
            updateAISessionContextLimit(currentSession.id, limit);
          } else {
            const newSess = createAISession('New Investigation', agentMode);
            updateAISessionContextLimit(newSess.id, limit);
          }
        }}
        onOpenFullSettings={() => {
          setShowQuickConfigModal(false);
          window.dispatchEvent(new CustomEvent('open-workspace-settings', { detail: { tab: 'providers' } }));
        }}
      />

      {/* AI Queue Modal */}
      <AIQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        queue={messageQueue}
        onUpdateItem={handleUpdateQueueItem}
        onRemoveItem={handleRemoveQueueItem}
        onReorder={handleReorderQueue}
        onClearQueue={handleClearQueue}
      />

      {/* Expanded Prompt Modal */}
      <AIExpandedInputModal
        isOpen={isInputExpanded}
        onClose={() => setIsInputExpanded(false)}
        value={inputQuery}
        onChange={setInputQuery}
        onSubmit={() => handleSendMessage()}
        isQuerying={isQuerying}
        mode="prompt"
        title="พิมพ์แชทเต็มจอ (Expanded Mode)"
      />

      {/* Expanded Message Edit Modal */}
      <AIExpandedInputModal
        isOpen={isEditExpanded}
        onClose={() => setIsEditExpanded(false)}
        value={editingContent}
        onChange={setEditingContent}
        onSubmit={() => handleSaveEdit(true)}
        onSaveOnly={() => handleSaveEdit(false)}
        isQuerying={isQuerying}
        mode="edit"
        title="แก้ไขข้อความแชทเต็มจอ (Edit Message)"
      />
    </div>
  );
};
