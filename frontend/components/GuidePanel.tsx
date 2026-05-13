import React from 'react';
import { Radio, Sun, MessageSquare, RefreshCw, Database, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

const GuidePanel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 w-full">
      <div className="mb-10">
        <h2 className="font-serif text-3xl font-semibold text-tanivibe-ink mb-3">Cara Menggunakan TaniVibe</h2>
        <p className="text-base text-tanivibe-ink2 leading-relaxed max-w-2xl">
          TaniVibe dirancang sederhana agar mudah digunakan di lapangan. Berikut adalah langkah-langkah untuk memaksimalkan manfaat sistem ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white border border-tanivibe-border rounded-2xl p-6 shadow-sm">
          <Radio className="w-6 h-6 text-tanivibe-ink2 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-tanivibe-ink mb-2">1. Aktifkan Lokasi</h3>
          <p className="text-sm text-tanivibe-ink2 leading-relaxed">
            Klik tombol 'Lokasi Saya' agar sistem mendeteksi posisi Anda. Ini penting untuk mengambil data cuaca yang benar-benar akurat di desa Anda.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-tanivibe-border rounded-2xl p-6 shadow-sm">
          <Sun className="w-6 h-6 text-tanivibe-ink2 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-tanivibe-ink mb-2">2. Baca Level Risiko</h3>
          <ul className="space-y-3 mt-3">
            <li className="flex items-start gap-2 text-sm text-tanivibe-ink2 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-tanivibe-green shrink-0 mt-0.5" />
              <span><strong className="text-tanivibe-green">Hijau (AMAN)</strong> berarti lanjut bertani seperti biasa.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-tanivibe-ink2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-tanivibe-yellow shrink-0 mt-0.5" />
              <span><strong className="text-tanivibe-yellow">Kuning (WASPADA)</strong> berarti ada potensi gangguan.</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-tanivibe-ink2 leading-relaxed">
              <AlertOctagon className="w-4 h-4 text-tanivibe-red shrink-0 mt-0.5" />
              <span><strong className="text-tanivibe-red">Merah (BAHAYA)</strong> berarti harus ada tindakan penyelamatan tanaman segera.</span>
            </li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-tanivibe-border rounded-2xl p-6 shadow-sm">
          <MessageSquare className="w-6 h-6 text-tanivibe-ink2 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-tanivibe-ink mb-2">3. Konsultasi AI</h3>
          <p className="text-sm text-tanivibe-ink2 leading-relaxed">
            Gunakan tab Tanya jika ragu. Anda bisa bertanya tentang takaran pupuk saat hujan lebat atau cara menangani hama yang tiba-tiba muncul.
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-tanivibe-border rounded-2xl p-6 shadow-sm">
          <RefreshCw className="w-6 h-6 text-tanivibe-ink2 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-tanivibe-ink mb-2">4. Cek Berkala</h3>
          <p className="text-sm text-tanivibe-ink2 leading-relaxed">
            Cuaca berubah cepat. Kami sarankan mengecek TaniVibe setiap pagi sebelum ke sawah dan sore hari untuk persiapan esok.
          </p>
        </div>

        {/* Card 5 - Sumber Data */}
        <div className="bg-[#eef1e8] border border-[#dce2d4] rounded-2xl p-6">
          <h3 className="text-xs font-bold tracking-wider text-tanivibe-green uppercase mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" /> SUMBER DATA
          </h3>
          <p className="text-sm text-tanivibe-ink2 leading-relaxed">
            Data cuaca diambil secara real-time dari <strong>Open-Meteo API</strong> (gratis & presisi tinggi). Analisis cerdas dilakukan oleh <strong>Mesin AI</strong> untuk memberikan interpretasi bahasa manusia yang relevan bagi petani di Indonesia.
          </p>
        </div>

        {/* Card 6 - Catatan Penting */}
        <div className="bg-[#fdf2f2] border border-[#fce4e4] rounded-2xl p-6">
          <h3 className="text-xs font-bold tracking-wider text-tanivibe-red uppercase mb-3 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" /> CATATAN PENTING
          </h3>
          <p className="text-sm text-tanivibe-ink2 leading-relaxed">
            TaniVibe adalah alat bantu cerdas. Untuk keputusan yang melibatkan investasi besar, harap tetap berkonsultasi dengan penyuluh pertanian atau memantau papan informasi BMKG setempat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuidePanel;
