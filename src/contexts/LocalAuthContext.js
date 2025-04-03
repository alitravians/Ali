import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userStatus, setUserStatus] = useState('active');
  const [userCountry, setUserCountry] = useState('');
  const [banInfo, setBanInfo] = useState(null);
  const [freezeInfo, setFreezeInfo] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setUserRole(user.role || 'user');
      setUserStatus(user.status || 'active');
      setUserCountry(user.country || '');
      setBanInfo(user.banInfo || null);
      setFreezeInfo(user.freezeInfo || null);
    }
    setLoading(false);
  }, []);

  async function register(username, email, password) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { success: false, message: t('auth.usernameExists') };
      }

      const uid = 'user_' + Date.now();
      
      let country = 'Unknown';
      try {
        const countryResponse = await fetch('https://ipapi.co/json/');
        const countryData = await countryResponse.json();
        country = countryData.country_name || 'Unknown';
      } catch (error) {
        console.error('Error fetching country:', error);
      }

      const userData = {
        uid,
        username,
        email,
        role: 'user',
        status: 'active',
        country,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', uid), userData);
      
      const userAuth = {
        ...userData,
        password // In a real app, never store passwords in localStorage
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userAuth));
      localStorage.setItem(`password_${uid}`, password);
      
      setCurrentUser(userAuth);
      setUserRole('user');
      setUserStatus('active');
      setUserCountry(country);
      
      return { success: true, message: t('auth.registerSuccess') };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: t('auth.registerError') + ': ' + error.message };
    }
  }

  async function login(username, password) {
    try {
      console.log('Attempting login for:', username);
      
      if (username === 'admin' && password === 'admin') {
        console.log('Attempting admin login');
        
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', 'admin'));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            return await createAdminUser();
          } else {
            const adminData = querySnapshot.docs[0].data();
            const adminUser = {
              uid: adminData.uid,
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
              status: 'active',
              country: 'Admin',
              lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            setCurrentUser(adminUser);
            setUserRole('admin');
            setUserStatus('active');
            setUserCountry('Admin');
            
            try {
              await setDoc(doc(db, 'users', adminData.uid), 
                { lastLogin: new Date().toISOString() }, 
                { merge: true }
              );
            } catch (error) {
              console.log('Failed to update last login time, but continuing with login');
            }
            
            console.log('Admin login successful');
            return { success: true, message: t('auth.loginSuccess') };
          }
        } catch (error) {
          console.log('Firestore error during admin login, using offline fallback:', error);
          
          const adminUid = 'admin_offline';
          const adminUser = {
            uid: adminUid,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
            status: 'active',
            country: 'Admin',
            lastLogin: new Date().toISOString()
          };
          
          localStorage.setItem('currentUser', JSON.stringify(adminUser));
          setCurrentUser(adminUser);
          setUserRole('admin');
          setUserStatus('active');
          setUserCountry('Admin');
          
          console.log('Admin login successful (offline mode)');
          return { success: true, message: t('auth.loginSuccess') + ' (' + t('common.offlineMode') + ')' };
        }
      }
      
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log('User not found:', username);
          return { success: false, message: t('auth.userNotFound') };
        }
        
        const userData = querySnapshot.docs[0].data();
        
        const storedPassword = localStorage.getItem(`password_${userData.uid}`);
        if (storedPassword && storedPassword !== password) {
          return { success: false, message: t('auth.invalidPassword') };
        }
        
        if (userData.status === 'banned') {
          return { 
            success: false, 
            message: t('ban.banned'),
            banInfo: userData.banInfo
          };
        }
        
        if (userData.status === 'frozen') {
          return { 
            success: false, 
            message: t('freeze.frozen'),
            freezeInfo: userData.freezeInfo
          };
        }
        
        const userAuth = {
          ...userData,
          password // In a real app, never store passwords in localStorage
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userAuth));
        localStorage.setItem(`password_${userData.uid}`, password);
        
        setCurrentUser(userAuth);
        setUserRole(userData.role);
        setUserStatus(userData.status);
        setUserCountry(userData.country);
        setBanInfo(userData.banInfo || null);
        setFreezeInfo(userData.freezeInfo || null);
        
        try {
          await setDoc(doc(db, 'users', userData.uid), 
            { lastLogin: new Date().toISOString() }, 
            { merge: true }
          );
        } catch (error) {
          console.log('Failed to update last login time, but continuing with login');
        }
        
        console.log('Login successful for:', username);
        return { success: true, message: t('auth.loginSuccess') };
      } catch (error) {
        console.error('Firestore error during user login:', error);
        
        const storedUsers = Object.keys(localStorage)
          .filter(key => key.startsWith('password_'))
          .map(key => {
            const uid = key.replace('password_', '');
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
              try {
                return JSON.parse(storedUser);
              } catch (e) {
                return null;
              }
            }
            return null;
          })
          .filter(user => user && user.username === username);
          
        if (storedUsers.length > 0 && storedUsers[0].password === password) {
          const userAuth = storedUsers[0];
          
          localStorage.setItem('currentUser', JSON.stringify(userAuth));
          setCurrentUser(userAuth);
          setUserRole(userAuth.role);
          setUserStatus(userAuth.status);
          setUserCountry(userAuth.country);
          setBanInfo(userAuth.banInfo || null);
          setFreezeInfo(userAuth.freezeInfo || null);
          
          console.log('Login successful using offline fallback for:', username);
          return { success: true, message: t('auth.loginSuccess') + ' (' + t('common.offlineMode') + ')' };
        }
        
        return { success: false, message: t('auth.loginError') + ': ' + error.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: t('auth.loginError') + ': ' + error.message };
    }
  }

  async function logout() {
    try {
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setUserRole('user');
      setUserStatus('active');
      setUserCountry('');
      setBanInfo(null);
      setFreezeInfo(null);
      
      return { success: true, message: t('auth.logoutSuccess') };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  }

  function isAdmin() {
    return userRole === 'admin';
  }

  function isModerator() {
    return userRole === 'moderator' || userRole === 'admin';
  }

  function isBanned() {
    return userStatus === 'banned';
  }

  function isFrozen() {
    return userStatus === 'frozen';
  }
  
  async function createAdminUser() {
    try {
      console.log('Creating admin user');
      
      const uid = 'admin_' + Date.now();
      
      const adminData = {
        uid,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        country: 'Admin',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', uid), adminData);
      
      const adminAuth = {
        ...adminData,
        password: 'admin' // In a real app, never store passwords in localStorage
      };
      
      localStorage.setItem('currentUser', JSON.stringify(adminAuth));
      localStorage.setItem(`password_${uid}`, 'admin');
      
      setCurrentUser(adminAuth);
      setUserRole('admin');
      setUserStatus('active');
      setUserCountry('Admin');
      
      console.log('Admin user created successfully');
      return { success: true, message: t('auth.adminCreated') };
    } catch (error) {
      console.error('Error creating admin user:', error);
      return { success: false, message: t('auth.adminError') + ': ' + error.message };
    }
  }

  const value = {
    currentUser,
    userRole,
    userStatus,
    userCountry,
    banInfo,
    freezeInfo,
    register,
    login,
    logout,
    isAdmin,
    isModerator,
    isBanned,
    isFrozen,
    createAdminUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
