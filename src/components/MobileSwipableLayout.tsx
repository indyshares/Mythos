import React, { useRef, useEffect } from 'react';
import { FileExplorer } from './FileExplorer';
import { MarkdownEditor } from './MarkdownEditor';
import { MobileAIView } from './MobileAIView';
import { useWorkspace } from '../context/WorkspaceContext';

interface MobileLayoutProps {
  onOpenInspector: () => void;
}

export const MobileSwipableLayout: React.FC<MobileLayoutProps> = ({ onOpenInspector }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setActiveView } = useWorkspace();

  // Scroll to Editor (center) on mount
  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollLeft = width;
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex w-screen h-screen overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
    >
      {/* 1. Left Panel: File Explorer & Workspace */}
      <div className="min-w-full h-full snap-start bg-neutral-50 dark:bg-neutral-950 p-4 overflow-y-auto">
        <FileExplorer onSelectTemplate={() => setActiveView('templates')} />
      </div>

      {/* 2. Center Panel: Clean Editor */}
      <div className="min-w-full h-full snap-start bg-white dark:bg-neutral-900 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor onOpenInspector={onOpenInspector} />
        </div>
      </div>

      {/* 3. Right Panel: AI Assistant */}
      <div className="min-w-full h-full snap-start bg-neutral-50 dark:bg-neutral-950">
        <MobileAIView onOpenFile={() => {
            // Logic to scroll back to center or switch view
            if(scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.offsetWidth;
        }} />
      </div>
    </div>
  );
};
