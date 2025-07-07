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

  useEffect(() => {
    if (user?.status === 'banned') {
      setShowBanAppeal(true)
    }
  }, [user])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  if (showBanAppeal && user?.status === 'banned') {
    return <BanAppealForm onBack={() => logout()} />
  }

  if (user?.role === 'admin') {
    return <AdminPanel />
  }

  return <ChatRoom />
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
