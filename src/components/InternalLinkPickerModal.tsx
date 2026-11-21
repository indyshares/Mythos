import React, { useState, useEffect } from 'react';
import { Search, FileText, X, Link2, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface InternalLinkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLink: (fileTitle: string, customDisplay?: string) => void;
  initialSelectedText?: string;
}

export const InternalLinkPickerModal: React.FC<InternalLinkPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLink,
  initialSelectedText = '',
}) => {
  const { files, activeWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [customDisplay, setCustomDisplay] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCustomDisplay(initialSelectedText || '');
    }
  }, [isOpen, initialSelectedText]);

  if (!isOpen) return null;

  const activeFiles = files.filter(
    (f) => f.workspaceId === activeWorkspace.id && !f.deletedAt
  );

  const filteredFiles = activeFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.content && f.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleChoose = (fileTitle: string) => {
    const finalDisplay = customDisplay.trim() || undefined;
    onSelectLink(fileTitle, finalDisplay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                แทรก Internal Link ([[Link]])
              </h3>
              <p className="text-[11px] text-neutral-500">เลือกไฟล์เป้าหมาย และตั้งชื่อข้อความแสดงผลได้ตามต้องการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs Section */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-2 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              ข้อความแสดงผล (Display Label / Title):
            </label>
            <input
              type="text"
              placeholder="ระบุข้อความที่จะให้แสดงบนลิงก์ (เช่น นางเอก, ดาบเวท)..."
              value={customDisplay}
              onChange={(e) => setCustomDisplay(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
            />
            {initialSelectedText && (
              <p className="mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                ✓ ดึงข้อความที่เลือกใน Editor มาตั้งเป็นชื่อลิงก์ให้อัตโนมัติแล้ว
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              ค้นหาไฟล์เป้าหมาย (Internal Target Note):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus={!initialSelectedText}
                placeholder="ค้นหาชื่อบันทึกใน Workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
          {searchQuery.trim() && (
            <div
              onClick={() => handleChoose(searchQuery.trim())}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-colors border border-sky-500/30 mb-2 font-medium"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">
                  ลิงก์ไปยังข้อความระบุเอง: <span className="underline">[[{searchQuery.trim()}]]</span>
                </p>
                {customDisplay.trim() && (
                  <p className="text-[10px] text-neutral-500 font-normal">
                    แสดงผลเป็น: &quot;{customDisplay.trim()}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          {filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-neutral-400">
              <p>ไม่พบไฟล์ที่ตรงกับการค้นหา</p>
            </div>
          ) : (
            filteredFiles.map((file) => {
              const noteTitle = file.name.replace(/\.md$/, '');
              const displayLabel = customDisplay.trim() || noteTitle;
              const hasAlias = customDisplay.trim() && customDisplay.trim() !== noteTitle;

              return (
                <div
                  key={file.id}
                  onClick={() => handleChoose(noteTitle)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors border border-transparent hover:border-sky-500/20 group"
                >
                  <FileText className="w-4 h-4 text-neutral-400 group-hover:text-sky-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {noteTitle}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono truncate">
                      /{file.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      {hasAlias ? `[[${noteTitle}|${displayLabel}]]` : `[[${noteTitle}]]`}
                    </span>
                    {hasAlias && (
                      <span className="text-[9px] text-sky-600 dark:text-sky-400 font-sans mt-0.5">
                        แสดง: &quot;{displayLabel}&quot;
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
