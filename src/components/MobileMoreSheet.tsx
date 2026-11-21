import React, { useState } from 'react';
import {
  X,
  GitBranch,
  Layers,
  Trash2,
  Settings,
  Search,
  Download,
  Moon,
  Sun,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenTrash,
  isDarkMode,
  setIsDarkMode,
}) => {
  const { setActiveView, setIsQuickSwitcherOpen, exportWorkspaceAsJson } = useWorkspace();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden select-none animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 p-5 z-10 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto -mt-1 mb-2" />

          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
              More Views & Tools
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title="About"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PWA Install Button Banner */}
          <PWAInstallButton variant="full" onInstalled={onClose} />

          <div className="space-y-1 text-sm">
            {/* Knowledge Graph */}
            <button
              onClick={() => {
                setActiveView('graph');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Knowledge Graph
                  </span>
                  <span className="text-[11px] text-neutral-500">Interactive note connections</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Templates */}
            <button
              onClick={() => {
                setActiveView('templates');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Note & Story Templates
                  </span>
                  <span className="text-[11px] text-neutral-500">Character, Timeline, Logs</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Quick Switcher */}
            <button
              onClick={() => {
                setIsQuickSwitcherOpen(true);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Quick Search (Ctrl+O)
                  </span>
                  <span className="text-[11px] text-neutral-500">Instant note jumping</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Trash */}
            <button
              onClick={() => {
                onOpenTrash();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Trash & Deleted Notes
                  </span>
                  <span className="text-[11px] text-neutral-500">Soft delete & restore</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Workspace Settings & AI
                  </span>
                  <span className="text-[11px] text-neutral-500">AI instructions & providers</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Export */}
            <button
              onClick={() => {
                exportWorkspaceAsJson();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Export Workspace
                  </span>
                  <span className="text-[11px] text-neutral-500">Download backup JSON</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Dark Mode Toggle */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">
                    Theme
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-medium text-xs text-neutral-800 dark:text-neutral-200"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5 text-neutral-900 dark:text-neutral-100 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-sky-500/30 border border-sky-500/30 shrink-0">
                  <img
                    src="/src/assets/images/mythos_logo_1793463782853.jpg"
                    alt="Mythos Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Mythos Workspace</h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">v1.0.0 Pro Edition</span>
                </div>
              </div>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans">
              <p>
                <strong className="text-neutral-900 dark:text-neutral-100">Mythos</strong> คือระบบ Workspace และ AI Knowledge Assistant ระดับโปร ที่ออกแบบมาเพื่อตอบโจทย์ทุกงานจดบันทึก การจัดการความรู้ การทำโปรเจกต์ การเรียน และงานเขียนสร้างสรรค์ทุกรูปแบบ
              </p>
              <p>
                โดดเด่นด้วยการจัดการ Markdown แบบ Rich Text ลื่นไหล, Frontmatter properties จัดระเบียบข้อมูล, Knowledge Graph เชื่อมโยงไอเดีย, Timeline ติดตามเหตุการณ์ และผู้ช่วย AI อัจฉริยะที่ช่วยคุณวิเคราะห์และค้นหาข้อมูลใน Workspace ได้อย่างทรงพลังบนทุกอุปกรณ์
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-xs font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Development by IndyShares Studio x Google AI Studio
              </span>
              <span className="text-[10px] text-neutral-400">
                All rights reserved © 2026
              </span>
            </div>

            <button
              onClick={() => setIsAboutOpen(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-sm transition-all shadow-md active:scale-98"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
