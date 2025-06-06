import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TeamProvider } from './context/TeamContext';
import './App.css';
import HomePage from './components/HomePage';
import AdminPanel from './components/AdminPanel';
import TeamPage from './components/TeamPage';

function App() {
  return (
    <TeamProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/team" element={<TeamPage />} />
          </Routes>
        </div>
      </Router>
    </TeamProvider>
  );
}

export default App;
