import React, { createContext, useContext, useState } from 'react';
import { User } from '../lib/api';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isAdmin: false,
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  });

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error storing user:', error);
    }
  };

  const value = {
    user,
    setUser,
    isAdmin: user?.role === 'admin',
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
