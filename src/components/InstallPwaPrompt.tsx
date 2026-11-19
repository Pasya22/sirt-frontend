import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa.dismissed') === '1');

  useEffect(() => {
    // Jangan tampilkan jika sudah berjalan dalam mode aplikasi (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Deteksi Safari iOS (tidak mendukung beforeinstallprompt)
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos && !dismissed) {
      setShowIosGuide(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa.dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosGuide(false);
  };

  if (dismissed || (!deferredPrompt && !showIosGuide)) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-50 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-extrabold text-xs shrink-0">
        RT
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-main">Pasang Aplikasi SIRUTAWA</p>
        {deferredPrompt ? (
          <>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Akses cepat portal warga & panel pengurus langsung dari layar utama HP Anda.
            </p>
            <button
              type="button"
              onClick={handleInstall}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors"
            >
              <Download size={14} />
              <span>Install Sekarang</span>
            </button>
          </>
        ) : (
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Di Safari iPhone/iPad: ketuk ikon <Share size={12} className="inline mx-0.5 text-primary" />{' '}
            <strong>Bagikan</strong> lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Tutup banner install"
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-text-main shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}