import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'error';
}

export default function Toast({ isOpen, onClose, message, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        type === 'success' ? 'bg-white border-primary-light text-primary' : 'bg-white border-red-100 text-red-500'
      }`}>
        {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        <p className="text-sm font-medium text-text-main">{message}</p>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}