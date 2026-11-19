import { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Save,
  UploadCloud,
} from 'lucide-react';
import Toast from '../../components/Toast';
import WilayahSelector, { type WilayahValue } from '../../components/WilayahSelector';
import { api, getErrorMessage } from '../../lib/api';

interface PengaturanResponse {
  sapaan: string;
  headerImage: string;
  wilayah?: Partial<WilayahValue>;
  koordinat?: {
    latitude: number | null;
    longitude: number | null;
    radius_meter: number;
  };
}

export default function AdminPengaturan() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  const [headerImage, setHeaderImage] = useState('');
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [sapaan, setSapaan] = useState('');

  const [wilayah, setWilayah] = useState<WilayahValue>({
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    kode_pos: '',
    rt: '',
    rw: '',
  });

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeter, setRadiusMeter] = useState('1000');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<PengaturanResponse>('/admin/pengaturan').then((res) => {
      setSapaan(res.data.sapaan ?? '');
      setHeaderImage(res.data.headerImage ?? '');
      if (res.data.wilayah) {
        setWilayah({
          provinsi: res.data.wilayah.provinsi ?? '',
          kabupaten: res.data.wilayah.kabupaten ?? '',
          kecamatan: res.data.wilayah.kecamatan ?? '',
          desa: res.data.wilayah.desa ?? '',
          kode_pos: res.data.wilayah.kode_pos ?? '',
          rt: res.data.wilayah.rt ?? '',
          rw: res.data.wilayah.rw ?? '',
        });
      }
      if (res.data.koordinat) {
        setLatitude(res.data.koordinat.latitude !== null ? String(res.data.koordinat.latitude) : '');
        setLongitude(res.data.koordinat.longitude !== null ? String(res.data.koordinat.longitude) : '');
        setRadiusMeter(String(res.data.koordinat.radius_meter ?? 1000));
      }
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

  const handleAmbilKoordinat = () => {
    if (!('geolocation' in navigator)) {
      setToast({ isOpen: true, message: 'Browser tidak mendukung deteksi GPS.' });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(7));
        setLongitude(pos.coords.longitude.toFixed(7));
        setIsLocating(false);
        setToast({ isOpen: true, message: 'Titik koordinat lokasi Anda berhasil diambil!' });
      },
      () => {
        setIsLocating(false);
        setToast({ isOpen: true, message: 'Gagal mengambil lokasi. Pastikan izin GPS browser aktif.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('sapaan', sapaan);
      payload.append('rt', wilayah.rt.trim());
      payload.append('rw', wilayah.rw.trim());
      payload.append('desa', wilayah.desa.trim());
      payload.append('kode_pos', wilayah.kode_pos.trim());
      payload.append('kecamatan', wilayah.kecamatan.trim());
      payload.append('kabupaten', wilayah.kabupaten.trim());
      payload.append('provinsi', wilayah.provinsi.trim());
      if (latitude.trim()) payload.append('latitude', latitude.trim());
      if (longitude.trim()) payload.append('longitude', longitude.trim());
      if (radiusMeter.trim()) payload.append('radius_meter', radiusMeter.trim());

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

  const hasCoords = Boolean(latitude.trim() && longitude.trim());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main">Pengaturan Tampilan & Wilayah</h2>
        <p className="text-sm text-text-muted mt-1">
          Atur sambutan, gambar header, identitas wilayah administratif, dan titik GPS pusat RT/RW/Desa.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Teks Sambutan */}
        <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200/80">
          <h3 className="font-bold text-text-main mb-4 flex items-center gap-2.5 text-sm sm:text-base">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
            Teks Sambutan
          </h3>
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Kalimat Sapaan Portal Warga</label>
            <input
              type="text"
              value={sapaan}
              onChange={(e) => setSapaan(e.target.value)}
              placeholder="Selamat siang, Warga"
              className="w-full min-h-[42px] border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 2. Wilayah & Titik Koordinat GPS */}
        <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-text-main flex items-center gap-2.5 text-sm sm:text-base">
              <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
              Wilayah Resmi & Titik Koordinat Peta
            </h3>
            <button
              type="button"
              onClick={handleAmbilKoordinat}
              disabled={isLocating}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary-light text-primary hover:bg-emerald-100 text-xs font-bold transition-colors disabled:opacity-60"
            >
              {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
              {isLocating ? 'Mendeteksi GPS...' : 'Ambil Titik Lokasi Saya Sekarang'}
            </button>
          </div>

          <WilayahSelector value={wilayah} onChange={setWilayah} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Latitude (Garis Lintang)</label>
              <input
                type="text"
                placeholder="-6.3421500"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full min-h-[42px] border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Longitude (Garis Bujur)</label>
              <input
                type="text"
                placeholder="107.1458200"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full min-h-[42px] border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Radius Deteksi (Meter)</label>
              <input
                type="number"
                min={50}
                max={50000}
                step={50}
                value={radiusMeter}
                onChange={(e) => setRadiusMeter(e.target.value)}
                className="w-full min-h-[42px] border border-gray-200 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {hasCoords && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs">
              <span className="flex items-center gap-1.5 text-text-muted">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>Titik pusat wilayah aktif ({radiusMeter || 1000}m di sekitar pin)</span>
              </span>
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
              >
                <span>Cek di Google Maps</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* 3. Gambar Background Header */}
        <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-200/80">
          <h3 className="font-bold text-text-main mb-4 flex items-center gap-2.5 text-sm sm:text-base">
            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
            Gambar Background Header
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-text-main mb-2">Preview</p>
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-200">
                {headerImage ? (
                  <img src={headerImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-main mb-2">Opsi 1: Upload dari Komputer</p>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-primary/50 text-primary bg-primary-light/30 hover:bg-primary-light/60 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 transition-colors"
                >
                  <UploadCloud size={24} />
                  <span className="text-sm font-semibold">Pilih Gambar Baru</span>
                  <span className="text-[11px]">Format JPG, PNG (Maks 2MB)</span>
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-main mb-2">Opsi 2: Masukkan URL Gambar</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LinkIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={headerFile ? '' : headerImage}
                    onChange={(e) => {
                      setHeaderFile(null);
                      setHeaderImage(e.target.value);
                    }}
                    className="w-full min-h-[42px] pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary"
                    placeholder="https://example.com/gambar.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-70 transition-colors"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      <Toast isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} message={toast.message} />
    </div>
  );
}