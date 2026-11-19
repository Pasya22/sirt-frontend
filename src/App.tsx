import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AksesGuard from './components/AksesGuard';
import RequireLogin from './components/RequireLogin';
import { FullPageLoader } from './components/LoadingScreen';
import { MENU_LIST, ROLE_PREFIX, hydrateAuth, menuPath, useAkses, type MenuKey } from './lib/akses';
// Layout dimuat langsung karena selalu dipakai
import WargaLayout from './layouts/WargaLayout';
import AdminLayout from './layouts/AdminLayout';

// Halaman dimuat saat dibuka (lazy), supaya bundle awal ringan di HP warga
const NotFound = lazy(() => import('./pages/NotFound'));

const WargaHome = lazy(() => import('./pages/warga/Home'));
const WargaKas = lazy(() => import('./pages/warga/Kas'));
const WargaKegiatan = lazy(() => import('./pages/warga/Kegiatan'));
const WargaDetailKegiatan = lazy(() => import('./pages/warga/DetailKegiatan'));
const WargaOrganisasi = lazy(() => import('./pages/warga/Organisasi'));

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminDataWarga = lazy(() => import('./pages/admin/DataWarga'));
const AdminKelolaStruktur = lazy(() => import('./pages/admin/KelolaStruktur'));
const AdminKas = lazy(() => import('./pages/admin/Kas'));
const AdminIuran = lazy(() => import('./pages/admin/Iuran'));
const AdminKegiatan = lazy(() => import('./pages/admin/Kegiatan'));
const AdminPengumuman = lazy(() => import('./pages/admin/Pengumuman'));
const AdminLaporan = lazy(() => import('./pages/admin/Laporan'));
const AdminPengguna = lazy(() => import('./pages/admin/Pengguna'));
const AdminPengaturan = lazy(() => import('./pages/admin/Pengaturan'));

const PREFIXES = Object.values(ROLE_PREFIX);

/** Bungkus halaman panel dengan pengecekan izin Lihat */
const guard = (menu: MenuKey, page: ReactNode) => <AksesGuard menu={menu}>{page}</AksesGuard>;

/** Halaman awal panel: Dashboard bila boleh, kalau tidak ke menu pertama yang boleh dibuka */
function PanelIndex() {
  const { currentUser, can } = useAkses();
  if (!currentUser) return null;
  if (can('dashboard', 'lihat')) return <AdminDashboard />;

  const pertama = MENU_LIST.find((m) => can(m.key, 'lihat'));
  if (pertama) return <Navigate to={menuPath(currentUser.role, pertama.key)} replace />;

  return guard('dashboard', null);
}

function App() {
  const { isHydrating } = useAkses();

  useEffect(() => {
    hydrateAuth();
  }, []);

  if (isHydrating) {
    return <FullPageLoader text="Memeriksa sesi pengguna..." />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          {/* Portal warga: publik, tanpa login */}
          <Route path="/" element={<WargaLayout />}>
            <Route index element={<WargaHome />} />
            <Route path="kas" element={<WargaKas />} />
            <Route path="kegiatan" element={<WargaKegiatan />} />
            <Route path="kegiatan/:id" element={<WargaDetailKegiatan />} />
            <Route path="organisasi" element={<WargaOrganisasi />} />
          </Route>

          {/* Panel pengurus: tiap role punya awalan alamat sendiri, isinya sama, dijaga izin per menu */}
          {PREFIXES.map((prefix) => (
            <Route key={prefix} path={prefix} element={<RequireLogin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<PanelIndex />} />
                <Route path="warga" element={guard('warga', <AdminDataWarga />)} />
                <Route path="struktur" element={guard('organisasi', <AdminKelolaStruktur />)} />
                <Route path="kegiatan" element={guard('kegiatan', <AdminKegiatan />)} />
                <Route path="kas" element={guard('kas', <AdminKas />)} />
                <Route path="iuran" element={guard('iuran', <AdminIuran />)} />
                <Route path="pengumuman" element={guard('pengumuman', <AdminPengumuman />)} />
                <Route path="laporan" element={guard('laporan', <AdminLaporan />)} />
                <Route path="pengaturan" element={guard('pengaturan', <AdminPengaturan />)} />
                <Route path="pengguna" element={guard('pengguna', <AdminPengguna />)} />
              </Route>
            </Route>
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;