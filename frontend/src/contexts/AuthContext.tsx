import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storageManager } from '../utils/storage'

interface User {
  user_id: string
  username: string
  role: string
  status?: string
  ban_reason?: string
  banned_until?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      await storageManager.initDB()
      
      let rawToken = localStorage.getItem('token') || localStorage.getItem('chat_token')
      const rawUserData = localStorage.getItem('userData') || localStorage.getItem('chat_user')
      
      console.log('AuthContext: Raw token from storage:', rawToken)
      console.log('AuthContext: Raw userData from storage:', rawUserData)
      
      if (rawToken && rawUserData) {
        try {
          let cleanToken = rawToken
          
          if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
            cleanToken = JSON.parse(rawToken)
          }
          
          if (cleanToken && typeof cleanToken === 'string') {
            if (!cleanToken.startsWith('eyJ')) {
              try {
                cleanToken = atob(cleanToken)
                console.log('AuthContext: Decoded base64 token')
              } catch (e) {
                console.log('AuthContext: Token is not base64 encoded, using as-is')
              }
            }
            
            if (cleanToken.startsWith('eyJ')) {
              console.log('AuthContext: Valid JWT token found')
            } else {
              console.log('AuthContext: Token format may be non-standard, proceeding anyway')
            }
          }
          
          console.log('AuthContext: Processed token:', cleanToken)
          
          let parsedUser
          if (typeof rawUserData === 'string') {
            if (rawUserData.startsWith('"') && rawUserData.endsWith('"')) {
              parsedUser = JSON.parse(JSON.parse(rawUserData))
            } else {
              parsedUser = JSON.parse(rawUserData)
            }
          } else {
            parsedUser = rawUserData
          }
          console.log('AuthContext: Parsed user:', parsedUser)
          
          try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://still-fire-2018.fly.dev'
            const statusResponse = await fetch(`${API_BASE_URL}/auth/status`, {
              headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (statusResponse.ok) {
              const currentStatus = await statusResponse.json()
              parsedUser = {
                ...parsedUser,
                status: currentStatus.status,
                ban_reason: currentStatus.ban_reason,
                banned_until: currentStatus.banned_until
              }
              console.log('AuthContext: Updated user status from server:', parsedUser)
            }
          } catch (statusError) {
            console.warn('AuthContext: Could not check user status with server:', statusError)
          }
          
          setToken(cleanToken)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          localStorage.setItem('token', cleanToken)
          localStorage.setItem('userData', JSON.stringify(parsedUser))
          
          storageManager.setSecureItem('token', cleanToken)
          storageManager.setSecureItem('user', parsedUser)
          await storageManager.syncData()
        } catch (error) {
          console.error('Token processing failed:', error)
          localStorage.removeItem('chat_token')
          localStorage.removeItem('chat_user')
          localStorage.removeItem('token')
          localStorage.removeItem('userData')
          storageManager.clearCache()
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userData') {
        console.log('AuthContext: localStorage changed externally, reinitializing...')
        initializeAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    initializeAuth()
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const login = async (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userData', JSON.stringify(newUser))
    
    localStorage.setItem('chat_token', JSON.stringify(newToken))
    localStorage.setItem('chat_user', JSON.stringify(newUser))
    
    storageManager.setSecureItem('token', newToken)
    storageManager.setSecureItem('user', newUser)
    
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
    
    storageManager.storeInIndexedDB('users', newUser).catch(error => {
      console.warn('IndexedDB storage failed, but login completed:', error)
    })
  }

  const logout = () => {
    localStorage.removeItem('chat_token')
    localStorage.removeItem('chat_user')
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    
    storageManager.clearCache()
    
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
