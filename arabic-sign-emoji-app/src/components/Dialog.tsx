import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export default function Dialog({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-lg",
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-indigo-900 to-purple-900 border border-white/20 rounded-2xl p-5 w-full ${maxWidth} max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {(title || icon) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {icon}
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
