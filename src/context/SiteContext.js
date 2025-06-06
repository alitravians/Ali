import React, { createContext, useContext, useState, useEffect } from 'react';

const SiteContext = createContext();

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  const [siteData, setSiteData] = useState({
    isClosed: false,
    closureReason: '',
    announcements: [],
    sections: {
      joining: 'محتوى كيفية الانضمام للوكالة',
      trends: 'محتوى كيفية طلب ترند',
      benefits: 'محتوى كيفية الاستفادة من البرنامج'
    }
  });

  const defaultData = {
    isClosed: false,
    closureReason: '',
    announcements: [],
    sections: {
      joining: 'محتوى كيفية الانضمام للوكالة',
      trends: 'محتوى كيفية طلب ترند',
      benefits: 'محتوى كيفية الاستفادة من البرنامج'
    }
  };

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('siteData');
        if (stored && stored !== 'undefined') {
          const parsedData = JSON.parse(stored);
          console.log('SiteContext - Loading from localStorage:', parsedData);
          setSiteData(parsedData);
        } else {
          console.log('SiteContext - No stored data, using defaults');
          setSiteData(defaultData);
          localStorage.setItem('siteData', JSON.stringify(defaultData));
        }
      } catch (error) {
        console.error('SiteContext - Error loading data:', error);
        setSiteData(defaultData);
        localStorage.setItem('siteData', JSON.stringify(defaultData));
      }
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'siteData' && e.newValue) {
        try {
          const newData = JSON.parse(e.newValue);
          console.log('SiteContext - Storage changed, updating:', newData);
          setSiteData(newData);
        } catch (error) {
          console.error('SiteContext - Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSiteData = (newData) => {
    console.log('SiteContext - Updating with:', newData);
    setSiteData(newData);
    localStorage.setItem('siteData', JSON.stringify(newData));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'siteData',
      newValue: JSON.stringify(newData),
      storageArea: localStorage
    }));
  };

  return (
    <SiteContext.Provider value={{ siteData, setSiteData: updateSiteData }}>
      {children}
    </SiteContext.Provider>
  );
};
