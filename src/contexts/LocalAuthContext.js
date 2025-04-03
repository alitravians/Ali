import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const LocalAuthContext = createContext();

export function useLocalAuth() {
  return useContext(LocalAuthContext);
}

export function LocalAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('chatUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      
      if (username === 'admin' && password === 'admin') {
        const adminUser = {
          id: 'admin-user',
          username: 'admin',
          role: 'admin',
          lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('chatUser', JSON.stringify(adminUser));
        setUser(adminUser);
        setIsAuthenticated(true);
        return adminUser;
      }
      
      if (username && password) {
        const newUser = {
          id: `user-${Date.now()}`,
          username,
          role: 'user',
          lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('chatUser', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
        return newUser;
      }
      
      throw new Error('Invalid username or password');
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const register = async (username, password) => {
    try {
      setError(null);
      
      const existingUsers = localStorage.getItem('chatUsers');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        if (users.some(u => u.username === username)) {
          throw new Error('Username already exists');
        }
      }
      
      const newUser = {
        id: `user-${Date.now()}`,
        username,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      users.push(newUser);
      localStorage.setItem('chatUsers', JSON.stringify(users));
      
      localStorage.setItem('chatUser', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('chatUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
    error,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin'
  };

  return (
    <LocalAuthContext.Provider value={value}>
      {!loading && children}
    </LocalAuthContext.Provider>
  );
}
