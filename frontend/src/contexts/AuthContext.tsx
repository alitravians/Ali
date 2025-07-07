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
      
      let token = storageManager.getSecureItem('token') || localStorage.getItem('chat_token')
      const userData = storageManager.getSecureItem('user') || localStorage.getItem('chat_user')
      
      console.log('AuthContext: Raw token from storage:', token)
      console.log('AuthContext: Raw userData from storage:', userData)
      
      if (token && userData) {
        try {
          let cleanToken = token
          
          if (typeof cleanToken === 'string') {
            if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
              cleanToken = cleanToken.slice(1, -1)
            }
            
            if (!cleanToken.startsWith('eyJ')) {
              cleanToken = atob(cleanToken)
              if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
                cleanToken = cleanToken.slice(1, -1)
              }
            }
          }
          
          console.log('AuthContext: Processed token:', cleanToken)
          
          const parsedUser = typeof userData === 'string' ? JSON.parse(userData) : userData
          console.log('AuthContext: Parsed user:', parsedUser)
          
          setToken(cleanToken)
          setUser(parsedUser)
          setIsAuthenticated(true)
          
          await storageManager.syncData()
        } catch (error) {
          console.error('Token processing failed:', error)
          localStorage.removeItem('chat_token')
          localStorage.removeItem('chat_user')
          storageManager.clearCache()
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
    
    await storageManager.storeInIndexedDB('users', newUser)
    
    setToken(newToken)
    setUser(newUser)
    setIsAuthenticated(true)
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
