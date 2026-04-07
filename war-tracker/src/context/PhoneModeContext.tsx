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
      return localStorage.getItem('warscope-phone-mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('warscope-phone-mode', String(isPhoneMode));
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
