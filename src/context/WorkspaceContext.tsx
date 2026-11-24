import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import {
  Workspace,
  Folder,
  FileItem,
  FileVersion,
  FileOperation,
  TabItem,
  ActiveView,
  AISession,
  AIProviderConfig,
  WorkspaceInstructions,
  DatabaseConfig,
  NoteTemplate,
} from '../types';
import {
  INITIAL_WORKSPACES,
  INITIAL_FOLDERS,
  INITIAL_FILES,
  INITIAL_INSTRUCTIONS,
} from '../utils/initialData';
import { parseMarkdown, serializeMarkdown, extractInternalLinks } from '../utils/markdownParser';
import { safeFetchJson } from '../utils/apiHelper';
import {
  getStorageRoot,
  resetStorageRoot,
  nativeStorageEnabled,
  readNativeTree,
  readWorkspaceInstructions,
  writeNativeTree,
  writeWorkspaceInstructions,
} from '../utils/storage/nativeStore';
import {
  LANGUAGE_STORAGE_KEY,
  translate,
  type Lang,
  type TranslationKey,
} from '../i18n';


interface WorkspaceContextType {
  // Workspaces
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspace: Workspace;
  setActiveWorkspaceId: (id: string) => void;
  createWorkspace: (name: string, description?: string) => Workspace;
  createWorkspaceDefault: (name: string, description?: string) => Workspace;
  createWorkspaceFromFolder: (parent: string, name: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  renameWorkspace: (id: string, newName: string) => void;
  deleteWorkspace: (id: string) => void;

  // Custom Templates & Category Management
  customTemplates: NoteTemplate[];
  templateCategories: string[];
  createCustomTemplate: (templateData: Omit<NoteTemplate, 'id' | 'isCustom'>) => NoteTemplate;
  saveFileAsTemplate: (fileId: string, name: string, category: string, description: string) => NoteTemplate | null;
  addTemplateCategory: (categoryName: string) => void;
  moveTemplateCategory: (templateId: string, newCategory: string) => void;
  deleteCustomTemplate: (templateId: string) => void;

  // File System
  folders: Folder[];
  files: FileItem[];
  activeFileId: string | null;
  activeFile: FileItem | null;
  setActiveFileId: (id: string | null) => void;

  // Operations
  createFile: (name: string, parentId?: string | null, initialContent?: string) => FileItem;
  updateFileContent: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => boolean;
  moveFile: (id: string, newParentId: string | null) => boolean;
  duplicateFile: (id: string) => FileItem | null;
  softDeleteFile: (id: string) => void;
  restoreFile: (id: string) => void;
  permanentDeleteFile: (id: string) => void;

  // Folders Operations
  createFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (id: string, newName: string) => boolean;
  moveFolder: (id: string, newParentId: string | null) => boolean;
  softDeleteFolder: (id: string) => void;
  restoreFolder: (id: string) => void;
  permanentDeleteFolder: (id: string) => void;

  // Bulk Operations
  bulkMove: (fileIds: string[], folderIds: string[], destinationParentId: string | null) => void;
  bulkDelete: (fileIds: string[], folderIds: string[]) => void;
  undoLastOperation: () => boolean;
  canUndo: boolean;

  // Tabs
  tabs: TabItem[];
  openFileInTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;

  // Views & UI
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isQuickSwitcherOpen: boolean;
  setIsQuickSwitcherOpen: (open: boolean) => void;
  isMoveDialogOpen: boolean;
  setIsMoveDialogOpen: (open: boolean) => void;
  isTrashOpen: boolean;
  setIsTrashOpen: (open: boolean) => void;
  itemToMove: { id: string; type: 'file' | 'folder'; name: string } | null;
  setItemToMove: (item: { id: string; type: 'file' | 'folder'; name: string } | null) => void;

  // Versions
  fileVersions: FileVersion[];
  createSnapshot: (fileId: string, summary?: string) => void;
  restoreVersion: (version: FileVersion) => void;

  // AI & Instructions & Chat Management
  workspaceInstructions: WorkspaceInstructions;
  updateInstructions: (content: string) => void;
  aiSessions: AISession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  draftAgentMode: 'ask' | 'build';
  setDraftAgentMode: (mode: 'ask' | 'build') => void;
  startNewAISession: (mode?: 'ask' | 'build') => void;
  createAISession: (title?: string, agentMode?: 'ask' | 'build') => AISession;
  deleteAISession: (id: string) => void;
  restoreAISession: (id: string) => void;
  permanentDeleteAISession: (id: string) => void;
  addAIMessage: (sessionId: string, message: any) => void;
  editAIMessage: (sessionId: string, messageId: string, newContent: string) => void;
  deleteAIMessage: (sessionId: string, messageId: string) => void;
  revertAISessionToMessage: (sessionId: string, messageId: string) => void;
  updateAISessionContextLimit: (sessionId: string, limit: number) => void;
  updateAISessionAgentMode: (sessionId: string, mode: 'ask' | 'build') => void;
  compactAISessionContext: (sessionId: string) => boolean;
  renameAISession: (sessionId: string, newTitle: string) => void;
  
  // AI Provider Management
  aiProviders: AIProviderConfig[];
  updateAIProvider: (id: string, updates: Partial<AIProviderConfig>) => void;
  addCustomAIProvider: (provider: Omit<AIProviderConfig, 'id'>) => AIProviderConfig | null;
  deleteAIProvider: (id: string) => void;
  testAIConnection: (id: string) => Promise<{ success: boolean; message: string; models?: string[] }>;

  manualContextIds: string[];
  toggleManualContextId: (fileId: string) => void;
  clearManualContext: () => void;

  // Unified Database Management
  dbConfig: DatabaseConfig;
  updateDbConfig: (updates: Partial<DatabaseConfig>) => void;
  syncToDatabase: () => Promise<{ success: boolean; message: string; syncedAt?: string }>;

  // Auto-save State
  saveState: 'saved' | 'saving' | 'error';
  lastSavedAt: Date | null;

  // Backlinks & Graph
  getBacklinks: (fileId: string) => { file: FileItem; snippet: string }[];
  getOutgoingLinks: (fileId: string) => { targetName: string; resolvedFile: FileItem | null }[];

  // Export (Markdown only)
  exportWorkspaceAsMarkdownZip: () => void;
  navigateInternalLink: (linkTarget: string) => void;

  // Native storage location
  nativeHydrated: boolean;
  storageRootLabel: string;
  refreshStorageRoot: () => void;

  // Language
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  t: (key: TranslationKey) => string;
}

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEYS = {
  WORKSPACES: 'mythos_workspaces',
  FOLDERS: 'mythos_folders',
  FILES: 'mythos_files',
  ACTIVE_WS: 'mythos_active_ws',
  INSTRUCTIONS: 'mythos_instructions',
  SESSIONS: 'mythos_ai_sessions',
  PROVIDERS: 'mythos_ai_providers_v2', // version 2 for new schema
  VERSIONS: 'mythos_versions',
  OPERATIONS: 'mythos_operations',
  CUSTOM_TEMPLATES: 'mythos_custom_templates',
  TEMPLATE_CATEGORIES: 'mythos_template_categories',
  DB_CONFIG: 'mythos_db_config_v2',
  NATIVE_WORKSPACE_INDEX: 'mythos_native_workspace_index',
  SECURE_PREFIX: 'mythos_secure_',
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or local storage
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const key = nativeStorageEnabled()
      ? STORAGE_KEYS.NATIVE_WORKSPACE_INDEX
      : STORAGE_KEYS.WORKSPACES;
    const saved = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEYS.WORKSPACES);
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_WS);
    return saved || '';
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!saved) return INITIAL_FILES;
    try {
      return JSON.parse(saved);
    } catch {
      return INITIAL_FILES;
    }
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<TabItem[]>([]);

  const [instructionsMap, setInstructionsMap] = useState<Record<string, WorkspaceInstructions>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INSTRUCTIONS);
    return saved ? JSON.parse(saved) : INITIAL_INSTRUCTIONS;
  });

  const [aiSessions, setAiSessions] = useState<AISession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: AISession) => s.messages && s.messages.length > 0);
        }
      } catch {}
    }
    return [];
  });

  const [language, setLanguageState] = useState<Lang>(() => {
    return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as Lang) || 'th';
  });

  const setLanguage = useCallback((lang: Lang) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('mythos-language-change', { detail: lang }));
  }, []);

  // Keep the document language/title in sync (no app restart needed — t() is reactive).
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, 'app.title');
  }, [language]);

  const t = useCallback((key: TranslationKey): string => translate(language, key), [language]);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [draftAgentMode, setDraftAgentMode] = useState<'ask' | 'build'>('ask');
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [operations, setOperations] = useState<FileOperation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [manualContextIds, setManualContextIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);

  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Custom Templates & Categories
  const [customTemplates, setCustomTemplates] = useState<NoteTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    return saved ? JSON.parse(saved) : [];
  });

  const [templateCategories, setTemplateCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATE_CATEGORIES);
    return saved
      ? JSON.parse(saved)
      : ['Novel', 'Worldbuilding', 'Story Planning', 'Notes & Logs', 'General'];
  });

  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'gemini-native',
        name: 'Google Gemini (Native)',
        protocol: 'gemini',
        defaultModel: '',
        isDefault: true,
        availableModels: [],
      },
      {
        id: 'openrouter-native',
        name: 'OpenRouter (Native)',
        protocol: 'openai',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: '',
        availableModels: [],
      },
    ];
  });

  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DB_CONFIG);
    if (saved) return JSON.parse(saved);
    return {
      type: 'local-server',
      enabled: false,
      status: 'idle',
    };
  });

  // Effect to load secure credentials from IndexedDB and verify server AI key
  useEffect(() => {
    const loadSecureData = async () => {
      let serverHasGemini = false; // never assume a key exists before health confirms it
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          serverHasGemini = Boolean(healthData.hasGeminiKey);
        }
      } catch {
        // Production native apps have no local server; keys come from IndexedDB only.
      }

      try {
        const updatedProviders = await Promise.all(
          aiProviders.map(async (p) => {
            const key = await idbGet(`${STORAGE_KEYS.SECURE_PREFIX}ai_key_${p.id}`);
            const isNative = p.id === 'gemini-native';
            const hasKey = Boolean(key || p.customApiKey);
            const connected = hasKey || (isNative && serverHasGemini);
            return {
              ...p,
              customApiKey: (key as string) || p.customApiKey || '',
              isConnected: connected,
            };
          })
        );
        setAiProviders(updatedProviders);
      } catch (e) {
        console.warn('Error reading secure keys from IndexedDB:', e);
      }

      try {
        const secureDbData = await idbGet(`${STORAGE_KEYS.SECURE_PREFIX}db_config`);
        if (secureDbData) {
          setDbConfig((prev) => ({ ...prev, ...(secureDbData as any) }));
        }
      } catch {}
    };

    loadSecureData();
  }, []);

  // Native apps use real folders/.md files; hydrate from disk before persisting.
  const [nativeHydrated, setNativeHydrated] = useState(!nativeStorageEnabled());
  const [nativeWriteEnabled, setNativeWriteEnabled] = useState(false);
  const [storageRootVersion, setStorageRootVersion] = useState(0);
  const userEditedRef = useRef(false);

  const refreshStorageRoot = useCallback(() => {
    setNativeWriteEnabled(false);
    setNativeHydrated(false);
    userEditedRef.current = false;
    setStorageRootVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!nativeStorageEnabled()) return;
    let cancelled = false;
    (async () => {
      try {
        const tree = await readNativeTree(workspaces);
        if (cancelled) return;
        if (!userEditedRef.current) {
          if (tree.workspaces.length) {
            setWorkspaces(tree.workspaces);
            setFolders(tree.folders);
            setFiles(tree.files);
            // Keep the active workspace in sync with what was actually loaded.
            if (!tree.workspaces.some((w) => w.id === activeWorkspaceId)) {
              setActiveWorkspaceId(tree.workspaces[0].id);
            }
          }
          // System prompt instructions live in <workspace>/Configures/AGENTS.md.
          const diskInstructions: Record<string, WorkspaceInstructions> = {};
          for (const ws of tree.workspaces) {
            const content = await readWorkspaceInstructions(ws.name);
            if (content !== null) {
              diskInstructions[ws.id] = {
                workspaceId: ws.id,
                content,
                updatedAt: new Date().toISOString(),
              };
            }
          }
          if (Object.keys(diskInstructions).length) {
            setInstructionsMap((prev) => ({ ...prev, ...diskInstructions }));
          }
        }
        setNativeWriteEnabled(true);
      } catch (err) {
        console.error('Failed to load native workspace tree:', err);
        // Never write/clean disk when hydration failed — that could delete real files.
        setNativeWriteEnabled(false);
      } finally {
        if (!cancelled) setNativeHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run when the chosen native storage root changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageRootVersion]);

  // Native: reconcile disk with in-memory state (debounced).
  useEffect(() => {
    if (!nativeStorageEnabled() || !nativeHydrated || !nativeWriteEnabled) return;
    const timer = setTimeout(() => {
      writeNativeTree({ workspaces, folders, files }).catch((err) =>
        console.error('Failed to persist native workspace tree:', err)
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [workspaces, folders, files, nativeHydrated, nativeWriteEnabled]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(aiProviders.map(({customApiKey, ...rest}) => rest)));
  }, [aiProviders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DB_CONFIG, JSON.stringify({
      type: dbConfig.type,
      enabled: dbConfig.enabled,
      status: dbConfig.status,
      lastSyncedAt: dbConfig.lastSyncedAt,
    }));
  }, [dbConfig]);


  // Sync to localStorage
  useEffect(() => {
    if (!nativeStorageEnabled()) {
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces));
    } else {
      localStorage.setItem(STORAGE_KEYS.NATIVE_WORKSPACE_INDEX, JSON.stringify(workspaces));
    }
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WS, activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!nativeStorageEnabled()) {
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    }
  }, [folders]);

  useEffect(() => {
    if (!nativeStorageEnabled()) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    }
  }, [files]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTRUCTIONS, JSON.stringify(instructionsMap));
  }, [instructionsMap]);

  useEffect(() => {
    const validSessions = aiSessions.filter((s) => s.messages && s.messages.length > 0);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(validSessions));
  }, [aiSessions]);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(fileVersions));
  }, [fileVersions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATE_CATEGORIES, JSON.stringify(templateCategories));
  }, [templateCategories]);

  // Active Workspace
  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => w.id === activeWorkspaceId) ||
      workspaces[0] || {
        id: '',
        name: '',
        description: '',
        icon: 'Folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  }, [workspaces, activeWorkspaceId]);

  // Active File
  const activeFile = useMemo(() => {
    if (!activeFileId) return null;
    return files.find((f) => f.id === activeFileId && !f.deletedAt) || null;
  }, [files, activeFileId]);

  // Switch Workspace context safely
  const handleSwitchWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    // Find first active file in that workspace
    const firstFile = files.find((f) => f.workspaceId === id && !f.deletedAt);
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setTabs([{ fileId: firstFile.id }]);
    } else {
      setActiveFileId(null);
      setTabs([]);
    }
    setActiveSessionId(null);
    setManualContextIds([]);
  }, [files]);

  // Create Workspace
  const createWorkspace = useCallback((name: string, description = '') => {
    userEditedRef.current = true;
    const id = `ws-${Date.now()}`;
    const newWs: Workspace = {
      id,
      name,
      description,
      icon: 'FolderKanban',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkspaces((prev) => [...prev, newWs]);
    // Create default root readme
    const rootReadme: FileItem = {
      id: `file-${Date.now()}`,
      workspaceId: id,
      parentId: null, // Root
      name: 'Welcome.md',
      extension: 'md',
      size: 150,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `# Welcome to ${name}\n\nStart organizing your thoughts, characters, and knowledge here.\n\nUse \`[[Internal Links]]\` to connect notes.`,
    };
    setFiles((prev) => [...prev, rootReadme]);
    handleSwitchWorkspace(id);
    return newWs;
  }, [handleSwitchWorkspace]);

  /** Typed name + Create: always place the workspace under Documents/Mythos. */
  const createWorkspaceDefault = useCallback(
    (name: string, description = '') => {
      resetStorageRoot();
      setWorkspaces([]);
      setFolders([]);
      setFiles([]);
      setActiveFileId(null);
      setTabs([]);
      setActiveWorkspaceId('');
      refreshStorageRoot();
      return createWorkspace(name, description);
    },
    [createWorkspace, refreshStorageRoot]
  );

  /** Picked folder IS the workspace; hydration discovers it and makes it active. */
  const createWorkspaceFromFolder = useCallback(
    (_parent: string, _name: string) => {
      setWorkspaces([]);
      setFolders([]);
      setFiles([]);
      setActiveFileId(null);
      setTabs([]);
      setActiveWorkspaceId('');
      refreshStorageRoot();
    },
    [refreshStorageRoot]
  );

  // Update Workspace
  const updateWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w))
    );
  }, []);

  // Rename Workspace
  const renameWorkspace = useCallback((id: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: clean, updatedAt: new Date().toISOString() } : w))
    );
  }, []);

  // Custom Templates Management
  const createCustomTemplate = useCallback((templateData: Omit<NoteTemplate, 'id' | 'isCustom'>): NoteTemplate => {
    const id = `tpl-custom-${Date.now()}`;
    const newTemplate: NoteTemplate = {
      ...templateData,
      id,
      isCustom: true,
    };
    setCustomTemplates((prev) => [...prev, newTemplate]);
    if (templateData.category && !templateCategories.includes(templateData.category)) {
      setTemplateCategories((prev) => [...prev, templateData.category]);
    }
    return newTemplate;
  }, [templateCategories]);

  const saveFileAsTemplate = useCallback(
    (fileId: string, name: string, category: string, description: string): NoteTemplate | null => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return null;
      const id = `tpl-custom-${Date.now()}`;
      const newTemplate: NoteTemplate = {
        id,
        name: name.trim() || file.name.replace(/\.md$/, ''),
        category: category.trim() || 'General',
        description: description.trim() || `Saved from note ${file.name}`,
        icon: 'FileText',
        defaultFilename: file.name,
        templateContent: file.content,
        isCustom: true,
      };
      setCustomTemplates((prev) => [...prev, newTemplate]);
      if (newTemplate.category && !templateCategories.includes(newTemplate.category)) {
        setTemplateCategories((prev) => [...prev, newTemplate.category]);
      }
      return newTemplate;
    },
    [files, templateCategories]
  );

  const addTemplateCategory = useCallback((categoryName: string) => {
    const clean = categoryName.trim();
    if (!clean) return;
    setTemplateCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  }, []);

  const moveTemplateCategory = useCallback((templateId: string, newCategory: string) => {
    const cleanCategory = newCategory.trim();
    if (!cleanCategory) return;
    setCustomTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, category: cleanCategory } : t))
    );
    setTemplateCategories((prev) => (prev.includes(cleanCategory) ? prev : [...prev, cleanCategory]));
  }, []);

  const deleteCustomTemplate = useCallback((templateId: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }, []);

  // Delete Workspace
  const deleteWorkspace = useCallback((id: string) => {
    if (workspaces.length <= 1) {
      alert('Cannot delete the last workspace.');
      return;
    }
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    setFolders((prev) => prev.filter((f) => f.workspaceId !== id));
    setFiles((prev) => prev.filter((f) => f.workspaceId !== id));
    const remaining = workspaces.filter((w) => w.id !== id);
    if (remaining.length > 0) {
      handleSwitchWorkspace(remaining[0].id);
    }
  }, [workspaces, handleSwitchWorkspace]);

  // Open file in tab
  const openFileInTab = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    setTabs((prev) => {
      if (prev.some((t) => t.fileId === fileId)) {
        return prev;
      }
      return [...prev, { fileId }];
    });
    setActiveView('editor');
  }, []);

  const closeTab = useCallback((fileId: string) => {
    setTabs((prev) => {
      const nextTabs = prev.filter((t) => t.fileId !== fileId);
      if (activeFileId === fileId) {
        if (nextTabs.length > 0) {
          setActiveFileId(nextTabs[nextTabs.length - 1].fileId);
        } else {
          setActiveFileId(null);
        }
      }
      return nextTabs;
    });
  }, [activeFileId]);

  // File Operations
  const createFile = useCallback(
    (name: string, parentId: string | null = null, initialContent = ''): FileItem => {
      userEditedRef.current = true;
      const cleanName = name.endsWith('.md') ? name : `${name}.md`;
      const id = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newFile: FileItem = {
        id,
        workspaceId: activeWorkspaceId,
        parentId,
        name: cleanName,
        extension: 'md',
        content: initialContent || `# ${cleanName.replace(/\.md$/, '')}\n\n`,
        size: initialContent.length,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setFiles((prev) => [...prev, newFile]);
      openFileInTab(id);
      return newFile;
    },
    [activeWorkspaceId, openFileInTab]
  );

  const updateFileContent = useCallback((id: string, content: string) => {
    setSaveState('saving');
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const parsed = parseMarkdown(content);
          return {
            ...f,
            content,
            size: content.length,
            frontmatter: parsed.frontmatter,
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      })
    );
    // Debounce save state feedback
    setTimeout(() => {
      setSaveState('saved');
      setLastSavedAt(new Date());
    }, 400);
  }, []);

  const renameFile = useCallback((id: string, newName: string): boolean => {
    const cleanName = newName.trim();
    if (!cleanName) return false;
    const finalName = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`;

    // Check duplicate in same parent folder
    const target = files.find((f) => f.id === id);
    if (!target) return false;

    const duplicate = files.find(
      (f) =>
        f.id !== id &&
        f.workspaceId === target.workspaceId &&
        f.parentId === target.parentId &&
        !f.deletedAt &&
        f.name.toLowerCase() === finalName.toLowerCase()
    );

    if (duplicate) {
      alert(`A file named "${finalName}" already exists in this folder.`);
      return false;
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: finalName, updatedAt: new Date().toISOString() } : f))
    );
    return true;
  }, [files]);

  // Move File (e.g. Root to folder, folder to root, folder to folder)
  const moveFile = useCallback(
    (id: string, newParentId: string | null): boolean => {
      const file = files.find((f) => f.id === id);
      if (!file) return false;
      if (file.parentId === newParentId) return true; // already there

      // Check duplicate name in destination
      const duplicate = files.find(
        (f) =>
          f.id !== id &&
          f.workspaceId === file.workspaceId &&
          f.parentId === newParentId &&
          !f.deletedAt &&
          f.name.toLowerCase() === file.name.toLowerCase()
      );

      if (duplicate) {
        alert(`A file named "${file.name}" already exists in the destination folder.`);
        return false;
      }

      // Record operation for undo
      const op: FileOperation = {
        id: `op-${Date.now()}`,
        workspaceId: activeWorkspaceId,
        operationType: 'move',
        targetIds: [id],
        previousState: { parentId: file.parentId },
        newState: { parentId: newParentId },
        timestamp: new Date().toISOString(),
      };
      setOperations((prev) => [op, ...prev.slice(0, 30)]);

      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, parentId: newParentId, updatedAt: new Date().toISOString() } : f))
      );
      return true;
    },
    [files, activeWorkspaceId]
  );

  const duplicateFile = useCallback(
    (id: string): FileItem | null => {
      const source = files.find((f) => f.id === id);
      if (!source) return null;

      const baseName = source.name.replace(/\.md$/, '');
      const newName = `${baseName} (Copy).md`;
      const newFile = createFile(newName, source.parentId, source.content);
      return newFile;
    },
    [files, createFile]
  );

  const softDeleteFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, deletedAt: new Date().toISOString() } : f))
    );
    // Close tab if open
    closeTab(id);
  }, [closeTab]);

  const restoreFile = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, deletedAt: null } : f)));
  }, []);

  const permanentDeleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Folder Operations
  const createFolder = useCallback(
    (name: string, parentId: string | null = null): Folder => {
      userEditedRef.current = true;
      const cleanName = name.trim();
      const id = `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newFolder: Folder = {
        id,
        workspaceId: activeWorkspaceId,
        parentId,
        name: cleanName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setFolders((prev) => [...prev, newFolder]);
      return newFolder;
    },
    [activeWorkspaceId]
  );

  const renameFolder = useCallback(
    (id: string, newName: string): boolean => {
      const cleanName = newName.trim();
      if (!cleanName) return false;
      const target = folders.find((f) => f.id === id);
      if (!target) return false;

      const duplicate = folders.find(
        (f) =>
          f.id !== id &&
          f.workspaceId === target.workspaceId &&
          f.parentId === target.parentId &&
          !f.deletedAt &&
          f.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        alert(`A folder named "${cleanName}" already exists in this directory.`);
        return false;
      }

      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: cleanName, updatedAt: new Date().toISOString() } : f))
      );
      return true;
    },
    [folders]
  );

  // Validate circular folder reference
  const isDescendantFolder = useCallback(
    (parentFolderId: string, candidateChildFolderId: string): boolean => {
      if (parentFolderId === candidateChildFolderId) return true;
      let curr = folders.find((f) => f.id === candidateChildFolderId);
      while (curr && curr.parentId) {
        if (curr.parentId === parentFolderId) return true;
        curr = folders.find((f) => f.id === curr!.parentId);
      }
      return false;
    },
    [folders]
  );

  const moveFolder = useCallback(
    (id: string, newParentId: string | null): boolean => {
      if (id === newParentId) {
        alert('Cannot move a folder into itself.');
        return false;
      }
      if (newParentId && isDescendantFolder(id, newParentId)) {
        alert('Cannot move a folder into one of its subfolders.');
        return false;
      }

      const folder = folders.find((f) => f.id === id);
      if (!folder) return false;
      if (folder.parentId === newParentId) return true;

      // Duplicate check
      const duplicate = folders.find(
        (f) =>
          f.id !== id &&
          f.workspaceId === folder.workspaceId &&
          f.parentId === newParentId &&
          !f.deletedAt &&
          f.name.toLowerCase() === folder.name.toLowerCase()
      );
      if (duplicate) {
        alert(`A folder named "${folder.name}" already exists in the destination.`);
        return false;
      }

      // Record undo
      const op: FileOperation = {
        id: `op-${Date.now()}`,
        workspaceId: activeWorkspaceId,
        operationType: 'move',
        targetIds: [id],
        previousState: { parentId: folder.parentId },
        newState: { parentId: newParentId },
        timestamp: new Date().toISOString(),
      };
      setOperations((prev) => [op, ...prev.slice(0, 30)]);

      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, parentId: newParentId, updatedAt: new Date().toISOString() } : f))
      );
      return true;
    },
    [folders, isDescendantFolder, activeWorkspaceId]
  );

  const softDeleteFolder = useCallback((id: string) => {
    // Soft delete folder and all child files and subfolders
    const deleteFolderRecursive = (folderId: string) => {
      const now = new Date().toISOString();
      setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, deletedAt: now } : f)));
      setFiles((prev) => prev.map((f) => (f.parentId === folderId ? { ...f, deletedAt: now } : f)));

      const subfolders = folders.filter((f) => f.parentId === folderId);
      subfolders.forEach((sub) => deleteFolderRecursive(sub.id));
    };

    deleteFolderRecursive(id);
  }, [folders]);

  const restoreFolder = useCallback((id: string) => {
    const restoreFolderRecursive = (folderId: string) => {
      setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, deletedAt: null } : f)));
      setFiles((prev) => prev.map((f) => (f.parentId === folderId ? { ...f, deletedAt: null } : f)));

      const subfolders = folders.filter((f) => f.parentId === folderId);
      subfolders.forEach((sub) => restoreFolderRecursive(sub.id));
    };

    restoreFolderRecursive(id);
  }, [folders]);

  const permanentDeleteFolder = useCallback((id: string) => {
    const deleteRecursive = (folderId: string) => {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setFiles((prev) => prev.filter((f) => f.parentId !== folderId));
      const subfolders = folders.filter((f) => f.parentId === folderId);
      subfolders.forEach((sub) => deleteRecursive(sub.id));
    };

    deleteRecursive(id);
  }, [folders]);

  // Bulk Operations
  const bulkMove = useCallback(
    (fileIds: string[], folderIds: string[], destinationParentId: string | null) => {
      fileIds.forEach((fId) => moveFile(fId, destinationParentId));
      folderIds.forEach((fId) => moveFolder(fId, destinationParentId));
    },
    [moveFile, moveFolder]
  );

  const bulkDelete = useCallback(
    (fileIds: string[], folderIds: string[]) => {
      fileIds.forEach((fId) => softDeleteFile(fId));
      folderIds.forEach((fId) => softDeleteFolder(fId));
    },
    [softDeleteFile, softDeleteFolder]
  );

  // Undo Last Operation
  const undoLastOperation = useCallback((): boolean => {
    if (operations.length === 0) return false;
    const [lastOp, ...remaining] = operations;

    if (lastOp.operationType === 'move') {
      const targetId = lastOp.targetIds[0];
      const prevParentId = lastOp.previousState.parentId;

      // Check if file or folder
      const isFile = files.some((f) => f.id === targetId);
      if (isFile) {
        setFiles((prev) =>
          prev.map((f) => (f.id === targetId ? { ...f, parentId: prevParentId } : f))
        );
      } else {
        setFolders((prev) =>
          prev.map((f) => (f.id === targetId ? { ...f, parentId: prevParentId } : f))
        );
      }
      setOperations(remaining);
      return true;
    }

    return false;
  }, [operations, files]);

  // Version Snapshots
  const createSnapshot = useCallback((fileId: string, summary?: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const nextVer = (file.version || 1) + 1;
    const versionObj: FileVersion = {
      id: `ver-${Date.now()}`,
      fileId,
      version: nextVer,
      content: file.content,
      timestamp: new Date().toISOString(),
      summary: summary || `Snapshot v${nextVer}`,
    };

    setFileVersions((prev) => [versionObj, ...prev]);
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, version: nextVer } : f))
    );
  }, [files]);

  const restoreVersion = useCallback((ver: FileVersion) => {
    updateFileContent(ver.fileId, ver.content);
  }, [updateFileContent]);

  // Instructions
  const workspaceInstructions = useMemo(() => {
    return (
      instructionsMap[activeWorkspaceId] || {
        workspaceId: activeWorkspaceId,
        content: '',
        updatedAt: new Date().toISOString(),
      }
    );
  }, [instructionsMap, activeWorkspaceId]);

  const updateInstructions = useCallback(
    (content: string) => {
      setInstructionsMap((prev) => ({
        ...prev,
        [activeWorkspaceId]: {
          workspaceId: activeWorkspaceId,
          content,
          updatedAt: new Date().toISOString(),
        },
      }));
      if (nativeStorageEnabled()) {
        const name = workspaces.find((w) => w.id === activeWorkspaceId)?.name;
        if (name) {
          void writeWorkspaceInstructions(name, content).catch((err) =>
            console.error('Failed to write AGENTS.md:', err)
          );
        }
      }
    },
    [activeWorkspaceId, workspaces]
  );

  // AI Sessions & Draft Lifecycle
  const startNewAISession = useCallback((mode: 'ask' | 'build' = 'ask') => {
    // Prune any existing blank sessions with 0 messages
    setAiSessions((prev) => prev.filter((s) => s.messages && s.messages.length > 0));
    setActiveSessionId(null);
    setDraftAgentMode(mode);
  }, []);

  const createAISession = useCallback(
    (title = 'New Investigation', agentMode: 'ask' | 'build' = 'ask'): AISession => {
      const id = `sess-${Date.now()}`;
      const session: AISession = {
        id,
        workspaceId: activeWorkspaceId,
        title,
        agentMode,
        messages: [],
        contextLimit: 100000,
        tokenUsage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAiSessions((prev) => [
        session,
        ...prev.filter((s) => s.messages && s.messages.length > 0),
      ]);
      setActiveSessionId(id);
      return session;
    },
    [activeWorkspaceId]
  );

  const updateAISessionContextLimit = useCallback((sessionId: string, limit: number) => {
    setAiSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, contextLimit: limit } : s))
    );
  }, []);

  const updateAISessionAgentMode = useCallback((sessionId: string, mode: 'ask' | 'build') => {
    setAiSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, agentMode: mode } : s))
    );
  }, []);

  const deleteAISession = useCallback((id: string) => {
    // Soft delete session to Trash & Recovery
    setAiSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, deletedAt: new Date().toISOString() } : s))
    );
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const restoreAISession = useCallback((id: string) => {
    // Restore session from Trash
    setAiSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, deletedAt: null } : s))
    );
  }, []);

  const permanentDeleteAISession = useCallback((id: string) => {
    // Permanently remove session from storage
    setAiSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  const renameAISession = useCallback((sessionId: string, newTitle: string) => {
    setAiSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, title: newTitle, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const addAIMessage = useCallback((sessionId: string, message: any) => {
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, message],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }, []);

  const editAIMessage = useCallback((sessionId: string, messageId: string, newContent: string) => {
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId
                ? { ...m, content: newContent, editedAt: new Date().toISOString() }
                : m
            ),
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }, []);

  const deleteAIMessage = useCallback((sessionId: string, messageId: string) => {
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.filter((m) => m.id !== messageId),
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }, []);

  const revertAISessionToMessage = useCallback((sessionId: string, messageId: string) => {
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const index = s.messages.findIndex((m) => m.id === messageId);
          if (index === -1) return s;
          // Keep messages up to the selected message
          const truncated = s.messages.slice(0, index + 1);
          return {
            ...s,
            messages: truncated,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  }, []);

  const compactAISessionContext = useCallback((sessionId: string) => {
    let compacted = false;
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId && s.messages && s.messages.length > 2) {
          compacted = true;
          const keepCount = Math.min(3, s.messages.length);
          const recent = s.messages.slice(-keepCount);
          const older = s.messages.slice(0, s.messages.length - keepCount);

          const summaryUserPrompts = older
            .filter((m) => m.role === 'user')
            .map((m) => m.content.slice(0, 35).replace(/\n/g, ' '))
            .slice(0, 4)
            .join('; ');

          const summaryMsg = {
            id: `compact-summary-${Date.now()}`,
            role: 'assistant' as const,
            content: `⚡ **Auto-Compacted Context Summary**\n\n- **สรุปบริบทบทสนทนาก่อนหน้า (${older.length} ข้อความ)**: ${summaryUserPrompts || 'สนทนาเกี่ยวกับเนื้อหาและเวิร์กสเปซ'}\n- *ระบบบีบอัด Context อัตโนมัติเพื่อรักษาขอบเขต Token Limit*`,
            timestamp: new Date().toISOString(),
            isCompactedSummary: true,
          };

          return {
            ...s,
            messages: [summaryMsg, ...recent],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
    return compacted;
  }, []);

  // Unified Database Management
  const updateDbConfig = useCallback(async (updates: Partial<DatabaseConfig>) => {
    setDbConfig((prev) => {
      const next = { ...prev, ...updates };
      
      // Save sensitive parts to IndexedDB
      const secureFields = ['accountId', 'databaseId', 'apiToken', 'connectionString', 'password'];
      const secureData: any = {};
      secureFields.forEach(f => {
        if ((next as any)[f]) secureData[f] = (next as any)[f];
      });
      idbSet(`${STORAGE_KEYS.SECURE_PREFIX}db_config`, secureData);
      
      return next;
    });
  }, []);

  const syncToDatabase = useCallback(async () => {
    try {
      updateDbConfig({ status: 'syncing' });
      const data = await safeFetchJson<{
        success: boolean;
        synced?: boolean;
        message: string;
        timestamp: string;
      }>('/api/database/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          sessions: aiSessions.filter((s) => s.messages && s.messages.length > 0),
          manualContextIds,
          instructions: workspaceInstructions?.content || '',
          dbConfig,
        }),
      });

      updateDbConfig({
        status: data.success ? 'connected' : 'error',
        lastSyncedAt: data.timestamp,
        errorMessage: data.success ? undefined : data.message,
      });

      return {
        success: data.success,
        message: data.message,
        syncedAt: data.timestamp,
      };
    } catch (err: any) {
      updateDbConfig({
        status: 'error',
        errorMessage: err.message || 'Failed to sync to database',
      });
      return {
        success: false,
        message: err.message || 'Failed to sync to database',
      };
    }
  }, [activeWorkspaceId, aiSessions, manualContextIds, workspaceInstructions, dbConfig, updateDbConfig]);

  // Debounced auto-save of sessions to local database sync endpoint
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/database/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          sessions: aiSessions.filter((s) => s.messages && s.messages.length > 0),
          manualContextIds,
          instructions: workspaceInstructions?.content || '',
          dbConfig: { ...dbConfig, enabled: false }, // background local save
        }),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [aiSessions, activeWorkspaceId, manualContextIds, workspaceInstructions, dbConfig]);

  // AI Provider Management
  const updateAIProvider = useCallback((id: string, updates: Partial<AIProviderConfig>) => {
    setAiProviders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = { ...p, ...updates };
          if (updates.customApiKey !== undefined) {
            const cleanKey = updates.customApiKey.trim();
            if (cleanKey) {
              idbSet(`${STORAGE_KEYS.SECURE_PREFIX}ai_key_${id}`, cleanKey);
              next.customApiKey = cleanKey;
            } else {
              idbDel(`${STORAGE_KEYS.SECURE_PREFIX}ai_key_${id}`).catch(() => {});
              next.customApiKey = '';
            }
          }
          return next;
        }
        return p;
      })
    );
  }, []);

  const addCustomAIProvider = useCallback((providerData: Omit<AIProviderConfig, 'id'>): AIProviderConfig | null => {
    if (aiProviders.length >= 11) { // 1 native + 10 custom
      alert('Maximum 10 custom providers allowed.');
      return null;
    }
    const id = `custom-${Date.now()}`;
    const newProvider: AIProviderConfig = {
      ...providerData,
      id,
    };
    if (providerData.customApiKey) {
      idbSet(`${STORAGE_KEYS.SECURE_PREFIX}ai_key_${id}`, providerData.customApiKey);
    }
    setAiProviders((prev) => [...prev, newProvider]);
    return newProvider;
  }, [aiProviders]);

  const deleteAIProvider = useCallback((id: string) => {
    setAiProviders((prev) => prev.filter((p) => p.id !== id));
    idbDel(`${STORAGE_KEYS.SECURE_PREFIX}ai_key_${id}`).catch(() => {});
  }, []);

  const testAIConnection = useCallback(async (id: string): Promise<{ success: boolean; message: string; models?: string[] }> => {
    const provider = aiProviders.find(p => p.id === id);
    if (!provider) return { success: false, message: 'Provider not found' };

    try {
      const data = await safeFetchJson<{ success: boolean; message: string; models?: string[] }>('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider:
            provider.id === 'gemini-native'
              ? 'gemini'
              : provider.id === 'openrouter-native'
                ? 'openrouter'
                : provider.protocol,
          baseUrl: provider.baseUrl,
          customApiKey: provider.customApiKey,
          model: provider.defaultModel,
          fetchModels: true,
        }),
      });

      if (data.success) {
        const models = data.models?.length ? data.models : provider.availableModels || [];
        updateAIProvider(id, {
          isConnected: true,
          availableModels: models,
          defaultModel: provider.defaultModel || models[0] || '',
        });
      } else {
        updateAIProvider(id, { isConnected: false });
      }

      return data;
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  }, [aiProviders, updateAIProvider]);

  // Automatically load model lists once per provider (no manual model id entry).
  const autoLoadedProvidersRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const provider of aiProviders) {
      if (autoLoadedProvidersRef.current.has(provider.id)) continue;
      if (provider.availableModels?.length) {
        autoLoadedProvidersRef.current.add(provider.id);
        continue;
      }
      if (
        provider.isConnected ||
        provider.customApiKey ||
        provider.id === 'gemini-native' ||
        provider.id === 'openrouter-native'
      ) {
        autoLoadedProvidersRef.current.add(provider.id);
        void testAIConnection(provider.id);
      }
    }
  }, [aiProviders, testAIConnection]);

  const toggleManualContextId = useCallback((fileId: string) => {
    setManualContextIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  }, []);

  const clearManualContext = useCallback(() => {
    setManualContextIds([]);
  }, []);

  // Backlinks & Outgoing Links computation
  const getBacklinks = useCallback(
    (targetFileId: string) => {
      const target = files.find((f) => f.id === targetFileId);
      if (!target) return [];

      const targetTitle = target.name.replace(/\.md$/, '');
      const results: { file: FileItem; snippet: string }[] = [];

      files
        .filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt && f.id !== targetFileId)
        .forEach((otherFile) => {
          const links = extractInternalLinks(otherFile.content);
          const hasLink = links.some(
            (l) => l.toLowerCase() === targetTitle.toLowerCase() || l.toLowerCase() === target.name.toLowerCase()
          );

          if (hasLink) {
            // Find snippet
            const idx = otherFile.content.indexOf(targetTitle);
            let snippet = '';
            if (idx !== -1) {
              const start = Math.max(0, idx - 40);
              const end = Math.min(otherFile.content.length, idx + targetTitle.length + 60);
              snippet = `...${otherFile.content.substring(start, end).trim()}...`;
            }
            results.push({ file: otherFile, snippet });
          }
        });

      return results;
    },
    [files, activeWorkspaceId]
  );

  const getOutgoingLinks = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return [];

      const rawLinks = extractInternalLinks(file.content);
      return rawLinks.map((targetName) => {
        const cleanTarget = targetName.split('/').pop()?.replace(/\.md$/, '').toLowerCase();
        const resolved = files.find(
          (f) =>
            f.workspaceId === activeWorkspaceId &&
            !f.deletedAt &&
            (f.name.replace(/\.md$/, '').toLowerCase() === cleanTarget ||
              f.name.toLowerCase() === `${cleanTarget}.md`)
        );
        return { targetName, resolvedFile: resolved || null };
      });
    },
    [files, activeWorkspaceId]
  );

  // Navigate to internal link
  const navigateInternalLink = useCallback(
    (linkTarget: string) => {
      const cleanTarget = linkTarget.split('/').pop()?.replace(/\.md$/, '').replace(/^\[\[/, '').replace(/\]\]$/, '').trim().toLowerCase() || '';
      const resolved = files.find(
        (f) =>
          f.workspaceId === activeWorkspaceId &&
          !f.deletedAt &&
          (f.name.replace(/\.md$/, '').toLowerCase() === cleanTarget ||
            f.name.toLowerCase() === `${cleanTarget}.md`)
      );

      if (resolved) {
        openFileInTab(resolved.id);
      } else {
        const rawNoteName = linkTarget.split('|')[0].trim().replace(/^\[\[/, '').replace(/\]\]$/, '');
        const newFile = createFile(rawNoteName, null, `# ${rawNoteName}\n\nCreated from internal link.`);
        openFileInTab(newFile.id);
      }
    },
    [files, activeWorkspaceId, openFileInTab, createFile]
  );

  // Export Workspace as a real ZIP archive containing only .md files, keeping folder hierarchy
  const exportWorkspaceAsMarkdownZip = useCallback(async () => {
    try {
      const zip = new JSZip();
      const wsFiles = files.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt);
      const wsFolders = folders.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt);

      // Helper to construct relative path for any folder
      const getFolderPath = (folderId: string | null): string => {
        if (!folderId) return '';
        const folder = wsFolders.find((f) => f.id === folderId);
        if (!folder) return '';
        const parentPath = getFolderPath(folder.parentId);
        return parentPath ? `${parentPath}/${folder.name}` : folder.name;
      };

      // Add folders to zip
      wsFolders.forEach((folder) => {
        const fPath = getFolderPath(folder.id);
        if (fPath) zip.folder(fPath);
      });

      // Add files to zip
      wsFiles.forEach((file) => {
        const parentPath = getFolderPath(file.parentId);
        const filePath = parentPath ? `${parentPath}/${file.name}` : file.name;
        zip.file(filePath, file.content || '');
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeWorkspace.name.replace(/\s+/g, '_')}_workspace.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
      alert('Failed to generate ZIP file.');
    }
  }, [files, folders, activeWorkspace, activeWorkspaceId]);

  const value: WorkspaceContextType = {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId: handleSwitchWorkspace,
    createWorkspace,
    createWorkspaceDefault,
    createWorkspaceFromFolder,
    updateWorkspace,
    renameWorkspace,
    deleteWorkspace,
    customTemplates,
    templateCategories,
    createCustomTemplate,
    saveFileAsTemplate,
    addTemplateCategory,
    moveTemplateCategory,
    deleteCustomTemplate,
    folders,
    files,
    activeFileId,
    activeFile,
    setActiveFileId,
    createFile,
    updateFileContent,
    renameFile,
    moveFile,
    duplicateFile,
    softDeleteFile,
    restoreFile,
    permanentDeleteFile,
    createFolder,
    renameFolder,
    moveFolder,
    softDeleteFolder,
    restoreFolder,
    permanentDeleteFolder,
    bulkMove,
    bulkDelete,
    undoLastOperation,
    canUndo: operations.length > 0,
    tabs,
    openFileInTab,
    closeTab,
    activeView,
    setActiveView,
    isQuickSwitcherOpen,
    setIsQuickSwitcherOpen,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    isTrashOpen,
    setIsTrashOpen,
    itemToMove,
    setItemToMove,
    fileVersions,
    createSnapshot,
    restoreVersion,
    workspaceInstructions,
    updateInstructions,
    aiSessions,
    activeSessionId,
    setActiveSessionId,
    draftAgentMode,
    setDraftAgentMode,
    startNewAISession,
    createAISession,
    deleteAISession,
    restoreAISession,
    permanentDeleteAISession,
    addAIMessage,
    editAIMessage,
    deleteAIMessage,
    revertAISessionToMessage,
    updateAISessionContextLimit,
    updateAISessionAgentMode,
    compactAISessionContext,
    renameAISession,
    aiProviders,
    updateAIProvider,
    addCustomAIProvider,
    deleteAIProvider,
    testAIConnection,
    manualContextIds,
    toggleManualContextId,
    clearManualContext,
    dbConfig,
    updateDbConfig,
    syncToDatabase,
    saveState,
    lastSavedAt,
    getBacklinks,
    getOutgoingLinks,
    exportWorkspaceAsMarkdownZip,
    navigateInternalLink,
    nativeHydrated,
    storageRootLabel: getStorageRoot().label,
    refreshStorageRoot,
    language,
    setLanguage,
    t,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
