import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Tag,
  ArrowRight,
  Trash2,
  Edit3,
  FolderPlus,
  Folder,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { parseMarkdown, serializeMarkdown } from '../utils/markdownParser';

interface TimelineViewProps {
  onNavigateToEditor?: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onNavigateToEditor }) => {
  const {
    files,
    folders,
    activeWorkspaceId,
    openFileInTab,
    createFile,
    createFolder,
    softDeleteFile,
    updateFileContent,
    setActiveView,
  } = useWorkspace();

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State for New Event
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [storyDate, setStoryDate] = useState('Year 420, Era of Embers');
  const [eventStatus, setEventStatus] = useState<'planned' | 'ongoing' | 'occurred'>('planned');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('auto_event'); // 'auto_event', folder.id, 'root', 'new'
  const [newFolderName, setNewFolderName] = useState('');

  // Extract all event notes or notes with story_date
  const timelineEvents = useMemo(() => {
    const wsFiles = files.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt);
    const events: {
      id: string;
      title: string;
      storyDate: string;
      status: string;
      type: string;
      summary: string;
      tags: string[];
      fileName: string;
      rawContent: string;
    }[] = [];

    wsFiles.forEach((file) => {
      const parsed = parseMarkdown(file.content);
      const storyDateVal =
        parsed.frontmatter.story_date ||
        (parsed.frontmatter.type === 'event' ? 'Undated Event' : null);

      if (storyDateVal || parsed.frontmatter.type === 'event') {
        const summaryMatch = parsed.body.replace(/^#+.*$/gm, '').trim();
        const firstParagraph = summaryMatch.split('\n\n')[0] || '';

        events.push({
          id: file.id,
          title: parsed.frontmatter.title || file.name.replace(/\.md$/, ''),
          storyDate: String(storyDateVal || 'Planned Milestone'),
          status: String(parsed.frontmatter.status || 'planned'),
          type: String(parsed.frontmatter.type || 'event'),
          summary: firstParagraph.slice(0, 160),
          tags: parsed.frontmatter.tags || [],
          fileName: file.name,
          rawContent: file.content,
        });
      }
    });

    return events;
  }, [files, activeWorkspaceId]);

  const activeFolders = useMemo(() => {
    return folders.filter((f) => f.workspaceId === activeWorkspaceId && !f.deletedAt);
  }, [folders, activeWorkspaceId]);

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return timelineEvents;
    return timelineEvents.filter((e) => e.status.toLowerCase() === statusFilter.toLowerCase());
  }, [timelineEvents, statusFilter]);

  // Handle Opening Create Modal
  const handleOpenCreateModal = () => {
    const existingEventFolder = activeFolders.find(
      (f) => f.name.toLowerCase() === 'event' || f.name.toLowerCase() === 'events'
    );

    if (existingEventFolder) {
      setSelectedFolderId(existingEventFolder.id);
    } else {
      setSelectedFolderId('auto_event');
    }

    setEventTitle('');
    setStoryDate('Year 420, Era of Embers');
    setEventStatus('planned');
    setNewFolderName('');
    setShowCreateModal(true);
  };

  // Handle Done / Creating Event
  const handleDoneCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = eventTitle.trim() || 'New Story Event';

    let targetParentFolderId: string | null = null;

    if (selectedFolderId === 'auto_event') {
      const existing = activeFolders.find(
        (f) => f.name.toLowerCase() === 'event' || f.name.toLowerCase() === 'events'
      );
      if (existing) {
        targetParentFolderId = existing.id;
      } else {
        const created = createFolder('Event', null);
        targetParentFolderId = created.id;
      }
    } else if (selectedFolderId === 'new') {
      const folderName = newFolderName.trim() || 'Event';
      const created = createFolder(folderName, null);
      targetParentFolderId = created.id;
    } else if (selectedFolderId !== 'root') {
      targetParentFolderId = selectedFolderId;
    }

    const eventContent = `---
id: EVT-${Date.now()}
title: "${cleanTitle}"
type: event
status: ${eventStatus}
story_date: "${storyDate.trim() || 'Undated Event'}"
tags:
  - event
  - timeline
---

# ${cleanTitle}

## 1. Overview
Summary of this story event...

## 2. Participants
- [[Lucia]]
- [[Lysander]]

## 3. Immediate Fallout
Consequences to the plot...
`;

    const newFile = createFile(`${cleanTitle}.md`, targetParentFolderId, eventContent);
    setShowCreateModal(false);

    // Open in Tab & Switch to Editor
    openFileInTab(newFile.id);
    setActiveView('editor');
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  // Handle Editing an Event (Open in Editor)
  const handleEditEvent = (evtId: string) => {
    openFileInTab(evtId);
    setActiveView('editor');
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  // Handle Deleting an Event
  const handleDeleteEvent = (e: React.MouseEvent, evtId: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete event "${title}"?`)) {
      softDeleteFile(evtId);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = (e: React.MouseEvent, evt: (typeof timelineEvents)[0]) => {
    e.stopPropagation();
    const nextStatusMap: Record<string, string> = {
      planned: 'ongoing',
      ongoing: 'occurred',
      occurred: 'planned',
    };
    const nextStatus = nextStatusMap[evt.status.toLowerCase()] || 'planned';

    const parsed = parseMarkdown(evt.rawContent);
    const updatedFm = { ...parsed.frontmatter, status: nextStatus };
    const updatedContent = serializeMarkdown(updatedFm, parsed.body);

    updateFileContent(evt.id, updatedContent);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto w-full select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-sky-500" />
            Story Timeline & Event Tracker
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Chronological map of narrative milestones extracted directly from note frontmatter.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs">
            {['all', 'planned', 'ongoing', 'occurred'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors font-medium ${
                  statusFilter === st
                    ? 'bg-white dark:bg-neutral-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="py-8 relative">
        {/* Continuous center spine line */}
        <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-neutral-200 dark:bg-neutral-800" />

        {filteredEvents.length === 0 ? (
          <div className="pl-14 py-12 text-neutral-400 text-xs flex flex-col items-start gap-3">
            <p>
              No timeline events match the filter. Click{' '}
              <span className="font-semibold text-sky-500">"New Event"</span> to create one in your workspace.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event Note</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((evt) => {
              const isOccurred = evt.status === 'occurred' || evt.status === 'concluded';
              const isOngoing = evt.status === 'ongoing';

              return (
                <div key={evt.id} className="relative flex items-start pl-14 group">
                  {/* Timeline Node Dot */}
                  <div
                    onClick={(e) => handleToggleStatus(e, evt)}
                    title="Click to toggle status (Planned -> Ongoing -> Occurred)"
                    className={`absolute left-[19px] top-3.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-neutral-900 flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                      isOccurred
                        ? 'border-emerald-500'
                        : isOngoing
                        ? 'border-amber-500'
                        : 'border-sky-500'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOccurred
                          ? 'bg-emerald-500'
                          : isOngoing
                          ? 'bg-amber-500'
                          : 'bg-sky-500'
                      }`}
                    />
                  </div>

                  {/* Event Card */}
                  <div
                    onClick={() => handleEditEvent(evt.id)}
                    className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-sky-500/50 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
                          {evt.storyDate}
                        </span>
                        <span className="text-neutral-400">·</span>
                        <button
                          onClick={(e) => handleToggleStatus(e, evt)}
                          title="Click to change status"
                          className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded transition-colors ${
                            isOccurred
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                              : isOngoing
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20'
                          }`}
                        >
                          {evt.status}
                        </button>
                      </div>

                      {/* Card Action Buttons (Edit & Delete) */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditEvent(evt.id)}
                          className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-sky-600 dark:hover:text-sky-400 px-2 py-1 bg-neutral-200/50 dark:bg-neutral-800 hover:bg-sky-500/10 rounded-md transition-colors"
                          title="Edit in Editor"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Event</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteEvent(e, evt.id, evt.title)}
                          className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                          title="Delete Event Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-display text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                      {evt.title}
                    </h3>

                    {evt.summary && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                        {evt.summary}
                      </p>
                    )}

                    {evt.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <Tag className="w-3 h-3 text-neutral-400" />
                        {evt.tags.map((t) => (
                          <span key={t} className="text-neutral-600 dark:text-neutral-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Event Modal with Folder Selector & Done Action */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" />
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-neutral-100">
                  New Story Event
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDoneCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Event Title:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. The Battle of Oakhaven"
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Story Date / Timeline Placement:
                </label>
                <input
                  type="text"
                  value={storyDate}
                  onChange={(e) => setStoryDate(e.target.value)}
                  placeholder="e.g. Year 420, Era of Embers"
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Status:
                </label>
                <select
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="planned">Planned (ที่จะเกิดขึ้น)</option>
                  <option value="ongoing">Ongoing (กำลังเกิดขึ้น)</option>
                  <option value="occurred">Occurred (เกิดขึ้นแล้ว)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                  Target Folder:
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="auto_event">📂 Auto Create / Use "Event" Folder</option>
                  <option value="root">📁 Root / (Workspace Root)</option>
                  {activeFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                  <option value="new">➕ Create New Custom Folder...</option>
                </select>
              </div>

              {selectedFolderId === 'new' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    New Folder Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Major Events, Story Arc 1..."
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-sky-500 rounded-xl text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-xs flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & Open in Editor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
