import React, { useState, useMemo } from 'react';
import {
  Layers,
  User,
  MapPin,
  Sparkles,
  Calendar,
  PenTool,
  BookOpen,
  Shield,
  ArrowRight,
  Search,
  X,
  FileText,
  Check,
  Plus,
  Bookmark,
  FolderPlus,
  Trash2,
  MoveRight,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { TEMPLATE_LIBRARY, applyTemplate } from '../utils/templates';
import { NoteTemplate } from '../types';

interface TemplatesViewProps {
  onNavigateToEditor?: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onNavigateToEditor }) => {
  const {
    createFile,
    openFileInTab,
    setActiveView,
    files,
    activeFile,
    customTemplates,
    templateCategories,
    createCustomTemplate,
    addTemplateCategory,
    moveTemplateCategory,
    deleteCustomTemplate,
  } = useWorkspace();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Template creation dialog state
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [customFilename, setCustomFilename] = useState<string>('');

  // Category modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Combine built-in templates with custom user templates
  const allTemplates = useMemo(() => {
    return [...TEMPLATE_LIBRARY, ...customTemplates];
  }, [customTemplates]);

  const categories = useMemo(() => {
    const set = new Set(['All', ...templateCategories]);
    allTemplates.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [templateCategories, allTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.defaultFilename.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'User':
        return <User className="w-5 h-5 text-sky-500" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-pink-500" />;
      case 'PenTool':
        return <PenTool className="w-5 h-5 text-sky-500" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-rose-500" />;
      default:
        return <Layers className="w-5 h-5 text-sky-500" />;
    }
  };

  const handleOpenTemplateModal = (template: NoteTemplate) => {
    const { filename } = applyTemplate(template);
    setSelectedTemplate(template);
    setCustomFilename(filename);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !customFilename.trim()) return;

    const { content } = applyTemplate(selectedTemplate);
    const newFile = createFile(customFilename.trim(), null, content);
    setSelectedTemplate(null);
    openFileInTab(newFile.id);
    setActiveView('editor');
  };

  const handleOpenEditorForTemplate = () => {
    if (!activeFile && files && files.length > 0) {
      const nonDeleted = files.filter((f) => !f.deletedAt);
      if (nonDeleted.length > 0) {
        openFileInTab(nonDeleted[0].id);
      }
    }
    setActiveView('editor');
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    addTemplateCategory(newCatInput.trim());
    setNewCatInput('');
    setShowAddCatModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-y-auto p-3.5 sm:p-8 max-w-5xl mx-auto w-full select-none pb-20 sm:pb-8">
      {/* Header */}
      <div className="pb-5 border-b border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 shrink-0" />
              <span>Note & Story Template Library</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              สร้าง, บันทึก และจัดหมวดหมู่เทมเพลตสำหรับตัวละคร, เวิลด์บิลดิ้ง, พล็อตเรื่อง และบันทึก
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddCatModal(true)}
              className="min-h-[40px] px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-sky-500" />
              <span>+ หมวดหมู่</span>
            </button>

            <button
              onClick={handleOpenEditorForTemplate}
              className="min-h-[40px] px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
              title="เปิดหน้า Editor เพื่อเขียนและบันทึกเป็น Template"
            >
              <PenTool className="w-4 h-4" />
              <span>สร้าง Custom Template</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="ค้นหาเทมเพลตตามชื่อ, คำอธิบาย หรือประเภท..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-9.5 pr-8 py-2.5 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? allTemplates.length
                : allTemplates.filter((t) => t.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-xs font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="py-16 text-center text-neutral-400 space-y-2">
          <Layers className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-700" />
          <p className="text-sm font-medium">ไม่พบเทมเพลตที่ตรงกับคำค้นหา "{searchQuery}"</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-xs text-sky-500 hover:underline pt-1"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 py-5 sm:py-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-sky-500/50 rounded-2xl transition-all hover:shadow-md flex flex-col justify-between group active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center gap-2">
                    {getTemplateIcon(template.icon)}
                    {template.isCustom && (
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800">
                      {template.category}
                    </span>

                    {template.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`คุณต้องการลบเทมเพลต "${template.name}" หรือไม่?`)) {
                            deleteCustomTemplate(template.id);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-red-500 rounded"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 group-hover:text-sky-500 transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                  {template.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800/60 text-xs">
                <span className="font-mono text-[11px] text-neutral-400 truncate max-w-[150px]">
                  {template.defaultFilename}
                </span>

                <button
                  onClick={() => handleOpenTemplateModal(template)}
                  className="min-h-[36px] px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>ใช้งาน</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instantiate Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs select-none p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setSelectedTemplate(null)} />

          <div className="relative w-full sm:max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  {getTemplateIcon(selectedTemplate.icon)}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedTemplate.name}
                  </h3>
                  <span className="text-[11px] text-neutral-500">{selectedTemplate.category}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTemplate(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  ตั้งชื่อไฟล์โน้ต (Filename):
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                  <input
                    type="text"
                    autoFocus
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    className="w-full min-h-[44px] pl-9.5 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-950/80 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400">ตัวอย่าง Markdown Schema:</span>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-3 font-mono leading-relaxed">
                  {selectedTemplate.templateContent.slice(0, 150)}...
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!customFilename.trim()}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>สร้างและเริ่มเขียน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowAddCatModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-5 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100">
                Add Template Category
              </h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Category Name:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="e.g. Quests, Magic Systems..."
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
