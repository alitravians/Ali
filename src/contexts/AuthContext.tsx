import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  role: string | null;
  isAdmin: boolean;
}

interface JWTPayload {
  role: string;
  sub: string;
  id: number;
  exp: number;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        setRole(decoded.role);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setRole(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      role, 
      isAdmin: role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
