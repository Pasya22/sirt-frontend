import { useCallback, useEffect, useState } from 'react';
import { Edit, Key, Loader2, MapPin, Plus, Shield, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import WilayahSelector, { type WilayahValue } from '../../components/WilayahSelector';
import {
    MENU_BISA_DIATUR, MENU_LIST, ROLES, izinBawaan, toggleIzin, useAkses,
    type Aksi, type IzinMap, type MenuKey, type Pengguna, type Role, type StatusPengguna,
} from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';
import type { SelectOption } from '../../components/SearchableSelect';
import SearchableSelect from '../../components/SearchableSelect';

interface FormState {
    nama: string;
    email: string;
    role: Role;
    status: StatusPengguna;
    password: string;
    wilayah: WilayahValue;
    izin: IzinMap;
}

const ROLE_OPTIONS: SelectOption[] = ROLES.map((r) => ({ value: r, label: r }));
const STATUS_OPTIONS: SelectOption[] = [
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Nonaktif', label: 'Nonaktif' },
];

const formKosong = (defaultWilayah?: Partial<WilayahValue>): FormState => ({
    nama: '',
    email: '',
    role: 'Sekretaris',
    status: 'Aktif',
    password: '',
    wilayah: {
        provinsi: defaultWilayah?.provinsi ?? '',
        kabupaten: defaultWilayah?.kabupaten ?? '',
        kecamatan: defaultWilayah?.kecamatan ?? '',
        desa: defaultWilayah?.desa ?? '',
        kode_pos: defaultWilayah?.kode_pos ?? '',
        rt: defaultWilayah?.rt ?? '',
        rw: defaultWilayah?.rw ?? '',
    },
    izin: izinBawaan('Sekretaris'),
});

const KOLOM: { aksi: Aksi; label: string }[] = [
    { aksi: 'lihat', label: 'Lihat' },
    { aksi: 'edit', label: 'Edit' },
    { aksi: 'hapus', label: 'Hapus' },
];

function MatriksIzin({ izin, onChange }: { izin: IzinMap; onChange: (next: IzinMap) => void }) {
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-text-muted">
                    <tr>
                        <th className="text-left font-medium px-4 py-2">Menu</th>
                        {KOLOM.map((k) => <th key={k.aksi} className="font-medium px-2 py-2 w-16 text-center">{k.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {MENU_BISA_DIATUR.map((m) => (
                        <tr key={m.key}>
                            <td className="px-4 py-2 font-medium text-text-main">{m.label}</td>
                            {KOLOM.map((k) => (
                                <td key={k.aksi} className="text-center">
                                    <input
                                        type="checkbox"
                                        checked={izin[m.key][k.aksi]}
                                        onChange={() => onChange(toggleIzin(izin, m.key as MenuKey, k.aksi))}
                                        className="w-5 h-5 accent-emerald-600 cursor-pointer"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function formatWilayahRingkas(u: Pengguna): string {
    const bagian: string[] = [];
    if (u.rt) bagian.push(`RT ${u.rt}`);
    if (u.rw) bagian.push(`RW ${u.rw}`);
    if (u.desa) bagian.push(u.desa);
    if (u.kecamatan) bagian.push(`Kec. ${u.kecamatan}`);
    if (u.kode_pos) bagian.push(u.kode_pos);
    return bagian.length > 0 ? bagian.join(', ') : '-';
}

// Kunci unik wilayah untuk membandingkan Ketua RT / Ketua RW di wilayah yang sama
const keyWilayahRt = (u: Pengguna) =>
    `${(u.desa ?? '').toLowerCase()}|${u.rw ?? ''}|${u.rt ?? ''}`;
const keyWilayahRw = (u: Pengguna) =>
    `${(u.desa ?? '').toLowerCase()}|${u.rw ?? ''}`;

export default function AdminPengguna() {
    const { currentUser, can } = useAkses();
    const bisaEdit = can('pengguna', 'edit');
    const bisaHapus = can('pengguna', 'hapus');

    const [users, setUsers] = useState<Pengguna[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Pengguna | null>(null);
    const [form, setForm] = useState<FormState>(() => formKosong());
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        message: '',
        type: 'success',
    });

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ isOpen: true, message, type });
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get<{ data: Pengguna[] }>('/admin/pengguna');
            setUsers(res.data.data);
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const visibleUsers = users.filter(
        (u) => currentUser?.role === 'Admin' || u.id !== currentUser?.id
    );

    // Hitung jumlah Ketua RT / Ketua RW aktif per masing-masing wilayah (termasuk currentUser jika tidak ada di list)
    const semuaPenggunaAktif = [
        ...visibleUsers,
        ...(currentUser && !visibleUsers.some((u) => u.id === currentUser.id) ? [currentUser] : []),
    ].filter((u) => u.status === 'Aktif');

    const cekKunciHapus = (user: Pengguna): { terkunci: boolean; alasan: string } => {
        if (user.id === currentUser?.id) {
            return { terkunci: true, alasan: 'Akun sendiri tidak bisa dihapus' };
        }
        if (user.role === 'Ketua RT' && user.status === 'Aktif') {
            const jumlahDiRtSama = semuaPenggunaAktif.filter(
                (u) => u.role === 'Ketua RT' && keyWilayahRt(u) === keyWilayahRt(user)
            ).length;
            if (jumlahDiRtSama <= 1) {
                return { terkunci: true, alasan: 'Ketua RT aktif terakhir di wilayah ini tidak bisa dihapus' };
            }
        }
        if (user.role === 'Ketua RW' && user.status === 'Aktif') {
            const jumlahDiRwSama = semuaPenggunaAktif.filter(
                (u) => u.role === 'Ketua RW' && keyWilayahRw(u) === keyWilayahRw(user)
            ).length;
            if (jumlahDiRwSama <= 1) {
                return { terkunci: true, alasan: 'Ketua RW aktif terakhir di wilayah ini tidak bisa dihapus' };
            }
        }
        return { terkunci: false, alasan: 'Hapus pengguna' };
    };

    const openCreate = () => {
        if (!bisaEdit) {
            showToast('Anda tidak memiliki izin untuk menambah pengguna.', 'error');
            return;
        }
        setSelectedUser(null);
        setForm(
            formKosong({
                provinsi: currentUser?.provinsi ?? '',
                kabupaten: currentUser?.kabupaten ?? '',
                kecamatan: currentUser?.kecamatan ?? '',
                desa: currentUser?.desa ?? '',
                kode_pos: currentUser?.kode_pos ?? '',
                rt: currentUser?.rt ?? '',
                rw: currentUser?.rw ?? '',
            })
        );
        setIsModalOpen(true);
    };

    const openEdit = (user: Pengguna) => {
        if (!bisaEdit) {
            showToast('Anda tidak memiliki izin untuk mengubah data pengguna.', 'error');
            return;
        }
        setSelectedUser(user);
        setForm({
            nama: user.nama,
            email: user.email,
            role: user.role,
            status: user.status,
            password: '',
            wilayah: {
                provinsi: user.provinsi ?? '',
                kabupaten: user.kabupaten ?? '',
                kecamatan: user.kecamatan ?? '',
                desa: user.desa ?? '',
                kode_pos: user.kode_pos ?? '',
                rt: user.rt ?? '',
                rw: user.rw ?? '',
            },
            izin: user.izin,
        });
        setIsModalOpen(true);
    };

    const ubahRole = (role: Role) =>
        setForm((f) => ({
            ...f,
            role,
            wilayah: role === 'Ketua RW' ? { ...f.wilayah, rt: '' } : f.wilayah,
            izin: izinBawaan(role),
        }));

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!bisaEdit) {
            showToast('Anda tidak memiliki izin untuk mengubah data pengguna.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                nama: form.nama.trim(),
                email: form.email.trim(),
                role: form.role,
                rt: form.wilayah.rt.trim() || null,
                rw: form.wilayah.rw.trim() || null,
                desa: form.wilayah.desa.trim() || null,
                kode_pos: form.wilayah.kode_pos.trim() || null,
                kecamatan: form.wilayah.kecamatan.trim() || null,
                kabupaten: form.wilayah.kabupaten.trim() || null,
                provinsi: form.wilayah.provinsi.trim() || null,
                status: form.status,
                password: form.password || undefined,
                izin: form.izin,
            };

            if (selectedUser) {
                await api.put(`/admin/pengguna/${selectedUser.id}`, payload);
            } else {
                await api.post('/admin/pengguna', payload);
            }
            await fetchUsers();
            setIsModalOpen(false);
            showToast('Data pengguna berhasil disimpan!', 'success');
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!bisaHapus || deleteId === null) return;
        try {
            await api.delete(`/admin/pengguna/${deleteId}`);
            await fetchUsers();
            showToast('Pengguna dihapus.', 'success');
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const jumlahMenu = (u: Pengguna) => MENU_LIST.filter((m) => u.izin?.[m.key]?.lihat).length;
    const tampilAksi = bisaEdit || bisaHapus;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-main">Pengguna Admin</h2>
                    <p className="text-sm text-text-muted mt-1">Atur akun pengurus, wilayah tugas (RT/RW/Desa), dan hak akses menu.</p>
                </div>
                {bisaEdit && (
                    <button type="button" onClick={openCreate} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px]">
                        <Plus size={16} /> Tambah Pengguna
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-main">
                    <thead className="text-text-muted border-b border-gray-200">
                        <tr>
                            <th className="pb-3 font-medium">Nama</th>
                            <th className="pb-3 font-medium">Role & Wilayah</th>
                            <th className="pb-3 font-medium">Akses menu</th>
                            <th className="pb-3 font-medium">Status</th>
                            {tampilAksi && <th className="pb-3 font-medium text-right">Aksi</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visibleUsers.length === 0 && (
                            <tr>
                                <td colSpan={tampilAksi ? 5 : 4} className="py-10 text-center text-text-muted">
                                    Belum ada pengguna lain.
                                </td>
                            </tr>
                        )}
                        {visibleUsers.map((user) => {
                            const diriSendiri = user.id === currentUser?.id;
                            const { terkunci: hapusDikunci, alasan: alasanHapus } = cekKunciHapus(user);
                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="py-4 font-medium">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">{user.nama.charAt(0)}</div>
                                            <div>
                                                <p className="font-semibold text-text-main">
                                                    {user.nama} {diriSendiri && <span className="text-xs text-text-muted font-normal">(Anda)</span>}
                                                </p>
                                                <p className="text-xs text-text-muted">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className="flex items-center gap-1.5 font-medium"><Shield size={14} className="text-primary" /> {user.role}</span>
                                        <span className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                                            <MapPin size={12} className="shrink-0" /> {formatWilayahRingkas(user)}
                                        </span>
                                    </td>
                                    <td className="py-4 text-text-muted">{jumlahMenu(user)} dari {MENU_LIST.length} menu</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status === 'Aktif' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}>{user.status}</span>
                                    </td>
                                    {tampilAksi && (
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {bisaEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(user)}
                                                        title="Edit pengguna"
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-lg"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {bisaHapus && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteId(user.id)}
                                                        disabled={hapusDikunci}
                                                        title={alasanHapus}
                                                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isSubmitting && setIsModalOpen(false)}
                title={selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                subtitle="Atur profil akun, wilayah tugas, dan izin akses menu"
                size="lg"
            >
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nama" className="block text-xs font-semibold text-text-main mb-1.5">Nama Lengkap</label>
                            <input id="nama" type="text" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full min-h-[42px] border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-text-main mb-1.5">Email</label>
                            <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full min-h-[42px] border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SearchableSelect
                            label="Role Jabatan"
                            value={form.role}
                            options={ROLE_OPTIONS}
                            searchPlaceholder="Cari role..."
                            onChange={(val) => val && ubahRole(val as Role)}
                        />
                        <SearchableSelect
                            label="Status Akun"
                            value={form.status}
                            options={STATUS_OPTIONS}
                            searchPlaceholder="Pilih status..."
                            onChange={(val) => val && setForm({ ...form, status: val as StatusPengguna })}
                        />
                    </div>

                    {/* Pemilih Wilayah Pengurus (Provinsi -> Kabupaten -> Kecamatan -> Desa -> Kode Pos -> RT/RW) */}
                    <WilayahSelector
                        value={form.wilayah}
                        onChange={(wilayah) => setForm({ ...form, wilayah })}
                    />

                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold text-text-main mb-1.5">{selectedUser ? 'Ganti Password (Opsional)' : 'Password'}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Key size={16} className="text-gray-400" /></div>
                            <input id="password" type="password" minLength={8} required={!selectedUser} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full min-h-[42px] pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" placeholder="Minimal 8 karakter" />
                        </div>
                    </div>

                    <div>
                        <p className="block text-xs font-semibold text-text-main mb-1.5">Menu dan Izin Akses</p>
                        <MatriksIzin izin={form.izin} onChange={(izin) => setForm({ ...form, izin })} />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-xl">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm flex items-center gap-2">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {isSubmitting ? 'Menyimpan...' : selectedUser ? 'Simpan Perubahan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={bisaHapus && deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} message="Akun pengguna ini akan dihapus permanen." />
            <Toast
                isOpen={toast.isOpen}
                onClose={() => setToast((t) => ({ ...t, isOpen: false }))}
                message={toast.message}
                type={toast.type}
            />
        </div>
    );
}