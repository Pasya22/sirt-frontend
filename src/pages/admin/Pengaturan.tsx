import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Loader2, Save, UploadCloud } from 'lucide-react';
import Toast from '../../components/Toast';
import { api, getErrorMessage } from '../../lib/api';

export default function AdminPengaturan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });
  const [headerImage, setHeaderImage] = useState('');
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [sapaan, setSapaan] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ sapaan: string; headerImage: string }>('/admin/pengaturan').then((res) => {
      setSapaan(res.data.sapaan);
      setHeaderImage(res.data.headerImage);
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeaderFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setHeaderImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('sapaan', sapaan);
      if (headerFile) {
        payload.append('headerFile', headerFile);
      } else {
        payload.append('headerImage', headerImage);
      }

      const res = await api.post<{ message: string; headerImage: string }>('/admin/pengaturan', payload);
      setHeaderImage(res.data.headerImage);
      setHeaderFile(null);
      setToast({ isOpen: true, message: res.data.message });
    } catch (err) {
      setToast({ isOpen: true, message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main">Pengaturan Tampilan</h2>
        <p className="text-sm text-text-muted mt-1">Atur gambar background dan teks sambutan yang tampil di Portal Warga.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Teks Sambutan
          </h3>
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Kalimat Sapaan</label>
            <input type="text" value={sapaan} onChange={(e) => setSapaan(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white" />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Gambar Background Header
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-text-main mb-2">Preview</p>
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-300 bg-gray-200">
                {headerImage ? <img src={headerImage} alt="Preview" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={32} /></div>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text-main mb-2">Opsi 1: Upload dari Komputer</p>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-primary/50 text-primary bg-primary-light/30 hover:bg-primary-light/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
                  <UploadCloud size={24} />
                  <span className="text-sm font-semibold">Pilih Gambar Baru</span>
                  <span className="text-[10px]">Format JPG, PNG (Maks 2MB)</span>
                </button>
              </div>

              <div>
                <p className="text-sm font-medium text-text-main mb-2">Opsi 2: Masukkan URL Gambar</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LinkIcon size={16} className="text-gray-400" /></div>
                  <input type="text" value={headerFile ? '' : headerImage} onChange={(e) => { setHeaderFile(null); setHeaderImage(e.target.value); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white" placeholder="https://example.com/gambar.jpg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-gray-100">
          <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-70">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} message={toast.message} />
    </div>
  );
}