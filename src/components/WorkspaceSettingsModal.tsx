import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  Sliders,
  Download,
  Trash2,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Check,
  Database,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Trash,
  ExternalLink,
  Info,
  Server,
  Cloud,
  FileCode,
  Globe,
  Lock,
  Edit2,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { DatabaseType, AIProviderConfig } from '../types';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeWorkspace,
    updateWorkspace,
    deleteWorkspace,
    workspaceInstructions,
    updateInstructions,
    aiProviders,
    updateAIProvider,
    addCustomAIProvider,
    deleteAIProvider,
    testAIConnection,
    dbConfig,
    updateDbConfig,
    syncToDatabase,
    exportWorkspaceAsMarkdownZip,
  } = useWorkspace();

  const { isDarkMode, setIsDarkMode, activeAccentHex } = useTheme();

  const [activeTab, setActiveTab] = useState<
    'general' | 'database' | 'ai-instructions' | 'providers' | 'export'
  >('general');

  // General state
  const [wsName, setWsName] = useState(activeWorkspace.name);
  const [wsDesc, setWsDesc] = useState(activeWorkspace.description);

  // AI Instructions state
  const [instructionsText, setInstructionsText] = useState(workspaceInstructions.content);

  useEffect(() => {
    setInstructionsText(workspaceInstructions.content || '');
  }, [workspaceInstructions.content]);

  // Database state
  const [dbType, setDbType] = useState<DatabaseType>(dbConfig.type);
  const [dbForm, setDbForm] = useState(dbConfig);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // AI Provider state
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [newProviderForm, setNewProviderForm] = useState<Partial<AIProviderConfig>>({
    name: '',
    protocol: 'openai',
    baseUrl: '',
    customApiKey: '',
    defaultModel: '',
  });
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [providerTestResults, setProviderTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  
  // Gemini key replacement & deletion state
  const [replacingGeminiKey, setReplacingGeminiKey] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiStatusFeedback, setGeminiStatusFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Custom provider key replacement state
  const [replacingCustomKeyId, setReplacingCustomKeyId] = useState<string | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState('');

  useEffect(() => {
    setDbForm(dbConfig);
    setDbType(dbConfig.type);
  }, [dbConfig]);

  useEffect(() => {
    const handleOpenTab = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('open-workspace-settings', handleOpenTab);
    return () => window.removeEventListener('open-workspace-settings', handleOpenTab);
  }, []);

  if (!isOpen) return null;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspace(activeWorkspace.id, {
      name: wsName.trim(),
      description: wsDesc.trim(),
    });
    alert('บันทึกการตั้งค่าเวิร์กสเปซแล้ว');
  };

  const handleSaveInstructions = () => {
    updateInstructions(instructionsText);
    alert('อัปเดตคำแนะนำ AI แล้ว');
  };

  const handleUpdateDbField = (field: keyof typeof dbForm, value: any) => {
    setDbForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDatabase = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      await updateDbConfig({ ...dbForm, type: dbType });
      const res = await syncToDatabase();
      setDbTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setDbTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveGeminiKey = async (keyToSave: string) => {
    const cleanKey = keyToSave.trim();
    if (!cleanKey) {
      alert('กรุณากรอก API Key');
      return;
    }
    setTestingProviderId('gemini-native');
    try {
      updateAIProvider('gemini-native', { customApiKey: cleanKey, isConnected: true });
      const res = await testAIConnection('gemini-native');
      if (res.success) {
        setGeminiStatusFeedback({ success: true, message: 'เชื่อมต่อ Google Gemini API สำเร็จแล้ว!' });
        setReplacingGeminiKey(false);
        setGeminiKeyInput('');
      } else {
        updateAIProvider('gemini-native', { isConnected: false });
        setGeminiStatusFeedback({ success: false, message: res.message || 'การเชื่อมต่อล้มเหลว กรุณาตรวจสอบ API Key' });
      }
    } catch (err: any) {
      setGeminiStatusFeedback({ success: false, message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setTestingProviderId(null);
      setTimeout(() => setGeminiStatusFeedback(null), 4000);
    }
  };

  const handleDeleteGeminiKey = () => {
    if (confirm('คุณต้องการลบ Google Gemini API Key หรือไม่? (หลังจากลบ ระบบจะพยายามใช้คีย์ของระบบหากมี)')) {
      updateAIProvider('gemini-native', { customApiKey: '', isConnected: false });
      setReplacingGeminiKey(false);
      setGeminiKeyInput('');
      setGeminiStatusFeedback({ success: true, message: 'ลบ API Key เรียบร้อยแล้ว' });
      setTimeout(() => setGeminiStatusFeedback(null), 3000);
    }
  };

  const handleReplaceCustomKey = async (providerId: string, newKey: string) => {
    const cleanKey = newKey.trim();
    if (!cleanKey) {
      alert('กรุณากรอก API Key');
      return;
    }
    setTestingProviderId(providerId);
    try {
      updateAIProvider(providerId, { customApiKey: cleanKey, isConnected: true });
      const res = await testAIConnection(providerId);
      if (res.success) {
        setReplacingCustomKeyId(null);
        setCustomKeyInput('');
        setProviderTestResults(prev => ({ ...prev, [providerId]: { success: true, message: 'อัปเดตและเชื่อมต่อ API Key สำเร็จ!' } }));
      } else {
        updateAIProvider(providerId, { isConnected: false });
        setProviderTestResults(prev => ({ ...prev, [providerId]: { success: false, message: res.message } }));
      }
    } catch (err: any) {
      setProviderTestResults(prev => ({ ...prev, [providerId]: { success: false, message: err.message } }));
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleDeleteCustomKey = (providerId: string) => {
    if (confirm('คุณต้องการลบ API Key ของ Provider นี้หรือไม่?')) {
      updateAIProvider(providerId, { customApiKey: '', isConnected: false });
      setReplacingCustomKeyId(null);
      setCustomKeyInput('');
      setProviderTestResults(prev => ({ ...prev, [providerId]: { success: true, message: 'ลบ API Key เรียบร้อยแล้ว' } }));
      setTimeout(() => {
        setProviderTestResults(prev => {
          const next = { ...prev };
          delete next[providerId];
          return next;
        });
      }, 3000);
    }
  };

  const handleAddProvider = async () => {
    if (!newProviderForm.name || !newProviderForm.baseUrl || !newProviderForm.customApiKey) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const added = addCustomAIProvider(newProviderForm as any);
    if (added) {
      setIsAddingProvider(false);
      setNewProviderForm({ name: '', protocol: 'openai', baseUrl: '', customApiKey: '', defaultModel: '' });
      // Test the newly added provider connection immediately
      await handleTestProvider(added.id);
    }
  };

  const handleUpdateProvider = (id: string) => {
    updateAIProvider(id, newProviderForm);
    setEditingProviderId(null);
    setNewProviderForm({ name: '', protocol: 'openai', baseUrl: '', customApiKey: '', defaultModel: '' });
  };

  const handleTestProvider = async (id: string) => {
    setTestingProviderId(id);
    try {
      const res = await testAIConnection(id);
      setProviderTestResults(prev => ({ ...prev, [id]: { success: res.success, message: res.message } }));
    } catch (err: any) {
      setProviderTestResults(prev => ({ ...prev, [id]: { success: false, message: err.message } }));
    } finally {
      setTestingProviderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none sm:p-4">
      <div className="fixed inset-0 hidden sm:block" onClick={onClose} />

      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl bg-white dark:bg-neutral-900 sm:border sm:border-neutral-200 sm:dark:border-neutral-800 sm:rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50/80 dark:bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Workspace Settings
              </h3>
              <p className="text-[11px] text-neutral-500">จัดการธีมสี, ฐานข้อมูล และคำสั่ง AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-3 sm:px-6 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-neutral-900">
          {[
            { id: 'general', icon: Layers, label: 'General' },
            { id: 'database', icon: Database, label: 'Database' },
            { id: 'ai-instructions', icon: Bot, label: 'AI Prompt' },
            { id: 'providers', icon: Sliders, label: 'AI Models' },
            { id: 'export', icon: Download, label: 'Export' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`min-h-[48px] py-3 px-1 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === t.id
                  ? 'border-sky-500 text-sky-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-sky-500' : ''}`} />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="max-w-2xl space-y-8">
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Workspace Name</label>
                    <input
                      type="text"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      className="w-full min-h-[48px] px-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Description</label>
                    <textarea
                      value={wsDesc}
                      onChange={(e) => setWsDesc(e.target.value)}
                      rows={3}
                      className="w-full p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="min-h-[48px] px-8 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                    Save General Changes
                  </button>
                </div>
              </form>

              <div className="space-y-4 p-6 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Moon className="w-4 h-4 text-sky-500" /> Appearance Mode
                </h4>
                <div className="flex p-1 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-fit">
                  <button onClick={() => setIsDarkMode(false)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${!isDarkMode ? 'bg-white shadow-md text-sky-600' : 'text-neutral-500'}`}>
                    <Sun className="w-4 h-4 text-amber-500" /> Light
                  </button>
                  <button onClick={() => setIsDarkMode(true)} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${isDarkMode ? 'bg-neutral-900 shadow-md text-white' : 'text-neutral-500'}`}>
                    <Moon className="w-4 h-4 text-sky-500" /> Dark
                  </button>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                  <div>
                    <h5 className="text-red-500 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Danger Zone
                    </h5>
                    <p className="text-xs text-neutral-500 mt-1">Permanently delete this workspace and all its data. This cannot be undone.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete workspace "${activeWorkspace.name}"?`)) {
                        deleteWorkspace(activeWorkspace.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DATABASE */}
          {activeTab === 'database' && (
            <div className="max-w-4xl space-y-8 pb-20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Form */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                       <Database className="w-4 h-4 text-sky-500" />
                       Database Connection
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'cloudflare-d1', label: 'Cloudflare D1', icon: Cloud },
                        { id: 'supabase', label: 'Supabase', icon: Globe },
                        { id: 'local-sqlite', label: 'Local SQLite', icon: Server },
                        { id: 'local-postgres', label: 'Local Postgres', icon: Database },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setDbType(type.id as DatabaseType)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            dbType === type.id ? 'border-sky-500 bg-sky-500/5' : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700'
                          }`}
                        >
                          <type.icon className={`w-5 h-5 ${dbType === type.id ? 'text-sky-500' : 'text-neutral-400'}`} />
                          <span className="text-[11px] font-bold">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-4">
                    {dbType === 'cloudflare-d1' && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-[11px] font-bold text-neutral-500">Account ID</label>
                          <input type="text" value={dbForm.accountId || ''} onChange={(e) => handleUpdateDbField('accountId', e.target.value)} className="w-full h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none" placeholder="7c94a5..." />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-[11px] font-bold text-neutral-500">Database ID (UUID)</label>
                          <input type="text" value={dbForm.databaseId || ''} onChange={(e) => handleUpdateDbField('databaseId', e.target.value)} className="w-full h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none" placeholder="3b47c0d2..." />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-[11px] font-bold text-neutral-500">API Token (D1:Edit)</label>
                          <input type="password" value={dbForm.apiToken || ''} onChange={(e) => handleUpdateDbField('apiToken', e.target.value)} className="w-full h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none" placeholder="••••••••" />
                        </div>
                      </div>
                    )}

                    {(dbType === 'supabase' || dbType === 'local-postgres') && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-[11px] font-bold text-neutral-500">Connection String (PostgreSQL)</label>
                          <input type="password" value={dbForm.connectionString || ''} onChange={(e) => handleUpdateDbField('connectionString', e.target.value)} className="w-full h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none" placeholder="postgres://user:pass@host:port/db" />
                        </div>
                      </div>
                    )}

                    {dbType === 'local-sqlite' && (
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-[11px] font-bold text-neutral-500">SQLite File Path (Server-relative)</label>
                          <input type="text" value={dbForm.filePath || ''} onChange={(e) => handleUpdateDbField('filePath', e.target.value)} className="w-full h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none" placeholder="/path/to/database.sqlite" />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={dbForm.enabled} onChange={(e) => handleUpdateDbField('enabled', e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-sky-500"></div>
                        </label>
                        <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">Enable External Database Sync</span>
                      </div>

                      <button
                        onClick={handleSaveDatabase}
                        disabled={isTestingDb}
                        className="h-12 w-full bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                      >
                        {isTestingDb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Connect & Sync
                      </button>
                    </div>

                    {dbTestResult && (
                      <div className={`p-4 rounded-xl text-[11px] font-bold flex items-center gap-3 ${dbTestResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {dbTestResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {dbTestResult.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Guide Section */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">
                    <Info className="w-4 h-4 text-sky-500" />
                    Setup Guide
                  </h4>
                  
                  <div className="grid gap-4">
                    {dbType === 'cloudflare-d1' && (
                      <div className="p-6 bg-white dark:bg-neutral-950 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-sky-500/20">01</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Create Database</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">เข้า Cloudflare Dashboard &gt; Workers & Pages &gt; D1 เพื่อสร้าง DB ใหม่</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-sky-500/20">02</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">API Token</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">ไปที่ User Profile &gt; API Tokens &gt; Create Token &gt; Edit D1</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-sky-500/20">03</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Copy Identifiers</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">คัดลอก Account ID และ Database ID มาวางในฟอร์มด้านซ้าย</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {dbType === 'supabase' && (
                      <div className="p-6 bg-white dark:bg-neutral-950 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-emerald-500/20">01</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Project Settings</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">เข้า Dashboard &gt; Project Settings &gt; Database</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-emerald-500/20">02</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Connection Info</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">หาหัวข้อ "Connection string" เลือกแบบ URI</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(dbType === 'local-sqlite' || dbType === 'local-postgres') && (
                      <div className="p-6 bg-white dark:bg-neutral-950 rounded-3xl border border-neutral-100 dark:border-neutral-800 space-y-6 shadow-sm">
                         <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-black text-sm shrink-0 shadow-lg">01</div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Server Configuration</p>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">ระบุ URL หรือ Path ของฐานข้อมูลที่รันอยู่บน Local Server</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6 bg-sky-500/5 dark:bg-sky-500/10 rounded-3xl border border-sky-500/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-sky-500 shrink-0" />
                        <h5 className="text-[11px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Secure Local Storage</h5>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-relaxed italic">
                        "ข้อมูลค่าที่ผู้ใช้กรอกจะถูก Hash และเข้ารหัสเก็บไว้ใน IndexedDB ของผู้ใช้เอง 100% ทุกอุปกรณ์ โดยไม่มีการส่งข้อมูลลับผ่านเซิร์ฟเวอร์ส่วนกลาง"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI MODELS */}
          {activeTab === 'providers' && (
            <div className="max-w-5xl space-y-10 pb-20">
              {/* Native Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-500" />
                      Google Gemini (Native)
                    </h4>
                    <p className="text-xs text-neutral-500">Native Protocol Google สำหรับโมเดล Gemini Flash และ Gemini Pro</p>
                  </div>
                </div>

                {(() => {
                  const native = aiProviders.find(p => p.id === 'gemini-native');
                  const isNativeConnected = Boolean(native?.isConnected || native?.customApiKey);

                  return (
                    <div className="p-6 sm:p-8 bg-neutral-950 text-white rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group border border-neutral-800">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] -mr-32 -mt-32 group-hover:bg-sky-500/20 transition-all pointer-events-none" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm">Google AI API</h5>
                            <p className="text-[11px] text-neutral-400 font-mono">gemini-3.5-flash / gemini-2.0-flash-exp</p>
                          </div>
                        </div>

                        {isNativeConnected ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>CONNECTED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold text-xs rounded-xl">
                            <span>DISCONNECTED</span>
                          </div>
                        )}
                      </div>

                      {geminiStatusFeedback && (
                        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 relative z-10 ${geminiStatusFeedback.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                          {geminiStatusFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                          <span>{geminiStatusFeedback.message}</span>
                        </div>
                      )}

                      {isNativeConnected && !replacingGeminiKey ? (
                        <div className="space-y-6 relative z-10">
                          {/* Active API Key Masked Box */}
                          <div className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                                <Key className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Active API Key</p>
                                <p className="text-xs font-mono tracking-widest text-neutral-200 mt-0.5">
                                  ••••••••••••••••••••••••••••••••
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  setReplacingGeminiKey(true);
                                  setGeminiKeyInput('');
                                }}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sky-400 text-xs font-bold rounded-xl transition-all active:scale-95 border border-neutral-700 hover:border-sky-500/50"
                              >
                                แทนที่ API Key
                              </button>
                              <button
                                onClick={handleDeleteGeminiKey}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all active:scale-95 border border-red-500/20"
                              >
                                ลบ API Key
                              </button>
                            </div>
                          </div>

                          {/* Model Selector & Test button */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select Active Model</label>
                              <div className="relative">
                                <select 
                                  value={native?.defaultModel || 'gemini-3.5-flash'}
                                  onChange={(e) => updateAIProvider('gemini-native', { defaultModel: e.target.value })}
                                  className="w-full h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs outline-none focus:border-sky-500 transition-all font-mono appearance-none"
                                >
                                  {(
                                    native?.availableModels && native.availableModels.length > 0
                                      ? native.availableModels
                                      : [
                                          'gemini-3.5-flash',
                                          'gemini-2.5-flash',
                                          'gemini-2.5-pro',
                                          'gemini-2.5-flash-lite',
                                          'gemini-1.5-flash',
                                          'gemini-1.5-pro',
                                          'gemini-flash-latest',
                                          'gemini-pro-latest',
                                        ]
                                  ).map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                                <ArrowRight className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Connection Check</label>
                              <button
                                onClick={() => handleTestProvider('gemini-native')}
                                disabled={testingProviderId === 'gemini-native'}
                                className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                              >
                                {testingProviderId === 'gemini-native' ? <RefreshCw className="w-4 h-4 animate-spin text-sky-400" /> : <Zap className="w-4 h-4 text-sky-400" />}
                                <span>Re-test Connection</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 relative z-10">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                              {replacingGeminiKey ? 'แทนที่ Google Gemini API Key' : 'เชื่อมต่อ Google Gemini API Key'}
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input 
                                type="password" 
                                value={geminiKeyInput}
                                onChange={(e) => setGeminiKeyInput(e.target.value)}
                                placeholder="กรอก API Key จาก Google AI Studio (AIzaSy...)"
                                className="flex-1 h-12 px-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs outline-none focus:border-sky-500 transition-all font-mono"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleSaveGeminiKey(geminiKeyInput)}
                                  disabled={testingProviderId === 'gemini-native' || !geminiKeyInput.trim()}
                                  className="h-12 px-6 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/20 text-xs"
                                >
                                  {testingProviderId === 'gemini-native' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                  {replacingGeminiKey ? 'บันทึกและแทนที่' : 'บันทึกและเชื่อมต่อ'}
                                </button>
                                {replacingGeminiKey && (
                                  <button
                                    onClick={() => {
                                      setReplacingGeminiKey(false);
                                      setGeminiKeyInput('');
                                    }}
                                    className="h-12 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-2xl text-xs font-bold transition-all"
                                  >
                                    ยกเลิก
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">
                              ยังไม่มีคีย์? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sky-400 font-bold hover:underline inline-flex items-center gap-1 ml-1">รับ API KEY ฟรีที่ Google AI Studio <ExternalLink className="w-3 h-3" /></a>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Custom Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-neutral-400" />
                      Add Custom Providers
                    </h4>
                    <p className="text-xs text-neutral-500">สามารถเพิ่ม OpenAI-Compatible Providers ได้สูงสุด 10 ราย (OpenRouter, Groq, DeepSeek, Local AI ฯลฯ)</p>
                  </div>
                  {!isAddingProvider && !editingProviderId && aiProviders.length < 11 && (
                    <button 
                      onClick={() => setIsAddingProvider(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl text-xs font-black transition-all border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Custom
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiProviders.filter(p => p.id !== 'gemini-native').map(p => (
                    <div key={p.id} className="p-6 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-5 relative group shadow-sm hover:shadow-xl hover:border-sky-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${p.isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                            <Server className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm truncate uppercase tracking-tight text-neutral-900 dark:text-neutral-100">{p.name}</h5>
                            <p className="text-[10px] text-neutral-500 font-mono truncate">{p.baseUrl}</p>
                          </div>
                        </div>

                        {p.isConnected ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-xl shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>CONNECTED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 font-bold text-[11px] rounded-xl shrink-0">
                            <span>DISCONNECTED</span>
                          </div>
                        )}
                      </div>

                      {providerTestResults[p.id] && (
                        <div className={`p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 ${providerTestResults[p.id].success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                          {providerTestResults[p.id].success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                          <span className="truncate">{providerTestResults[p.id].message}</span>
                        </div>
                      )}

                      {/* Active Key Display / Replace Mode */}
                      {replacingCustomKeyId === p.id ? (
                        <div className="p-4 bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/30 rounded-2xl space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">แทนที่ API Key สำหรับ {p.name}</label>
                          <input 
                            type="password"
                            value={customKeyInput}
                            onChange={(e) => setCustomKeyInput(e.target.value)}
                            placeholder="กรอก API Key ใหม่..."
                            className="w-full h-11 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono outline-none focus:border-sky-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplaceCustomKey(p.id, customKeyInput)}
                              disabled={testingProviderId === p.id || !customKeyInput.trim()}
                              className="flex-1 h-10 bg-sky-500 text-white font-bold rounded-xl text-xs active:scale-95 disabled:opacity-50"
                            >
                              {testingProviderId === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'บันทึกและเชื่อมต่อ'}
                            </button>
                            <button
                              onClick={() => {
                                setReplacingCustomKeyId(null);
                                setCustomKeyInput('');
                              }}
                              className="px-4 h-10 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-xs"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Active Key</p>
                              <p className="text-xs font-mono tracking-widest text-neutral-700 dark:text-neutral-300">
                                {p.customApiKey ? '••••••••••••••••••••••••••••••••' : 'No Key Set'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            <button
                              onClick={() => {
                                setReplacingCustomKeyId(p.id);
                                setCustomKeyInput('');
                              }}
                              className="px-2.5 py-1.5 bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-sky-600 dark:text-sky-400 text-[11px] font-bold rounded-lg transition-all"
                            >
                              แทนที่ Key
                            </button>
                            <button
                              onClick={() => handleDeleteCustomKey(p.id)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[11px] font-bold rounded-lg transition-all"
                            >
                              ลบ Key
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`ลบ Provider "${p.name}" ทั้งหมดหรือไม่?`)) {
                                  deleteAIProvider(p.id);
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                              title="ลบ Provider"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Model selector & Connect Button */}
                      <div className="space-y-3 pt-1">
                        {p.isConnected && p.availableModels && p.availableModels.length > 0 && (
                          <div className="relative">
                            <select 
                              value={p.defaultModel}
                              onChange={(e) => updateAIProvider(p.id, { defaultModel: e.target.value })}
                              className="w-full h-11 px-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold outline-none appearance-none hover:border-sky-500/50 transition-all font-mono"
                            >
                              {p.availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                          </div>
                        )}
                        
                        <button 
                          onClick={() => handleTestProvider(p.id)}
                          disabled={testingProviderId === p.id}
                          className="w-full h-11 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          {testingProviderId === p.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          <span>{p.isConnected ? 'Reconnect & Verify' : 'Connect Provider'}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {isAddingProvider && (
                    <div className="p-6 sm:p-8 bg-sky-500/5 border-2 border-dashed border-sky-500/30 rounded-3xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm uppercase tracking-wide text-sky-600 dark:text-sky-400">เพิ่ม Custom Provider</h5>
                          <p className="text-[10px] text-neutral-500">รองรับ OpenAI, OpenRouter, Groq, Ollama</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <input 
                          type="text" 
                          placeholder="ชื่อ Provider (เช่น OpenRouter)" 
                          value={newProviderForm.name} 
                          onChange={(e) => setNewProviderForm({...newProviderForm, name: e.target.value})} 
                          className="h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold focus:border-sky-500 outline-none transition-all shadow-xs" 
                        />
                        <input 
                          type="text" 
                          placeholder="Base URL (เช่น https://openrouter.ai/api/v1)" 
                          value={newProviderForm.baseUrl} 
                          onChange={(e) => setNewProviderForm({...newProviderForm, baseUrl: e.target.value})} 
                          className="h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none transition-all shadow-xs" 
                        />
                        <input 
                          type="password" 
                          placeholder="API Key (เช่น sk-or-v1-...)" 
                          value={newProviderForm.customApiKey} 
                          onChange={(e) => setNewProviderForm({...newProviderForm, customApiKey: e.target.value})} 
                          className="h-11 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-mono focus:border-sky-500 outline-none transition-all shadow-xs" 
                        />
                        
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handleAddProvider} 
                            disabled={!newProviderForm.name || !newProviderForm.baseUrl || !newProviderForm.customApiKey}
                            className="flex-1 h-12 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                          >
                            บันทึกและเชื่อมต่อ Provider
                          </button>
                          <button 
                            onClick={() => setIsAddingProvider(false)} 
                            className="px-6 h-12 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold active:scale-95 transition-all"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI INSTRUCTIONS */}
          {activeTab === 'ai-instructions' && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center"><Bot className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-sm font-bold">System Prompt Instructions</h4>
                    <p className="text-[11px] text-neutral-500">กำหนดพฤติกรรมและการตอบกลับของ AI ในเวิร์กสเปซนี้</p>
                  </div>
                </div>
                <textarea
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  rows={15}
                  className="w-full p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-[13px] leading-relaxed font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  placeholder="เช่น จงตอบกลับอย่างละเอียดและเป็นวิชาการ..."
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveInstructions} className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl shadow-lg hover:bg-sky-600 active:scale-95 transition-all">
                    Update Instructions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXPORT */}
          {activeTab === 'export' && (
            <div className="max-w-3xl space-y-8 pb-20">
              <div className="space-y-4">
                <h4 className="text-sm font-bold">Backup & Portability</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">ส่งออกข้อมูลเวิร์กสเปซของคุณในรูปแบบมาตรฐาน เพื่อความปลอดภัยและความสะดวกในการย้ายข้อมูล</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-8 bg-neutral-50 dark:bg-neutral-950 rounded-3xl border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between group hover:border-sky-500/50 transition-all">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                       <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-bold">Markdown Archive (ZIP)</h5>
                      <p className="text-[10px] text-neutral-500 mt-1">ส่งออกเป็นไฟล์ .md ตามโครงสร้างโฟลเดอร์ ใช้งานร่วมกับ Obsidian, Notion หรือ VS Code ได้ทันที</p>
                    </div>
                  </div>
                  <button onClick={exportWorkspaceAsMarkdownZip} className="mt-8 h-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 font-bold rounded-xl text-xs hover:bg-sky-500 hover:text-white transition-all">Download ZIP Archive</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Save Indicator / Footer for mobile */}
        <div className="sm:hidden px-4 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400">
             <Lock className="w-3.5 h-3.5 text-sky-500" /> Secure Encryption Active
           </div>
           <button onClick={onClose} className="px-8 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-[13px] font-bold shadow-lg">Close Settings</button>
        </div>
      </div>
    </div>
  );
};
