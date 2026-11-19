import { Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Wallet, Users } from 'lucide-react';
import { ContentLoader } from '../components/LoadingScreen';

export default function WargaLayout() {
  const location = useLocation();
  const menus = [
    { path: '/', icon: Home, label: 'Beranda' },
    { path: '/kegiatan', icon: Calendar, label: 'Kegiatan' },
    { path: '/kas', icon: Wallet, label: 'Kas' },
    { path: '/organisasi', icon: Users, label: 'Organisasi' },
  ];

  return (
    <div className="min-h-[100dvh] bg-bg-gray max-w-md mx-auto relative shadow-2xl overflow-x-hidden flex flex-col">
      <main className="flex-1 pb-24">
        <Suspense fallback={<ContentLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Navigation terkunci di dasar layar */}
      <nav
        aria-label="Navigasi Portal Warga"
        className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-md bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 transform-gpu"
      >
        {menus.map((menu) => {
          const isActive =
            location.pathname === menu.path ||
            (menu.path !== '/' && location.pathname.startsWith(menu.path));

          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`relative flex flex-col items-center justify-center text-[10px] w-16 py-1 rounded-xl transition-colors ${isActive ? 'text-primary font-bold' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-6 h-1 rounded-full bg-primary" />
              )}
              <menu.icon
                size={21}
                strokeWidth={isActive ? 2.4 : 2}
                className={`mb-1 transition-transform ${isActive ? 'scale-105 fill-primary/10' : ''}`}
              />
              {menu.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}