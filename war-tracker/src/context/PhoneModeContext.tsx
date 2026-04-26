import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PhoneModeContextType {
  isPhoneMode: boolean;
  togglePhoneMode: () => void;
}

const PhoneModeContext = createContext<PhoneModeContextType>({
  isPhoneMode: false,
  togglePhoneMode: () => {},
});

export function PhoneModeProvider({ children }: { children: ReactNode }) {
  const [isPhoneMode, setIsPhoneMode] = useState(() => {
    try {
      const saved = localStorage.getItem('warscope-phone-mode') === 'true';
      // Auto-disable phone mode on desktop-sized viewports
      // Phone mode is only useful on actual mobile or for quick testing
      if (saved && typeof window !== 'undefined' && window.innerWidth >= 768) {
        localStorage.removeItem('warscope-phone-mode');
        return false;
      }
      return saved;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isPhoneMode) {
        localStorage.setItem('warscope-phone-mode', 'true');
      } else {
        localStorage.removeItem('warscope-phone-mode');
      }
    } catch {
      // localStorage not available
    }

    // Add/remove class on document root
    if (isPhoneMode) {
      document.documentElement.classList.add('phone-mode');
    } else {
      document.documentElement.classList.remove('phone-mode');
    }
  }, [isPhoneMode]);

  // Auto-disable phone mode if user resizes to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isPhoneMode) {
        setIsPhoneMode(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPhoneMode]);

  const togglePhoneMode = () => setIsPhoneMode(prev => !prev);

  return (
    <PhoneModeContext.Provider value={{ isPhoneMode, togglePhoneMode }}>
      {children}
    </PhoneModeContext.Provider>
  );
}

export function usePhoneMode() {
  return useContext(PhoneModeContext);
}
