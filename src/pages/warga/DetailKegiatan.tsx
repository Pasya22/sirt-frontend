import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, Copy, ExternalLink, Info, MapPin, Share2, X } from 'lucide-react';
import Toast from '../../components/Toast';
import { ContentLoader } from '../../components/LoadingScreen';
import { api } from '../../lib/api';
import { formatRp } from '../../lib/format';

interface DetailKegiatanData {
  id: number;
  judul: string;
  status: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  estimasi: number;
  aktual: number;
  deskripsi: string | null;
  coverUrl: string | null;
  galeri: string[];
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.473 1.332 4.986L2 22l5.182-1.359a9.93 9.93 0 0 0 4.849 1.258h.004c5.515 0 9.968-4.453 9.968-9.969A9.914 9.914 0 0 0 19.08 4.92 9.908 9.908 0 0 0 12.031 2Zm5.816 14.273c-.246.693-1.434 1.326-1.992 1.408-.512.076-1.16.108-1.873-.118-.434-.138-.99-.322-1.703-.63-2.996-1.293-4.953-4.31-5.103-4.51-.15-.2-1.219-1.621-1.219-3.092 0-1.471.771-2.194 1.045-2.493.274-.299.598-.374.797-.374.199 0 .398.002.572.01.184.009.43-.07.673.513.249.598.847 2.069.922 2.219.075.15.125.324.025.524-.1.2-.15.324-.299.499-.15.174-.314.39-.449.524-.15.149-.306.311-.131.61.174.299.774 1.277 1.662 2.069 1.142 1.018 2.104 1.334 2.403 1.483.299.15.474.125.648-.075.175-.199.748-.872.948-1.172.199-.299.399-.249.673-.15.274.1 1.745.823 2.044.972.299.15.499.224.573.349.075.125.075.723-.171 1.416Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12Z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
  </svg>
);

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export default function WargaDetailKegiatan() {
  const { id } = useParams();
  const [kegiatan, setKegiatan] = useState<DetailKegiatanData | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (id) {
      api.get<{ data: DetailKegiatanData }>(`/public/kegiatan/${id}`).then((res) => setKegiatan(res.data.data));
    }
  }, [id]);

  if (!kegiatan) {
    return <ContentLoader />;
  }

  const tanggalLengkap = new Date(`${kegiatan.tanggal}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const shareUrl = window.location.href;
  const pesanShare = [
    `*${kegiatan.judul}* (${kegiatan.status})`,
    `RT 01 / RW 08 - Desa Sukadami`,
    ``,
    `📅 ${tanggalLengkap}, ${kegiatan.waktu} WIB`,
    `📍 ${kegiatan.lokasi}`,
    ``,
    `Lihat detail & galeri kegiatan:`,
    shareUrl,
  ].join('\n');

  const encodedText = encodeURIComponent(pesanShare);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`${kegiatan.judul} - RT 01 / RW 08`);

  const saluranSosial = [
    {
      nama: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}`,
      bg: 'bg-[#25D366] text-white',
      icon: <WhatsAppIcon />,
    },
    {
      nama: 'Instagram',
      href: 'https://www.instagram.com/',
      bg: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white',
      icon: <InstagramIcon />,
      onClick: async () => {
        await copyText(pesanShare.replace(/\*/g, ''));
        setToast({ isOpen: true, message: 'Info & tautan disalin! Silakan tempel di Instagram.' });
      },
    },
    {
      nama: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: 'bg-[#1877F2] text-white',
      icon: <FacebookIcon />,
    },
    {
      nama: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      bg: 'bg-[#0F1419] text-white',
      icon: <XIcon />,
    },
    {
      nama: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      bg: 'bg-[#26A5E4] text-white',
      icon: <TelegramIcon />,
    },
    {
      nama: 'Email',
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(pesanShare.replace(/\*/g, ''))}`,
      bg: 'bg-rose-500 text-white',
      icon: <EmailIcon />,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      setToast({ isOpen: true, message: 'Tautan kegiatan berhasil disalin!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast({ isOpen: true, message: 'Gagal menyalin tautan.' });
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: kegiatan.judul,
        text: pesanShare.replace(/\*/g, ''),
        url: shareUrl,
      });
      setIsShareOpen(false);
    } catch {
      // Pengguna membatalkan dialog share
    }
  };

  return (
    <div className="min-h-screen bg-bg-gray pb-10">
      <div className="relative h-64 w-full bg-gray-300">
        <img
          src={kegiatan.coverUrl || 'https://images.unsplash.com/photo-1593113589914-07599018dd3e?auto=format&fit=crop&q=80&w=800'}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <Link to="/kegiatan" className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30">
          <ArrowLeft size={20} />
        </Link>
        <div className="absolute bottom-6 left-6 right-6">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-wider">{kegiatan.status}</span>
          <h1 className="text-2xl font-bold text-white leading-tight">{kegiatan.judul}</h1>
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-primary mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-xs text-text-muted">Tanggal & Waktu</p>
                <p className="text-sm font-semibold text-text-main">{tanggalLengkap}, {kegiatan.waktu} WIB</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-xs text-text-muted">Lokasi</p>
                <p className="text-sm font-semibold text-text-main">{kegiatan.lokasi}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-text-muted mb-1">Estimasi Biaya</p>
              <p className="text-sm font-bold text-text-main">{formatRp(kegiatan.estimasi)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-text-muted mb-1">Biaya Aktual</p>
              <p className="text-sm font-bold text-text-main">{formatRp(kegiatan.aktual)}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-text-main mb-3 flex items-center gap-2">
            <Info size={18} className="text-primary" /> Tentang Kegiatan
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">{kegiatan.deskripsi || 'Belum ada deskripsi kegiatan.'}</p>
        </div>

        {kegiatan.galeri.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-text-main mb-3">Galeri</h2>
            <div className="grid grid-cols-3 gap-2">
              {kegiatan.galeri.map((foto, index) => (
                <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-200">
                  <img src={foto} alt={`Galeri ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="w-full bg-white border-2 border-primary text-primary font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors"
        >
          <Share2 size={18} /> Bagikan Kegiatan
        </button>
      </div>

      {/* Bottom Sheet Bagikan ke Media Sosial & Aplikasi Komunikasi */}
      {isShareOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-[1px]"
          onClick={() => setIsShareOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-text-main text-base">Bagikan Kegiatan</h3>
                <p className="text-xs text-text-muted truncate max-w-[260px]">{kegiatan.judul}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid 3x2 Logo Resmi */}
            <div className="grid grid-cols-3 gap-y-5 gap-x-3 mb-6">
              {saluranSosial.map((item) => (
                <a
                  key={item.nama}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    if (item.onClick) await item.onClick();
                    setIsShareOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${item.bg}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-text-main text-center leading-tight">{item.nama}</span>
                </a>
              ))}
            </div>

            {/* Salin Tautan */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 pl-3 mb-3">
              <p className="text-xs text-text-muted truncate flex-1">{shareUrl}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {copied ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin</>}
              </button>
            </div>

            {/* Menu Share Bawaan Perangkat */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 rounded-xl border border-gray-200 text-text-main text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={15} /> Bagikan lewat aplikasi lain di HP
              </button>
            )}
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((t) => ({ ...t, isOpen: false }))}
        message={toast.message}
      />
    </div>
  );
}