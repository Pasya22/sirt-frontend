import { Eye } from 'lucide-react';

export default function InfoAkses({ tampil }: { tampil: boolean }) {
    if (!tampil) return null;
    return (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 mb-4">
            <Eye size={14} aria-hidden="true" />
            Anda hanya memiliki akses lihat untuk halaman ini.
        </div>
    );
}