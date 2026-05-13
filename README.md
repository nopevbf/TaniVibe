# TaniVibe 🌿

**TaniVibe** adalah "Sahabat Pintar Petani Indonesia" — sebuah aplikasi asisten pertanian cerdas yang menggabungkan data cuaca real-time dengan kecerdasan buatan (AI) untuk membantu petani mengambil keputusan yang lebih tepat.

Aplikasi ini menggunakan teknologi **Google Cloud Vertex AI** untuk menganalisis risiko pertanian dan memberikan saran praktis dalam bahasa yang mudah dimengerti oleh masyarakat luas.

## ✨ Fitur Utama

- 🌤️ **Pemantauan Cuaca Presisi**: Mendapatkan data suhu, curah hujan, dan angin secara real-time berdasarkan lokasi GPS atau nama desa.
- 🤖 **Analisis Risiko AI**: Deteksi dini risiko banjir, kekeringan, dan ancaman cuaca lainnya berdasarkan pola meteorologi terbaru.
- 💧 **Rekomendasi Irigasi**: Saran cerdas kapan harus menyiram atau menjaga saluran drainase berdasarkan prediksi hujan.
- 💬 **Konsultasi AI (Tanya TaniVibe)**: Chat asisten AI yang memahami sejarah dan kondisi lahan Anda untuk menjawab masalah pertanian harian.
- 🗓️ **Prediksi 3 Hari ke Depan**: Membantu perencanaan kerja tani (seperti pemupukan atau panen) untuk beberapa hari mendatang.

## 🚀 Teknologi yang Digunakan

- **Frontend**: React, TypeScript, Vite, Framer Motion, Lucide React.
- **Backend**: Node.js & Express (sebagai proxy aman untuk Vertex AI).
- **AI Engine**: Google Cloud Vertex AI (Gemini 1.5 Flash).
- **Data Cuaca**: Open-Meteo API.

## 🔧 Instalasi dan Persiapan

### Prasyarat
- **Node.js & npm** terinstal di mesin Anda.
- **Google Cloud SDK (gcloud CLI)** untuk autentikasi.
- Proyek Google Cloud dengan **Vertex AI API** yang sudah diaktifkan.

### Langkah-langkah
1. **Clone repository**:
   ```bash
   git clone <repo-url>
   cd TaniVibe
   ```

2. **Instal dependensi**:
   Instal semua paket yang diperlukan di root, frontend, dan backend:
   ```bash
   npm install
   ```

3. **Autentikasi Google Cloud**:
   Pastikan Anda sudah login ke akun Google Cloud Anda:
   ```bash
   gcloud auth application-default login
   ```

4. **Konfigurasi Environment**:
   Pastikan file `backend/.env.local` sudah berisi Project ID dan Lokasi Google Cloud Anda.

5. **Jalankan Aplikasi**:
   Jalankan frontend dan backend secara bersamaan dalam mode pengembangan:
   ```bash
   npm run dev
   ```

## 📖 Cara Penggunaan
1. Buka aplikasi di browser (biasanya di `http://localhost:5173`).
2. Masukkan nama desa Anda atau klik **Lokasi Saya** untuk deteksi otomatis.
3. Klik **Analisis** untuk mendapatkan laporan risiko cuaca dari AI.
4. Gunakan tab **Tanya** untuk berkonsultasi lebih lanjut mengenai hasil analisis tersebut.

## 📋 Changelog
Lihat riwayat perubahan selengkapnya di [CHANGELOG.md](./CHANGELOG.md).

## 📄 Lisensi
Copyright © 2026 TaniVibe Team. Dibuat untuk mendukung ketahanan pangan dan kemajuan pertanian Indonesia.
