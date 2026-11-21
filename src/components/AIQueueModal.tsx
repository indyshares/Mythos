import React, { useState } from 'react';
import {
  Clock,
  X,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  ListOrdered,
  AlertCircle,
} from 'lucide-react';

export interface QueueItem {
  id: string;
  prompt: string;
  sessionId: string;
  createdAt: string;
}

interface AIQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: QueueItem[];
  onUpdateItem: (id: string, newPrompt: string) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClearQueue: () => void;
}

export const AIQueueModal: React.FC<AIQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onUpdateItem,
  onRemoveItem,
  onReorder,
  onClearQueue,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (item: QueueItem) => {
    setEditingId(item.id);
    setEditPromptText(item.prompt);
  };

  const handleSaveEdit = (id: string) => {
    const cleanText = editPromptText.trim();
    if (cleanText) {
      onUpdateItem(id, cleanText);
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-50/80 dark:bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  AI Request Queue
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                  {queue.length}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                จัดการลำดับ แก้ไข หรือยกเลิกข้อความที่รอประมวลผล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-3">
              <ListOrdered className="w-10 h-10 mx-auto opacity-40 text-amber-500" />
              <div>
                <p className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                  ไม่มีข้อความในคิว
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  เมื่อคุณส่งข้อความขณะที่ AI กำลังประมวลผลอยู่ ข้อความใหม่จะถูกจัดเข้าคิวและดำเนินการต่อเนื่องโดยอัตโนมัติ
                </p>
              </div>
            </div>
          ) : (
            queue.map((item, index) => {
              const isEditing = editingId === item.id;
              const isFirst = index === 0;
              const isLast = index === queue.length - 1;

              return (
                <div
                  key={item.id}
                  className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3 hover:border-amber-500/40 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => onReorder(index, index - 1)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="เลื่อนขึ้น"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => onReorder(index, index + 1)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="เลื่อนลง"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-sky-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                          title="แก้ไขข้อความ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove / Cancel */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="ยกเลิกข้อความนี้ในคิว"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body: Editing or Text Preview */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editPromptText}
                        onChange={(e) => setEditPromptText(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-white dark:bg-neutral-900 border border-amber-500 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-amber-500/20"
                        placeholder="แก้ไขข้อความ..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>บันทึกการแก้ไข</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed bg-white/70 dark:bg-neutral-900/70 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80">
                      {item.prompt}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {queue.length > 0 && (
          <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการยกเลิกและล้างข้อความทั้งหมดในคิวหรือไม่?')) {
                  onClearQueue();
                }
              }}
              className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างคิวทั้งหมด</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              เสร็จสิ้น
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
