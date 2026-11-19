import { Suspense, useEffect, useState, type ComponentType } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Banknote,
    Calendar,
    Clock,
    ExternalLink,
    FileText,
    LayoutDashboard,
    LogOut,
    MapPin,
    Megaphone,
    Menu,
    Network,
    Settings,
    UserCog,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { ContentLoader } from '../components/LoadingScreen';
import { MENU_LIST, menuPath, useAkses, type MenuKey } from '../lib/akses';

const MENU_ICONS: Record<MenuKey, ComponentType<{ size?: number; className?: string }>> = {
    dashboard: LayoutDashboard,
    warga: Users,
    organisasi: Network,
    kegiatan: Calendar,
    kas: Wallet,
    iuran: Banknote,
    pengumuman: Megaphone,
    laporan: FileText,
    pengaturan: Settings,
    pengguna: UserCog,
};

const BOTTOM_BAR_KEYS: MenuKey[] = ['dashboard', 'warga', 'organisasi', 'kegiatan', 'iuran'];

const BOTTOM_SHORT_LABELS: Partial<Record<MenuKey, string>> = {
    warga: 'Warga',
    organisasi: 'Struktur',
};

export default function AdminLayout() {
    const { currentUser, can, logout } = useAkses();
    const location = useLocation();
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [now, setNow] = useState(() => new Date());

    // Perbarui jam real-time setiap detik untuk header desktop
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Tutup drawer otomatis saat berpindah halaman
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    // Kunci scroll latar belakang & dukung tombol Escape saat drawer terbuka
    useEffect(() => {
        if (!isDrawerOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsDrawerOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDrawerOpen]);

    if (!currentUser) return null;

    const allowedMenus = MENU_LIST.filter((m) => can(m.key, 'lihat')).map((m) => ({
        ...m,
        path: menuPath(currentUser.role, m.key),
        Icon: MENU_ICONS[m.key],
    }));

    const isMenuActive = (key: MenuKey, path: string) => {
        if (key === 'dashboard') {
            return location.pathname === path || location.pathname === `${path}/`;
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const activeMenu = allowedMenus.find((m) => isMenuActive(m.key, m.path));
    const pageTitle = activeMenu?.label ?? 'Panel Pengurus';

    // Hanya tampilkan 5 menu utama (sesuai hak akses) di bottom bar mobile
    const mobileBottomMenus = BOTTOM_BAR_KEYS.map((key) => allowedMenus.find((m) => m.key === key))
        .filter((m): m is (typeof allowedMenus)[number] => Boolean(m))
        .map((m) => ({
            ...m,
            shortLabel: BOTTOM_SHORT_LABELS[m.key] ?? m.label,
        }));

    // Sembunyikan menu yang sudah tampil di bottom bar dari drawer hamburger
    const bottomKeySet = new Set(mobileBottomMenus.map((m) => m.key));
    const drawerMenus = allowedMenus.filter((m) => !bottomKeySet.has(m.key));

    const inisialUser = currentUser.nama
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s.charAt(0).toUpperCase())
        .join('');

    const tanggalSekarang = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const waktuSekarang = now
        .toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
        .replace(/\./g, ':');

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-[100dvh] bg-bg-gray flex flex-col lg:flex-row overflow-x-clip">
            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-30">
                <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                        RT
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-text-main text-sm leading-tight truncate">SIRT 01 / 08</p>
                        <p className="text-[11px] text-text-muted truncate">Panel Pengurus</p>
                    </div>
                </div>

                <nav aria-label="Menu Panel Desktop" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {allowedMenus.map(({ key, label, path, Icon }) => {
                        const active = isMenuActive(key, path);
                        return (
                            <Link
                                key={key}
                                to={path}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-text-muted hover:bg-gray-100 hover:text-text-main'
                                    }`}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span className="truncate">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-gray-100 space-y-2 shrink-0">
                    <Link
                        to="/"
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-text-muted hover:bg-gray-100 hover:text-text-main transition-colors"
                    >
                        <span>Lihat Portal Warga</span>
                        <ExternalLink size={14} />
                    </Link>

                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {inisialUser}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-text-main truncate">{currentUser.nama}</p>
                            <p className="text-[11px] text-text-muted truncate">{currentUser.role}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Keluar"
                            className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Kolom Konten Utama */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
                {/* Top Bar Mobile & Desktop */}
                <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(true)}
                            aria-label="Buka menu lainnya"
                            aria-expanded={isDrawerOpen}
                            className="lg:hidden relative p-2 -ml-2 rounded-xl text-text-main hover:bg-gray-100 active:scale-95 transition"
                        >
                            <Menu size={22} />
                            {drawerMenus.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-white" />
                            )}
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-text-main truncate">{pageTitle}</h1>
                            <p className="text-[11px] text-text-muted lg:hidden truncate">
                                {currentUser.role} • {currentUser.nama}
                            </p>
                        </div>
                    </div>

                    {/* Info Tempat, Tanggal & Waktu (Khusus Desktop) */}
                    <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs text-text-muted shrink-0">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text-main">
                            <MapPin size={14} className="text-primary shrink-0" />
                            <span>RT 01/08, Desa Sukadami</span>
                        </span>
                        <span className="text-gray-300" aria-hidden="true">|</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} className="text-primary shrink-0" />
                            <span>{tanggalSekarang}</span>
                        </span>
                        <span className="text-gray-300" aria-hidden="true">|</span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-text-main tabular-nums">
                            <Clock size={14} className="text-primary shrink-0" />
                            <span>{waktuSekarang} WIB</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link
                            to="/"
                            className="hidden sm:inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-text-main hover:bg-gray-50 transition-colors"
                        >
                            <span>Portal Warga</span>
                            <ExternalLink size={13} />
                        </Link>
                        <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">
                            {currentUser.role}
                        </span>
                    </div>
                </header>

                {/* Area Konten Halaman */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
                    <Suspense fallback={<ContentLoader />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>

            {/* Bottom Navigation Bar Mobile (Khusus 5 Menu Utama) */}
            {mobileBottomMenus.length > 0 && (
                <nav
                    aria-label="Navigasi Utama Mobile"
                    className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex items-center justify-around px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 transform-gpu"
                >
                    {mobileBottomMenus.map(({ key, shortLabel, path, Icon }) => {
                        const active = isMenuActive(key, path);
                        return (
                            <Link
                                key={key}
                                to={path}
                                className={`relative flex-1 max-w-[76px] flex flex-col items-center justify-center text-[10px] py-1 rounded-xl transition-all duration-200 ${active ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {active && (
                                    <span className="absolute -top-2 w-6 h-1 rounded-full bg-primary transition-all duration-200" />
                                )}
                                <Icon
                                    size={20}
                                    className={`mb-1 transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                                />
                                <span className="truncate w-full text-center px-0.5">{shortLabel}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}

            {/* Slide-over Drawer Menu Mobile dengan Animasi Buka & Tutup */}
            <div
                aria-hidden={!isDrawerOpen}
                className={`lg:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    onClick={() => setIsDrawerOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
                />

                {/* Panel Drawer */}
                <div
                    className={`relative w-72 max-w-[82vw] bg-white h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-out will-change-transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-xs">
                                RT
                            </div>
                            <div>
                                <p className="font-bold text-text-main text-sm leading-tight">SIRT 01 / 08</p>
                                <p className="text-[11px] text-text-muted">Menu Lainnya</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsDrawerOpen(false)}
                            aria-label="Tutup menu"
                            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-text-main active:scale-95 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Kartu Profil Pengurus */}
                    <div className="px-4 py-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {inisialUser}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-text-main truncate">{currentUser.nama}</p>
                            <p className="text-xs text-primary font-medium truncate">{currentUser.role}</p>
                        </div>
                    </div>

                    {/* Menu Sisa (yang tidak tampil di bottom bar) */}
                    <nav aria-label="Menu Tambahan Pengurus" className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-1">
                        {drawerMenus.length > 0 ? (
                            <>
                                <p className="px-3.5 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                                    Administrasi & Pengaturan
                                </p>
                                {drawerMenus.map(({ key, label, path, Icon }) => {
                                    const active = isMenuActive(key, path);
                                    return (
                                        <Link
                                            key={key}
                                            to={path}
                                            tabIndex={isDrawerOpen ? 0 : -1}
                                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${active
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-text-main hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon size={18} className="shrink-0" />
                                            <span className="truncate">{label}</span>
                                        </Link>
                                    );
                                })}
                            </>
                        ) : (
                            <p className="px-3.5 py-6 text-xs text-center text-text-muted">
                                Semua menu Anda tersedia di bilah navigasi bawah.
                            </p>
                        )}
                    </nav>

                    <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-100 space-y-2 shrink-0">
                        <Link
                            to="/"
                            tabIndex={isDrawerOpen ? 0 : -1}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-text-main hover:bg-gray-50 transition-colors"
                        >
                            <span>Buka Portal Warga</span>
                            <ExternalLink size={14} />
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            tabIndex={isDrawerOpen ? 0 : -1}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={15} />
                            <span>Keluar dari Panel</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}