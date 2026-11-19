import { useEffect, useState } from 'react';
import { FileDown, Printer } from 'lucide-react';
import { api, downloadBlob } from '../../lib/api';
import { formatRp, formatTanggal } from '../../lib/format';

interface LaporanResponse {
  periode: string;
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  transaksi: { id: number; tanggal: string; ket: string; kategori: string; tipe: 'masuk' | 'keluar'; nominal: number }[];
}

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

export default function AdminLaporan() {
  const [bulan, setBulan] = useState(10);
  const [tahun, setTahun] = useState(2026);
  const [laporan, setLaporan] = useState<LaporanResponse | null>(null);

  useEffect(() => {
    api.get<LaporanResponse>('/admin/laporan', { params: { bulan, tahun } }).then((res) => setLaporan(res.data));
  }, [bulan, tahun]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-main">Laporan Kas</h2>
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {BULAN_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => downloadBlob('/admin/laporan/export-pdf', { bulan, tahun }, `laporan-kas-${tahun}-${bulan}.pdf`)} className="bg-white border border-gray-300 text-text-main hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <FileDown size={16} /> Export PDF
          </button>
          <button type="button" onClick={() => downloadBlob('/admin/laporan/export-excel', { bulan, tahun }, `laporan-kas-${tahun}-${bulan}.xlsx`)} className="bg-white border border-gray-300 text-text-main hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Printer size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-1">Saldo Awal</p><p className="text-xl font-bold text-text-main">{formatRp(laporan?.saldoAwal ?? 0)}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-1">Total Masuk</p><p className="text-xl font-bold text-primary">+ {formatRp(laporan?.totalMasuk ?? 0)}</p></div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><p className="text-sm text-text-muted font-medium mb-1">Total Keluar</p><p className="text-xl font-bold text-red-500">- {formatRp(laporan?.totalKeluar ?? 0)}</p></div>
        <div className="bg-primary p-5 rounded-2xl shadow-sm border border-primary-dark text-white"><p className="text-sm text-primary-light font-medium mb-1">Saldo Akhir</p><p className="text-xl font-bold">{formatRp(laporan?.saldoAkhir ?? 0)}</p></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-text-main">Rincian Transaksi ({laporan?.periode ?? ''})</h3>
        </div>
        <table className="w-full text-left text-sm text-text-main">
          <thead className="bg-gray-50 text-text-muted">
            <tr><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">Keterangan</th><th className="px-6 py-3">Kategori</th><th className="px-6 py-3 text-right">Nominal</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(laporan?.transaksi ?? []).length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-text-muted">Tidak ada transaksi pada periode ini.</td></tr>
            )}
            {(laporan?.transaksi ?? []).map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-text-muted">{formatTanggal(trx.tanggal)}</td>
                <td className="px-6 py-4 font-medium">{trx.ket}</td>
                <td className="px-6 py-4 text-text-muted">{trx.kategori}</td>
                <td className={`px-6 py-4 text-right font-bold ${trx.tipe === 'masuk' ? 'text-primary' : 'text-red-500'}`}>
                  {trx.tipe === 'masuk' ? '+' : '-'} {formatRp(trx.nominal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}