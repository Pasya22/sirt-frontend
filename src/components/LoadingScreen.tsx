export function FullPageLoader({ text = 'Memuat Sistem Informasi RT...' }: { text?: string }) {
  return (
    <div
      className="min-h-[100dvh] bg-bg-gray flex flex-col items-center justify-center p-6 select-none"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Ring luar berputar halus */}
        <div className="w-20 h-20 rounded-3xl border-4 border-primary/15 border-t-primary animate-spin" />

        {/* Emblem tengah */}
        <div className="absolute w-14 h-14 rounded-2xl bg-primary text-white flex flex-col items-center justify-center shadow-lg shadow-primary/30">
          <span className="text-base font-extrabold tracking-tight leading-none">RT</span>
          <span className="text-[10px] font-semibold text-white/85 mt-0.5">01/08</span>
        </div>
      </div>

      <p className="text-sm font-semibold text-text-main tracking-tight">{text}</p>

      {/* Tiga titik animasi */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
      </div>
    </div>
  );
}

export function ContentLoader() {
  return (
    <div
      className="min-h-[60dvh] flex flex-col items-center justify-center p-6 select-none"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-2xl border-[3px] border-primary/15 border-t-primary animate-spin" />
        <div className="absolute w-7 h-7 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
          RT
        </div>
      </div>
      <p className="text-xs font-medium text-text-muted animate-pulse">Menyiapkan halaman...</p>
    </div>
  );
}