import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/LoginForm'
import ChatRoom from './components/ChatRoom'
import AdminPanel from './components/AdminPanel'
import BanAppealForm from './components/BanAppealForm'
import './App.css'

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth()
  const [showBanAppeal, setShowBanAppeal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    if (user?.status === 'banned') {
      setShowBanAppeal(true)
    } else {
      setShowBanAppeal(false)
    }
  }, [user])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (showBanAppeal && user?.status === 'banned') {
    return <BanAppealForm onBack={() => logout()} />
  }

  if (showAdminPanel && user?.role === 'admin') {
    return <AdminPanel onBackToChat={() => setShowAdminPanel(false)} />
  }

  return <ChatRoom onShowAdminPanel={user?.role === 'admin' ? () => setShowAdminPanel(true) : undefined} />
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <AppContent />
      </div>
    </AuthProvider>
  )
}

export default App
