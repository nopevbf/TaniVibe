# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.
Format versioning mengikuti [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-05-13

### 🚀 Fitur Baru
- **Peluncuran aplikasi TaniVibe v1.0.0.**
- **Monitor Cuaca Real-time**: Integrasi data cuaca presisi berdasarkan lokasi GPS atau input manual menggunakan Open-Meteo API.
- **Analisis Risiko AI**: Deteksi dini risiko banjir, kekeringan, dan kondisi angin yang berbahaya untuk lahan pertanian.
- **Tanya TaniVibe**: Asisten AI pertanian yang memahami konteks lahan Anda untuk konsultasi masalah tani harian.
- **Prediksi Pertanian**: Memberikan gambaran kondisi lahan untuk 3 hari ke depan.
- **Farm Memory**: Sistem penyimpanan konteks lokal untuk percakapan AI yang lebih personal dan akurat.
- **UI Premium**: Antarmuka modern yang responsif dan ramah petani dengan tema warna "TaniVibe Green".

### 🔧 Perubahan
- Transisi penuh dari template "Vertex AI Studio Frontend App" menjadi identitas mandiri **TaniVibe**.
- Optimalisasi backend proxy untuk mendukung streaming data dari Google Cloud Vertex AI.

### 📦 Dependencies
- Menambahkan library utama: `@google/genai`, `framer-motion`, `lucide-react`, dan `node-fetch`.
