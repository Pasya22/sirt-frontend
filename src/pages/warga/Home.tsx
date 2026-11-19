import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, LocateFixed, MapPin, Navigation, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { formatRp } from '../../lib/format';

interface WilayahInfo {
  rt?: string | null;
  rw?: string | null;
  desa?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
}

interface LokasiTerdeteksi extends WilayahInfo {
  dalamWilayahTerdaftar: boolean;
  jarakMeter: number | null;
  pesan: string;
}

interface HomeResponse {
  pengaturan: {
    sapaan: string;
    headerImage: string;
    wilayah?: WilayahInfo;
  };
  lokasiTerdeteksi?: LokasiTerdeteksi | null;
  kas: { saldoAkhir: number; masukBulanIni: number; keluarBulanIni: number };
  kegiatanTerdekat: { id: number; judul: string; tanggal: string; waktu: string; lokasi: string; status: string }[];
}

async function fallbackReverseGeocode(lat: number, lng: number): Promise<LokasiTerdeteksi | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'id' } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const addr = json?.address ?? {};

    const desa = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || null;
    const kecamatan = addr.city_district || addr.district || addr.subdistrict || null;
    const kabupaten = addr.city || addr.regency || addr.county || null;
    const provinsi = addr.state || null;

    const bagian = [desa, kecamatan ? `Kec. ${kecamatan}` : null, kabupaten, provinsi].filter(Boolean);
    if (bagian.length === 0) return null;

    return {
      dalamWilayahTerdaftar: false,
      jarakMeter: null,
      rt: null,
      rw: null,
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      pesan: `Anda berada di wilayah ${bagian.join(', ')}`,
    };
  } catch {
    return null;
  }
}

export default function WargaHome() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [fallbackLokasi, setFallbackLokasi] = useState<LokasiTerdeteksi | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'detecting' | 'granted' | 'denied'>('detecting');

  const fetchHome = useCallback(async (coords?: { lat: number; lng: number }) => {
    const res = await api.get<HomeResponse>('/public/home', {
      params: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
    });
    setData(res.data);

    // Jika backend belum mengembalikan lokasiTerdeteksi, lakukan reverse geocode langsung dari browser
    if (coords && !res.data.lokasiTerdeteksi) {
      const lokal = await fallbackReverseGeocode(coords.lat, coords.lng);
      if (lokal) setFallbackLokasi(lokal);
    } else if (res.data.lokasiTerdeteksi) {
      setFallbackLokasi(null);
    }
  }, []);

  const deteksiKoordinat = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('denied');
      fetchHome();
      return;
    }

    setGpsStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('granted');
        fetchHome({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGpsStatus('denied');
        fetchHome();
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, [fetchHome]);

  useEffect(() => {
    deteksiKoordinat();
  }, [deteksiKoordinat]);

  const headerImage =
    data?.pengaturan.headerImage ||
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800';
  const sapaan = data?.pengaturan.sapaan || 'Selamat siang, Warga';

  const lokasiAktif = data?.lokasiTerdeteksi ?? fallbackLokasi;
  const wilayahUtama = lokasiAktif ?? data?.pengaturan.wilayah;

  const judulRtRw = [
    wilayahUtama?.rt ? `RT ${wilayahUtama.rt}` : null,
    wilayahUtama?.rw ? `RW ${wilayahUtama.rw}` : null,
  ]
    .filter(Boolean)
    .join(' / ');

  const subWilayah = [
    wilayahUtama?.desa,
    wilayahUtama?.kecamatan,
    wilayahUtama?.kabupaten,
    wilayahUtama?.provinsi,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-bg-gray min-h-screen pb-24">
      <div className="relative pt-10 pb-28 px-6 rounded-b-[2.5rem] shadow-sm z-10 overflow-hidden">
        <img src={headerImage} alt="Background Desa" className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-primary/90 z-0" />

        <div className="relative z-10 text-white">
          {/* Banner Notifikasi Posisi Koordinat GPS Warga */}
          <div className="mb-4 flex items-start justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 text-xs">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin size={15} className="text-emerald-300 shrink-0 mt-0.5" />
              <p className="text-white/95 leading-relaxed">
                {gpsStatus === 'detecting' && 'Mendeteksi titik lokasi Anda...'}
                {gpsStatus === 'granted' &&
                  (lokasiAktif?.pesan || 'Lokasi GPS aktif, memuat detail wilayah...')}
                {gpsStatus === 'denied' &&
                  `Izin lokasi nonaktif • Wilayah: ${[judulRtRw, subWilayah].filter(Boolean).join(', ')}`}
              </p>
            </div>
            <button
              type="button"
              onClick={deteksiKoordinat}
              title="Perbarui titik lokasi GPS"
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white shrink-0 transition"
            >
              {gpsStatus === 'detecting' ? (
                <Navigation size={13} className="animate-pulse text-emerald-300" />
              ) : (
                <LocateFixed size={13} />
              )}
            </button>
          </div>

          <p className="text-sm text-white/80 mb-1">{sapaan}</p>
          <h2 className="text-lg font-bold mb-6 drop-shadow-md">
            {judulRtRw || wilayahUtama?.desa || 'Portal Wilayah'}
            <br />
            <span className="text-xs sm:text-sm font-normal text-white/90 leading-snug block mt-0.5">
              {subWilayah || 'Desa Sukadami, Cikarang Selatan'}
            </span>
          </h2>

          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg">
            <p className="text-sm text-white/80 mb-1">Saldo Kas</p>
            <p className="text-3xl font-bold mb-4 drop-shadow-sm">{formatRp(data?.kas.saldoAkhir ?? 0)}</p>
            <div className="flex gap-2 text-xs font-medium flex-wrap">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingUp size={14} className="text-green-400" /> Masuk: {formatRp(data?.kas.masukBulanIni ?? 0)}
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingDown size={14} className="text-red-400" /> Keluar: {formatRp(data?.kas.keluarBulanIni ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 relative z-20">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-white text-lg tracking-tight drop-shadow-md">Kegiatan Terdekat</h3>
          <Link to="/kegiatan" className="text-xs font-semibold text-primary bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-1 hover:bg-gray-50">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {(data?.kegiatanTerdekat ?? []).map((k) => {
            const d = new Date(`${k.tanggal}T00:00:00`);
            const tgl = d.toLocaleDateString('id-ID', { day: '2-digit' });
            const bln = d.toLocaleDateString('id-ID', { month: 'short' });
            const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });

            return (
              <Link to={`/kegiatan/${k.id}`} key={k.id} className="flex bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center gap-4 hover:shadow-md transition-shadow">
                <div className="bg-primary-light text-primary flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0">
                  <span className="text-lg font-bold leading-none">{tgl}</span>
                  <span className="text-[10px] font-bold mt-1 uppercase">{bln}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text-main text-sm mb-1 truncate">{k.judul}</p>
                  <p className="text-[11px] text-text-muted truncate">{hari}, {k.waktu} - {k.lokasi}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${k.status === 'Berjalan' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {k.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}