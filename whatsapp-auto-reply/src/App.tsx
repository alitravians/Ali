import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import RepliesList from './pages/RepliesList';
import AddEditReply from './pages/AddEditReply';
import SettingsPage from './pages/Settings';
import LogsPage from './pages/Logs';
import NotificationsPage from './pages/Notifications';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
          <div className="max-w-lg mx-auto relative">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/replies" element={<RepliesList />} />
              <Route path="/replies/new" element={<AddEditReply />} />
              <Route path="/replies/edit/:id" element={<AddEditReply />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Routes>
            <BottomNav />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App
