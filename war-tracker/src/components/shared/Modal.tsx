import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  noPadding?: boolean;
}

export default function Modal({ isOpen, onClose, title, titleIcon, children, size = 'md', noPadding = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />

      {/* Modal */}
      <div className={`relative w-full ${sizeClasses[size]} bg-[#12121a] border border-gray-700 rounded-2xl shadow-2xl shadow-black/50 animate-modalIn max-h-[90vh] sm:max-h-[85vh] flex flex-col`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              {titleIcon}
              <h2 className="text-sm font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Close button if no title */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 left-3 z-10 w-8 h-8 rounded-lg bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-3 sm:p-4'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
