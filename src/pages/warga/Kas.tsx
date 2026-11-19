import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api } from '../../lib/api';
import { formatRp, formatTanggal } from '../../lib/format';

interface PublicKasResponse {
  summary: { saldoAkhir: number; totalMasuk: number; totalKeluar: number };
  chart6Bulan: { bulan: string; masuk: number; keluar: number }[];
  data: { id: number; tipe: 'masuk' | 'keluar'; ket: string; tanggal: string; nominal: number }[];
}

export default function WargaKas() {
  const [kas, setKas] = useState<PublicKasResponse | null>(null);

  useEffect(() => {
    api.get<PublicKasResponse>('/public/kas').then((res) => setKas(res.data));
  }, []);

  const maxChart = Math.max(1, ...(kas?.chart6Bulan.flatMap((b) => [b.masuk, b.keluar]) ?? [1]));

  return (
    <div className="p-6 pt-10">
      <h1 className="text-2xl font-bold text-text-main mb-6">Kas RT</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <p className="text-sm text-text-muted mb-1">Saldo saat ini</p>
        <p className="text-3xl font-bold text-text-main mb-6">{formatRp(kas?.summary.saldoAkhir ?? 0)}</p>

        <div className="flex justify-between items-end h-32 gap-2 mb-2">
          {(kas?.chart6Bulan ?? []).map((b) => (
            <div key={b.bulan} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
              <div className="w-full flex justify-center gap-1 items-end h-full">
                <div className="w-2 bg-primary rounded-t-sm" style={{ height: `${Math.max(5, (b.masuk / maxChart) * 100)}%` }} />
                <div className="w-2 bg-red-400 rounded-t-sm" style={{ height: `${Math.max(5, (b.keluar / maxChart) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-text-muted mt-2">{b.bulan}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 className="font-bold text-text-main text-lg mb-4">Transaksi Terakhir</h3>
      <div className="space-y-3">
        {(kas?.data ?? []).map((trx) => (
          <div key={trx.id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${trx.tipe === 'masuk' ? 'bg-primary-light text-primary' : 'bg-red-50 text-red-500'}`}>
                {trx.tipe === 'masuk' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div>
                <p className="font-semibold text-text-main text-sm">{trx.ket}</p>
                <p className="text-xs text-text-muted">{formatTanggal(trx.tanggal)}</p>
              </div>
            </div>
            <p className={`font-bold text-sm ${trx.tipe === 'masuk' ? 'text-primary' : 'text-red-500'}`}>
              {trx.tipe === 'masuk' ? '+' : '-'}{formatRp(trx.nominal)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}