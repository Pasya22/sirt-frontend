import { useCallback, useEffect, useRef, useState } from 'react';
import { Edit, Loader2, Plus, Search, Trash2, TrendingDown, TrendingUp, UploadCloud, Wallet } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';
import { formatRp, formatTanggal, hariIni } from '../../lib/format';

type TipeKas = 'masuk' | 'keluar';
interface KasData { id: number; tanggal: string; ket: string; kategori: string; tipe: TipeKas; nominal: number; bukti: string | null; }

export default function AdminKas() {
  const { can } = useAkses();
  const bisaEdit = can('kas', 'edit');
  const bisaHapus = can('kas', 'hapus');
  const tampilAksi = bisaEdit || bisaHapus;

  const buktiInputRef = useRef<HTMLInputElement>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<KasData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [trxType, setTrxType] = useState<TipeKas>('masuk');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  const [kasData, setKasData] = useState<KasData[]>([]);
  const [summary, setSummary] = useState({ totalMasuk: 0, totalKeluar: 0, saldoAkhir: 0 });

  const fetchKas = useCallback(async () => {
    const res = await api.get<{ summary: typeof summary; data: KasData[] }>('/admin/kas', {
      params: { search: searchTerm },
    });
    setSummary(res.data.summary);
    setKasData(res.data.data);
  }, [searchTerm]);

  useEffect(() => {
    fetchKas();
  }, [fetchKas]);

  const showToast = (message: string) => setToast({ isOpen: true, message });

  const openCreate = () => {
    if (!bisaEdit) return;
    setSelectedTrx(null);
    setTrxType('masuk');
    setBuktiFile(null);
    setIsModalOpen(true);
  };

  const openEdit = (trx: KasData) => {
    if (!bisaEdit) return;
    setSelectedTrx(trx);
    setTrxType(trx.tipe);
    setBuktiFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bisaEdit) return;

    const raw = new FormData(e.currentTarget);
    const payload = new FormData();
    payload.append('tipe', trxType);
    payload.append('nominal', String(raw.get('nominal')));
    payload.append('kategori', String(raw.get('kategori')));
    payload.append('tanggal', String(raw.get('tanggal')));
    payload.append('ket', String(raw.get('ket')));
    if (buktiFile) payload.append('bukti', buktiFile);

    setIsSubmitting(true);
    try {
      if (selectedTrx) {
        payload.append('_method', 'PUT');
        await api.post(`/admin/kas/${selectedTrx.id}`, payload);
      } else {
        await api.post('/admin/kas', payload);
      }
      await fetchKas();
      setIsModalOpen(false);
      showToast(selectedTrx ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil dicatat!');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!bisaHapus || deleteId === null) return;
    await api.delete(`/admin/kas/${deleteId}`);
    await fetchKas();
    showToast('Transaksi berhasil dihapus.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-primary-light text-primary rounded-xl"><TrendingUp size={24} /></div>
          <div><p className="text-sm text-text-muted font-medium mb-1">Total Uang Masuk</p><p className="text-xl font-bold text-text-main">{formatRp(summary.totalMasuk)}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={24} /></div>
          <div><p className="text-sm text-text-muted font-medium mb-1">Total Uang Keluar</p><p className="text-xl font-bold text-text-main">{formatRp(summary.totalKeluar)}</p></div>
        </div>
        <div className="bg-primary p-5 rounded-2xl shadow-sm border border-primary-dark flex items-center gap-4 text-white">
          <div className="p-3 bg-white/20 rounded-xl"><Wallet size={24} /></div>
          <div><p className="text-sm text-primary-light font-medium mb-1">Saldo Kas Saat Ini</p><p className="text-xl font-bold">{formatRp(summary.saldoAkhir)}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-text-main">Riwayat Transaksi</h2>
          {bisaEdit && (
            <button type="button" onClick={openCreate} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px]">
              <Plus size={16} /> Catat Transaksi
            </button>
          )}
        </div>

        <InfoAkses tampil={!tampilAksi} />

        <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari keterangan transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-main">
            <thead className="text-text-muted border-b border-gray-200">
              <tr>
                <th className="pb-3 font-medium w-32">Tanggal</th>
                <th className="pb-3 font-medium">Keterangan</th>
                <th className="pb-3 font-medium">Kategori</th>
                <th className="pb-3 font-medium">Bukti</th>
                <th className="pb-3 font-medium text-right">Nominal</th>
                {tampilAksi && <th className="pb-3 font-medium text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kasData.length === 0 && (
                <tr><td colSpan={tampilAksi ? 6 : 5} className="py-10 text-center text-text-muted">Tidak ada transaksi.</td></tr>
              )}
              {kasData.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="py-4 text-text-muted">{formatTanggal(trx.tanggal)}</td>
                  <td className="py-4 font-medium">{trx.ket}</td>
                  <td className="py-4 text-text-muted">{trx.kategori}</td>
                  <td className="py-4">
                    {trx.bukti
                      ? <a href={trx.bukti} target="_blank" rel="noreferrer" className="text-primary text-xs font-semibold hover:underline">Lihat Bukti</a>
                      : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className={`py-4 text-right font-bold ${trx.tipe === 'masuk' ? 'text-primary' : 'text-red-500'}`}>
                    {trx.tipe === 'masuk' ? '+' : '-'} {formatRp(trx.nominal)}
                  </td>
                  {tampilAksi && (
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {bisaEdit && <button type="button" onClick={() => openEdit(trx)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors"><Edit size={16} /></button>}
                        {bisaHapus && <button type="button" onClick={() => setDeleteId(trx.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selectedTrx ? 'Edit Transaksi' : 'Catat Transaksi Baru'}>
        <form key={selectedTrx?.id ?? 'baru'} className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button type="button" onClick={() => setTrxType('masuk')} className={`flex-1 py-2 text-sm font-semibold rounded-lg min-h-[44px] ${trxType === 'masuk' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>Uang Masuk</button>
            <button type="button" onClick={() => setTrxType('keluar')} className={`flex-1 py-2 text-sm font-semibold rounded-lg min-h-[44px] ${trxType === 'keluar' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}>Uang Keluar</button>
          </div>
          <div>
            <label htmlFor="nominal" className="block text-sm font-medium text-text-main mb-1">Nominal (Rp)</label>
            <input id="nominal" name="nominal" type="number" inputMode="numeric" min={1} required defaultValue={selectedTrx?.nominal ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="kategori" className="block text-sm font-medium text-text-main mb-1">Kategori</label>
              <select id="kategori" name="kategori" defaultValue={selectedTrx?.kategori ?? 'Iuran Warga'} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                <option value="Iuran Warga">Iuran Warga</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Donasi">Donasi</option>
              </select>
            </div>
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-text-main mb-1">Tanggal</label>
              <input id="tanggal" name="tanggal" type="date" required defaultValue={selectedTrx?.tanggal ?? hariIni()} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="ket" className="block text-sm font-medium text-text-main mb-1">Keterangan</label>
            <input id="ket" name="ket" type="text" required defaultValue={selectedTrx?.ket ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
          </div>
          <div>
            <p className="block text-sm font-medium text-text-main mb-1">Bukti Transaksi</p>
            <input ref={buktiInputRef} type="file" accept="image/*" onChange={(e) => setBuktiFile(e.target.files?.[0] ?? null)} className="hidden" />
            <div onClick={() => buktiInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <UploadCloud size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-primary font-medium text-sm">{buktiFile ? buktiFile.name : 'Ambil foto atau pilih gambar'}</p>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm flex items-center gap-2">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : selectedTrx ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Transaksi kas ini akan dihapus." />
      <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
    </div>
  );
}