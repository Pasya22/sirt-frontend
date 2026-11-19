import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: 'md' | 'lg' | 'xl';
    children: ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    size = 'lg',
    children,
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
            />

            {/* Dialog Box Proporsional */}
            <div
                role="dialog"
                aria-modal="true"
                className={`relative w-full ${SIZE_CLASS[size]} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92dvh] flex flex-col overflow-hidden z-10`}
            >
                {/* Header Modal */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0 bg-white">
                    <div>
                        <h3 className="text-lg font-bold text-text-main leading-snug">{title}</h3>
                        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup dialog"
                        className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-text-main hover:bg-gray-100 transition-colors shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className="px-6 py-5 overflow-y-auto overscroll-contain flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}