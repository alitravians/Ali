import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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

  async function login(username, password) {
    try {
      if (username === 'admin' && password === 'admin') {
        console.log('Attempting admin login');
        
        try {
          const adminEmail = 'admin@example.com';
          const userCredential = await signInWithEmailAndPassword(auth, adminEmail, 'admin');
          const user = userCredential.user;
          
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          
          console.log('Admin login successful');
          return { success: true, message: t('auth.loginSuccess') };
        } catch (signInError) {
          console.log('Admin sign-in failed, attempting to create admin user', signInError);
          
          return await createAdminUser();
        }
      }
      
      console.log('Attempting regular user login for:', username);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('User not found:', username);
        return { success: false, message: t('auth.userNotFound') };
      }
      
      const userData = querySnapshot.docs[0].data();
      const email = userData.email;
      
      console.log('Found user email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const updatedUserData = userDoc.data();
        
        if (updatedUserData.status === 'banned') {
          await signOut(auth);
          return { 
            success: false, 
            message: t('ban.banned'),
            banInfo: updatedUserData.banInfo
          };
        }
        
        if (updatedUserData.status === 'frozen') {
          await signOut(auth);
          return { 
            success: false, 
            message: t('freeze.frozen'),
            freezeInfo: updatedUserData.freezeInfo
          };
        }
      }
      
      console.log('Login successful for:', username);
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
  
  async function createAdminUser() {
    try {
      const adminEmail = 'admin@example.com';
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, 'admin');
        const user = userCredential.user;
        
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        
        console.log('Admin user signed in successfully');
        return { success: true, message: t('auth.loginSuccess') };
      } catch (signInError) {
        console.log('Admin user does not exist yet, creating...', signInError);
        
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, 'admin');
        const user = userCredential.user;
        
        await updateProfile(user, {
          displayName: 'admin'
        });
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: 'admin',
          email: adminEmail,
          role: 'admin',
          status: 'active',
          country: 'Admin',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        
        console.log('Admin user created successfully');
        return { success: true, message: t('auth.adminCreated') };
      }
    } catch (error) {
      console.error('Error handling admin user:', error);
      return { success: false, message: t('auth.adminError') + ': ' + error.message };
    }
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
    createAdminUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
