import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 text-center bg-slate-50">
            <div className="w-20 h-20 rounded-3xl bg-primary-light text-primary text-2xl font-extrabold flex items-center justify-center">404</div>
            <h1 className="text-2xl font-bold text-text-main">Halaman tidak ditemukan</h1>
            <p className="text-sm text-text-muted">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
            <Link to="/" className="mt-3 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold">
                Kembali ke Beranda
            </Link>
        </div>
    );
}