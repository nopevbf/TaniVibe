import { GoogleGenAI, Type } from '@google/genai';
import { AnalysisResult, WeatherData, ChatMessage, FarmMemory } from '../types';

// ---------------------------------------------------------------------------
// ROLLING WINDOW CONFIG
// ---------------------------------------------------------------------------
const ROLLING_WINDOW_SIZE = 20;

// ---------------------------------------------------------------------------
// SYSTEM INSTRUCTION
// ---------------------------------------------------------------------------
const SYSTEM_INSTRUCTION = `Anda adalah "Pakar Pertanian TaniVibe", asisten AI yang ramah, sopan, dan ahli dalam pertanian di Indonesia.
Fokus utama Anda:
- Membantu petani memahami kondisi pertanian secara praktis.
- Memberikan saran yang mudah dilakukan di lapangan.
- Menjawab dari perspektif pertanian, khususnya tanaman padi, jagung, cabai, terong, dan palawija umum.
- Gunakan istilah pertanian yang umum di Indonesia, seperti wereng, pengairan, gabah, pupuk urea, pemupukan susulan, drainase, pengendalian hama, dan penyakit tanaman.
- Gunakan bahasa Indonesia yang santun, mudah dipahami petani, praktis, dan tidak terlalu kaku.

BATASAN JAWABAN:
1. Tetap fokus pada konteks pertanian.
2. Jangan memberikan jawaban yang terlalu teknis jika pengguna tidak memintanya.
3. Jangan membuat klaim berlebihan atau memastikan diagnosis tanpa data cukup.
4. Jika informasi pengguna belum cukup, berikan dugaan awal secara hati-hati lalu tanyakan detail lanjutan.
5. Jika ada risiko tinggi pada tanaman, sampaikan dengan jelas namun tetap tenang.

---
KEMAMPUAN ANALISIS FOTO:
Jika pengguna mengirimkan foto tanaman, lahan, atau kondisi pertanian, Anda WAJIB:
1. Identifikasi apa yang terlihat di foto (jenis tanaman, kondisi, gejala, dll).
2. Berikan analisis singkat dan praktis berdasarkan apa yang terlihat.
3. Jika ada gejala penyakit atau hama, sebutkan kemungkinan penyebabnya.
4. Jika foto tidak berkaitan dengan pertanian, sampaikan dengan sopan bahwa Anda fokus pada pertanian.
5. Tetap gunakan format bullet point dan blockquote seperti aturan di bawah.

---
PENTING UNTUK ANALISIS CUACA:
1. Buat rangkuman analisis secara terperinci namun simpel dan langsung pada intinya.
2. Gunakan emoji yang sesuai untuk memperjelas konteks secara visual, misalnya:
  - 💧 untuk air/irigasi
  - 🐛 untuk hama
  - ☀️ untuk cuaca panas
  - 🌧️ untuk hujan
  - 🌾 untuk tanaman
3. Format saran atau poin-poin menggunakan bullet point (*) dan cetak tebal (**) pada kata kunci utama.
4. Contoh format yang BENAR:
  "* 💧 **Pantau Ketersediaan Air:** Pastikan saluran irigasi lancar."
5. Untuk status cuaca:
  - AMAN: berikan saran pemantauan ringan.
  - WASPADA: berikan saran pencegahan dan pengecekan rutin.
  - BAHAYA: berikan saran tindakan cepat yang harus segera dilakukan petani.

---
PENTING UNTUK CHAT (TANYA JAWAB):

ATURAN MEMBACA MEMORY & HISTORY — LAKUKAN INI SEBELUM MENJAWAB:
Kamu memiliki akses ke dua sumber memori:
1. [FARM MEMORY] — fakta-fakta yang sudah diketahui tentang lahan dan petani (disuntikkan di system context)
2. [CONVERSATION HISTORY] — percakapan terbaru (N pesan terakhir)

Sebelum membuat respons, WAJIB:
- Baca [FARM MEMORY] dan catat semua fakta yang sudah diketahui
- Baca [CONVERSATION HISTORY] dan catat info tambahan yang relevan
- Jangan menanyakan ulang fakta yang sudah ada di salah satu sumber tersebut
- Gunakan fakta dari memory untuk membuat saran yang lebih personal dan relevan

ATURAN RESPONS:
1. Jawab inti pertanyaan secara LANGSUNG, SINGKAT, dan TIDAK BERTELE-TELE.
2. Mulai dengan konfirmasi singkat (1 kalimat) terhadap kondisi yang disampaikan pengguna.
3. Jangan mengulangi informasi yang sudah dijelaskan di respons sebelumnya.
4. Jangan menanyakan ulang informasi yang sudah disebutkan pengguna di percakapan ini.
5. Maksimal 4 bullet point saran. Jika kondisi sudah dijelaskan sebelumnya, cukup 2-3 poin tambahan yang relevan.

FORMAT BULLET POINT — WAJIB IKUTI FORMAT INI:
Gunakan tanda bintang (*) di awal setiap poin, emoji konteks, lalu nama tindakan dicetak tebal, lalu penjelasan singkat.
Contoh yang BENAR:
* 💧 **Penyiraman Rutin:** Siram pagi dan sore agar tanah tetap lembab.
* 🐛 **Cek Hama:** Periksa bagian bawah daun dari kutu atau ulat.

PERTANYAAN PROAKTIF — ATURAN WAJIB:
1. Akhiri setiap respons dengan TEPAT 1 pertanyaan proaktif jika masih ada info yang kurang.
2. Pertanyaan proaktif WAJIB menggunakan format blockquote markdown, diawali "> ".
3. Jangan tambahkan kalimat apapun setelah blockquote, KECUALI tag produk (lihat aturan no 4).

REKOMENDASI PRODUK E-COMMERCE — ATURAN WAJIB:
4. Jika Anda menyarankan produk fisik (seperti jenis pupuk, fungisida, insektisida, benih, atau alat pertanian), Anda WAJIB menuliskan tag produk di baris PALING AKHIR (setelah blockquote pertanyaan).
5. Format tag produk harus persis seperti ini: [PRODUK: Nama Produk 1, Nama Produk 2]
6. Sebutkan nama merek dagang yang umum di Indonesia agar mudah dicari di toko online.
Contoh: [PRODUK: Pupuk NPK Mutiara, Fungisida Antracol, Insektisida Regent]

LOGIKA PERTANYAAN PROAKTIF — JANGAN TANYAKAN YANG SUDAH DIKETAHUI:
Ikuti urutan prioritas ini, dan SKIP jika info sudah disebutkan di [FARM MEMORY] atau percakapan:
1. Jenis komoditas → tanyakan jika belum disebutkan
2. Umur / fase tanaman → tanyakan jika komoditas sudah diketahui tapi umur belum
3. Gejala spesifik → tanyakan jika ada keluhan tapi belum detail
4. Kondisi lahan / irigasi → tanyakan jika saran irigasi diperlukan
5. Pupuk yang sudah digunakan → tanyakan jika pertanyaan soal pemupukan

ATURAN KONSISTENSI KONTEKS — WAJIB DIPATUHI:
Pertanyaan proaktif HARUS logis dan relevan dengan kondisi yang sudah disampaikan pengguna.
Jangan menanyakan sesuatu yang secara fisik/logis TIDAK MUNGKIN ADA berdasarkan kondisi yang disebutkan.
Contoh SALAH:
- User bilang "belum tumbuh tunas" → JANGAN tanya "apakah daunnya layu atau menguning?" karena belum ada daun.
Contoh BENAR:
- User bilang "belum tumbuh tunas" → BOLEH tanya "apakah pangkal batang bibit terlihat layu atau berlendir?"

---
CONTOH PERCAKAPAN YANG BENAR (FEW-SHOT):

Contoh 1:
User: "padi saya kena wereng, obatnya apa?"
AI: "Wereng memang harus ditangani cepat sebelum menyebar luas.

* 🐛 **Semprot Insektisida Sistemik:** Gunakan Applaud atau Confidor, fokus ke bagian bawah batang padi tempat wereng bersembunyi.
* 💧 **Keringkan Petak Sawah:** Wereng berkembang biak lebih cepat di kondisi lembap — keringkan sawah 2-3 hari jika bisa.
* 🌾 **Hindari Pemupukan N Berlebih:** Nitrogen tinggi membuat padi lebih disukai wereng.

> Apakah werengnya sudah sangat banyak hingga menutupi batang bawah padi?
[PRODUK: Insektisida Applaud, Insektisida Confidor]"

Contoh 2 — ANALISIS FOTO:
User: [mengirim foto daun dengan bercak cokelat] "ini kenapa ya?"
AI: "Dari foto yang dikirim, terlihat bercak cokelat pada daun yang kemungkinan besar adalah gejala penyakit blas atau hawar daun.

* 🐛 **Identifikasi Lebih Dekat:** Periksa apakah bercak berbentuk belah ketupat (blas) atau memanjang mengikuti tepi daun (hawar).
* 💊 **Semprot Fungisida:** Gunakan Antracol atau Nativo jika ini penyakit jamur, aplikasikan pagi hari.
* 💧 **Kurangi Kelembaban:** Hindari penyiraman berlebihan yang memicu jamur berkembang biak.

> Tanaman apa ini dan sudah berumur berapa minggu?
[PRODUK: Fungisida Antracol, Fungisida Nativo]"

Contoh 3:
User: "daun cabai saya keriting"
AI: "Daun cabai keriting biasanya disebabkan oleh serangan thrips atau tungau, terutama di musim kemarau.

* 🐛 **Cek Bagian Bawah Daun:** Periksa ada tidaknya thrips (serangga kecil kuning/hitam) atau tungau (titik-titik merah kecil).
* 💦 **Semprot Air + Insektisida:** Gunakan Pegasus atau Agrimec untuk tungau, Confidor untuk thrips.
* ☀️ **Kurangi Stres Panas:** Siram lebih rutin jika cuaca sedang panas terik.

> Apakah selain keriting, daun juga terlihat berbintik kuning atau mengering di tepinya?
[PRODUK: Insektisida Pegasus, Akarisida Agrimec, Insektisida Confidor]"`;

// ---------------------------------------------------------------------------
// DIFFICULTY ASSESSMENT
// ---------------------------------------------------------------------------
type TaskDifficulty = 'low' | 'medium' | 'high';

const assessDifficulty = (text: string): TaskDifficulty => {
  const complexKeywords = [
    'analisis', 'jadwal', 'strategi', 'penyakit', 'cuaca', 'prediksi',
    'solusi', 'mengapa', 'bagaimana', 'pupuk', 'hama', 'wereng', 'daun',
    'menguning', 'kering', 'busuk', 'bercak', 'irigasi', 'panen', 'tanam',
    'cabai', 'padi', 'jagung', 'terong', 'palawija', 'fungisida',
    'insektisida', 'urea', 'npk', 'kompos'
  ];
  const lowerText = text.toLowerCase();
  const hasComplexKeyword = complexKeywords.some(kw => lowerText.includes(kw));
  if (text.length > 150 || hasComplexKeyword) return 'high';
  if (text.length < 50 && !hasComplexKeyword) return 'low';
  return 'medium';
};

const getDynamicModelConfig = (difficulty: TaskDifficulty) => {
  const baseModel = 'gemini-2.5-flash';
  switch (difficulty) {
    case 'low':
      return { model: baseModel, config: { temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } } };
    case 'high':
      return { model: baseModel, config: { temperature: 0.7, thinkingConfig: { thinkingBudget: 4096 } } };
    case 'medium':
    default:
      return { model: baseModel, config: { temperature: 0.5, thinkingConfig: { thinkingBudget: 1024 } } };
  }
};

// ---------------------------------------------------------------------------
// WEATHER ANALYSIS
// ---------------------------------------------------------------------------
export const analyzeWeatherWithAI = async (
  ai: GoogleGenAI,
  weatherData: WeatherData,
  locationName: string
): Promise<AnalysisResult> => {
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
          level_risiko: { type: Type.STRING, description: 'Tingkat risiko: AMAN, WASPADA, atau BAHAYA' },
          warna: { type: Type.STRING, description: 'Warna indikator: hijau untuk AMAN, kuning untuk WASPADA, atau merah untuk BAHAYA' },
          ringkasan: { type: Type.STRING, description: 'Ringkasan singkat kondisi cuaca dan dampaknya ke pertanian dalam 1-2 kalimat' },
          peringatan_utama: { type: Type.STRING, description: 'Peringatan utama jika ada potensi bahaya' },
          saran_aksi: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Daftar 3-4 saran tindakan praktis untuk petani' },
          prediksi_3hari: { type: Type.STRING, description: 'Narasi singkat prediksi cuaca 3 hari ke depan' },
          detail: {
            type: Type.OBJECT,
            properties: {
              risiko_banjir: { type: Type.STRING },
              risiko_kekeringan: { type: Type.STRING },
              kondisi_angin: { type: Type.STRING },
              rekomendasi_irigasi: { type: Type.STRING }
            },
            required: ['risiko_banjir', 'risiko_kekeringan', 'kondisi_angin', 'rekomendasi_irigasi']
          }
        },
        required: ['level_risiko', 'warna', 'ringkasan', 'peringatan_utama', 'saran_aksi', 'prediksi_3hari', 'detail']
      }
    }
  });

  try {
    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Gagal memproses analisis dari AI.');
  }
};

// ---------------------------------------------------------------------------
// SUMMARIZE OLD HISTORY
// ---------------------------------------------------------------------------
export const summarizeHistory = async (
  ai: GoogleGenAI,
  oldMessages: ChatMessage[],
  existingSummary: string
): Promise<string> => {
  const historyText = oldMessages
    .map(m => `${m.role === 'user' ? 'Petani' : 'AI'}: ${m.text}`)
    .join('\n');

  const prompt = `Berikut adalah ringkasan percakapan sebelumnya (jika ada):
${existingSummary || '(belum ada ringkasan)'}

Berikut adalah percakapan baru yang perlu diringkas:
${historyText}

Buat ringkasan SINGKAT (maks 5 kalimat) dalam bahasa Indonesia yang mencakup:
- Jenis tanaman yang dibahas
- Masalah atau gejala yang dilaporkan
- Saran yang sudah diberikan
- Informasi penting lainnya tentang lahan petani

Tulis hanya ringkasannya saja, tanpa pengantar.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: { temperature: 0.3 }
  });

  return response.text.trim();
};

// ---------------------------------------------------------------------------
// BUILD MEMORY CONTEXT STRING
// ---------------------------------------------------------------------------
const buildMemoryContext = (memory: FarmMemory): string => {
  const parts: string[] = ['[FARM MEMORY — Gunakan ini sebagai konteks lahan petani]'];

  if (memory.location) parts.push(`Lokasi lahan: ${memory.location}`);
  if (memory.cropTypes.length > 0) parts.push(`Tanaman yang dibudidayakan: ${memory.cropTypes.join(', ')}`);
  if (Object.keys(memory.cropAges).length > 0) {
    const ages = Object.entries(memory.cropAges).map(([k, v]) => `${k} (${v})`).join(', ');
    parts.push(`Umur/fase tanaman: ${ages}`);
  }
  if (memory.fieldNotes.length > 0) parts.push(`Catatan lahan: ${memory.fieldNotes.join('; ')}`);
  if (memory.reportedSymptoms.length > 0) parts.push(`Gejala yang pernah dilaporkan: ${memory.reportedSymptoms.join('; ')}`);
  if (memory.handledIssues.length > 0) parts.push(`Masalah yang sudah pernah dibahas: ${memory.handledIssues.join('; ')}`);
  if (memory.lastWeatherAnalysis) {
    const w = memory.lastWeatherAnalysis;
    parts.push(`Analisis cuaca terakhir (${w.timestamp}): Status ${w.riskLevel} di ${w.location}. ${w.summary}. ${w.mainWarning ? 'Peringatan: ' + w.mainWarning : ''} Rekomendasi irigasi: ${w.irrigationRecommendation}`);
  }
  if (memory.conversationSummary) parts.push(`Ringkasan percakapan sebelumnya: ${memory.conversationSummary}`);

  return parts.length > 1 ? parts.join('\n') : '';
};

// ---------------------------------------------------------------------------
// EXTRACT FARM FACTS FROM AI RESPONSE
// ---------------------------------------------------------------------------
export const extractFarmFacts = (
  userMessage: string,
  aiResponse: string,
  currentMemory: FarmMemory
): Partial<FarmMemory> => {
  const updates: Partial<FarmMemory> = {};
  const lowerUser = userMessage.toLowerCase();

  // Deteksi jenis tanaman
  const crops = ['padi', 'jagung', 'cabai', 'terong', 'tomat', 'bawang', 'singkong', 'ubi', 'kedelai', 'kacang'];
  const foundCrops = crops.filter(c => lowerUser.includes(c) || aiResponse.toLowerCase().includes(c));
  if (foundCrops.length > 0) {
    const newCrops = [...new Set([...currentMemory.cropTypes, ...foundCrops])];
    if (newCrops.length !== currentMemory.cropTypes.length) updates.cropTypes = newCrops;
  }

  // Deteksi umur/fase tanaman
  const agePatterns = [
    { regex: /(\w+)\s+(?:saya\s+)?(?:baru\s+)?(?:berumur\s+)?(\d+)\s*(hari|minggu|bulan)\s+(?:setelah\s+tanam|tanam)/i, type: 'age' },
    { regex: /baru\s+(?:saya\s+)?tanam\s+(\w+)/i, type: 'new' },
    { regex: /(\w+)\s+(?:saya\s+)?sudah\s+(berbuah|berbunga|vegetatif|generatif)/i, type: 'phase' },
  ];

  for (const crop of foundCrops) {
    for (const p of agePatterns) {
      const match = lowerUser.match(p.regex);
      if (match) {
        const newAges = { ...currentMemory.cropAges };
        if (p.type === 'new') newAges[crop] = 'baru tanam';
        else if (p.type === 'age') newAges[crop] = `${match[2]} ${match[3]} setelah tanam`;
        else if (p.type === 'phase') newAges[crop] = match[2];
        updates.cropAges = newAges;
        break;
      }
    }
    if (lowerUser.includes('baru') && (lowerUser.includes('tanam') || lowerUser.includes('ditanam'))) {
      updates.cropAges = { ...currentMemory.cropAges, [crop]: 'baru tanam' };
    }
    const weekMatch = lowerUser.match(/(\d+)\s*minggu/);
    if (weekMatch) {
      updates.cropAges = { ...currentMemory.cropAges, [crop]: `${weekMatch[1]} minggu setelah tanam` };
    }
  }

  // Deteksi gejala yang dilaporkan
  const symptoms = ['layu', 'menguning', 'keriting', 'bercak', 'busuk', 'kering', 'berlubang', 'pucat', 'belum tumbuh'];
  const foundSymptoms = symptoms.filter(s => lowerUser.includes(s));
  if (foundSymptoms.length > 0) {
    const newSymptoms = [...new Set([...currentMemory.reportedSymptoms, ...foundSymptoms])];
    if (newSymptoms.length !== currentMemory.reportedSymptoms.length) updates.reportedSymptoms = newSymptoms;
  }

  return updates;
};

// ---------------------------------------------------------------------------
// MAIN CHAT FUNCTION — dengan dukungan gambar (vision/multimodal)
// ---------------------------------------------------------------------------
export const chatWithAI = async (
  ai: GoogleGenAI,
  history: ChatMessage[],
  memory: FarmMemory,
  weatherContext?: string
): Promise<string> => {
  // 1. Filter welcome message
  const filteredHistory = history.filter(msg => !msg.isWelcome);

  // 2. Rolling window — ambil N pesan terakhir saja
  const recentHistory = filteredHistory.slice(-ROLLING_WINDOW_SIZE);

  // 3. Sanitasi — Gemini butuh pola user/model alternating
  const sanitizedHistory = recentHistory.reduce<ChatMessage[]>((acc, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role) {
      // Gabung pesan role yang sama
      acc[acc.length - 1] = { ...last, text: `${last.text}\n\n${msg.text}` };
    } else {
      acc.push(msg);
    }
    return acc;
  }, []);

  // 4. Pastikan diawali pesan 'user'
  while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
    sanitizedHistory.shift();
  }

  // 5. Build contents dengan dukungan multi-modal (teks + gambar)
  const contents = sanitizedHistory.map(msg => {
    if (msg.role === 'user' && msg.image) {
      // Pesan dengan gambar → multi-part (image + text)
      return {
        role: 'user' as const,
        parts: [
          {
            inlineData: {
              mimeType: msg.image.mimeType,
              data: msg.image.base64,
            }
          },
          {
            text: msg.text.trim() || 'Tolong analisis foto tanaman ini dan berikan saran pertanian yang relevan.'
          }
        ]
      };
    }
    // Pesan teks biasa
    return {
      role: msg.role === 'model' ? 'model' as const : 'user' as const,
      parts: [{ text: msg.text }]
    };
  });

  // 6. Bangun system instruction dengan memory context
  const memoryContext = buildMemoryContext(memory);
  let fullSystemInstruction = SYSTEM_INSTRUCTION;
  if (memoryContext) fullSystemInstruction += `\n\n${memoryContext}`;
  if (weatherContext) {
    fullSystemInstruction += `\n\nKonteks Cuaca Saat Ini:\n${weatherContext}\n\nAturan penggunaan konteks cuaca:\n1. Gunakan konteks cuaca ini hanya jika relevan dengan pertanyaan pengguna.\n2. Jika relevan, hubungkan dampaknya dengan tindakan pertanian yang praktis.\n3. Jika tidak relevan, jawab berdasarkan pertanyaan pengguna saja.`;
  }

  // 7. Nilai difficulty — pesan dengan gambar selalu 'high'
  const latestMsg = sanitizedHistory.filter(m => m.role === 'user').pop();
  const difficulty = latestMsg?.image ? 'high' : assessDifficulty(latestMsg?.text || '');
  const dynamicSetup = getDynamicModelConfig(difficulty);

  const response = await ai.models.generateContent({
    model: dynamicSetup.model,
    contents,
    config: {
      ...dynamicSetup.config,
      systemInstruction: fullSystemInstruction
    }
  });

  return response.text.trim();
};