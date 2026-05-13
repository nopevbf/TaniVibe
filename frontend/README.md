# TaniVibe 🌱
**Sahabat Pintar Petani Indonesia (v1.0.0)**

TaniVibe adalah sebuah aplikasi web cerdas (*Smart Agricultural Early Warning System*) yang dirancang khusus untuk membantu petani di Indonesia. Aplikasi ini memantau kondisi cuaca secara real-time dan memberikan peringatan dini serta saran pertanian yang praktis, personal, dan mudah dipahami menggunakan kecerdasan buatan (Mesin AI).

## 🎯 Tujuan Proyek
Memberikan peringatan dini terkait risiko cuaca (banjir, kekeringan, angin) dan menyediakan asisten virtual proaktif yang dapat diajak berdiskusi mengenai masalah pertanian sehari-hari (hama, penyakit, irigasi, pemupukan) menggunakan bahasa Indonesia yang santun, tepat sasaran, dan tidak kaku.

## ✨ Fitur Utama

### 1. 📡 Pantau (Monitor Cuaca & Analisis Risiko)
- Mengambil data cuaca real-time dan prakiraan 3 hari ke depan menggunakan **Open-Meteo API** berdasarkan lokasi pengguna (GPS atau pencarian nama desa).
- **Mesin AI** menganalisis data cuaca tersebut dan menerjemahkannya menjadi tingkat risiko pertanian: **🟢 AMAN**, **🟡 WASPADA**, atau **🔴 BAHAYA**.
- Memberikan saran tindakan cepat, prediksi risiko banjir/kekeringan, kondisi angin, dan rekomendasi irigasi secara spesifik.

### 2. 💬 Tanya (Asisten AI Pertanian Multimodal)
- Chatbot interaktif yang ditenagai oleh **Gemini 2.5 Flash** dengan dukungan teks dan **analisis gambar (foto tanaman/lahan)**.
- **Farm Memory (Memori Lahan):** AI secara otomatis mengekstrak dan mengingat fakta-fakta dari percakapan (jenis tanaman, umur tanaman, gejala penyakit, catatan lahan) dan menyimpannya di `localStorage`. Saran AI menjadi semakin akurat dan personal seiring berjalannya waktu.
- **Rekomendasi Produk:** AI dapat merekomendasikan produk pertanian (pupuk, insektisida, fungisida, benih) lengkap dengan gambar representatif dan tombol pencarian langsung ke **Google Shopping**.
- **Pertanyaan Proaktif:** AI diprogram untuk selalu proaktif menanyakan detail lahan/tanaman pengguna di akhir jawabannya untuk mempersempit konteks masalah secara logis.

### 3. 📖 Panduan (User Guide)
- Halaman statis yang berisi panduan singkat cara menggunakan aplikasi TaniVibe, membaca level risiko, dan memahami sumber data.

## 🛠️ Teknologi yang Digunakan
- **Frontend:** React 18 (ESM), TypeScript
- **Styling:** Tailwind CSS (dengan palet warna *earthy/organic* khusus)
- **Animasi:** Framer Motion (untuk transisi tab dan efek *typewriter* dinamis)
- **Icons:** Lucide React
- **AI Engine:** Google Gemini API (`@google/genai` - Gemini 2.5 Flash & Gemini 2.0 Flash untuk summarization)
- **Weather API:** Open-Meteo (Geocoding & Forecast)

## 📂 Struktur Kode Utama
- `App.tsx`: Entry point utama, mengatur navigasi tab, layout global, dan state `FarmMemory`.
- `services/aiService.ts`: Berisi *System Instructions* yang sangat mendetail untuk mengatur persona AI, logika *Farm Memory*, ekstraksi fakta, dan fungsi pemanggilan API Gemini.
- `services/weatherService.ts`: Menangani *fetch* data cuaca dan koordinat lokasi ke Open-Meteo.
- `components/MonitorPanel.tsx`: UI untuk fitur Pantau Cuaca dengan efek *typewriter* dinamis.
- `components/ChatPanel.tsx`: UI untuk fitur Chatbot dengan dukungan upload gambar, *quick questions*, dan *product cards*.
- `components/GuidePanel.tsx`: UI untuk panduan penggunaan aplikasi.
- `types.ts`: Definisi tipe data TypeScript (termasuk struktur `FarmMemory` dan `AnalysisResult`).
