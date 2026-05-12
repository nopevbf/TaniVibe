import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Tabs, { TabType } from './components/Tabs';
import MonitorPanel from './components/MonitorPanel';
import ChatPanel from './components/ChatPanel';
import GuidePanel from './components/GuidePanel';

// Initialize the SDK here to ensure process.env.API_KEY is correctly injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pantau');
  const [globalContext, setGlobalContext] = useState<string>('');
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>();

  const handleNavigateToChat = (message?: string) => {
    setInitialChatMessage(message);
    setActiveTab('tanya');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-tanivibe-surface border-b border-tanivibe-border shadow-sm">
        <div className="flex items-center gap-2 text-tanivibe-green font-serif text-xl font-semibold">
          <div className="w-8 h-8 bg-tanivibe-green rounded-lg flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          TaniVibe
        </div>
        <Tabs activeTab={activeTab} onChange={setActiveTab} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'pantau' && (
          <MonitorPanel 
            ai={ai}
            onNavigateToChat={handleNavigateToChat} 
            setGlobalContext={setGlobalContext} 
          />
        )}
        {activeTab === 'tanya' && (
          <ChatPanel 
            ai={ai}
            globalContext={globalContext} 
            initialMessage={initialChatMessage} 
          />
        )}
        {activeTab === 'panduan' && (
          <GuidePanel />
        )}
      </main>
    </div>
  );
};

export default App;
