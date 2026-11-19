import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAkses, type MenuKey } from '../lib/akses';

export default function AksesGuard({ menu, children }: { menu: MenuKey; children: ReactNode }) {
    const { can } = useAkses();

    if (!can(menu, 'lihat')) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <ShieldAlert size={32} className="mx-auto text-red-500 mb-3" aria-hidden="true" />
                <p className="font-bold text-text-main">Akses ditolak</p>
                <p className="text-sm text-text-muted mt-1">Anda tidak memiliki izin untuk membuka halaman ini.</p>
            </div>
        );
    }
    return <>{children}</>;
}