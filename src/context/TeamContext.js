import React, { createContext, useContext, useState, useEffect } from 'react';

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  const [teamSections, setTeamSections] = useState(() => {
    console.log('TeamContext - Initializing with default sections');
    
    const savedSections = localStorage.getItem('teamSections');
    if (savedSections) {
      try {
        const parsed = JSON.parse(savedSections);
        console.log('TeamContext - Loaded from localStorage:', parsed);
        return parsed;
      } catch (error) {
        console.error('TeamContext - Error parsing localStorage data:', error);
      }
    }
    
    return [
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
  });
  
  console.log('TeamProvider initialized with sections:', teamSections);

  useEffect(() => {
    console.log('TeamProvider state updated:', teamSections);
    console.log('TeamProvider - Total sections:', teamSections.length);
    teamSections.forEach((section, index) => {
      console.log(`Section ${index + 1}: ${section.name} - ${section.members.length} members`);
    });
  }, [teamSections]);

  useEffect(() => {
    try {
      localStorage.setItem('teamSections', JSON.stringify(teamSections));
      console.log('TeamContext - Saved to localStorage:', teamSections);
    } catch (error) {
      console.error('TeamContext - Error saving to localStorage:', error);
    }
  }, [teamSections]);

  return (
    <TeamContext.Provider value={{ teamSections, setTeamSections }}>
      {children}
    </TeamContext.Provider>
  );
};
