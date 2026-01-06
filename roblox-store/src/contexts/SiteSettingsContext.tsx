import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { subscribeSiteSettings } from '../services/firebase';
import type { SiteSettings } from '../types';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time settings updates from Firebase only
    const unsubscribe = subscribeSiteSettings((data) => {
      setSettings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
