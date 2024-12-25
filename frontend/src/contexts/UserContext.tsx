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
  const [user, setUser] = useState<User | null>(null);

  const value = {
    user,
    setUser,
    isAdmin: user?.role === 'admin',
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
