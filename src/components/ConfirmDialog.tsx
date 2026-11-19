import { AlertTriangle, Loader2, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    message: string;
    confirmLabel?: string;
    loadingLabel?: string;
    variant?: 'danger' | 'primary';
}

const VARIANT_STYLES = {
    danger: {
        iconWrap: 'bg-red-50 text-red-500',
        button: 'bg-red-500 hover:bg-red-600',
        Icon: Trash2,
    },
    primary: {
        iconWrap: 'bg-primary-light text-primary',
        button: 'bg-primary hover:bg-primary-dark',
        Icon: Send,
    },
} as const;

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi Hapus',
    message,
    confirmLabel = 'Ya, Hapus',
    loadingLabel = 'Menghapus...',
    variant = 'danger',
}: ConfirmDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { iconWrap, button, Icon } = VARIANT_STYLES[variant];

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    // Dialog tidak bisa ditutup saat proses berjalan
    const handleClose = () => {
        if (!isLoading) onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title}>
            <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className={`p-4 rounded-full mb-4 ${iconWrap}`}>
                    <AlertTriangle size={32} />
                </div>
                <p className="text-text-main text-base mb-2 font-medium">Apakah Anda yakin?</p>
                <p className="text-sm text-text-muted mb-8">{message}</p>

                <div className="flex gap-3 w-full">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 ${button}`}
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                        {isLoading ? loadingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}