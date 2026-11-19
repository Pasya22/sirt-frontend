import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, Plus, ReceiptText, Search, XCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import AlertDialog from '../../components/AlertDialog';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';
import { formatRp } from '../../lib/format';

type StatusBayar = 'Lunas' | 'Belum';
interface DetailIuran { keamanan: number; kebersihan: number; kasRt: number; }
interface WargaIuran {
  id: number;
  nama: string;
  blok: string;
  status: Record<string, StatusBayar>;
  detail: Record<string, DetailIuran>;
}
interface ConfirmState {
  isOpen: boolean;
  wargaId: number | null;
  bulan: string | null;
  namaWarga: string;
  statusBaru: StatusBayar | null;
}

const BULAN_LIST = ['Agu', 'Sep', 'Okt', 'Nov'];
const STANDAR: DetailIuran = { keamanan: 50000, kebersihan: 30000, kasRt: 20000 };
const KOSONG: DetailIuran = { keamanan: 0, kebersihan: 0, kasRt: 0 };
const TOTAL_STANDAR = 100000;
const CONFIRM_AWAL: ConfirmState = { isOpen: false, wargaId: null, bulan: null, namaWarga: '', statusBaru: null };

const total = (d?: DetailIuran) => (d ? d.keamanan + d.kebersihan + d.kasRt : 0);
const badgeClass = (lunas: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1 mx-auto w-24 ${lunas ? 'bg-primary-light text-primary' : 'bg-red-50 text-red-500'}`;

export default function AdminIuran() {
  const { can } = useAkses();
  const bisaEdit = can('iuran', 'edit');
  const bisaHapus = can('iuran', 'hapus');

  const [tahun] = useState(2026);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmState>(CONFIRM_AWAL);
  const [formDetail, setFormDetail] = useState<DetailIuran>(KOSONG);
  const [massalData, setMassalData] = useState({ wargaId: '', bulan: [] as string[] });
  const [toast, setToast] = useState({ isOpen: false, message: '' });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' });
  const [wargaList, setWargaList] = useState<WargaIuran[]>([]);

  const fetchIuran = useCallback(async () => {
    const res = await api.get<{ data: WargaIuran[] }>('/admin/iuran', {
      params: { tahun, search: searchTerm },
    });
    setWargaList(res.data.data);
  }, [tahun, searchTerm]);

  useEffect(() => {
    fetchIuran();
  }, [fetchIuran]);

  const bolehUbahStatus = (status: StatusBayar) => (status === 'Belum' ? bisaEdit : bisaHapus);

  const handleStatusClick = (w: WargaIuran, bulan: string) => {
    const statusSaatIni = w.status[bulan] ?? 'Belum';
    const statusBaru: StatusBayar = statusSaatIni === 'Lunas' ? 'Belum' : 'Lunas';
    if (!bolehUbahStatus(statusSaatIni)) return;
    setConfirmData({ isOpen: true, wargaId: w.id, bulan, namaWarga: w.nama, statusBaru });
    setFormDetail(total(w.detail[bulan]) > 0 ? w.detail[bulan] : STANDAR);
  };

  const confirmChangeStatus = async () => {
    const { wargaId, bulan, statusBaru } = confirmData;
    if (wargaId === null || !bulan || !statusBaru) return;

    if (statusBaru === 'Lunas' && total(formDetail) <= 0) {
      setAlertDialog({ isOpen: true, message: 'Total iuran tidak boleh Rp 0. Silakan isi nominal terlebih dahulu.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ message: string }>('/admin/iuran/status', {
        wargaId,
        tahun,
        bulan,
        statusBaru,
        detail: statusBaru === 'Lunas' ? formDetail : undefined,
      });
      await fetchIuran();
      setConfirmData(CONFIRM_AWAL);
      setToast({ isOpen: true, message: res.data.message });
    } catch (err) {
      setAlertDialog({ isOpen: true, message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMassalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bisaEdit) return;
    if (!massalData.wargaId || massalData.bulan.length === 0) {
      setAlertDialog({ isOpen: true, message: 'Pilih warga dan minimal satu bulan iuran.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ message: string }>('/admin/iuran/massal', {
        wargaId: Number(massalData.wargaId),
        tahun,
        bulan: massalData.bulan,
      });
      await fetchIuran();
      setIsModalOpen(false);
      setMassalData({ wargaId: '', bulan: [] });
      setToast({ isOpen: true, message: res.data.message });
    } catch (err) {
      setAlertDialog({ isOpen: true, message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBulanMassal = (bulan: string) =>
    setMassalData((prev) => ({
      ...prev,
      bulan: prev.bulan.includes(bulan) ? prev.bulan.filter((b) => b !== bulan) : [...prev.bulan, bulan],
    }));

  const updateDetail = (key: keyof DetailIuran, value: string) =>
    setFormDetail((d) => ({ ...d, [key]: Number(value) }));

  const bisaUbahApaPun = bisaEdit || bisaHapus;
  const totalForm = total(formDetail);

  const RINCIAN: { key: keyof DetailIuran; label: string; warna: string }[] = [
    { key: 'keamanan', label: 'Iuran Keamanan', warna: 'bg-blue-500' },
    { key: 'kebersihan', label: 'Iuran Kebersihan', warna: 'bg-green-500' },
    { key: 'kasRt', label: 'Kas RT', warna: 'bg-orange-500' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-main">Iuran Warga ({tahun})</h2>
          <p className="text-sm text-text-muted mt-1">
            {bisaUbahApaPun ? 'Klik pada status bulan untuk mengubah Lunas/Belum.' : 'Status pembayaran iuran warga per bulan.'}
          </p>
        </div>
        {bisaEdit && (
          <button type="button" onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px]">
            <Plus size={16} /> Catat Pembayaran Massal
          </button>
        )}
      </div>

      <InfoAkses tampil={!bisaUbahApaPun} />

      <div className="flex gap-4 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-text-main min-w-[600px]">
          <thead className="text-text-muted border-b border-gray-200">
            <tr>
              <th className="pb-3 font-medium">Kepala Keluarga</th>
              <th className="pb-3 font-medium">Blok</th>
              {BULAN_LIST.map((b) => <th key={b} className="pb-3 font-medium text-center">{b}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wargaList.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="py-4 font-medium">{w.nama}</td>
                <td className="py-4 text-text-muted">{w.blok}</td>
                {BULAN_LIST.map((b) => {
                  const status = w.status[b] ?? 'Belum';
                  const lunas = status === 'Lunas';
                  const icon = lunas ? <CheckCircle2 size={12} /> : <XCircle size={12} />;
                  return (
                    <td key={b} className="py-4 text-center">
                      {bolehUbahStatus(status) ? (
                        <button type="button" onClick={() => handleStatusClick(w, b)} className={`${badgeClass(lunas)} transition-all hover:scale-105 active:scale-95`}>
                          {icon}{status}
                        </button>
                      ) : (
                        <span className={badgeClass(lunas)}>{icon}{status}</span>
                      )}
                      {lunas && <p className="text-[10px] text-text-muted mt-1">{formatRp(total(w.detail[b]))}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs mt-6 bg-blue-50 p-3 rounded-lg text-blue-700 flex items-start gap-2">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>Rincian standar: Keamanan {formatRp(STANDAR.keamanan)}, Kebersihan {formatRp(STANDAR.kebersihan)}, Kas RT {formatRp(STANDAR.kasRt)}.</p>
      </div>

      <Modal isOpen={bisaUbahApaPun && confirmData.isOpen} onClose={() => !isSubmitting && setConfirmData(CONFIRM_AWAL)} title={confirmData.statusBaru === 'Lunas' ? 'Konfirmasi Pembayaran' : 'Batalkan Lunas'}>
        <div className="space-y-5">
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className={`p-3 rounded-full ${confirmData.statusBaru === 'Lunas' ? 'bg-primary-light text-primary' : 'bg-red-50 text-red-500'}`}>
              {confirmData.statusBaru === 'Lunas' ? <ReceiptText size={24} /> : <AlertCircle size={24} />}
            </div>
            <div>
              <p className="text-sm text-text-muted">Mengubah status iuran untuk:</p>
              <p className="font-bold text-text-main text-lg">{confirmData.namaWarga}</p>
              <p className="text-sm font-semibold text-primary">Bulan {confirmData.bulan} {tahun}</p>
            </div>
          </div>

          {confirmData.statusBaru === 'Lunas' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-main mb-2">Rincian Pembayaran:</p>
              {RINCIAN.map((r) => (
                <div key={r.key} className="flex justify-between items-center border border-gray-200 p-3 rounded-lg bg-white">
                  <span className="text-sm text-text-muted flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${r.warna}`} /> {r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Rp</span>
                    <input type="number" inputMode="numeric" min={0} value={formDetail[r.key]} onChange={(e) => updateDetail(r.key, e.target.value)} className="w-24 text-right border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary font-medium" />
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                <span className="font-bold text-text-main">Total Diterima</span>
                <span className="font-bold text-primary text-lg">{formatRp(totalForm)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 w-full pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setConfirmData(CONFIRM_AWAL)} disabled={isSubmitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-gray-100 hover:bg-gray-200 rounded-xl">Batal</button>
            <button type="button" onClick={confirmChangeStatus} disabled={isSubmitting} className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl shadow-sm flex justify-center items-center gap-2 ${confirmData.statusBaru === 'Lunas' ? 'bg-primary hover:bg-primary-dark' : 'bg-red-500 hover:bg-red-600'}`}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : confirmData.statusBaru === 'Lunas' ? 'Konfirmasi & Catat Kas' : 'Ya, Batalkan'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Catat Pembayaran Massal">
        <form className="space-y-4" onSubmit={handleMassalSubmit}>
          <div className="bg-primary-light p-4 rounded-xl text-primary text-sm mb-4">Standar Iuran: <strong>{formatRp(TOTAL_STANDAR)}</strong> / KK / Bulan</div>
          <div>
            <label htmlFor="warga-massal" className="block text-sm font-medium text-text-main mb-1">Pilih Warga</label>
            <select id="warga-massal" value={massalData.wargaId} onChange={(e) => setMassalData({ ...massalData, wargaId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
              <option value="">-- Pilih Warga --</option>
              {wargaList.map((w) => <option key={w.id} value={w.id}>{w.nama} ({w.blok})</option>)}
            </select>
          </div>
          <div>
            <p className="block text-sm font-medium text-text-main mb-1">Pilih Bulan</p>
            <div className="grid grid-cols-4 gap-2">
              {BULAN_LIST.map((b) => (
                <label key={b} className={`flex items-center gap-2 border p-2 rounded-lg cursor-pointer transition-colors ${massalData.bulan.includes(b) ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={massalData.bulan.includes(b)} onChange={() => toggleBulanMassal(b)} className="rounded text-primary" />
                  <span className="text-sm font-medium">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm flex items-center gap-2">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
      <AlertDialog isOpen={alertDialog.isOpen} onClose={() => setAlertDialog((a) => ({ ...a, isOpen: false }))} message={alertDialog.message} />
    </div>
  );
}