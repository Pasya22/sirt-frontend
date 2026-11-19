import { useEffect, useState } from 'react';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatRp } from '../../lib/format';

interface HomeResponse {
  pengaturan: { sapaan: string; headerImage: string };
  kas: { saldoAkhir: number; masukBulanIni: number; keluarBulanIni: number };
  kegiatanTerdekat: { id: number; judul: string; tanggal: string; waktu: string; lokasi: string; status: string }[];
}

export default function WargaHome() {
  const [data, setData] = useState<HomeResponse | null>(null);

  useEffect(() => {
    api.get<HomeResponse>('/public/home').then((res) => setData(res.data));
  }, []);

  const headerImage = data?.pengaturan.headerImage || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800';
  const sapaan = data?.pengaturan.sapaan || 'Selamat siang, Warga';

  return (
    <div className="bg-bg-gray min-h-screen pb-24">
      <div className="relative pt-12 pb-28 px-6 rounded-b-[2.5rem] shadow-sm z-10 overflow-hidden">
        <img src={headerImage} alt="Background Desa" className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-primary/90 z-0" />

        <div className="relative z-10 text-white">
          <p className="text-sm text-white/80 mb-1">{sapaan}</p>
          <h2 className="text-lg font-bold mb-6 drop-shadow-md">
            RT 01 / RW 08
            <br />
            <span className="text-sm font-normal text-white/90">Desa Sukadami, Cikarang Selatan</span>
          </h2>

          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg">
            <p className="text-sm text-white/80 mb-1">Saldo Kas</p>
            <p className="text-3xl font-bold mb-4 drop-shadow-sm">{formatRp(data?.kas.saldoAkhir ?? 0)}</p>
            <div className="flex gap-2 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingUp size={14} className="text-green-400" /> Masuk: {formatRp(data?.kas.masukBulanIni ?? 0)}
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingDown size={14} className="text-red-400" /> Keluar: {formatRp(data?.kas.keluarBulanIni ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-20">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-white text-lg tracking-tight drop-shadow-md">Kegiatan Terdekat</h3>
          <Link to="/kegiatan" className="text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-1 hover:bg-gray-50">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {(data?.kegiatanTerdekat ?? []).map((k) => {
            const d = new Date(`${k.tanggal}T00:00:00`);
            const tgl = d.toLocaleDateString('id-ID', { day: '2-digit' });
            const bln = d.toLocaleDateString('id-ID', { month: 'short' });
            const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });

            return (
              <Link to={`/kegiatan/${k.id}`} key={k.id} className="flex bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center gap-4 hover:shadow-md transition-shadow">
                <div className="bg-primary-light text-primary flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0">
                  <span className="text-lg font-bold leading-none">{tgl}</span>
                  <span className="text-[10px] font-bold mt-1 uppercase">{bln}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-main text-sm mb-1 truncate">{k.judul}</p>
                  <p className="text-[11px] text-text-muted truncate">{hari}, {k.waktu} - {k.lokasi}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${k.status === 'Berjalan' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {k.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}