import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/pages/welcome/Welcome';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminEditCountdown from './components/admin/AdminEditCountdown';
import AdminEditTeam from './components/admin/AdminEditTeam';
import AdminEditUpdates from './components/admin/AdminEditUpdates';

const isAdminAuthenticated = () => {
  return localStorage.getItem('adminAuth') === import.meta.env.VITE_ADMIN_PASSWORD;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-countdown"
          element={
            <ProtectedRoute>
              <AdminEditCountdown />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-team"
          element={
            <ProtectedRoute>
              <AdminEditTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-updates"
          element={
            <ProtectedRoute>
              <AdminEditUpdates />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
