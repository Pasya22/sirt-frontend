import { useCallback, useEffect, useState } from 'react';
import { FileEdit, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';
import { formatTanggal, hariIni } from '../../lib/format';

type StatusPengumuman = 'Terkirim' | 'Draf';
interface Pengumuman { id: number; judul: string; isi: string; tanggal: string; status: StatusPengumuman; }

export default function AdminPengumuman() {
    const { can } = useAkses();
    const bisaEdit = can('pengumuman', 'edit');
    const bisaHapus = can('pengumuman', 'hapus');
    const tampilAksi = bisaEdit || bisaHapus;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Pengumuman | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [sendId, setSendId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ isOpen: false, message: '' });
    const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);

    const fetchPengumuman = useCallback(async () => {
        const res = await api.get<{ data: Pengumuman[] }>('/admin/pengumuman');
        setPengumuman(res.data.data);
    }, []);

    useEffect(() => {
        fetchPengumuman();
    }, [fetchPengumuman]);

    const showToast = (message: string) => setToast({ isOpen: true, message });
    const openCreate = () => { if (bisaEdit) { setSelectedItem(null); setIsModalOpen(true); } };
    const openEdit = (item: Pengumuman) => { if (bisaEdit) { setSelectedItem(item); setIsModalOpen(true); } };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bisaEdit) return;

        const fd = new FormData(e.currentTarget);
        const payload = {
            judul: String(fd.get('judul')),
            isi: String(fd.get('isi')),
            tanggal: String(fd.get('tanggal')),
            status: fd.get('status') as StatusPengumuman,
        };

        setIsSubmitting(true);
        try {
            if (selectedItem) {
                await api.put(`/admin/pengumuman/${selectedItem.id}`, payload);
            } else {
                await api.post('/admin/pengumuman', payload);
            }
            await fetchPengumuman();
            setIsModalOpen(false);
            showToast('Data berhasil disimpan!');
        } catch (err) {
            showToast(getErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bisaHapus || deleteId === null) return;
        await api.delete(`/admin/pengumuman/${deleteId}`);
        await fetchPengumuman();
        showToast('Pengumuman dihapus.');
    };

    const handleSend = async () => {
        if (!bisaEdit || sendId === null) return;
        const res = await api.post<{ message: string }>(`/admin/pengumuman/${sendId}/kirim`);
        await fetchPengumuman();
        showToast(res.data.message);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Pengumuman</h2>
                    <p className="text-sm text-text-muted mt-1">Kelola informasi untuk warga.</p>
                </div>
                {bisaEdit && (
                    <button type="button" onClick={openCreate} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px]">
                        <Plus size={16} /> Buat Pengumuman
                    </button>
                )}
            </div>

            <InfoAkses tampil={!tampilAksi} />

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-main">
                    <thead className="text-text-muted border-b border-gray-200">
                        <tr>
                            <th className="pb-3 font-medium w-1/2">Judul</th>
                            <th className="pb-3 font-medium">Tanggal</th>
                            <th className="pb-3 font-medium">Status</th>
                            {tampilAksi && <th className="pb-3 font-medium text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pengumuman.length === 0 && (
                            <tr><td colSpan={tampilAksi ? 4 : 3} className="py-10 text-center text-text-muted">Belum ada pengumuman.</td></tr>
                        )}
                        {pengumuman.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="py-4 font-medium">{item.judul}</td>
                                <td className="py-4 text-text-muted">{formatTanggal(item.tanggal)}</td>
                                <td className="py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'Terkirim' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}>{item.status}</span>
                                </td>
                                {tampilAksi && (
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {bisaEdit && <button type="button" onClick={() => openEdit(item)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg"><FileEdit size={16} /></button>}
                                            {bisaEdit && item.status === 'Draf' && <button type="button" onClick={() => setSendId(item.id)} className="p-2 text-primary hover:bg-primary-light rounded-lg"><Send size={16} /></button>}
                                            {bisaHapus && <button type="button" onClick={() => setDeleteId(item.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selectedItem ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}>
                <form key={selectedItem?.id ?? 'baru'} className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="judul" className="block text-sm font-medium text-text-main mb-1">Judul</label>
                        <input id="judul" name="judul" type="text" required defaultValue={selectedItem?.judul ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                    </div>
                    <div>
                        <label htmlFor="isi" className="block text-sm font-medium text-text-main mb-1">Isi</label>
                        <textarea id="isi" name="isi" required rows={5} defaultValue={selectedItem?.isi ?? ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tanggal" className="block text-sm font-medium text-text-main mb-1">Tanggal</label>
                            <input id="tanggal" name="tanggal" type="date" required defaultValue={selectedItem?.tanggal ?? hariIni()} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-main mb-1">Status</label>
                            <select id="status" name="status" defaultValue={selectedItem?.status ?? 'Draf'} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                                <option value="Draf">Draf</option>
                                <option value="Terkirim">Terkirim</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-lg">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm flex items-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Menyimpan...' : selectedItem ? 'Simpan Perubahan' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Pengumuman ini akan dihapus." />
            <ConfirmDialog isOpen={bisaEdit && sendId !== null} onClose={() => setSendId(null)} onConfirm={handleSend} variant="primary" title="Kirim Notifikasi" confirmLabel="Ya, Kirim" loadingLabel="Mengirim..." message="Notifikasi akan dikirim ke seluruh warga yang mengaktifkannya." />
            <Toast isOpen={toast.isOpen} onClose={() => setToast((t) => ({ ...t, isOpen: false }))} message={toast.message} />
        </div>
    );
}