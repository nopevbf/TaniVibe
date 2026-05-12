import React from 'react';
import { motion } from 'framer-motion';
import { Radio, MessageCircle, BookOpen } from 'lucide-react';

export type TabType = 'pantau' | 'tanya' | 'panduan';

interface TabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'pantau', label: 'Pantau', icon: <Radio className="w-4 h-4" /> },
    { id: 'tanya', label: 'Tanya', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'panduan', label: 'Panduan', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-1 bg-tanivibe-surface p-1 rounded-lg border border-tanivibe-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors z-10 ${
            activeTab === tab.id ? 'text-white' : 'text-tanivibe-ink3 hover:text-tanivibe-ink hover:bg-tanivibe-bg2'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-tanivibe-green rounded-md -z-10"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Tabs;
