import { useSyncExternalStore } from 'react';
import { api, TOKEN_KEY } from './api';

export const MENU_LIST = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'warga', label: 'Data Warga' },
    { key: 'organisasi', label: 'Struktur Organisasi' },
    { key: 'kegiatan', label: 'Kegiatan' },
    { key: 'kas', label: 'Kas' },
    { key: 'iuran', label: 'Iuran' },
    { key: 'pengumuman', label: 'Pengumuman' },
    { key: 'laporan', label: 'Laporan' },
    { key: 'pengaturan', label: 'Pengaturan' },
    { key: 'pengguna', label: 'Pengguna' },
] as const;

export type MenuKey = (typeof MENU_LIST)[number]['key'];
export type Aksi = 'lihat' | 'edit' | 'hapus';
export type Izin = Record<Aksi, boolean>;
export type IzinMap = Record<MenuKey, Izin>;

export const ROLES = ['Ketua RT', 'Ketua RW', 'Sekretaris', 'Bendahara', 'Admin'] as const;
export type Role = (typeof ROLES)[number];
export type StatusPengguna = 'Aktif' | 'Nonaktif';

export interface Pengguna {
    id: number;
    nama: string;
    email: string;
    role: Role;
    rt?: string | null;
    rw?: string | null;
    desa?: string | null;
    kode_pos?: string | null;
    kecamatan?: string | null;
    kabupaten?: string | null;
    provinsi?: string | null;
    status: StatusPengguna;
    izin: IzinMap;
}

export const MENU_BISA_DIATUR = MENU_LIST.filter((m) => m.key !== 'pengguna');

const KOSONG: Izin = { lihat: false, edit: false, hapus: false };
const BACA: Izin = { lihat: true, edit: false, hapus: false };
const LIHAT_EDIT: Izin = { lihat: true, edit: true, hapus: false };
const PENUH: Izin = { lihat: true, edit: true, hapus: true };

const buatIzin = (p: Partial<Record<MenuKey, Izin>>): IzinMap =>
    Object.fromEntries(MENU_LIST.map((m) => [m.key, { ...(p[m.key] ?? KOSONG) }])) as IzinMap;

const SEMUA_PENUH = Object.fromEntries(MENU_LIST.map((m) => [m.key, PENUH])) as Record<MenuKey, Izin>;

const PRESET_KETUA: Partial<Record<MenuKey, Izin>> = {
    dashboard: BACA, warga: LIHAT_EDIT, organisasi: PENUH, kegiatan: PENUH,
    kas: BACA, iuran: BACA, pengumuman: PENUH, laporan: BACA,
    pengaturan: PENUH, pengguna: PENUH,
};

const PRESET: Record<Role, Partial<Record<MenuKey, Izin>>> = {
    'Ketua RT': PRESET_KETUA,
    'Ketua RW': PRESET_KETUA,
    Sekretaris: {
        dashboard: BACA, warga: PENUH, organisasi: PENUH, kegiatan: PENUH,
        pengumuman: PENUH, kas: BACA, laporan: BACA,
    },
    Bendahara: {
        dashboard: BACA, kegiatan: BACA, kas: PENUH, iuran: PENUH, laporan: BACA,
    },
    Admin: { ...SEMUA_PENUH, pengguna: PENUH },
};

export const izinBawaan = (role: Role): IzinMap => buatIzin(PRESET[role]);

export function toggleIzin(izin: IzinMap, menu: MenuKey, aksi: Aksi): IzinMap {
    const sekarang = izin[menu];
    const nilai = !sekarang[aksi];
    let berikut: Izin = { ...sekarang, [aksi]: nilai };
    if (aksi === 'lihat' && !nilai) berikut = { ...KOSONG };
    if (aksi !== 'lihat' && nilai) berikut.lihat = true;
    return { ...izin, [menu]: berikut };
}

export const ROLE_PREFIX: Record<Role, string> = {
    'Ketua RT': '/ketua',
    'Ketua RW': '/rw',
    Sekretaris: '/sekretaris',
    Bendahara: '/bendahara',
    Admin: '/admin',
};

const SEGMEN: Record<MenuKey, string> = {
    dashboard: '',
    warga: 'warga',
    organisasi: 'struktur',
    kegiatan: 'kegiatan',
    kas: 'kas',
    iuran: 'iuran',
    pengumuman: 'pengumuman',
    laporan: 'laporan',
    pengaturan: 'pengaturan',
    pengguna: 'pengguna',
};

export const menuPath = (role: Role, key: MenuKey): string => {
    const base = ROLE_PREFIX[role] ?? '/admin';
    return SEGMEN[key] ? `${base}/${SEGMEN[key]}` : base;
};

const USER_KEY = 'sirt.currentUser';

const bacaUser = (): Pengguna | null => {
    try {
        const raw = sessionStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as Pengguna) : null;
    } catch {
        return null;
    }
};

interface AuthState {
    currentUser: Pengguna | null;
    isHydrating: boolean;
}

let state: AuthState = {
    currentUser: bacaUser(),
    isHydrating: Boolean(sessionStorage.getItem(TOKEN_KEY)),
};

const listeners = new Set<() => void>();
const setState = (next: AuthState) => {
    state = next;
    listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function setAuthSession(token: string, user: Pengguna) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ currentUser: user, isHydrating: false });
}

export function clearAuthSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setState({ currentUser: null, isHydrating: false });
}

export async function hydrateAuth() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
        setState({ currentUser: null, isHydrating: false });
        return;
    }
    try {
        const res = await api.get<{ data: Pengguna }>('/auth/me');
        sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.data));
        setState({ currentUser: res.data.data, isHydrating: false });
    } catch {
        clearAuthSession();
    }
}

window.addEventListener('sirt:unauthorized', () => clearAuthSession());

export function useAkses() {
    const s = useSyncExternalStore(subscribe, getSnapshot);
    const { currentUser, isHydrating } = s;

    const can = (menu: MenuKey, aksi: Aksi): boolean => {
        if (!currentUser || currentUser.status !== 'Aktif') return false;
        if ((currentUser.role === 'Ketua RT' || currentUser.role === 'Ketua RW') && menu === 'pengguna') {
            return true;
        }
        return currentUser.izin?.[menu]?.[aksi] ?? false;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // abaikan jika token sudah kedaluwarsa
        } finally {
            clearAuthSession();
        }
    };

    return {
        currentUser,
        isHydrating,
        can,
        logout,
    };
}