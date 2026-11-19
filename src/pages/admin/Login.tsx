import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import Toast from '../../components/Toast';
import { ROLE_PREFIX, setAuthSession, useAkses, type Pengguna } from '../../lib/akses';
import { api, getErrorMessage } from '../../lib/api';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAkses();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success',
  });

  if (currentUser) return <Navigate to={ROLE_PREFIX[currentUser.role]} replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await api.post<{ message: string; token: string; user: Pengguna }>('/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });

      const { token, user, message } = res.data;
      setAuthSession(token, user);
      setToast({ isOpen: true, message, type: 'success' });

      const dariSebelumnya = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(dariSebelumnya ?? ROLE_PREFIX[user.role], { replace: true });
    } catch (err) {
      setToast({ isOpen: true, message: getErrorMessage(err, 'Email atau password salah!'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans relative">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 text-white max-w-md">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-lg">
            <span className="text-3xl font-bold">RT</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">Sistem Informasi RT 01 / RW 08</h1>
          <p className="text-primary-light text-lg">Desa Sukadami, Cikarang Selatan</p>
          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-sm text-white/80 italic">"Membangun lingkungan yang transparan, modern, dan gotong royong."</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-bg-gray">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-text-main mb-2">Selamat Datang Kembali</h2>
            <p className="text-text-muted text-sm">Silakan masuk ke akun admin Anda</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  placeholder="ketua@rt01.test"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-primary/30 mt-2 flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <><Loader2 size={20} className="animate-spin" /> Memverifikasi...</> : 'Masuk ke Panel'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link to="/" className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
              &larr; Kembali ke Portal Warga
            </Link>
          </div>
        </div>
      </div>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} message={toast.message} type={toast.type} />
    </div>
  );
}