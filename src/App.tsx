import { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import ChatRoom from './components/ChatRoom'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('user')

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
  }, [])

  const handleLogin = (token: string, username: string, role: string) => {
    localStorage.setItem('chat_token', token)
    localStorage.setItem('chat_username', username)
    localStorage.setItem('chat_role', role)
    setToken(token)
    setUsername(username)
    setUserRole(role)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('chat_token')
    localStorage.removeItem('chat_username')
    localStorage.removeItem('chat_role')
    setToken(null)
    setUsername(null)
    setUserRole('user')
    setIsAuthenticated(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <ChatRoom 
          token={token!}
          username={username!}
          userRole={userRole}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
