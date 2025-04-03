import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('user');
  const [userStatus, setUserStatus] = useState('active');
  const [userCountry, setUserCountry] = useState('');
  const [banInfo, setBanInfo] = useState(null);
  const [freezeInfo, setFreezeInfo] = useState(null);
  const { t } = useTranslation();

  async function register(username, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: username
      });

      const countryResponse = await fetch('https://ipapi.co/json/');
      const countryData = await countryResponse.json();
      const country = countryData.country_name || 'Unknown';

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email,
        role: 'user',
        status: 'active',
        country,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      return { success: true, message: t('auth.registerSuccess') };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: t('auth.registerError') + ': ' + error.message };
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.status === 'banned') {
          await signOut(auth);
          return { 
            success: false, 
            message: t('ban.banned'),
            banInfo: userData.banInfo
          };
        }
        
        if (userData.status === 'frozen') {
          await signOut(auth);
          return { 
            success: false, 
            message: t('freeze.frozen'),
            freezeInfo: userData.freezeInfo
          };
        }
      }
      
      return { success: true, message: t('auth.loginSuccess') };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: t('auth.loginError') + ': ' + error.message };
    }
  }

  async function logout() {
    try {
      await signOut(auth);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserStatus(userData.status);
          setUserCountry(userData.country);
          setBanInfo(userData.banInfo || null);
          setFreezeInfo(userData.freezeInfo || null);
        }
        
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole('user');
        setUserStatus('active');
        setUserCountry('');
        setBanInfo(null);
        setFreezeInfo(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
