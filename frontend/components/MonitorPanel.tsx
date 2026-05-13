import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, RefreshCw, AlertTriangle, CheckCircle2, Info, Droplets, Wind, CloudRain, SunDim } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { LocationData, WeatherData, AnalysisResult } from '../types';
import { fetchWeatherData, fetchCoordinates } from '../services/weatherService';
import { analyzeWeatherWithAI } from '../services/aiService';

interface MonitorPanelProps {
  ai: GoogleGenAI;
  onNavigateToChat: (initialMessage?: string) => void;
  setGlobalContext: (context: string) => void;
  onWeatherAnalyzed?: (result: AnalysisResult, locationName: string) => void;
}

const dynamicPhrases = [
  "kamu pahami",
  "mudah dimengerti",
  "jelas terbaca",
  "ramah petani",
  "akurat & cepat"
];

type LoadingStep = 'location' | 'weather' | 'ai' | null;

const MonitorPanel: React.FC<MonitorPanelProps> = ({ ai, onNavigateToChat, setGlobalContext, onWeatherAnalyzed }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rawWeather, setRawWeather] = useState<WeatherData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // State untuk efek ketik (typewriter)
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  const isLoading = loadingStep !== null;

  // Efek Typewriter
  useEffect(() => {
    const i = loopNum % dynamicPhrases.length;
    const fullText = dynamicPhrases[i];

    const handleType = () => {
      setText(isDeleting ? fullText.substring(0, text.length - 1) : fullText.substring(0, text.length + 1));
      setTypingSpeed(isDeleting ? 40 : 100);

      if (!isDeleting && text === fullText) {
        // Jeda setelah selesai mengetik satu kata
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === '') {
        // Pindah ke kata berikutnya setelah selesai menghapus
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // Jeda sebelum mulai mengetik kata baru
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung GPS.');
      return;
    }
    
    setLoadingStep('location');
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: locationInput || 'Lokasi Saat Ini'
        });
      },
      (err) => {
        setError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.');
        setLoadingStep(null);
      },
      { timeout: 10000 }
    );
  };

  const performAnalysis = useCallback(async (loc: LocationData) => {
    setLoadingStep('weather');
    setError(null);
    try {
      const weather = await fetchWeatherData(loc.lat, loc.lon);
      setRawWeather(weather);
      
      setLoadingStep('ai');
      const aiResult = await analyzeWeatherWithAI(ai, weather, loc.name);
      setAnalysis(aiResult);
      setLastUpdated(new Date().toLocaleString('id-ID'));
      
      // Set context for chat
      setGlobalContext(`Lokasi: ${loc.name}. Cuaca: Suhu ${weather.current.temperature_2m}°C, Hujan ${weather.current.precipitation}mm. Status: ${aiResult.level_risiko}.`);
      
      if (onWeatherAnalyzed) {
        onWeatherAnalyzed(aiResult, loc.name);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menganalisis data.');
    } finally {
      setLoadingStep(null);
    }
  }, [ai, setGlobalContext, onWeatherAnalyzed]);

  // Trigger analysis when location changes
  useEffect(() => {
    if (location) {
      performAnalysis(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleManualSubmit = async () => {
    if (!locationInput.trim()) {
      setError('Masukkan nama desa atau gunakan Lokasi Saya.');
      return;
    }
    
    setLoadingStep('location');
    setError(null);

    try {
      const coords = await fetchCoordinates(locationInput);
      setLocation({
        lat: coords.lat,
        lon: coords.lon,
        name: coords.name
      });
      // Note: useEffect on `location` will trigger `performAnalysis` automatically.
    } catch (err: any) {
      setError(err.message || 'Gagal mencari lokasi.');
      setLoadingStep(null);
    }
  };

  const getStatusColors = (warna: string) => {
    switch (warna) {
      case 'hijau': return { bg: 'bg-tanivibe-green-l', border: 'border-[#b2dfcc]', text: 'text-tanivibe-green', icon: <CheckCircle2 className="w-8 h-8 text-tanivibe-green" /> };
      case 'kuning': return { bg: 'bg-tanivibe-yellow-l', border: 'border-[#f0d080]', text: 'text-tanivibe-yellow', icon: <AlertTriangle className="w-8 h-8 text-tanivibe-yellow" /> };
      case 'merah': return { bg: 'bg-tanivibe-red-l', border: 'border-[#f5b8b8]', text: 'text-tanivibe-red', icon: <AlertTriangle className="w-8 h-8 text-tanivibe-red" /> };
      default: return { bg: 'bg-tanivibe-green-l', border: 'border-[#b2dfcc]', text: 'text-tanivibe-green', icon: <CheckCircle2 className="w-8 h-8 text-tanivibe-green" /> };
    }
  };

  // Fungsi untuk mem-parsing teks tebal (**) pada semua teks dari AI
  const parseBold = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-tanivibe-ink">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 w-full">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-tanivibe-green-l text-tanivibe-green border border-tanivibe-green-m rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide mb-6">
          <div className="w-2 h-2 rounded-full bg-tanivibe-green animate-pulse"></div>
          Data cuaca real-time
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-tanivibe-ink leading-tight mb-4">
          Cuaca yang{' '}
          <em className="text-tanivibe-green not-italic italic inline-block min-w-[180px] text-left">
            {text}<span className="animate-pulse font-light">|</span>
          </em>,
          <br/>panen yang terjaga.
        </h1>
        <p className="text-tanivibe-ink3 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Peringatan dini dan saran pertanian berdasarkan data cuaca nyata — disampaikan dalam bahasa yang mudah dimengerti petani.
        </p>

        {/* Location Bar */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto sm:bg-tanivibe-surface sm:border sm:border-tanivibe-border sm:rounded-xl sm:p-2 sm:shadow-subtle">
          <div className="flex-1 flex items-center px-4 py-3 sm:px-3 sm:py-0 gap-2 bg-tanivibe-surface border border-tanivibe-border rounded-xl shadow-subtle sm:bg-transparent sm:border-none sm:rounded-none sm:shadow-none">
            <MapPin className="w-5 h-5 text-tanivibe-ink3 shrink-0" />
            <input 
              type="text" 
              placeholder="Nama desa / wilayah..." 
              className="w-full bg-transparent border-none outline-none text-sm text-tanivibe-ink placeholder:text-tanivibe-ink3"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          <div className="flex justify-center gap-2">
            <button 
              onClick={handleGetLocation}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-tanivibe-border bg-tanivibe-surface sm:bg-transparent text-tanivibe-ink2 text-sm font-medium hover:bg-tanivibe-bg2 transition-colors disabled:opacity-50"
            >
              <MapPin className="w-4 h-4" /> Lokasi Saya
            </button>
            <button 
              onClick={handleManualSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-tanivibe-green text-white text-sm font-medium hover:bg-[#1e4f3a] transition-colors disabled:opacity-50"
            >
              Analisis
            </button>
          </div>
        </div>
        {location && (
          <p className="text-xs text-tanivibe-ink3 mt-3">
            Koordinat: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
          </p>
        )}
        {error && (
          <p className="text-sm text-tanivibe-red mt-3 bg-tanivibe-red-l inline-block px-3 py-1 rounded-md">
            {error}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-tanivibe-border border-t-tanivibe-green rounded-full animate-spin"></div>
          <div className="text-sm text-tanivibe-ink3 text-center font-medium">
            <AnimatePresence mode="wait">
              {loadingStep === 'location' && (
                <motion.div key="loc" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                  Mendapatkan data lokasi...
                </motion.div>
              )}
              {loadingStep === 'weather' && (
                <motion.div key="wea" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                  Mengambil data cuaca real-time...
                </motion.div>
              )}
              {loadingStep === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                  Mesin AI sedang menganalisis risiko pertanian...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !analysis && !error && (
        <div className="text-center py-16 px-6 text-tanivibe-ink3 text-sm leading-relaxed">
          <div className="text-5xl mx-auto mb-4 opacity-50">🌤️</div>
          <strong className="text-base text-tanivibe-ink block mb-2">Belum ada analisis cuaca</strong>
          Klik <b>Lokasi Saya</b> untuk menggunakan GPS, atau masukkan nama desa dan klik <b>Analisis</b>.
        </div>
      )}

      {/* Results State */}
      {!isLoading && analysis && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="rounded-xl overflow-hidden border border-tanivibe-border shadow-subtle bg-tanivibe-surface">
            <div className={`flex items-center justify-between p-5 md:p-6 border-b ${getStatusColors(analysis.warna).bg} ${getStatusColors(analysis.warna).border}`}>
              <div>
                <div className="text-xs font-semibold tracking-wider uppercase mb-1.5 opacity-70 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {location?.name}
                </div>
                <div className={`font-serif text-2xl md:text-3xl font-semibold ${getStatusColors(analysis.warna).text}`}>
                  {analysis.level_risiko}
                </div>
                <div className="text-xs mt-1.5 opacity-75">
                  Diperbarui: {lastUpdated}
                </div>
              </div>
              <div>
                {getStatusColors(analysis.warna).icon}
              </div>
            </div>
            
            <div className="p-5 md:p-6">
              <p className="text-sm md:text-base text-tanivibe-ink2 leading-relaxed mb-5">
                {parseBold(analysis.ringkasan)}
              </p>
              
              {analysis.peringatan_utama && (
                <div className="bg-tanivibe-bg2 rounded-lg p-4 text-sm font-medium text-tanivibe-ink leading-relaxed border-l-4 border-tanivibe-green mb-6">
                  {parseBold(analysis.peringatan_utama)}
                </div>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-wider text-tanivibe-ink3 mb-3">Saran Tindakan</h3>
              <div className="flex flex-col gap-2.5 mb-6">
                {analysis.saran_aksi.map((saran, idx) => {
                  // Bersihkan bullet point jika AI mengembalikannya dengan format markdown
                  const cleanSaran = saran.replace(/^(\* |- )\s*/, '');
                  return (
                    <div key={idx} className="flex gap-3 items-start bg-tanivibe-surface border border-tanivibe-border rounded-lg p-3 text-sm text-tanivibe-ink2 leading-relaxed">
                      <div className="w-6 h-6 rounded-full bg-tanivibe-green text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>{parseBold(cleanSaran)}</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-tanivibe-green-l border border-tanivibe-green-m rounded-lg p-4 text-sm text-tanivibe-green leading-relaxed mb-6">
                <strong>🗓️ Prediksi 3 Hari:</strong> {parseBold(analysis.prediksi_3hari)}
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-tanivibe-ink3 mb-3">Detail Risiko</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-tanivibe-bg2 rounded-lg p-3.5 border border-tanivibe-border">
                  <div className="text-[11px] font-semibold text-tanivibe-ink3 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5"/> Risiko Banjir</div>
                  <div className="text-sm text-tanivibe-ink2">{parseBold(analysis.detail.risiko_banjir)}</div>
                </div>
                <div className="bg-tanivibe-bg2 rounded-lg p-3.5 border border-tanivibe-border">
                  <div className="text-[11px] font-semibold text-tanivibe-ink3 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><SunDim className="w-3.5 h-3.5"/> Risiko Kekeringan</div>
                  <div className="text-sm text-tanivibe-ink2">{parseBold(analysis.detail.risiko_kekeringan)}</div>
                </div>
                <div className="bg-tanivibe-bg2 rounded-lg p-3.5 border border-tanivibe-border">
                  <div className="text-[11px] font-semibold text-tanivibe-ink3 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Wind className="w-3.5 h-3.5"/> Kondisi Angin</div>
                  <div className="text-sm text-tanivibe-ink2">{parseBold(analysis.detail.kondisi_angin)}</div>
                </div>
                <div className="bg-tanivibe-bg2 rounded-lg p-3.5 border border-tanivibe-border">
                  <div className="text-[11px] font-semibold text-tanivibe-ink3 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5"/> Rekomendasi Irigasi</div>
                  <div className="text-sm text-tanivibe-ink2">{parseBold(analysis.detail.rekomendasi_irigasi)}</div>
                </div>
              </div>

              <details className="mt-6 group">
                <summary className="text-xs text-tanivibe-ink3 cursor-pointer hover:text-tanivibe-ink transition-colors flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Lihat data mentah cuaca
                </summary>
                <pre className="mt-3 bg-tanivibe-bg2 border border-tanivibe-border rounded-lg p-4 text-xs text-tanivibe-ink3 overflow-x-auto font-mono">
                  {JSON.stringify(rawWeather, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => location && performAnalysis(location)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-tanivibe-border text-tanivibe-ink2 text-sm font-medium hover:bg-tanivibe-bg2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Perbarui
            </button>
            <button 
              onClick={() => onNavigateToChat(`Tolong bahas hasil analisis cuaca untuk ${location?.name || 'lokasi saya'}. Status saat ini: ${analysis.level_risiko}. Berikan saran awal.`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tanivibe-green text-white text-sm font-medium hover:bg-[#1e4f3a] transition-colors"
            >
              💬 Tanya TaniVibe
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MonitorPanel;
