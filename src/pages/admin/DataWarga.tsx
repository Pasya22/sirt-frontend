import { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown, Edit, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';

type StatusWarga = 'Tetap' | 'Kontrak';
interface Warga { id: number; nama: string; nik: string; blok: string; status: StatusWarga; }

export default function AdminDataWarga() {
    const { can } = useAkses();
    const bisaEdit = can('warga', 'edit');
    const bisaHapus = can('warga', 'hapus');
    const tampilAksi = bisaEdit || bisaHapus;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Warga | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [sortAsc, setSortAsc] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [toast, setToast] = useState({ isOpen: false, message: '' });
    const [wargaList, setWargaList] = useState<Warga[]>([]);

    const fetchWarga = useCallback(async () => {
        const res = await api.get<{ data: Warga[] }>('/admin/warga', {
            params: { search: searchTerm, status: filterStatus, sort: sortAsc ? 'asc' : 'desc' },
        });
        setWargaList(res.data.data);
    }, [searchTerm, filterStatus, sortAsc]);

    useEffect(() => {
        fetchWarga();
    }, [fetchWarga]);

    const showToast = (message: string) => setToast({ isOpen: true, message });

    const openCreate = () => { if (bisaEdit) { setSelected(null); setFormError(''); setIsModalOpen(true); } };
    const openEdit = (w: Warga) => { if (bisaEdit) { setSelected(w); setFormError(''); setIsModalOpen(true); } };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bisaEdit) return;

        const fd = new FormData(e.currentTarget);
        const payload = {
            nama: String(fd.get('nama')).trim(),
            nik: String(fd.get('nik')).trim(),
            blok: String(fd.get('blok')).trim(),
            status: fd.get('status') as StatusWarga,
        };

        setFormError('');
        setIsSubmitting(true);
        try {
            if (selected) {
                await api.put(`/admin/warga/${selected.id}`, payload);
            } else {
                await api.post('/admin/warga', payload);
            }
            await fetchWarga();
            setIsModalOpen(false);
            showToast('Data warga berhasil disimpan!');
        } catch (err) {
            setFormError(getErrorMessage(err, 'Gagal menyimpan data warga.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bisaHapus || deleteId === null) return;
        await api.delete(`/admin/warga/${deleteId}`);
        await fetchWarga();
        showToast('Data warga dihapus.');
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Data Warga</h2>
                    <p className="text-sm text-text-muted mt-1">Total: {wargaList.length} data ditemukan</p>
                </div>
                {bisaEdit && (
                    <button type="button" onClick={openCreate} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px]">
                        <Plus size={16} /> Tambah Warga
                    </button>
                )}
            </div>

            <InfoAkses tampil={!tampilAksi} />

            <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari nama atau NIK..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                    <option value="Semua">Semua Status</option>
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                </select>
                <button type="button" onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-gray-100 bg-white transition-colors">
                    <ArrowUpDown size={14} /> Urutkan ({sortAsc ? 'A-Z' : 'Z-A'})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-main">
                    <thead className="text-text-muted border-b border-gray-200">
                        <tr>
                            <th className="pb-3 font-medium">Nama</th>
                            <th className="pb-3 font-medium">NIK</th>
                            <th className="pb-3 font-medium">Blok</th>
                            <th className="pb-3 font-medium">Status</th>
                            {tampilAksi && <th className="pb-3 font-medium text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {wargaList.length === 0 && (
                            <tr><td colSpan={tampilAksi ? 5 : 4} className="py-10 text-center text-text-muted">Tidak ada data warga.</td></tr>
                        )}
                        {wargaList.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50">
                                <td className="py-4 font-medium">{w.nama}</td>
                                <td className="py-4 text-text-muted">{w.nik}</td>
                                <td className="py-4 text-text-muted">{w.blok}</td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${w.status === 'Tetap' ? 'bg-primary-light text-primary' : 'bg-orange-50 text-orange-600'}`}>{w.status}</span>
                                </td>
                                {tampilAksi && (
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {bisaEdit && <button type="button" onClick={() => openEdit(w)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg transition-colors"><Edit size={16} /></button>}
                                            {bisaHapus && <button type="button" onClick={() => setDeleteId(w.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selected ? 'Edit Data Warga' : 'Tambah Warga'}>
                <form key={selected?.id ?? 'baru'} className="space-y-4" onSubmit={handleSubmit}>
                    {formError && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{formError}</div>}
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-text-main mb-1">Nama Lengkap</label>
                        <input id="nama" name="nama" type="text" required defaultValue={selected?.nama ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="nik" className="block text-sm font-medium text-text-main mb-1">NIK (16 Digit)</label>
                        <input id="nik" name="nik" type="text" inputMode="numeric" maxLength={16} required defaultValue={selected?.nik ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="blok" className="block text-sm font-medium text-text-main mb-1">Blok</label>
                            <input id="blok" name="blok" type="text" required defaultValue={selected?.blok ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-main mb-1">Status</label>
                            <select id="status" name="status" defaultValue={selected?.status ?? 'Tetap'} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
                                <option value="Tetap">Tetap</option>
                                <option value="Kontrak">Kontrak</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center gap-2 disabled:opacity-70">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Data warga ini akan dihapus permanen." />
            <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
        </div>
    );
}