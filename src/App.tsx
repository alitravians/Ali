import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginDialog } from './components/AdminLoginDialog';
import TrendRequestForm from './pages/TrendRequestForm';
import AdminDashboard from './pages/AdminDashboard';
import AcceptedRejectedTrends from './pages/AcceptedRejectedTrends';
import { ReactElement } from 'react';

const isAdminAuthenticated = () => {
  return !!localStorage.getItem('adminToken');
};

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  return isAdminAuthenticated() ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end py-4">
            <AdminLoginDialog />
          </div>
          <Routes>
            <Route path="/" element={<TrendRequestForm />} />
            <Route path="/trends" element={<AcceptedRejectedTrends />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
