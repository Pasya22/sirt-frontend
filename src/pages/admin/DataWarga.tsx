import { useCallback, useEffect, useState } from 'react';
import { ArrowUpDown, Edit, Loader2, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import InfoAkses from '../../components/InfoAkses';
import WilayahSelector, { type WilayahValue } from '../../components/WilayahSelector';
import { parseNikIndonesia } from '../../lib/nikParser';
import { useAkses } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';

type StatusWarga = 'Tetap' | 'Kontrak';

interface AnggotaKeluargaRingkas {
    id: number;
    nama: string;
    nik: string;
    hubungan_keluarga: string;
    jenis_kelamin?: string;
}

interface Warga {
    id: number;
    nama: string;
    nik: string;
    no_kk?: string | null;
    jenis_kelamin?: 'Laki-laki' | 'Perempuan' | null;
    tempat_lahir?: string | null;
    tanggal_lahir?: string | null;
    hubungan_keluarga?: string;
    blok: string;
    rt?: string | null;
    rw?: string | null;
    desa?: string | null;
    kode_pos?: string | null;
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
    status: StatusWarga;
    anggotaKeluarga?: AnggotaKeluargaRingkas[];
}

export default function AdminDataWarga() {
    const { currentUser, can } = useAkses();
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

    // Controlled state untuk auto-deteksi NIK & KK
    const [nama, setNama] = useState('');
    const [nik, setNik] = useState('');
    const [noKk, setNoKk] = useState('');
    const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
    const [tempatLahir, setTempatLahir] = useState('');
    const [tanggalLahir, setTanggalLahir] = useState('');
    const [hubunganKeluarga, setHubunganKeluarga] = useState('Kepala Keluarga');
    const [blok, setBlok] = useState('');
    const [status, setStatus] = useState<StatusWarga>('Tetap');
    const [wilayah, setWilayah] = useState<WilayahValue>({
        provinsi: '', kabupaten: '', kecamatan: '', desa: '', kode_pos: '', rt: '', rw: '',
    });
    const [nikAutoInfo, setNikAutoInfo] = useState('');
    const [kkAnggotaTerdeteksi, setKkAnggotaTerdeteksi] = useState<AnggotaKeluargaRingkas[]>([]);

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

    const openCreate = () => {
        if (!bisaEdit) return;
        setSelected(null);
        setFormError('');
        setNama('');
        setNik('');
        setNoKk('');
        setJenisKelamin('Laki-laki');
        setTempatLahir('');
        setTanggalLahir('');
        setHubunganKeluarga('Kepala Keluarga');
        setBlok('');
        setStatus('Tetap');
        setNikAutoInfo('');
        setKkAnggotaTerdeteksi([]);
        setWilayah({
            provinsi: currentUser?.provinsi ?? '',
            kabupaten: currentUser?.kabupaten ?? '',
            kecamatan: currentUser?.kecamatan ?? '',
            desa: currentUser?.desa ?? '',
            kode_pos: currentUser?.kode_pos ?? '',
            rt: currentUser?.rt ?? '',
            rw: currentUser?.rw ?? '',
        });
        setIsModalOpen(true);
    };

    const openEdit = (w: Warga) => {
        if (!bisaEdit) return;
        setSelected(w);
        setFormError('');
        setNama(w.nama);
        setNik(w.nik);
        setNoKk(w.no_kk ?? '');
        setJenisKelamin(w.jenis_kelamin ?? 'Laki-laki');
        setTempatLahir(w.tempat_lahir ?? '');
        setTanggalLahir(w.tanggal_lahir ?? '');
        setHubunganKeluarga(w.hubungan_keluarga ?? 'Kepala Keluarga');
        setBlok(w.blok);
        setStatus(w.status);
        setNikAutoInfo('');
        setKkAnggotaTerdeteksi(w.anggotaKeluarga ?? []);
        setWilayah({
            provinsi: w.provinsi ?? '',
            kabupaten: w.kabupaten ?? '',
            kecamatan: w.kecamatan ?? '',
            desa: w.desa ?? '',
            kode_pos: w.kode_pos ?? '',
            rt: w.rt ?? '',
            rw: w.rw ?? '',
        });
        setIsModalOpen(true);
    };

    // Deteksi otomatis tanggal lahir & jenis kelamin ketika NIK 16 digit diketik
    const handleNikChange = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        setNik(digits);
        if (digits.length === 16) {
            const parsed = parseNikIndonesia(digits);
            if (parsed) {
                setTanggalLahir(parsed.tanggalLahir);
                setJenisKelamin(parsed.jenisKelamin);
                setNikAutoInfo(`Terdeteksi otomatis: ${parsed.jenisKelamin}, Lahir ${parsed.tanggalLahir}`);
            } else {
                setNikAutoInfo('');
            }
        } else {
            setNikAutoInfo('');
        }
    };

    // Deteksi otomatis alamat & anggota keluarga ketika No. KK 16 digit diketik
    const handleNoKkChange = async (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        setNoKk(digits);
        if (digits.length === 16) {
            try {
                const res = await api.get<{ found: boolean; data: any }>(`/admin/kartu-keluarga/${digits}`);
                if (res.data.found && res.data.data) {
                    const kk = res.data.data;
                    if (kk.blok) setBlok(kk.blok);
                    setWilayah({
                        provinsi: kk.provinsi ?? wilayah.provinsi,
                        kabupaten: kk.kabupaten ?? wilayah.kabupaten,
                        kecamatan: kk.kecamatan ?? wilayah.kecamatan,
                        desa: kk.desa ?? wilayah.desa,
                        kode_pos: kk.kode_pos ?? wilayah.kode_pos,
                        rt: kk.rt ?? wilayah.rt,
                        rw: kk.rw ?? wilayah.rw,
                    });
                    setKkAnggotaTerdeteksi(kk.anggota ?? []);
                    if ((kk.anggota ?? []).length > 0 && hubunganKeluarga === 'Kepala Keluarga') {
                        setHubunganKeluarga('Anggota Keluarga');
                    }
                } else {
                    setKkAnggotaTerdeteksi([]);
                }
            } catch {
                // abaikan jika endpoint belum tersedia
            }
        } else {
            setKkAnggotaTerdeteksi([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bisaEdit) return;

        const payload = {
            nama: nama.trim(),
            nik: nik.trim(),
            no_kk: noKk.trim() || null,
            jenis_kelamin: jenisKelamin,
            tempat_lahir: tempatLahir.trim() || null,
            tanggal_lahir: tanggalLahir || null,
            hubungan_keluarga: hubunganKeluarga,
            blok: blok.trim(),
            rt: wilayah.rt.trim() || null,
            rw: wilayah.rw.trim() || null,
            desa: wilayah.desa.trim() || null,
            kode_pos: wilayah.kode_pos.trim() || null,
            kecamatan: wilayah.kecamatan.trim() || null,
            kabupaten: wilayah.kabupaten.trim() || null,
            provinsi: wilayah.provinsi.trim() || null,
            status,
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
            showToast('Data warga & Kartu Keluarga berhasil disimpan!');
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
                    <h2 className="text-xl font-bold text-text-main">Data Warga & Kartu Keluarga</h2>
                    <p className="text-sm text-text-muted mt-1">Total: {wargaList.length} warga terdaftar</p>
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
                    <input type="text" placeholder="Cari nama, NIK, atau No. KK..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary bg-white" />
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
                            <th className="pb-3 font-medium">Nama & Hubungan</th>
                            <th className="pb-3 font-medium">NIK / No. KK</th>
                            <th className="pb-3 font-medium">Blok & Wilayah</th>
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
                                <td className="py-4">
                                    <p className="font-semibold text-text-main">{w.nama}</p>
                                    <p className="text-xs text-text-muted">
                                        {w.hubungan_keluarga ?? 'Kepala Keluarga'}
                                        {w.jenis_kelamin ? ` • ${w.jenis_kelamin}` : ''}
                                    </p>
                                </td>
                                <td className="py-4 text-xs">
                                    <p className="font-mono text-text-main">NIK: {w.nik}</p>
                                    {w.no_kk && <p className="font-mono text-text-muted mt-0.5">KK: {w.no_kk}</p>}
                                </td>
                                <td className="py-4 text-xs">
                                    <p className="font-medium text-text-main">
                                        Blok {w.blok} {w.rt ? `• RT ${w.rt}` : ''}{w.rw ? `/RW ${w.rw}` : ''}
                                    </p>
                                    <p className="text-text-muted mt-0.5">
                                        {[w.desa, w.kecamatan, w.kode_pos].filter(Boolean).join(', ') || '-'}
                                    </p>
                                </td>
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

            <Modal isOpen={bisaEdit && isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selected ? 'Edit Data Warga' : 'Tambah Warga / Kartu Keluarga'}>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {formError && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{formError}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="no_kk" className="block text-sm font-medium text-text-main mb-1">Nomor Kartu Keluarga (16 Digit)</label>
                            <input id="no_kk" type="text" inputMode="numeric" maxLength={16} placeholder="Opsional / 16 digit No. KK" value={noKk} onChange={(e) => handleNoKkChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="nik" className="block text-sm font-medium text-text-main mb-1">NIK KTP (16 Digit)</label>
                            <input id="nik" type="text" inputMode="numeric" maxLength={16} required placeholder="Ketik 16 digit NIK" value={nik} onChange={(e) => handleNikChange(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                    </div>

                    {nikAutoInfo && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                            <Sparkles size={14} className="shrink-0 text-emerald-600" />
                            <span>{nikAutoInfo}</span>
                        </div>
                    )}

                    {kkAnggotaTerdeteksi.length > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
                            <p className="font-bold text-blue-900 flex items-center gap-1.5">
                                <Users size={14} /> Anggota Keluarga Terdaftar di KK Ini ({kkAnggotaTerdeteksi.length} orang):
                            </p>
                            <ul className="space-y-1 text-blue-800">
                                {kkAnggotaTerdeteksi.map((a) => (
                                    <li key={a.id} className="flex justify-between">
                                        <span>• {a.nama} ({a.hubungan_keluarga})</span>
                                        <span className="font-mono text-[11px]">{a.nik}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nama" className="block text-sm font-medium text-text-main mb-1">Nama Lengkap (Sesuai KTP)</label>
                            <input id="nama" type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="hubungan_keluarga" className="block text-sm font-medium text-text-main mb-1">Status dalam Keluarga</label>
                            <select id="hubungan_keluarga" value={hubunganKeluarga} onChange={(e) => setHubunganKeluarga(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                                <option value="Kepala Keluarga">Kepala Keluarga</option>
                                <option value="Istri">Istri</option>
                                <option value="Anak">Anak</option>
                                <option value="Famili Lain">Famili Lain</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="jenis_kelamin" className="block text-sm font-medium text-text-main mb-1">Jenis Kelamin</label>
                            <select id="jenis_kelamin" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white">
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tempat_lahir" className="block text-sm font-medium text-text-main mb-1">Tempat Lahir</label>
                            <input id="tempat_lahir" type="text" placeholder="Contoh: Bekasi" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-text-main mb-1">Tanggal Lahir</label>
                            <input id="tanggal_lahir" type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="blok" className="block text-sm font-medium text-text-main mb-1">Blok / Nomor Rumah</label>
                            <input id="blok" type="text" required placeholder="Contoh: A1 / No. 12" value={blok} onChange={(e) => setBlok(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-text-main mb-1">Status Hunian</label>
                            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusWarga)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
                                <option value="Tetap">Tetap</option>
                                <option value="Kontrak">Kontrak</option>
                            </select>
                        </div>
                    </div>

                    {/* Pemilih Wilayah Warga (Provinsi -> Kabupaten -> Kecamatan -> Desa -> Kode Pos -> RT/RW) */}
                    <WilayahSelector value={wilayah} onChange={setWilayah} />

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