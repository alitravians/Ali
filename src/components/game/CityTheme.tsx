import React from 'react';
import { CITIES } from '../../game/constants';

interface CityThemeProps {
  cityId: number;
  language: 'en' | 'ar';
}

const CityTheme: React.FC<CityThemeProps> = ({ cityId, language }) => {
  const city = CITIES.find(c => c.id === cityId) || CITIES[0];
  
  const getCityElements = () => {
    switch (city.theme) {
      case 'desert':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-5 left-5 w-10 h-10 bg-yellow-300 rounded-full opacity-70" />
            <div className="absolute bottom-10 right-10 w-20 h-8 bg-yellow-600 rounded-sm opacity-40" />
            <div className="absolute top-1/2 left-1/4 w-16 h-6 bg-yellow-600 rounded-sm opacity-40" />
          </div>
        );
      case 'modern':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-5 left-10 w-6 h-20 bg-gray-700 opacity-60" />
            <div className="absolute top-5 left-20 w-6 h-16 bg-gray-800 opacity-60" />
            <div className="absolute top-5 right-10 w-6 h-24 bg-gray-700 opacity-60" />
            <div className="absolute bottom-5 left-1/3 w-6 h-18 bg-gray-800 opacity-60" />
          </div>
        );
      case 'luxury':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-5 right-5 w-12 h-12 bg-yellow-500 rounded-full opacity-30" />
            <div className="absolute bottom-10 left-10 w-16 h-16 bg-yellow-400 rounded-full opacity-20" />
            <div className="absolute top-1/3 left-1/3 w-8 h-8 bg-yellow-300 rounded-full opacity-30" />
          </div>
        );
      case 'ancient':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-5 left-1/4 w-20 h-20 bg-yellow-700 opacity-40 transform rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            <div className="absolute bottom-5 right-1/4 w-16 h-16 bg-yellow-700 opacity-40 transform rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
            <div className="absolute top-10 left-1/2 w-12 h-12 bg-yellow-600 opacity-30 transform -translate-x-1/2 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          </div>
        );
      case 'coastal':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-blue-400 opacity-30" />
            <div className="absolute top-10 right-10 w-12 h-8 bg-blue-200 rounded-full opacity-40" />
            <div className="absolute top-14 right-14 w-8 h-6 bg-blue-200 rounded-full opacity-40" />
            <div className="absolute top-8 right-20 w-10 h-6 bg-blue-200 rounded-full opacity-40" />
          </div>
        );
      case 'european':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-1/2 w-10 h-24 bg-gray-600 opacity-50 transform -translate-x-1/2" />
            <div className="absolute top-5 left-1/2 w-6 h-6 bg-gray-700 opacity-50 transform -translate-x-1/2 rotate-45" />
            <div className="absolute bottom-10 right-10 w-16 h-10 bg-gray-500 opacity-40" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)' }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: city.background }}>
      {getCityElements()}
      <div className="absolute top-2 left-2 text-sm font-bold text-gray-800 bg-white bg-opacity-70 px-2 py-1 rounded">
        {language === 'en' ? city.name : city.nameAr}
      </div>
    </div>
  );
};

export default CityTheme;
