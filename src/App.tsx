import React, { useState } from 'react';

function App() {
  const [language, setLanguage] = useState('en');
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };
  
  return (
    <div className="App" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>
        {language === 'en' ? 'Snake City Game' : 'لعبة مدينة الثعبان'}
      </h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ textAlign: 'center' }}>
          {language === 'en' 
            ? 'The game is currently being updated. Please check back soon.' 
            : 'يتم تحديث اللعبة حاليًا. يرجى التحقق مرة أخرى قريبًا.'}
        </p>
      </div>
      
      {/* Language Toggle Button */}
      <button 
        onClick={toggleLanguage}
        style={{
          padding: '0.5rem 1rem',
          margin: '0.5rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {language === 'en' ? 'العربية' : 'English'}
      </button>
      
      {/* Device Toggle Button */}
      <button 
        style={{
          padding: '0.5rem 1rem',
          margin: '0.5rem',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {language === 'en' ? 'Toggle Device' : 'تبديل الجهاز'}
      </button>
      
      {/* Admin Access Button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        {language === 'en' ? 'Admin Dashboard' : 'لوحة تحكم الإدارة'}
      </button>
    </div>
  );
}

export default App;
