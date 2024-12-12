import { Routes, Route, Navigate } from 'react-router-dom';
import { Welcome } from './components/pages/welcome/Welcome';
import { Rules } from './components/pages/rules/Rules';
import { JoinModerators } from './components/pages/join-moderators/JoinModerators';
import { RequestTrend } from './components/pages/request-trend/RequestTrend';
import { Updates } from './components/pages/updates/Updates';
import { Team } from './components/pages/team/Team';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { isAdminAuthenticated } from './utils/localStorage';
import {
  AdminLogin,
  AdminDashboard,
  AdminEditRules,
  AdminEditModerators,
  AdminEditTrend,
  AdminEditCountdown,
  AdminEditTeam,
  AdminEditUpdates,
  AdminEditWelcome
} from './components/admin';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route index element={<Welcome />} />
        <Route path="rules" element={<Rules />} />
        <Route path="join-moderators" element={<JoinModerators />} />
        <Route path="request-trend" element={<RequestTrend />} />
        <Route path="updates" element={<Updates />} />
        <Route path="team" element={<Team />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="rules" element={<AdminEditRules />} />
        <Route path="join-moderators" element={<AdminEditModerators />} />
        <Route path="request-trend" element={<AdminEditTrend />} />
        <Route path="countdown" element={<AdminEditCountdown />} />
        <Route path="team" element={<AdminEditTeam />} />
        <Route path="updates" element={<AdminEditUpdates />} />
        <Route path="welcome" element={<AdminEditWelcome />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
