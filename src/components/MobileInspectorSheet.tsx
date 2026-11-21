import React, { useState } from 'react';
import {
  X,
  Sliders,
  Link2,
  ListTree,
  ChevronRight,
  Plus,
  Trash2,
  Tag,
  Clock,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { extractHeadings, parseMarkdown, serializeMarkdown } from '../utils/markdownParser';

interface MobileInspectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInspectorSheet: React.FC<MobileInspectorSheetProps> = ({ isOpen, onClose }) => {
  const { activeFile, updateFileContent, getBacklinks, getOutgoingLinks, openFileInTab } =
    useWorkspace();

  const [activeTab, setActiveTab] = useState<'properties' | 'backlinks' | 'outline'>('properties');

  if (!isOpen || !activeFile) return null;

  const parsed = parseMarkdown(activeFile.content);
  const headings = extractHeadings(activeFile.content);
  const backlinks = getBacklinks(activeFile.id);
  const outgoingLinks = getOutgoingLinks(activeFile.id);

  const handleUpdateProperty = (key: string, value: any) => {
    const updatedFm = { ...parsed.frontmatter, [key]: value };
    const newContent = serializeMarkdown(updatedFm, parsed.body);
    updateFileContent(activeFile.id, newContent);
  };

  const handleDeleteProperty = (key: string) => {
    const updatedFm = { ...parsed.frontmatter };
    delete updatedFm[key];
    const newContent = serializeMarkdown(updatedFm, parsed.body);
    updateFileContent(activeFile.id, newContent);
  };

  const handleAddProperty = () => {
    const key = prompt('Enter property name:');
    if (!key || !key.trim()) return;
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    handleUpdateProperty(cleanKey, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden select-none animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 max-h-[85vh] flex flex-col z-10 overflow-hidden">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 mb-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="font-display text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {activeFile.name}
            </h3>
            <p className="text-[11px] text-neutral-500">Document Inspector & Metadata</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="grid grid-cols-3 p-1 mx-4 my-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'properties'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Properties</span>
          </button>

          <button
            onClick={() => setActiveTab('backlinks')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'backlinks'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Links ({backlinks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outline')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'outline'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ListTree className="w-3.5 h-3.5 text-amber-500" />
            <span>Outline</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4 text-xs">
          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-neutral-500">YAML Frontmatter Fields</span>
                <button
                  onClick={handleAddProperty}
                  className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium py-1 px-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {Object.keys(parsed.frontmatter).length === 0 ? (
                <div className="p-6 text-center text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  No frontmatter properties. Tap "Add Field" to attach type, status, or tags.
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(parsed.frontmatter).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {key}
                        </span>
                        <button
                          onClick={() => handleDeleteProperty(key)}
                          className="p-1 text-neutral-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {Array.isArray(val) ? (
                        <input
                          type="text"
                          value={val.join(', ')}
                          onChange={(e) =>
                            handleUpdateProperty(
                              key,
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
                          placeholder="comma-separated tags..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(val ?? '')}
                          onChange={(e) => handleUpdateProperty(key, e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BACKLINKS */}
          {activeTab === 'backlinks' && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">
                  Notes Referencing "{activeFile.name.replace(/\.md$/, '')}"
                </span>
                {backlinks.length === 0 ? (
                  <p className="text-neutral-400 text-xs italic">
                    No other notes reference this document yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {backlinks.map(({ file, snippet }) => (
                      <div
                        key={file.id}
                        onClick={() => {
                          openFileInTab(file.id);
                          onClose();
                        }}
                        className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        <div className="font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between mb-1">
                          <span>{file.name.replace(/\.md$/, '')}</span>
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        </div>
                        <p className="text-neutral-500 text-[11px] line-clamp-2">{snippet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">
                  Outgoing Links ({outgoingLinks.length})
                </span>
                <div className="space-y-1.5">
                  {outgoingLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (link.resolvedFile) {
                          openFileInTab(link.resolvedFile.id);
                          onClose();
                        }
                      }}
                      className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Link2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium truncate">{link.targetName}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {link.resolvedFile ? 'Linked' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OUTLINE */}
          {activeTab === 'outline' && (
            <div className="space-y-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">
                Document Headings
              </span>
              {headings.length === 0 ? (
                <p className="text-neutral-400 text-xs italic">
                  No headings found. Use # Heading in your note to see them here.
                </p>
              ) : (
                headings.map((h, i) => (
                  <div
                    key={i}
                    onClick={onClose}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 10}px` }}
                  >
                    <span className="font-mono text-[10px] text-amber-500 font-bold">
                      H{h.level}
                    </span>
                    <span className="truncate font-medium">{h.text}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
