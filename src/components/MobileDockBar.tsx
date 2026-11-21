import React from 'react';
import { Bot, FileText, Calendar, GitBranch, Layers, History } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';

interface MobileDockBarProps {
  onNavigate: (index: number) => void;
}

export const MobileDockBar: React.FC<MobileDockBarProps> = ({ onNavigate }) => {
  const { activeView, setActiveView } = useWorkspace();
  const { activeAccentHex } = useTheme();

  const menuItems = [
    { id: 'editor', name: 'Editor', icon: FileText, panelIndex: 1 },
    { id: 'timeline', name: 'Timeline', icon: Calendar, panelIndex: 1 },
    { id: 'graph', name: 'Graph', icon: GitBranch, panelIndex: 1 },
    { id: 'templates', name: 'Templates', icon: Layers, panelIndex: 1 },
    { id: 'sessions', name: 'History', icon: History, panelIndex: 1 },
    { id: 'ai', name: 'AI Chat', icon: Bot, panelIndex: 2 },
  ] as const;

  return (
    <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-around items-center">
      {menuItems.map((item) => {
        const isActive = activeView === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id as any);
              onNavigate(item.panelIndex);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              isActive ? 'text-accent' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" style={isActive ? { color: activeAccentHex } : {}} />
            <span className="text-[9px] font-medium">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
};
