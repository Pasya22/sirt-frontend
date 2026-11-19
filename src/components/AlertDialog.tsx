import { AlertTriangle} from 'lucide-react';
import Modal from './Modal';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export default function AlertDialog({ isOpen, onClose, message, title = "Peringatan" }: AlertDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="p-4 rounded-full mb-4 bg-red-50 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <p className="text-text-main text-base mb-8 font-medium">
          {message}
        </p>
        <button 
          onClick={onClose} 
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-sm"
        >
          Mengerti
        </button>
      </div>
    </Modal>
  );
}