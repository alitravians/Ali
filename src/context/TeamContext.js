import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '../firebase';

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  const [teamSections, setTeamSections] = useState([]);

  const defaultSections = [
    {
      id: 1,
      name: 'الإدارة العامة',
      members: [
        {
          id: 1,
          name: 'أحمد محمد',
          role: 'مدير عام',
          avatar: 'https://via.placeholder.com/80x80/007bff/ffffff?text=AM'
        },
        {
          id: 2,
          name: 'فاطمة علي',
          role: 'مديرة المحتوى',
          avatar: 'https://via.placeholder.com/80x80/28a745/ffffff?text=FA'
        }
      ]
    },
    {
      id: 2,
      name: 'القسم التقني',
      members: [
        {
          id: 3,
          name: 'محمد سالم',
          role: 'مطور تقني',
          avatar: 'https://via.placeholder.com/80x80/dc3545/ffffff?text=MS'
        },
        {
          id: 4,
          name: 'نورا حسن',
          role: 'مصممة جرافيك',
          avatar: 'https://via.placeholder.com/80x80/ffc107/ffffff?text=NH'
        }
      ]
    },
    {
      id: 3,
      name: 'قسم التسويق',
      members: [
        {
          id: 5,
          name: 'سارة أحمد',
          role: 'مديرة التسويق',
          avatar: 'https://via.placeholder.com/80x80/6f42c1/ffffff?text=SA'
        }
      ]
    },
    {
      id: 4,
      name: 'قسم خدمة العملاء',
      members: [
        {
          id: 6,
          name: 'عمر خالد',
          role: 'مسؤول خدمة العملاء',
          avatar: 'https://via.placeholder.com/80x80/fd7e14/ffffff?text=OK'
        }
      ]
    }
  ];

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('teamSections');
        if (stored) {
          const parsedData = JSON.parse(stored);
          console.log('TeamContext - Loading from localStorage:', parsedData);
          setTeamSections(parsedData);
        } else {
          console.log('TeamContext - No stored data, using defaults');
          setTeamSections(defaultSections);
          localStorage.setItem('teamSections', JSON.stringify(defaultSections));
        }
      } catch (error) {
        console.error('TeamContext - Error loading data:', error);
        setTeamSections(defaultSections);
      }
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'teamSections' && e.newValue) {
        try {
          const newData = JSON.parse(e.newValue);
          console.log('TeamContext - Storage changed, updating:', newData);
          setTeamSections(newData);
        } catch (error) {
          console.error('TeamContext - Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateTeamSections = (newSections) => {
    console.log('TeamContext - Updating with:', newSections);
    setTeamSections(newSections);
    localStorage.setItem('teamSections', JSON.stringify(newSections));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'teamSections',
      newValue: JSON.stringify(newSections),
      storageArea: localStorage
    }));
  };

  return (
    <TeamContext.Provider value={{ teamSections, setTeamSections: updateTeamSections }}>
      {children}
    </TeamContext.Provider>
  );
};
