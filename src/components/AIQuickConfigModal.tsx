import React, { useState, useEffect } from 'react';
import { Sliders, X, Check, Bot, CheckCircle2, Key, BookOpen, ExternalLink, Cpu, Zap, Sparkles, SlidersHorizontal, MessageSquareText, Layers } from 'lucide-react';
import { ResponseConciseness } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';

interface AIQuickConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  conciseness: ResponseConciseness;
  setConciseness: (c: ResponseConciseness) => void;
  contextLimit: number;
  setContextLimit: (limit: number) => void;
  onOpenFullSettings?: () => void;
}

export const AIQuickConfigModal: React.FC<AIQuickConfigModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  setSelectedModel,
  conciseness,
  setConciseness,
  contextLimit,
  setContextLimit,
  onOpenFullSettings,
}) => {
  const { aiProviders, workspaceInstructions, updateInstructions } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'models' | 'instructions' | 'parameters'>('models');
  const [draftInstructions, setDraftInstructions] = useState(workspaceInstructions?.content || '');
  const [savedInstructionsNotice, setSavedInstructionsNotice] = useState(false);

  // Sync draft instructions when modal opens or workspaceInstructions changes
  useEffect(() => {
    if (workspaceInstructions?.content) {
      setDraftInstructions(workspaceInstructions.content);
    }
  }, [workspaceInstructions?.content, isOpen]);

  if (!isOpen) return null;

  // Filter ONLY connected providers (has customApiKey or marked isConnected or native Gemini)
  const connectedProviders = aiProviders.filter((p) => {
    if (p.isConnected) return true;
    if (p.customApiKey && p.customApiKey.trim().length > 0) return true;
    if (p.id === 'gemini-native') return true;
    return false;
  });

  const handleSaveInstructions = () => {
    updateInstructions(draftInstructions);
    setSavedInstructionsNotice(true);
    setTimeout(() => setSavedInstructionsNotice(false), 2500);
  };

  const handleApplyPreset = (presetText: string) => {
    setDraftInstructions(presetText);
    updateInstructions(presetText);
    setSavedInstructionsNotice(true);
    setTimeout(() => setSavedInstructionsNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-xs select-none p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop Click */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Container: Bottom sheet on mobile, centered modal on sm+ */}
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-neutral-900 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[28px] sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden transition-all duration-300">
        
        {/* Mobile Top Sheet Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100">
                  AI Quick Settings
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hidden sm:inline-flex">
                  Mobile & Desktop
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                จัดการโมเดล AI คำสั่งระบบ และพารามิเตอร์การตอบ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Touch-optimized Segmented Tab Navigation Bar */}
        <div className="p-2 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-neutral-950/40 shrink-0">
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60">
            <button
              type="button"
              onClick={() => setActiveTab('models')}
              className={`min-h-[42px] px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                activeTab === 'models'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Models</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'models' ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}>
                {connectedProviders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('instructions')}
              className={`min-h-[42px] px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                activeTab === 'instructions'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Instructions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('parameters')}
              className={`min-h-[42px] px-2 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                activeTab === 'parameters'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Params</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* TAB 1: Connected AI Models */}
          {activeTab === 'models' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    โมเดลที่เปิดใช้งาน (Connected Models)
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    เลือกโมเดลที่ต้องการใช้งานในแชทปัจจุบัน
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {connectedProviders.map((provider) => {
                  const isNative = provider.id === 'gemini-native';
                  const availableModels = provider.availableModels && provider.availableModels.length > 0
                    ? provider.availableModels
                    : isNative
                    ? [
                        'gemini-3.8-flash',
                        'gemini-3.8-pro',
                        'gemini-2.5-flash',
                        'gemini-2.5-pro',
                        'gemini-2.5-flash-lite',
                        'gemini-1.5-flash',
                        'gemini-1.5-pro',
                        'gemini-flash-latest',
                        'gemini-pro-latest',
                      ]
                    : [provider.defaultModel || 'gpt-4o-mini'];

                  const hasCustomKey = Boolean(provider.customApiKey);

                  return (
                    <div
                      key={provider.id}
                      className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60 space-y-3"
                    >
                      {/* Provider Header Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                            {provider.name}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        </div>

                        {/* Masked API Key Badge */}
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono bg-neutral-200/60 dark:bg-neutral-800/60 px-2 py-0.5 rounded-md">
                          <Key className="w-3 h-3 text-neutral-500" />
                          <span>{hasCustomKey ? '••••••••' : '(AI Studio Key)'}</span>
                        </div>
                      </div>

                      {/* Models List Touch Cards */}
                      <div className="grid gap-2">
                        {availableModels.map((m) => {
                          const isSelected = selectedModel === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedModel(m)}
                              className={`w-full min-h-[46px] p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.99] touch-manipulation ${
                                isSelected
                                  ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-sky-400/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-sky-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                <span className="font-mono text-xs truncate">{m}</span>
                                {m === 'gemini-3.8-flash' && (
                                  <span className="ml-1 shrink-0 text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded font-bold flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5 fill-current" /> Fast
                                  </span>
                                )}
                              </div>
                              <div className="shrink-0">
                                {isSelected ? (
                                  <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-700" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manage Providers Action Card */}
              <div className="p-3.5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    ต้องการเชื่อมต่อ Provider เพิ่มเติม?
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    เพิ่ม API Key สำหรับ OpenRouter, Groq, DeepSeek และอื่นๆ
                  </p>
                </div>
                {onOpenFullSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullSettings();
                    }}
                    className="shrink-0 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-bold text-sky-600 dark:text-sky-400 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-750 flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span>ตั้งค่าโมเดล</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Instructions */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 text-xs">
                  <BookOpen className="w-4 h-4 text-sky-500" />
                  Workspace System Instructions
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  คำสั่งระดับเวิร์กสเปซที่จะกำกับดูแลการตอบของ AI
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  คำสั่งด่วน (Quick Presets):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        `# Workspace Instructions\n\n- สวมบทบาทเป็นผู้ช่วยนักเขียนนิยายระดับมืออาชีพ\n- ใช้ภาษาไทยสละสลวย บรรยายอารมณ์และฉากอย่างมีชีวิตชีวา\n- พัฒนาบทสนทนาให้มีเอกลักษณ์และเป็นธรรมชาติ`
                      )
                    }
                    className="p-2.5 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-left text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/50 dark:border-neutral-700/50"
                  >
                    <span className="text-base">✍️</span>
                    <div>
                      <div className="font-bold">นักเขียนนิยาย</div>
                      <div className="text-[9px] text-neutral-400 font-normal">บรรยายสละสลวย</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        `# Workspace Instructions\n\n- สวมบทบาทเป็นผู้เชี่ยวชาญจักรวาล (Lore Master)\n- ยึดถือกฎเกณฑ์และประวัติศาสตร์ในเวิร์กสเปซอย่างเคร่งครัด\n- อ้างอิงแหล่งที่มา เช่น [Note.md] เสมอ`
                      )
                    }
                    className="p-2.5 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-left text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/50 dark:border-neutral-700/50"
                  >
                    <span className="text-base">🧠</span>
                    <div>
                      <div className="font-bold">ผู้เชี่ยวชาญ Lore</div>
                      <div className="text-[9px] text-neutral-400 font-normal">อ้างอิงความถูกต้อง</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApplyPreset(
                        `# Workspace Instructions\n\n- ตอบตรงประเด็น รวดเร็ว และกระชับ\n- สรุปใจความสำคัญเป็นข้อๆ ไม่ต้องมีคำเกริ่นนำหรือคำลงท้ายซ้ำซ้อน`
                      )
                    }
                    className="p-2.5 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-left text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/50 dark:border-neutral-700/50"
                  >
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-bold">กระชับ & สรุปข้อ</div>
                      <div className="text-[9px] text-neutral-400 font-normal">ตอบตรงประเด็น</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Instructions Textarea */}
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  value={draftInstructions}
                  onChange={(e) => setDraftInstructions(e.target.value)}
                  placeholder="พิมพ์คำสั่งระบบ AI เช่น แนวทางการตอบ กฎของเรื่อง หรือแนวคิดสำคัญ..."
                  className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {savedInstructionsNotice ? (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> บันทึกคำสั่งเรียบร้อยแล้ว!
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400">บันทึกแล้วจะมีผลในข้อความถัดไป</span>
                )}

                <button
                  type="button"
                  onClick={handleSaveInstructions}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 touch-manipulation"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>บันทึกคำสั่ง</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Parameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Conciseness Mode */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  ระดับความกระชับในการตอบ (Conciseness Mode):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConciseness('concise')}
                    className={`min-h-[54px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                      conciseness === 'concise'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs ring-1 ring-sky-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold">กระชับ</span>
                    <span className="text-[9px] text-neutral-400 font-normal">Concise</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConciseness('balanced')}
                    className={`min-h-[54px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                      conciseness === 'balanced'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs ring-1 ring-sky-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold">สมดุล</span>
                    <span className="text-[9px] text-neutral-400 font-normal">Balanced</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConciseness('detailed')}
                    className={`min-h-[54px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all touch-manipulation ${
                      conciseness === 'detailed'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs ring-1 ring-sky-500/30'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xs font-bold">ละเอียด</span>
                    <span className="text-[9px] text-neutral-400 font-normal">Detailed</span>
                  </button>
                </div>
              </div>

              {/* Context Window Limit */}
              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                      Context Window Limit:
                    </label>
                    <p className="text-[10px] text-neutral-400">จํานวน Token สูงสุดที่ส่งให้ AI ในแต่ละ Turn</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                    {(contextLimit / 1000).toFixed(0)}k tokens
                  </span>
                </div>

                {/* Range Input Slider */}
                <div className="space-y-2 py-1">
                  <input
                    type="range"
                    min={10000}
                    max={1000000}
                    step={10000}
                    value={contextLimit}
                    onChange={(e) => setContextLimit(Number(e.target.value))}
                    className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  
                  {/* Preset Buttons for Easy Touch Selecting */}
                  <div className="flex items-center justify-between text-[10px] gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setContextLimit(100000)}
                      className={`px-2.5 py-1 rounded-lg font-mono border transition-all ${
                        contextLimit === 100000
                          ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      100k Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setContextLimit(500000)}
                      className={`px-2.5 py-1 rounded-lg font-mono border transition-all ${
                        contextLimit === 500000
                          ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      500k Large
                    </button>
                    <button
                      type="button"
                      onClick={() => setContextLimit(1000000)}
                      className={`px-2.5 py-1 rounded-lg font-mono border transition-all ${
                        contextLimit === 1000000
                          ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      1M Maximum
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile & Desktop Footer Action Bar */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/90 dark:bg-neutral-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex items-center gap-1.5 text-xs">
            <span className="text-neutral-400 hidden sm:inline">Selected:</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400 truncate max-w-[150px] sm:max-w-[200px]">
              {selectedModel}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] touch-manipulation flex items-center gap-1.5 shrink-0"
          >
            <span>เรียบร้อย</span>
          </button>
        </div>
      </div>
    </div>
  );
};
