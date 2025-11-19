import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import BookMovie from './components/BookMovie'
import CheckStatus from './components/CheckStatus'
import PlatformRules from './components/PlatformRules'
import MoviePlayer from './components/MoviePlayer'
import AdminPanel from './components/AdminPanel'
import CodeLogin from './components/CodeLogin'

type Screen = 'home' | 'book' | 'status' | 'rules' | 'player' | 'admin' | 'code-login'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [sessionData, setSessionData] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const savedScreen = localStorage.getItem('cinema-sara-screen')
    const savedSession = localStorage.getItem('cinema-sara-session')
    const savedAdmin = localStorage.getItem('cinema-sara-admin')
    
    if (savedScreen) {
      setCurrentScreen(savedScreen as Screen)
    }
    if (savedSession) {
      setSessionData(JSON.parse(savedSession))
    }
    if (savedAdmin === 'true') {
      setIsAdmin(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cinema-sara-screen', currentScreen)
  }, [currentScreen])

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const handleCodeLogin = (data: any) => {
    setSessionData(data)
    localStorage.setItem('cinema-sara-session', JSON.stringify(data))
    setCurrentScreen('player')
  }

  const handleLogout = () => {
    setSessionData(null)
    setIsAdmin(false)
    localStorage.removeItem('cinema-sara-session')
    localStorage.removeItem('cinema-sara-admin')
    setCurrentScreen('home')
  }

  return (
    <div className="app-container" dir="rtl">
      {currentScreen === 'home' && (
        <HomePage 
          navigateTo={navigateTo}
        />
      )}
      {currentScreen === 'book' && (
        <BookMovie 
          navigateTo={navigateTo}
        />
      )}
      {currentScreen === 'status' && (
        <CheckStatus 
          navigateTo={navigateTo}
        />
      )}
      {currentScreen === 'rules' && (
        <PlatformRules 
          navigateTo={navigateTo}
        />
      )}
      {currentScreen === 'code-login' && (
        <CodeLogin 
          navigateTo={navigateTo}
          onLoginSuccess={handleCodeLogin}
        />
      )}
      {currentScreen === 'player' && sessionData && (
        <MoviePlayer 
          sessionData={sessionData}
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'admin' && isAdmin && (
        <AdminPanel 
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

export default App
