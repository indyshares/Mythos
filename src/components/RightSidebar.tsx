import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Link2,
  ListTree,
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
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  Edit2,
  Trash2,
  RotateCcw,
  Database,
  Check,
  Hammer,
  Bookmark,
  History,
  Copy,
  Square,
  Clock,
  PanelRightClose,
  Maximize2,
  Minimize2,
  ListOrdered,
  Ban,
  Zap,
  Cpu,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { extractHeadings } from '../utils/markdownParser';
import { ResponseConciseness } from '../types';
import { WorkspaceTreePicker } from './WorkspaceTreePicker';
import { AIQuickConfigModal } from './AIQuickConfigModal';
import { AIQueueModal, QueueItem } from './AIQueueModal';
import { AIExpandedInputModal } from './AIExpandedInputModal';
import { ChatMessageContent } from './ChatMessageContent';
import { safeFetchJson, formatFriendlyErrorMessage } from '../utils/apiHelper';

interface RightSidebarProps {
  onToggleCollapse?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ onToggleCollapse }) => {
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
    deleteAISession,
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
    getBacklinks,
    getOutgoingLinks,
    openFileInTab,
    aiProviders,
    createCustomTemplate,
    setActiveView,
    t,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'ai' | 'backlinks' | 'outline'>('ai');
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [showAttachDrawer, setShowAttachDrawer] = useState(false);
  const [showTreePicker, setShowTreePicker] = useState(false);
  const [showQuickConfigModal, setShowQuickConfigModal] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Queue, Expand, Stop controller, active generating tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const [messageQueue, setMessageQueue] = useState<QueueItem[]>([]);
  const [currentlyProcessingMessageId, setCurrentlyProcessingMessageId] = useState<string | null>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Model selection, Conciseness, Context Limits & @file Focused Notes
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');

  // Keep chat on the model chosen in AI Models settings once providers finish loading.
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

  // Headings
  const headings = activeFile ? extractHeadings(activeFile.content) : [];

  // Links
  const backlinks = activeFile ? getBacklinks(activeFile.id) : [];
  const outgoingLinks = activeFile ? getOutgoingLinks(activeFile.id) : [];

  // Active AI Session (Draft state if activeSessionId is null)
  const currentSession = activeSessionId ? aiSessions.find((s) => s.id === activeSessionId) || null : null;
  const agentMode = currentSession ? currentSession.agentMode : draftAgentMode;
  const contextLimit = currentSession?.contextLimit || 100000;

  const wsActiveFiles = files.filter(
    (f) => f.workspaceId === activeWorkspace.id && !f.deletedAt
  );

  // Copy message text to clipboard
  const handleCopyMessage = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Stop current AI generation (halts generation, keeps partial output)
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsQuerying(false);
    setCurrentlyProcessingMessageId(null);
  };

  // Cancel generation directly from user message (halts generation and deletes the user message turn)
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

      // Dynamically select the provider matching the selected model or active connected provider
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
          model: selectedModel,
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

      // If in build mode, extract markdown template codeblock if present
      if (agentMode === 'build' && data.reply) {
        const codeBlockMatch = data.reply.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
        if (codeBlockMatch && codeBlockMatch[1]) {
          setBuilderTemplateContent(codeBlockMatch[1].trim());
        }
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // User aborted, do not append error message
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

  // Calculate estimated context tokens
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

  const removeFocusedFile = (fileId: string) => {
    setFocusedFileIds((prev) => prev.filter((id) => id !== fileId));
  };

  const handleManualSyncDatabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncToDatabase();
      alert(res.message);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Revert chat session to a previous message
  const handleRevertToMessage = (messageId: string) => {
    if (!currentSession) return;
    if (confirm('Revert chat to this point? Future messages in this turn will be removed.')) {
      revertAISessionToMessage(currentSession.id, messageId);
    }
  };

  // Delete message: if deleting active generating message, treat as cancel
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

  // Start editing a user message
  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  // Save edit and optionally resend
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

  // Send message to AI Assistant
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
      // If AI is currently answering, add to queue
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

  const handleSaveBuilderTemplate = () => {
    if (!builderTemplateContent.trim()) return;
    createCustomTemplate({
      name: builderTemplateTitle.trim() || 'AI Generated Template',
      category: 'AI Generated',
      description: 'Template created via AI Template Builder',
      icon: 'Sparkles',
      defaultFilename: `${builderTemplateTitle.trim().replace(/\s+/g, '_')}.md`,
      templateContent: builderTemplateContent,
    });
    alert('บันทึกเทมเพลตที่สร้างจาก AI ลงใน Template Library เรียบร้อยแล้ว!');
  };

  return (
    <aside className="w-80 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col h-full select-none shrink-0">
      {/* Sidebar Tabs Header */}
      <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 px-2 flex items-center justify-around shrink-0 bg-white dark:bg-neutral-900 text-xs">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-accent-subtle text-accent font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="AI Knowledge Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-sky-500" />
          <span>AI Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('backlinks')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-medium transition-colors ${
            activeTab === 'backlinks'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Backlinks & References"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Links ({backlinks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md font-medium transition-colors ${
            activeTab === 'outline'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          }`}
          title="Headings Outline"
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>{t('nav.outline')}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* PANEL 1: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col h-full">
            {/* Security Banner & Agent Tabs ("Ask" vs "Build") */}
            <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 space-y-2.5 text-xs">
              {/* Row 1: Segmented Agent Mode Switcher + Session Actions */}
              <div className="flex items-center justify-between gap-2">
                {/* Agent Mode Switcher */}
                <div className="inline-flex items-center bg-neutral-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px] font-medium shrink-0">
                  <button
                    onClick={() => {
                      if (currentSession) {
                        updateAISessionAgentMode(currentSession.id, 'ask');
                      } else {
                        setDraftAgentMode('ask');
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                      agentMode === 'ask'
                        ? 'bg-white dark:bg-neutral-950 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('sidebar.ask')}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (currentSession) {
                        updateAISessionAgentMode(currentSession.id, 'build');
                      } else {
                        setDraftAgentMode('build');
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                      agentMode === 'build'
                        ? 'bg-white dark:bg-neutral-950 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('nav.build')}</span>
                  </button>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setActiveView('sessions')}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-sky-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 font-semibold transition-colors whitespace-nowrap"
                    title="View Chat Session History"
                  >
                    <History className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{t('nav.history')}</span>
                  </button>

                  <button
                    onClick={() => startNewAISession(agentMode)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-[11px] font-semibold transition-colors shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('sidebar.new')}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Database Sync Status Badge + Pin Note Context Button */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleManualSyncDatabase}
                  disabled={isSyncingDb}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-colors whitespace-nowrap ${
                    dbConfig.enabled
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Database className="w-3 h-3 shrink-0" />
                  <span>{dbConfig.enabled ? dbConfig.type.toUpperCase() : 'Local DB'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAttachDrawer(!showAttachDrawer)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors whitespace-nowrap ${
                      manualContextIds.length > 0
                        ? 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Paperclip className="w-3 h-3 shrink-0" />
                    <span>
                      {manualContextIds.length > 0
                        ? `${manualContextIds.length} pinned`
                        : 'Pin note to context'}
                    </span>
                  </button>

                  {manualContextIds.length > 0 && (
                    <button
                      onClick={clearManualContext}
                      className="text-[10px] text-neutral-400 hover:text-red-500 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: Context Token Usage Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>Context: {estimatedTokens} / {contextLimit}</span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20" title="Auto Compacts when tokens > 80%">
                      <Zap className="w-2.5 h-2.5 text-emerald-500 fill-current" /> Auto
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {currentSession && currentSession.messages.length > 2 && (
                      <button
                        type="button"
                        onClick={() => compactAISessionContext(currentSession.id)}
                        className="px-1.5 py-0.2 text-[9px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded border border-sky-500/20 transition-all active:scale-95"
                        title="บีบอัด Context อัตโนมัติทันที"
                      >
                        ⚡ Compact
                      </button>
                    )}
                    <span className={tokenPercentage > 80 ? 'text-amber-500 font-bold' : 'text-sky-500 font-semibold'}>
                      {tokenPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${tokenPercentage > 80 ? 'bg-amber-500' : 'bg-sky-500'}`}
                    style={{ width: `${tokenPercentage}%` }}
                  />
                </div>
              </div>

              {/* Pin note button */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAttachDrawer(!showAttachDrawer)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
                    manualContextIds.length > 0
                      ? 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Paperclip className="w-3 h-3" />
                  <span>
                    {manualContextIds.length > 0
                      ? `${manualContextIds.length} pinned to prompt`
                      : 'Pin note to context'}
                  </span>
                </button>

                {manualContextIds.length > 0 && (
                  <button
                    onClick={clearManualContext}
                    className="text-[10px] text-neutral-400 hover:text-red-500"
                  >
                    Clear pins
                  </button>
                )}
              </div>

              {/* Drawer for pinning context */}
              {showAttachDrawer && (
                <div className="mt-2 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-36 overflow-y-auto space-y-1">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase">
                    Pin notes to prompt context:
                  </span>
                  {wsActiveFiles.map((file) => {
                    const isAttached = manualContextIds.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleManualContextId(file.id)}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs"
                      >
                        <span className="truncate pr-2">{file.name}</span>
                        {isAttached && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Template Builder Preview (if in Build Mode) */}
            {agentMode === 'build' && builderTemplateContent && (
              <div className="p-3 border-b border-amber-500/20 bg-amber-500/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Template Builder Preview
                  </span>
                  <button
                    onClick={handleSaveBuilderTemplate}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" /> Save Template
                  </button>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-3 font-mono bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  {builderTemplateContent.slice(0, 180)}...
                </p>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
              {!currentSession || currentSession.messages.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 space-y-2">
                  <Sparkles className="w-6 h-6 mx-auto text-sky-500/80" />
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    {agentMode === 'build' ? 'AI Template Builder Mode' : 'Ask anything about this workspace'}
                  </p>
                  <p className="text-[11px] text-neutral-400 max-w-[210px] mx-auto">
                    Use <strong className="text-sky-500">@file</strong> to browse full workspace folder structure and focus on files.
                  </p>
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
                        <div className="w-full flex items-center justify-center my-2.5 animate-in fade-in duration-200 select-none">
                          <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                          <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                            <Cpu className="w-3 h-3 text-sky-500 stroke-[2.5]" />
                            <span>Switch model to <strong className="text-sky-600 dark:text-sky-400 font-extrabold">{msg.model}</strong></span>
                          </span>
                          <div className="flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
                        </div>
                      )}

                      <div
                        className={`group flex flex-col space-y-1 ${
                          isEditingThis ? 'w-full' : isUser ? 'items-end' : 'items-start'
                        }`}
                      >
                      <div
                        className={`relative rounded-xl leading-relaxed transition-all ${
                          isEditingThis
                            ? 'w-full p-3 bg-white dark:bg-neutral-900 border-2 border-sky-500 shadow-md text-neutral-900 dark:text-neutral-100'
                            : isUser
                            ? 'max-w-[92%] p-2.5 bg-sky-500 text-white font-medium shadow-xs'
                            : 'max-w-[92%] p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="w-full space-y-2.5 text-neutral-900 dark:text-neutral-100">
                            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                              <span className="flex items-center gap-1.5 text-sky-500 font-bold">
                                <Edit2 className="w-3.5 h-3.5" /> แก้ไขข้อความแชท
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditExpanded(true)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors text-[10px] font-bold"
                                title="ขยายเต็มจอ (Expand Fullscreen)"
                              >
                                <Maximize2 className="w-3 h-3" />
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
                              className="w-full min-h-[120px] p-3 text-xs leading-relaxed bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-sky-500 font-sans resize-y"
                              placeholder="แก้ไขข้อความ... (Shift+Enter เพื่อขึ้นบรรทัดใหม่, Enter เพื่อส่ง)"
                              autoFocus
                            />
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="text-[10px] text-neutral-400">
                                Shift+Enter ขึ้นบรรทัดใหม่
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(false)}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 font-medium"
                                >
                                  บันทึก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(true)}
                                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium flex items-center gap-1 shadow-xs"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>บันทึกและถาม</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ChatMessageContent content={msg.content} isUser={isUser} onOpenFile={openFileInTab} />

                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">
                                  Sources cited:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {msg.citations.map((cite, cIdx) => (
                                    <button
                                      key={cIdx}
                                      onClick={() => openFileInTab(cite.fileId)}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-neutral-700 dark:text-neutral-300 rounded text-[10px] transition-colors"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5 text-sky-500" />
                                      <span>{cite.fileName}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Dedicated Cancel button directly under the user message when AI is generating for it */}
                      {isGeneratingThis && (
                        <div className="flex items-center justify-end gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleCancelGeneratingMessage(msg.id)}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-[11px] font-bold rounded-lg border border-red-500/30 flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                            title="ยกเลิกคำขอนี้และหยุดการสร้างคำตอบ"
                          >
                            <Ban className="w-3 h-3" />
                            <span>ยกเลิก</span>
                          </button>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div
                          className={`flex items-center gap-1.5 text-[10px] text-neutral-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-sky-500 p-0.5 rounded transition-colors"
                            title="Copy message"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>

                          {isUser && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg.id, msg.content)}
                              className="hover:text-sky-500 p-0.5 rounded transition-colors"
                              title="แก้ไขข้อความ"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRevertToMessage(msg.id)}
                            className="hover:text-sky-500 p-0.5 rounded transition-colors"
                            title="ย้อนกลับมาที่ข้อความนี้"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="hover:text-red-500 p-0.5 rounded transition-colors"
                            title="ลบข้อความ (หาก AI กำลังทำงานจะถือเป็นการยกเลิก)"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
                })
              )}

              {isQuerying && (
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-500 text-xs">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                    <span>Processing response...</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-semibold flex items-center gap-1"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
            </div>

            {/* Input Action Controls Container */}
            <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
              {/* Queue Status Banner with interactive Manage Queue button */}
              {messageQueue.length > 0 && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/30">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>รอในคิว ({messageQueue.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQueueModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95"
                  >
                    <ListOrdered className="w-3 h-3" />
                    <span>จัดการคิว</span>
                  </button>
                </div>
              )}

              {/* Active Focused Notes (@file chips) */}
              {focusedFileIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pb-1">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                    <AtSign className="w-2.5 h-2.5" /> Focus:
                  </span>
                  {focusedFileIds.map((fId) => {
                    const f = files.find((item) => item.id === fId);
                    if (!f) return null;
                    return (
                      <span
                        key={fId}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded text-[10px] font-semibold border border-sky-500/30"
                      >
                        <span>@{f.name.replace(/\.md$/, '')}</span>
                        <button
                          type="button"
                          onClick={() => removeFocusedFile(fId)}
                          className="hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Tree Picker Popover for @file */}
              {showTreePicker && (
                <WorkspaceTreePicker
                  selectedFileIds={focusedFileIds}
                  onToggleFile={toggleFocusedFile}
                  onClose={() => setShowTreePicker(false)}
                />
              )}

              {/* Main Message Input Form - Unified Modern Container */}
              <form onSubmit={handleSendMessage} className="space-y-1.5">
                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2.5 shadow-xs focus-within:border-sky-500/80 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all flex flex-col gap-2">
                  
                  {/* Textarea */}
                  <textarea
                    rows={2}
                    placeholder={
                      isQuerying
                        ? 'พิมพ์ข้อความถัดไป (จะเข้าคิวอัตโนมัติ)...'
                        : agentMode === 'build'
                        ? 'อธิบายเทมเพลตที่ต้องการสร้าง...'
                        : 'ถาม AI Assistant... (Shift+Enter ขึ้นบรรทัดใหม่)'
                    }
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full min-h-[42px] max-h-36 px-1.5 pt-0.5 text-xs leading-relaxed bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none resize-none font-sans"
                  />

                  {/* Integrated Action Row inside the Chat Box */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    
                    {/* Left Tools */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowTreePicker(!showTreePicker)}
                        className={`h-7 px-2 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                          focusedFileIds.length > 0
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold'
                            : 'text-neutral-500 hover:text-sky-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        title="Tag / Focus files (@file)"
                      >
                        <AtSign className="w-3.5 h-3.5" />
                        <span>@file</span>
                        {focusedFileIds.length > 0 && (
                          <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center ml-0.5">
                            {focusedFileIds.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInputExpanded(true)}
                        className="h-7 px-2 text-neutral-500 hover:text-sky-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        title="พิมพ์แชทเต็มจอ (Expand Fullscreen)"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">เต็มจอ</span>
                      </button>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowQuickConfigModal(true)}
                        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-sky-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="AI Quick Settings"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {isQuerying ? (
                        <button
                          type="button"
                          onClick={handleStopGeneration}
                          className="w-7 h-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center shadow-xs transition-all active:scale-95"
                          title="หยุดการประมวลผล (Stop)"
                        >
                          <Square className="w-3 h-3 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!inputQuery.trim()}
                          className="w-7 h-7 bg-sky-500 hover:bg-sky-600 disabled:opacity-30 text-white rounded-lg transition-all flex items-center justify-center shadow-xs active:scale-95"
                          title="ส่งข้อความ"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PANEL 2: BACKLINKS */}
        {activeTab === 'backlinks' && (
          <div className="p-3 space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Backlinks (Referenced in)
                </span>
                <span className="text-[10px] text-neutral-400">{backlinks.length} notes</span>
              </div>

              {backlinks.length === 0 ? (
                <p className="text-neutral-400 italic text-[11px]">
                  No other notes link to this note yet. Use [[{activeFile?.name.replace(/\.md$/, '')}]] in another note to link.
                </p>
              ) : (
                <div className="space-y-2">
                  {backlinks.map(({ file, snippet }) => (
                    <div
                      key={file.id}
                      onClick={() => openFileInTab(file.id)}
                      className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md cursor-pointer hover:border-sky-500/50 transition-colors"
                    >
                      <div className="font-medium text-sky-600 dark:text-sky-400 flex items-center justify-between mb-1">
                        <span>{file.name.replace(/\.md$/, '')}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-2">{snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: OUTLINE */}
        {activeTab === 'outline' && (
          <div className="p-3 text-xs space-y-1">
            <div className="pb-1 mb-2 border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300">
              Table of Contents
            </div>

            {headings.length === 0 ? (
              <p className="text-neutral-400 italic text-[11px]">
                No headings found in this document. Add # Heading 1 to build outline.
              </p>
            ) : (
              headings.map((h, i) => (
                <div
                  key={i}
                  className="py-1 px-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer text-neutral-700 dark:text-neutral-300 truncate"
                  style={{ paddingLeft: `${(h.level - 1) * 12 + 6}px` }}
                >
                  <span className="font-mono text-[10px] text-sky-500 mr-1.5 font-bold">H{h.level}</span>
                  <span>{h.text}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Config Modal */}
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
    </aside>
  );
};
