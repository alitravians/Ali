import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/UserContext';
// Language selector removed - Arabic only
import { LoginForm } from './components/LoginForm';
import { VisitorSupportPage } from './components/VisitorSupportPage';
import { TutorialPreview } from './components/TutorialPreview';
import { TicketList } from './components/TicketList';
import { CreateTicket } from './components/CreateTicket';
import { TicketDetail } from './components/TicketDetail';
import { AdminPanel } from './components/AdminPanel';
import './App.css';

function NavBar() {
  const { user, isAdmin } = useUser();
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">نظام الدعم الفني</h1>
            </div>
            {user && (
              <>
                <Link to="/tickets" className="text-gray-700 hover:text-gray-900">التذاكر</Link>
                {isAdmin && (
                  <Link to="/admin" className="text-gray-700 hover:text-gray-900">لوحة التحكم</Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <NavBar />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/tutorial-preview" element={<TutorialPreview />} />
                <Route path="/" element={<VisitorSupportPage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/new"
                  element={
                    <ProtectedRoute>
                      <CreateTicket />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tickets/:id"
                  element={
                    <ProtectedRoute>
                      <TicketDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </Router>
      </LanguageProvider>
    </UserProvider>
  )
}

export default App
