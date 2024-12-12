import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/pages/welcome/Welcome';
import Rules from './components/pages/rules/Rules';
import JoinModerators from './components/pages/join-moderators/JoinModerators';
import RequestTrend from './components/pages/request-trend/RequestTrend';
import Team from './components/pages/team/Team';
import Navbar from './components/layout/Navbar';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminEditCountdown from './components/admin/AdminEditCountdown';
import AdminEditTeam from './components/admin/AdminEditTeam';
import AdminEditUpdates from './components/admin/AdminEditUpdates';

const isAdminAuthenticated = () => {
  return localStorage.getItem('adminAuth') === import.meta.env.VITE_ADMIN_PASSWORD;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAdminAuthenticated() ? children : <Navigate to="admin/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-8">
          <Routes>
            <Route path="" element={<Welcome />} />
            <Route path="rules" element={<Rules />} />
            <Route path="join-moderators" element={<JoinModerators />} />
            <Route path="request-trend" element={<RequestTrend />} />
            <Route path="team" element={<Team />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/edit-countdown"
              element={
                <ProtectedRoute>
                  <AdminEditCountdown />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/edit-team"
              element={
                <ProtectedRoute>
                  <AdminEditTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/edit-updates"
              element={
                <ProtectedRoute>
                  <AdminEditUpdates />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
