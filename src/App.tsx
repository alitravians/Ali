import { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import RegistrationForm from './components/RegistrationForm'
import ChatRoom from './components/ChatRoom'
import MaintenancePage from './components/MaintenancePage'
import BanAppealForm from './components/BanAppealForm'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [showBanAppeal, setShowBanAppeal] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [banInfo, setBanInfo] = useState<{reason: string, duration?: number, banUntil?: string} | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('chat_token')
    const savedUsername = localStorage.getItem('chat_username')
    const savedRole = localStorage.getItem('chat_role')
    
    if (savedToken && savedUsername) {
      setToken(savedToken)
      setUsername(savedUsername)
      setUserRole(savedRole || 'user')
      setIsAuthenticated(true)
    }

    checkMaintenanceStatus()
  }, [])

  const checkMaintenanceStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/settings`)
      if (response.ok) {
        const data = await response.json()
        setMaintenanceMode(data.settings?.maintenance_mode || false)
        setMaintenanceMessage(data.settings?.maintenance_message || '')
      }
    } catch (error) {
      console.log('Could not check maintenance status')
    }
  }

  const handleLogin = (token: string, username: string, role: string) => {
    localStorage.setItem('chat_token', token)
    localStorage.setItem('chat_username', username)
    localStorage.setItem('chat_role', role)
    setToken(token)
    setUsername(username)
    setUserRole(role)
    setIsAuthenticated(true)
    setShowRegistration(false)
    setShowBanAppeal(false)
    setBanInfo(null)
  }

  const handleBanError = (banReason: string, banDuration?: number, banUntil?: string, userToken?: string) => {
    setBanInfo({ reason: banReason, duration: banDuration, banUntil })
    setToken(userToken || null)
    setShowBanAppeal(true)
    setShowRegistration(false)
  }

  const handleRegistrationSuccess = (token: string, username: string, role: string, userId: string) => {
    localStorage.setItem('chat_token', token)
    localStorage.setItem('chat_username', username)
    localStorage.setItem('chat_role', role)
    localStorage.setItem('chat_user_id', userId)
    setToken(token)
    setUsername(username)
    setUserRole(role)
    setIsAuthenticated(true)
    setShowRegistration(false)
  }

  const handleShowRegistration = () => {
    setShowRegistration(true)
  }

  const handleBackToLogin = () => {
    setShowRegistration(false)
    setShowBanAppeal(false)
    setBanInfo(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('chat_token')
    localStorage.removeItem('chat_username')
    localStorage.removeItem('chat_role')
    setToken(null)
    setUsername(null)
    setUserRole('user')
    setIsAuthenticated(false)
    setShowBanAppeal(false)
    setBanInfo(null)
  }

  if (maintenanceMode && userRole !== 'admin') {
    return <MaintenancePage message={maintenanceMessage} />
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        showBanAppeal ? (
          <BanAppealForm 
            token={token || ''}
            banReason={banInfo?.reason || ''}
            banDuration={banInfo?.duration}
            banUntil={banInfo?.banUntil}
            onLogout={handleLogout}
          />
        ) : showRegistration ? (
          <RegistrationForm 
            onRegistrationSuccess={handleRegistrationSuccess}
            onBackToLogin={handleBackToLogin}
          />
        ) : (
          <LoginForm 
            onLogin={handleLogin} 
            onShowRegistration={handleShowRegistration}
            onBanError={handleBanError}
          />
        )
      ) : (
        <ChatRoom 
          token={token!}
          username={username!}
          userRole={userRole}
          onLogout={handleLogout}
          onMaintenanceUpdate={(mode: boolean, message: string) => {
            setMaintenanceMode(mode)
            setMaintenanceMessage(message)
          }}
        />
      )}
    </div>
  )
}

export default App
