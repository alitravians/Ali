import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { isAdminAuthenticated, clearAdminAuth } from '@/utils/localStorage';

export function AdminLayout() {
  const isAuthenticated = isAdminAuthenticated();
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin' || location.pathname === '/admin/login';

  // Clear auth state on component mount
  useEffect(() => {
    // Only clear if not authenticated to avoid clearing during active session
    if (!isAuthenticated) {
      clearAdminAuth();
    }
  }, []);

  // If not authenticated and trying to access any admin page except login
  if (!isAuthenticated && !isLoginPage) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // If authenticated and on login page, redirect to dashboard
  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <Outlet />
      </div>
    </div>
  );
}
