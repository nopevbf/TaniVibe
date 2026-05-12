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
}
