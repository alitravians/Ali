import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/rtl.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="maintenance-container">
          <h1>تطبيق الدردشة قيد الصيانة</h1>
          <p>نعمل على تحسين التطبيق وإصلاح المشاكل. سيكون متاحًا قريبًا.</p>
          <div className="maintenance-countdown">
            يرجى المحاولة مرة أخرى لاحقًا
          </div>
          <p>نعتذر عن الإزعاج ونشكركم على صبركم.</p>
        </div>
      </div>
    </Router>
  );
}

export default App;
