import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, MessageSquare, RefreshCw, Database, AlertTriangle } from 'lucide-react';

const GuidePanel: React.FC = () => {
  const guides = [
    {
      icon: <MapPin className="w-7 h-7 text-tanivibe-green" />,
      title: "1. Aktifkan Lokasi",
      desc: "Klik tombol 'Lokasi Saya' untuk mendeteksi posisi Anda secara otomatis. Pastikan browser mengizinkan akses lokasi. Data lokasi hanya digunakan untuk mengambil cuaca — tidak disimpan."
    },
    {
      icon: <Sun className="w-7 h-7 text-tanivibe-yellow" />,
      title: "2. Baca Level Risiko",
      desc: "🟢 AMAN — Kondisi baik untuk kegiatan pertanian normal.\n🟡 WASPADA — Ada potensi risiko, ikuti saran yang diberikan.\n🔴 BAHAYA — Ambil tindakan perlindungan segera."
    },
    {
      icon: <MessageSquare className="w-7 h-7 text-tanivibe-green" />,
      title: "3. Tanya Langsung",
      desc: "Gunakan fitur Tanya untuk bertanya tentang hama, pupuk, jadwal tanam, atau masalah pertanian lainnya. AI akan menjawab dengan bahasa sederhana yang mudah dipahami."
    },
    {
      icon: <RefreshCw className="w-7 h-7 text-tanivibe-ink2" />,
      title: "4. Perbarui Berkala",
      desc: "Data cuaca diperbarui secara real-time. Disarankan cek TaniVibe setiap pagi sebelum memulai aktivitas pertanian dan sore hari untuk antisipasi besok."
    },
    {
      icon: <Database className="w-7 h-7 text-tanivibe-ink3" />,
      title: "Sumber Data",
      desc: "Data cuaca dari Open-Meteo API (prakiraan cuaca global resolusi tinggi, gratis). Analisis dilakukan oleh Gemini 2.5 Flash dari Google AI."
    },
    {
      icon: <AlertTriangle className="w-7 h-7 text-tanivibe-red" />,
      title: "Catatan Penting",
      desc: "TaniVibe adalah alat bantu pengambilan keputusan. Untuk kondisi darurat atau keputusan besar, selalu konsultasikan dengan penyuluh pertanian setempat dan pantau BMKG."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-5xl mx-auto p-4 md:p-8"
    >
      <div className="mb-8">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-tanivibe-ink mb-2">Cara Menggunakan TaniVibe</h2>
        <p className="text-sm text-tanivibe-ink3 leading-relaxed">Panduan singkat untuk memaksimalkan manfaat sistem peringatan dini ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {guides.map((guide, idx) => (
          <div key={idx} className="bg-tanivibe-surface border border-tanivibe-border rounded-xl p-6 shadow-subtle hover:shadow-md transition-shadow">
            <div className="mb-4 bg-tanivibe-bg2 w-12 h-12 rounded-lg flex items-center justify-center">
              {guide.icon}
            </div>
            <h3 className="font-serif text-lg font-semibold text-tanivibe-ink mb-2">{guide.title}</h3>
            <p className="text-sm text-tanivibe-ink3 leading-relaxed whitespace-pre-line">
              {guide.desc}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default GuidePanel;
