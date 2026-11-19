import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatRp, formatTanggal } from '../../lib/format';

interface DashboardData {
  stats: { totalWarga: number; kepalaKeluarga: number; saldoKas: number; kegiatanAktif: number };
  kas6Bulan: { bulan: string; masuk: number; keluar: number }[];
  aktivitasTerbaru: { id: number; pesan: string; waktu: string }[];
  transaksiTerbaru: { id: number; ket: string; kategori: string; tanggal: string; tipe: 'masuk' | 'keluar'; nominal: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard').then((res) => setData(res.data));
  }, []);

  const maxChart = Math.max(1, ...(data?.kas6Bulan.flatMap((b) => [b.masuk, b.keluar]) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-2">Total Warga</p><p className="text-3xl font-bold text-text-main">{data?.stats.totalWarga ?? 0}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-2">Kepala Keluarga</p><p className="text-3xl font-bold text-text-main">{data?.stats.kepalaKeluarga ?? 0}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-2">Saldo Kas</p><p className="text-3xl font-bold text-text-main">{formatRp(data?.stats.saldoKas ?? 0)}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-2">Kegiatan Aktif</p><p className="text-3xl font-bold text-text-main">{data?.stats.kegiatanAktif ?? 0}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-text-main mb-6">Kas 6 Bulan Terakhir</h3>
          <div className="flex justify-around items-end h-48 gap-4">
            {(data?.kas6Bulan ?? []).map((b) => (
              <div key={b.bulan} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                <div className="w-full flex justify-center gap-1.5 items-end h-full">
                  <div className="w-3 md:w-4 bg-primary rounded-t-sm transition-all" style={{ height: `${Math.max(4, (b.masuk / maxChart) * 100)}%` }} title={`Masuk: ${formatRp(b.masuk)}`} />
                  <div className="w-3 md:w-4 bg-red-400 rounded-t-sm transition-all" style={{ height: `${Math.max(4, (b.keluar / maxChart) * 100)}%` }} title={`Keluar: ${formatRp(b.keluar)}`} />
                </div>
                <span className="text-xs text-text-muted font-medium">{b.bulan}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-text-main mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            {(data?.aktivitasTerbaru ?? []).map((a) => (
              <div key={a.id} className="border-b border-gray-50 pb-3 last:border-0">
                <p className="text-sm text-text-main">{a.pesan}</p>
                <p className="text-xs text-text-muted mt-0.5">{a.waktu}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100"><h3 className="font-bold text-text-main text-lg">Transaksi Kas Terbaru</h3></div>
        <table className="w-full text-left text-sm text-text-main">
          <thead className="bg-gray-50 text-text-muted font-medium">
            <tr><th className="px-6 py-4">Keterangan</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4 text-right">Nominal</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.transaksiTerbaru ?? []).map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{trx.ket}</td>
                <td className="px-6 py-4 text-text-muted">{trx.kategori}</td>
                <td className="px-6 py-4 text-text-muted">{formatTanggal(trx.tanggal)}</td>
                <td className={`px-6 py-4 text-right font-bold ${trx.tipe === 'masuk' ? 'text-primary' : 'text-red-500'}`}>
                  {trx.tipe === 'masuk' ? '+' : '-'}{formatRp(trx.nominal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}