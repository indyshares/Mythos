import React, { useEffect, useRef, useState } from 'react';
import {
  Minimize2,
  Send,
  Sparkles,
  Bot,
  Check,
  CornerDownLeft,
  Trash2,
  Copy,
  Code,
  List,
  Link,
  Edit3,
  FileText,
  MessageSquare,
} from 'lucide-react';

interface AIExpandedInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  title?: string;
  placeholder?: string;
  isQuerying?: boolean;
  mode?: 'prompt' | 'edit';
  onSaveOnly?: () => void;
}

export const AIExpandedInputModal: React.FC<AIExpandedInputModalProps> = ({
  isOpen,
  onClose,
  value,
  onChange,
  onSubmit,
  title = 'AI Expanded Prompt Studio',
  placeholder = 'พิมพ์ข้อความของคุณที่นี่... (กด Shift+Enter เพื่อขึ้นบรรทัดใหม่, Enter เพื่อส่ง)',
  isQuerying = false,
  mode = 'prompt',
  onSaveOnly,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInsertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + snippet);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    onChange(newValue);

    setTimeout(() => {
      el.focus();
      const newPos = start + snippet.length;
      el.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const handleCopyText = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleClearText = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const estimatedTokens = Math.round(charCount / 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-6 animate-in fade-in duration-200 select-none">
      {/* Backdrop overlay */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Modal Window: Fullscreen on mobile (100dvh), Centered card on Desktop */}
      <div className="relative w-full h-[100dvh] sm:h-[88vh] sm:max-w-4xl bg-white dark:bg-neutral-900 sm:border border-neutral-200 dark:border-neutral-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col transition-all duration-200">
        
        {/* Header - No duplicate close/minimize buttons! Just a single clean "ย่อหน้าจอ" exit control */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              mode === 'edit'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
            }`}>
              {mode === 'edit' ? <Edit3 className="w-5 h-5 stroke-[2.5]" /> : <Sparkles className="w-5 h-5 stroke-[2.5]" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  mode === 'edit'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                }`}>
                  {mode === 'edit' ? 'Edit Mode' : 'Expanded'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate hidden sm:block">
                {mode === 'edit'
                  ? 'แก้ไขข้อความแชทเดิมอย่างละเอียดและสะดวกยิ่งขึ้น'
                  : 'พื้นที่พิมพ์แชทขนาดใหญ่ พร้อมสถิติและเครื่องมือช่วยแต่งข้อความ'}
              </p>
            </div>
          </div>

          {/* Single, non-duplicated minimize button in the header */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ย่อหน้าจอ"
            title="ย่อกลับไปที่หน้าต่างแชทหลัก"
            className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700/60 shadow-xs transition-all active:scale-95 shrink-0 touch-manipulation"
          >
            <Minimize2 className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="hidden sm:inline">ย่อหน้าจอ</span>
          </button>
        </div>

        {/* Quick formatting toolbar */}
        <div className="px-4 sm:px-6 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-950/40 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1 hidden sm:inline">
              เครื่องมือด่วน:
            </span>
            <button
              type="button"
              onClick={() => handleInsertSnippet('[[ ')}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="แทรก WikiLink [[ ]]"
            >
              <Link className="w-3 h-3 text-sky-500" />
              <span>[[WikiLink]]</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertSnippet('\n```\n\n```\n')}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="แทรก Block Code"
            >
              <Code className="w-3 h-3 text-sky-500" />
              <span>```Code```</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertSnippet('\n- ')}
              className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 transition-colors"
              title="แทรก List item"
            >
              <List className="w-3 h-3 text-sky-500" />
              <span>- List</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {value.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="คัดลอกข้อความทั้งหมด"
                >
                  {copiedNotice ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedNotice ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearText}
                  className="px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="ล้างข้อความทั้งหมด"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างข้อความ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Textarea Workspace Area */}
        <div className="flex-1 p-3 sm:p-6 flex flex-col bg-neutral-50/40 dark:bg-neutral-950/40 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full flex-1 p-4 sm:p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm leading-relaxed text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none font-sans"
          />
        </div>

        {/* Footer Area - Unboxed metadata + Single Clear Action Controls */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/90 dark:bg-neutral-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Metadata Discipline: Unboxed plain text metadata with dot separators */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1 text-[11px]">
              <CornerDownLeft className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span><strong>Enter</strong> ส่ง • <strong>Shift+Enter</strong> ขึ้นบรรทัดใหม่</span>
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
              {wordCount} คำ • {charCount} ตัวอักษร (~{estimatedTokens} tokens)
            </span>
          </div>

          {/* Clean Action Buttons (No Duplicate Close Buttons) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors touch-manipulation flex-1 sm:flex-initial"
            >
              ยกเลิก
            </button>

            {mode === 'edit' && onSaveOnly && (
              <button
                type="button"
                onClick={() => {
                  onSaveOnly();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors touch-manipulation flex-1 sm:flex-initial"
              >
                บันทึกเท่านั้น
              </button>
            )}

            <button
              type="button"
              disabled={!value.trim()}
              onClick={() => {
                onSubmit();
                onClose();
              }}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all touch-manipulation flex-1 sm:flex-initial"
            >
              {mode === 'edit' ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>
                {mode === 'edit'
                  ? 'บันทึกและส่งคำถามใหม่'
                  : isQuerying
                  ? 'จัดเข้าคิว (Queue)'
                  : 'ส่งข้อความ'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
