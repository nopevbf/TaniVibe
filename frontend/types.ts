export interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

export interface AnalysisDetail {
  risiko_banjir: string;
  risiko_kekeringan: string;
  kondisi_angin: string;
  rekomendasi_irigasi: string;
}

export interface AnalysisResult {
  level_risiko: string;
  warna: 'hijau' | 'kuning' | 'merah';
  ringkasan: string;
  peringatan_utama: string;
  saran_aksi: string[];
  prediksi_3hari: string;
  detail: AnalysisDetail;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isWelcome?: boolean;
  /** Opsional: gambar yang dilampirkan user, disimpan sebagai base64 data URL */
  image?: {
    base64: string;       // base64 murni tanpa prefix
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    previewUrl: string;   // data URL lengkap untuk ditampilkan di UI
  };
}

/**
 * Menyimpan fakta-fakta penting yang diketahui tentang petani & lahannya.
 */
export interface FarmMemory {
  location: string | null;
  cropTypes: string[];
  cropAges: Record<string, string>;
  fieldNotes: string[];
  lastWeatherAnalysis: {
    timestamp: string;
    location: string;
    riskLevel: string;
    summary: string;
    mainWarning: string;
    irrigationRecommendation: string;
  } | null;
  reportedSymptoms: string[];
  handledIssues: string[];
  conversationSummary: string;
  summaryUpdatedAt: string | null;
  sessionCount: number;
  lastActiveAt: string | null;
}

export const DEFAULT_FARM_MEMORY: FarmMemory = {
  location: null,
  cropTypes: [],
  cropAges: {},
  fieldNotes: [],
  lastWeatherAnalysis: null,
  reportedSymptoms: [],
  handledIssues: [],
  conversationSummary: '',
  summaryUpdatedAt: null,
  sessionCount: 0,
  lastActiveAt: null,
};