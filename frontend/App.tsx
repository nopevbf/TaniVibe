import React, { useState, useEffect } from 'react';
import { Sprout } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion } from 'framer-motion';
import Tabs, { TabType } from './components/Tabs';
import MonitorPanel from './components/MonitorPanel';
import ChatPanel from './components/ChatPanel';
import GuidePanel from './components/GuidePanel';
import { FarmMemory, DEFAULT_FARM_MEMORY, AnalysisResult } from './types';

const MEMORY_STORAGE_KEY = 'tanivibe_farm_memory';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

// ---------------------------------------------------------------------------
// Load / Save memory dari localStorage
// ---------------------------------------------------------------------------
const loadMemoryFromStorage = (): FarmMemory => {
  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FARM_MEMORY };
    const parsed = JSON.parse(raw) as FarmMemory;
    return { ...DEFAULT_FARM_MEMORY, ...parsed };
  } catch {
    return { ...DEFAULT_FARM_MEMORY };
  }
};

const saveMemoryToStorage = (memory: FarmMemory): void => {
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.warn('Failed to save farm memory to localStorage:', e);
  }
};

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pantau');
  const [globalContext, setGlobalContext] = useState<string>('');
  const [chatTrigger, setChatTrigger] = useState<{ text: string; ts: number } | null>(null);

  // FarmMemory — persisten via localStorage
  const [farmMemory, setFarmMemory] = useState<FarmMemory>(() => {
    const loaded = loadMemoryFromStorage();
    return {
      ...loaded,
      sessionCount: loaded.sessionCount + 1,
      lastActiveAt: new Date().toISOString(),
    };
  });

  // Simpan ke localStorage setiap kali memory berubah
  useEffect(() => {
    saveMemoryToStorage(farmMemory);
  }, [farmMemory]);

  // Handler untuk update memory — dipanggil dari ChatPanel atau MonitorPanel.
  // Opsi A: batasi panjang array agar FarmMemory tidak tumbuh tak terbatas
  // dan token yang di-inject ke AI tetap kecil & efisien.
  const handleUpdateMemory = (updates: Partial<FarmMemory>) => {
    setFarmMemory(prev => {
      const merged = { ...prev, ...updates };
      return {
        ...merged,
        // Maks 5 catatan lahan terbaru — catatan lama biasanya sudah tidak relevan
        fieldNotes: merged.fieldNotes.slice(-5),
        // Maks 10 gejala terbaru — cukup untuk konteks tanpa membengkak
        reportedSymptoms: merged.reportedSymptoms.slice(-10),
        // Maks 10 isu yang sudah ditangani
        handledIssues: merged.handledIssues.slice(-10),
      };
    });
  };

  // Handler khusus saat analisis cuaca selesai — simpan hasilnya ke memory
  const handleWeatherAnalyzed = (result: AnalysisResult, locationName: string) => {
    const analysisEntry = {
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
      location: locationName,
      riskLevel: result.level_risiko,
      summary: result.ringkasan,
      mainWarning: result.peringatan_utama,
      irrigationRecommendation: result.detail.rekomendasi_irigasi,
    };

    setFarmMemory(prev => ({
      ...prev,
      location: locationName,
      lastWeatherAnalysis: analysisEntry,
    }));
  };

  const handleNavigateToChat = (message?: string) => {
    if (message) {
      setChatTrigger({ text: message, ts: Date.now() });
    }
    setActiveTab('tanya');
  };

  const tabVariants = {
    active: {
      opacity: 1,
      y: 0,
      display: 'flex',
      transition: { duration: 0.3, delay: 0.2, ease: 'easeOut' }
    },
    inactive: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2, ease: 'easeIn' },
      transitionEnd: { display: 'none' }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-tanivibe-surface border-b border-tanivibe-border shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-tanivibe-green font-serif text-xl font-semibold">
          <div className="w-8 h-8 bg-tanivibe-green rounded-lg flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          TaniVibe
        </div>
        <Tabs activeTab={activeTab} onChange={setActiveTab} />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <motion.div
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'pantau' ? 'active' : 'inactive'}
          className="absolute inset-0 overflow-y-auto flex-col"
        >
          <MonitorPanel
            ai={ai}
            onNavigateToChat={handleNavigateToChat}
            setGlobalContext={setGlobalContext}
            onWeatherAnalyzed={handleWeatherAnalyzed}
          />
        </motion.div>

        <motion.div
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'tanya' ? 'active' : 'inactive'}
          className="absolute inset-0 overflow-y-auto flex-col"
        >
          <ChatPanel
            ai={ai}
            globalContext={globalContext}
            chatTrigger={chatTrigger}
            farmMemory={farmMemory}
            onUpdateMemory={handleUpdateMemory}
          />
        </motion.div>

        <motion.div
          variants={tabVariants}
          initial="inactive"
          animate={activeTab === 'panduan' ? 'active' : 'inactive'}
          className="absolute inset-0 overflow-y-auto flex-col"
        >
          <GuidePanel />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-tanivibe-border py-3 relative flex flex-col items-center justify-center text-center bg-tanivibe-bg px-4">
        <div className="flex items-center gap-2 text-tanivibe-green font-serif text-base font-semibold mb-1">
          <Sprout className="w-4 h-4" />
          TaniVibe
        </div>
        <div className="text-[9px] font-bold tracking-[0.15em] text-tanivibe-ink3 uppercase">
          SAHABAT PINTAR PETANI INDONESIA • 2026
        </div>
        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-tanivibe-ink3 bg-tanivibe-bg2 px-2 py-1 rounded-md border border-tanivibe-border">
          v1.0.0
        </div>
      </footer>
    </div>
  );
};

export default App;
