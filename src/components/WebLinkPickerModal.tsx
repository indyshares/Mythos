import React, { useState, useEffect } from 'react';
import { Globe, X, Link2 } from 'lucide-react';

interface WebLinkPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLink: (url: string, label: string) => void;
  initialSelectedText?: string;
}

export const WebLinkPickerModal: React.FC<WebLinkPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertLink,
  initialSelectedText = '',
}) => {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setLabel(initialSelectedText || '');
    }
  }, [isOpen, initialSelectedText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = url.trim();
    if (!cleanUrl) return;

    if (!/^https?:\/\//i.test(cleanUrl) && !/^mailto:/i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const finalLabel = label.trim() || cleanUrl;
    onInsertLink(cleanUrl, finalLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                เพิ่มลิงก์ภายนอก (External Link)
              </h3>
              <p className="text-[11px] text-neutral-500">ระบุ URL เว็บไซต์และชื่อข้อความแสดงผล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              URL เว็บไซต์ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="https://example.com หรือ example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              ข้อความแสดงผล (Link Title / Label):
            </label>
            <input
              type="text"
              placeholder="ระบุข้อความที่จะให้แสดงบนลิงก์ (หากไม่ระบุจะใช้ URL)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
            />
            {initialSelectedText && (
              <p className="mt-1 text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                ✓ ดึงข้อความที่เลือกใน Editor มาตั้งเป็นชื่อลิงก์ให้อัตโนมัติแล้ว
              </p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              เพิ่มลิงก์
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
