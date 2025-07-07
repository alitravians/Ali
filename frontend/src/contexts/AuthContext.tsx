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
      
      let rawToken = localStorage.getItem('chat_token')
      const rawUserData = localStorage.getItem('chat_user')
      
      console.log('AuthContext: Raw token from storage:', rawToken)
      console.log('AuthContext: Raw userData from storage:', rawUserData)
      
      if (rawToken && rawUserData) {
        try {
          let cleanToken = rawToken
          
          if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
            cleanToken = JSON.parse(rawToken)
          }
          
          if (!cleanToken.startsWith('eyJ')) {
            console.error('Invalid JWT token format')
            throw new Error('Invalid token format')
          }
          
          console.log('AuthContext: Processed token:', cleanToken)
          
          const parsedUser = JSON.parse(rawUserData)
          console.log('AuthContext: Parsed user:', parsedUser)
          
          setToken(cleanToken)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          storageManager.setSecureItem('token', cleanToken)
          storageManager.setSecureItem('user', parsedUser)
          await storageManager.syncData()
        } catch (error) {
          console.error('Token processing failed:', error)
          localStorage.removeItem('chat_token')
          localStorage.removeItem('chat_user')
          storageManager.clearCache()
          setToken(null)
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    }
    
    initializeAuth()
  }, [])

  const login = async (newToken: string, newUser: User) => {
    localStorage.setItem('chat_token', JSON.stringify(newToken))
    localStorage.setItem('chat_user', JSON.stringify(newUser))
    
    storageManager.setSecureItem('token', newToken)
    storageManager.setSecureItem('user', newUser)
    
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
    
    try {
      await storageManager.storeInIndexedDB('users', newUser)
    } catch (error) {
      console.warn('IndexedDB storage failed, but login completed:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('chat_token')
    localStorage.removeItem('chat_user')
    
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
