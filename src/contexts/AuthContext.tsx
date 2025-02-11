import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  role: string | null;
  isAdmin: boolean;
}

interface JWTPayload {
  role?: string;
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
        const userRole = decoded.role || (decoded.sub === 'admin' ? 'admin' : 'student');
        console.log('Decoded token:', decoded, 'User role:', userRole);
        setRole(userRole);
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
