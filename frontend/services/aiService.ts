import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisResult, WeatherData, ChatMessage } from '../types';

const SYSTEM_INSTRUCTION = `Anda adalah "Pakar Pertanian TaniVibe", asisten AI yang ramah, sopan, dan ahli dalam pertanian di Indonesia.
Fokus analisis Anda HANYA pada perspektif pertanian (khususnya tanaman padi, jagung, cabai, dan palawija umum).
Gunakan istilah pertanian yang umum di Indonesia (misal: wereng, pengairan, gabah, pupuk urea, dll).
Gunakan bahasa Indonesia yang santun, mudah dipahami petani, dan tidak terlalu kaku.`;

type TaskDifficulty = 'low' | 'medium' | 'high';

/**
 * Fungsi untuk menilai tingkat kesusahan prompt berdasarkan panjang dan kata kunci.
 */
const assessDifficulty = (text: string): TaskDifficulty => {
  const complexKeywords = [
    'analisis', 'jadwal', 'strategi', 'penyakit', 'cuaca', 
    'prediksi', 'solusi', 'mengapa', 'bagaimana', 'pupuk', 'hama'
  ];
  const lowerText = text.toLowerCase();
  
  const hasComplexKeyword = complexKeywords.some(kw => lowerText.includes(kw));
  
  if (text.length > 150 || hasComplexKeyword) {
    return 'high';
  } else if (text.length < 50 && !hasComplexKeyword) {
    return 'low';
  }
  return 'medium';
};

/**
 * Fungsi untuk mendapatkan konfigurasi model dinamis berdasarkan kesusahan.
 */
const getDynamicModelConfig = (difficulty: TaskDifficulty) => {
  const baseModel = 'gemini-2.5-flash';
  
  switch (difficulty) {
    case 'low':
      return {
        model: baseModel,
        config: {
          temperature: 0.3,
          // Matikan thinking untuk task mudah agar respons lebih cepat
          thinkingConfig: { thinkingBudget: 0 }
        }
      };
    case 'high':
      return {
        model: baseModel,
        config: {
          temperature: 0.7,
          // Omit thinkingConfig untuk mengaktifkan thinking secara default (kualitas tinggi)
        }
      };
    case 'medium':
    default:
      return {
        model: baseModel,
        config: {
          temperature: 0.5,
          // Omit thinkingConfig
        }
      };
  }
};

export const analyzeWeatherWithAI = async (ai: GoogleGenAI, weatherData: WeatherData, locationName: string): Promise<AnalysisResult> => {
  const prompt = `
    Analisis data cuaca berikut untuk daerah ${locationName} dari perspektif risiko pertanian.
    
    Data Cuaca Saat Ini:
    - Suhu: ${weatherData.current.temperature_2m}°C
    - Kelembaban: ${weatherData.current.relative_humidity_2m}%
    - Curah Hujan: ${weatherData.current.precipitation} mm
    - Kecepatan Angin: ${weatherData.current.wind_speed_10m} km/h
    
    Prakiraan 3 Hari Kedepan (Hujan):
    - Besok: ${weatherData.daily.precipitation_sum[1]} mm
    - Lusa: ${weatherData.daily.precipitation_sum[2]} mm
    - Hari ke-3: ${weatherData.daily.precipitation_sum[3]} mm
    
    Berikan analisis risiko, peringatan, dan saran tindakan untuk petani.
  `;

  // Analisis cuaca dan ekstraksi JSON selalu dianggap sebagai task dengan tingkat kesusahan 'high'
  const dynamicSetup = getDynamicModelConfig('high');

  const response = await ai.models.generateContent({
    model: dynamicSetup.model,
    contents: prompt,
    config: {
      ...dynamicSetup.config,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          level_risiko: { type: Type.STRING, description: "Tingkat risiko: AMAN, WASPADA, atau BAHAYA" },
          warna: { type: Type.STRING, description: "Warna indikator: hijau (untuk AMAN), kuning (untuk WASPADA), atau merah (untuk BAHAYA)" },
          ringkasan: { type: Type.STRING, description: "Ringkasan singkat kondisi cuaca dan dampaknya ke pertanian (1-2 kalimat)" },
          peringatan_utama: { type: Type.STRING, description: "Peringatan utama jika ada potensi bahaya (misal: potensi banjir, hama wereng akibat lembab)" },
          saran_aksi: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Daftar 3-4 saran tindakan praktis untuk petani"
          },
          prediksi_3hari: { type: Type.STRING, description: "Narasi singkat prediksi cuaca 3 hari ke depan dampaknya" },
          detail: {
            type: Type.OBJECT,
            properties: {
              risiko_banjir: { type: Type.STRING, description: "Tingkat risiko banjir (Rendah/Sedang/Tinggi) dan alasannya singkat" },
              risiko_kekeringan: { type: Type.STRING, description: "Tingkat risiko kekeringan dan alasannya" },
              kondisi_angin: { type: Type.STRING, description: "Dampak angin terhadap tanaman (misal: aman, rawan rebah)" },
              rekomendasi_irigasi: { type: Type.STRING, description: "Saran pengairan (misal: tunda penyiraman, perlu irigasi ekstra)" }
            }
          }
        },
        required: ["level_risiko", "warna", "ringkasan", "peringatan_utama", "saran_aksi", "prediksi_3hari", "detail"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text.trim()) as AnalysisResult;
    return result;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Gagal memproses analisis dari AI.");
  }
};

export const chatWithAI = async (ai: GoogleGenAI, history: ChatMessage[], context?: string): Promise<string> => {
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Ambil pesan terakhir dari user untuk menilai tingkat kesusahan
  const latestUserMessage = history.filter(m => m.role === 'user').pop()?.text || '';
  const difficulty = assessDifficulty(latestUserMessage);
  
  // Dapatkan konfigurasi dinamis (mengatur thinking budget & temperature)
  const dynamicSetup = getDynamicModelConfig(difficulty);

  const currentSystemInstruction = context
    ? `${SYSTEM_INSTRUCTION}\n\nKonteks Cuaca Saat Ini:\n${context}`
    : SYSTEM_INSTRUCTION;

  const response = await ai.models.generateContent({
    model: dynamicSetup.model,
    contents: contents,
    config: {
      ...dynamicSetup.config,
      systemInstruction: currentSystemInstruction,
    }
  });

  return response.text.trim();
};
