import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function getUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role || 'user';
      } else {
        await setDoc(doc(db, 'users', uid), {
          role: 'user',
          createdAt: new Date(),
          lastLogin: new Date(),
          status: 'active'
        });
        return 'user';
      }
    } catch (error) {
      console.error("Error getting user role:", error);
      return 'user';
    }
  }

  async function login(email, password) {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lastLogin: new Date()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
      
      return userCredential;
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      throw error;
    }
  }

  async function register(email, password, username) {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        username,
        role: 'user',
        createdAt: new Date(),
        lastLogin: new Date(),
        status: 'active'
      });
      
      return userCredential;
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
      throw error;
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      setError(error.message);
      throw error;
    }
  }

  async function checkUserStatus(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.status === 'banned') {
          const banDoc = await getDoc(doc(collection(db, 'bans'), uid));
          if (banDoc.exists()) {
            const banData = banDoc.data();
            if (banData.expiresAt && banData.expiresAt.toDate() < new Date()) {
              await setDoc(doc(db, 'users', uid), { status: 'active' }, { merge: true });
              return { status: 'active' };
            }
            return { status: 'banned', reason: banData.reason, expiresAt: banData.expiresAt };
          }
        }
        
        if (userData.status === 'frozen') {
          const freezeDoc = await getDoc(doc(collection(db, 'freezes'), uid));
          if (freezeDoc.exists()) {
            const freezeData = freezeDoc.data();
            return { status: 'frozen', reason: freezeData.reason };
          }
        }
        
        return { status: userData.status || 'active' };
      }
      return { status: 'active' };
    } catch (error) {
      console.error("Error checking user status:", error);
      return { status: 'active' };
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const statusCheck = await checkUserStatus(user.uid);
          
          if (statusCheck.status === 'banned') {
            window.location.href = '/banned';
            setCurrentUser(user);
            setLoading(false);
            return;
          }
          
          if (statusCheck.status === 'frozen') {
            window.location.href = '/frozen';
            setCurrentUser(user);
            setLoading(false);
            return;
          }
          
          const role = await getUserRole(user.uid);
          setUserRole(role);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          setUserRole('user');
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        toast.error("خطأ في التحقق من حالة المستخدم");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    signOut,
    loading,
    error,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator' || userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
