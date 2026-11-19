import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Edit, Eye, Loader2, MapPin, Plus, Search, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';
import { formatTanggal, hariIni } from '../../lib/format';

type StatusKegiatan = 'Planning' | 'Berjalan' | 'Selesai';
interface Kegiatan {
    id: number;
    judul: string;
    kategori: string;
    status: StatusKegiatan;
    tanggal: string;
    waktu: string;
    lokasi: string;
    estimasi: number;
    aktual: number;
    tampilWarga: boolean;
    deskripsi?: string;
}

const KATEGORI = ['Kerja Bakti', 'Rapat', 'Keagamaan', 'Acara'];
const STATUS: StatusKegiatan[] = ['Planning', 'Berjalan', 'Selesai'];
const badgeStatus = (s: StatusKegiatan) =>
    s === 'Planning' ? 'bg-orange-50 text-orange-600' : s === 'Berjalan' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600';

export default function AdminKegiatan() {
    const { can } = useAkses();
    const bisaEdit = can('kegiatan', 'edit');
    const bisaHapus = can('kegiatan', 'hapus');
    const tampilAksi = bisaEdit || bisaHapus;

    const coverRef = useRef<HTMLInputElement>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Kegiatan | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ isOpen: false, message: '' });
    const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);

    const fetchKegiatan = useCallback(async () => {
        const res = await api.get<{ data: Kegiatan[] }>('/admin/kegiatan', {
            params: { search: searchTerm, status: filterStatus },
        });
        setKegiatanList(res.data.data);
    }, [searchTerm, filterStatus]);

    useEffect(() => {
        fetchKegiatan();
    }, [fetchKegiatan]);

    const showToast = (message: string) => setToast({ isOpen: true, message });
    const openCreate = () => { if (bisaEdit) { setSelected(null); setCoverFile(null); setIsModalOpen(true); } };
    const openEdit = (k: Kegiatan) => { if (bisaEdit) { setSelected(k); setCoverFile(null); setIsModalOpen(true); } };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bisaEdit) return;

        const raw = new FormData(e.currentTarget);
        const payload = new FormData();
        payload.append('judul', String(raw.get('judul')).trim());
        payload.append('kategori', String(raw.get('kategori')));
        payload.append('status', String(raw.get('status')));
        payload.append('tanggal', String(raw.get('tanggal')));
        payload.append('waktu', String(raw.get('waktu') || '08.00'));
        payload.append('lokasi', String(raw.get('lokasi')).trim());
        payload.append('estimasi', String(Number(raw.get('estimasi')) || 0));
        payload.append('biayaAktual', String(Number(raw.get('biayaAktual')) || 0));
        payload.append('deskripsi', String(raw.get('deskripsi') || ''));
        payload.append('tampilWarga', raw.get('tampilWarga') === 'on' ? '1' : '0');
        if (coverFile) payload.append('cover', coverFile);

        setIsSubmitting(true);
        try {
            if (selected) {
                payload.append('_method', 'PUT');
                await api.post(`/admin/kegiatan/${selected.id}`, payload);
            } else {
                await api.post('/admin/kegiatan', payload);
            }
            await fetchKegiatan();
            setIsModalOpen(false);
            showToast('Data kegiatan berhasil disimpan!');
        } catch (err) {
            showToast(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bisaHapus || deleteId === null) return;
        await api.delete(`/admin/kegiatan/${deleteId}`);
        await fetchKegiatan();
        showToast('Kegiatan dihapus.');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Manajemen Kegiatan</h2>
                    <p className="text-sm text-text-muted mt-1">Kelola jadwal dan informasi kegiatan warga.</p>
                </div>
                {bisaEdit && (
                    <button type="button" onClick={openCreate} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px]">
                        <Plus size={16} /> Tambah Kegiatan
                    </button>
                )}
            </div>

            <InfoAkses tampil={!tampilAksi} />

            <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari judul atau lokasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white">
                    <option value="Semua">Semua Status</option>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-main">
                    <thead className="text-text-muted border-b border-gray-200">
                        <tr>
                            <th className="pb-3 font-medium">Nama Kegiatan</th>
                            <th className="pb-3 font-medium">Kategori</th>
                            <th className="pb-3 font-medium">Jadwal</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Tampil Warga</th>
                            {tampilAksi && <th className="pb-3 font-medium text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {kegiatanList.length === 0 && (
                            <tr><td colSpan={tampilAksi ? 6 : 5} className="py-10 text-center text-text-muted">Tidak ada kegiatan.</td></tr>
                        )}
                        {kegiatanList.map((k) => (
                            <tr key={k.id} className="hover:bg-gray-50">
                                <td className="py-4">
                                    <p className="font-medium text-text-main">{k.judul}</p>
                                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><MapPin size={12} /> {k.lokasi}</p>
                                </td>
                                <td className="py-4 text-text-muted">{k.kategori}</td>
                                <td className="py-4 text-text-muted"><span className="flex items-center gap-1.5"><Calendar size={14} /> {formatTanggal(k.tanggal)} ({k.waktu})</span></td>
                                <td className="py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStatus(k.status)}`}>{k.status}</span></td>
                                <td className="py-4">
                                    {k.tampilWarga
                                        ? <span className="flex items-center gap-1 text-primary text-xs font-medium"><Eye size={14} /> Ya</span>
                                        : <span className="text-gray-500 text-xs">Disembunyikan</span>}
                                </td>
                                {tampilAksi && (
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {bisaEdit && <button type="button" onClick={() => openEdit(k)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg"><Edit size={16} /></button>}
                                            {bisaHapus && <button type="button" onClick={() => setDeleteId(k.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selected ? 'Edit Kegiatan' : 'Tambah Kegiatan'}>
                <form key={selected?.id ?? 'baru'} className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="judul" className="block text-sm font-medium text-text-main mb-1">Judul Kegiatan</label>
                        <input id="judul" name="judul" type="text" required defaultValue={selected?.judul ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="kategori" className="block text-sm font-medium text-text-main mb-1">Kategori</label>
                            <select id="kategori" name="kategori" defaultValue={selected?.kategori ?? KATEGORI[0]} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                                {KATEGORI.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-main mb-1">Status</label>
                            <select id="status" name="status" defaultValue={selected?.status ?? 'Planning'} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                                {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tanggal" className="block text-sm font-medium text-text-main mb-1">Tanggal</label>
                            <input id="tanggal" name="tanggal" type="date" required defaultValue={selected?.tanggal ?? hariIni()} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="waktu" className="block text-sm font-medium text-text-main mb-1">Waktu (WIB)</label>
                            <input id="waktu" name="waktu" type="text" defaultValue={selected?.waktu ?? '08.00'} placeholder="08.00" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="estimasi" className="block text-sm font-medium text-text-main mb-1">Estimasi Biaya</label>
                            <input id="estimasi" name="estimasi" type="number" min={0} defaultValue={selected?.estimasi ?? 0} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="biayaAktual" className="block text-sm font-medium text-text-main mb-1">Biaya Aktual</label>
                            <input id="biayaAktual" name="biayaAktual" type="number" min={0} defaultValue={selected?.aktual ?? 0} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="lokasi" className="block text-sm font-medium text-text-main mb-1">Lokasi</label>
                        <input id="lokasi" name="lokasi" type="text" required defaultValue={selected?.lokasi ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                    <div>
                        <label htmlFor="deskripsi" className="block text-sm font-medium text-text-main mb-1">Deskripsi</label>
                        <textarea id="deskripsi" name="deskripsi" rows={3} defaultValue={selected?.deskripsi ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none" />
                    </div>
                    <div>
                        <p className="block text-sm font-medium text-text-main mb-1">Cover Kegiatan</p>
                        <input ref={coverRef} type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="hidden" />
                        <div onClick={() => coverRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer">
                            <p className="text-primary font-medium text-sm">{coverFile ? coverFile.name : 'Pilih foto cover'}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="font-medium text-sm text-text-main">Tampilkan ke Warga</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input name="tampilWarga" type="checkbox" className="sr-only peer" defaultChecked={selected?.tampilWarga ?? true} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                        </label>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm flex items-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Kegiatan ini akan dihapus permanen." />
            <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
        </div>
    );
}