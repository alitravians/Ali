import { Smartphone, Monitor } from 'lucide-react';
import { usePhoneMode } from '../../context/PhoneModeContext';

export default function PhoneModeToggle() {
  const { isPhoneMode, togglePhoneMode } = usePhoneMode();

  return (
    <button
      onClick={togglePhoneMode}
      className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 px-3 py-2.5 rounded-full shadow-lg shadow-black/30 border transition-all duration-300"
      style={{
        background: isPhoneMode
          ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
          : 'rgba(18, 18, 26, 0.95)',
        borderColor: isPhoneMode ? 'rgba(99, 102, 241, 0.5)' : 'rgba(55, 65, 81, 0.5)',
      }}
      title={isPhoneMode ? 'إلغاء وضع الهاتف' : 'تفعيل وضع الهاتف'}
      aria-label={isPhoneMode ? 'إلغاء وضع الهاتف' : 'تفعيل وضع الهاتف'}
    >
      {isPhoneMode ? (
        <>
          <Monitor className="w-4 h-4 text-white" />
          <span className="text-[11px] font-bold text-white">وضع الكمبيوتر</span>
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4 text-gray-300" />
          <span className="text-[11px] font-bold text-gray-300">وضع الهاتف</span>
        </>
      )}
    </button>
  );
}
