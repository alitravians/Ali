import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { toast } from 'react-toastify';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "FIREBASE_APP_ID_PLACEHOLDER"
};

let app, auth, db;

try {
  console.log("Initializing Firebase with config:", JSON.stringify({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  }));
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "FIREBASE_API_KEY_PLACEHOLDER" || 
      !firebaseConfig.projectId || firebaseConfig.projectId === "FIREBASE_PROJECT_ID_PLACEHOLDER") {
    throw new Error("Firebase configuration is not properly set. Check your environment variables or .env file.");
  }
  
  app = initializeApp(firebaseConfig);
  
  auth = getAuth(app);
  console.log("Firebase Auth initialized successfully");
  
  db = getFirestore(app);
  
  const settings = {
    cacheSizeBytes: 5242880, // 5MB
    ignoreUndefinedProperties: true
  };
  
  console.log("Firestore initialized with settings:", JSON.stringify(settings));
  
  enableIndexedDbPersistence(db, { synchronizeTabs: true })
    .then(() => {
      console.log("Firestore offline persistence enabled with synchronizeTabs");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        if (typeof window !== 'undefined') {
          toast?.warning?.("Multiple tabs open. Offline mode may not work properly.");
        }
      } else if (err.code === 'unimplemented') {
        console.warn("The current browser does not support all of the features required for Firestore offline persistence.");
        if (typeof window !== 'undefined') {
          toast?.warning?.("Your browser doesn't support offline mode.");
        }
      } else {
        console.error("Error enabling offline persistence:", err);
        if (typeof window !== 'undefined') {
          toast?.error?.("Error enabling offline mode. Some features may not work properly.");
        }
      }
    });
  
  console.log("Firebase initialization completed successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  
  let errorMessage = "Error connecting to database. ";
  
  if (error.code === 'auth/configuration-not-found') {
    errorMessage += "Authentication configuration not found.";
    console.error("Firebase Auth configuration error:", error);
  } else if (error.code === 'auth/internal-error') {
    errorMessage += "Internal authentication error.";
  } else if (error.message && error.message.includes('network')) {
    errorMessage += "Network connection issue.";
  } else if (error.message && error.message.includes('Firebase configuration')) {
    errorMessage += error.message;
  } else {
    errorMessage += "Some features may not work properly.";
  }
  
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      console.log("Mock Auth: onAuthStateChanged called");
      return callback(null);
    },
    signInWithEmailAndPassword: (email, password) => {
      console.log(`Mock Auth: signInWithEmailAndPassword called with email: ${email}`);
      return Promise.reject(new Error("Firebase Auth unavailable"));
    },
    createUserWithEmailAndPassword: (email, password) => {
      console.log(`Mock Auth: createUserWithEmailAndPassword called with email: ${email}`);
      return Promise.reject(new Error("Firebase Auth unavailable"));
    },
    signOut: () => {
      console.log("Mock Auth: signOut called");
      return Promise.resolve();
    }
  };
  
  db = {
    collection: (collectionPath) => {
      console.log(`Mock Firestore: collection called with path: ${collectionPath}`);
      return {
        doc: (docPath) => ({
          get: () => {
            console.log(`Mock Firestore: get called for doc: ${docPath}`);
            return Promise.resolve({ exists: false, data: () => ({}) });
          },
          set: (data) => {
            console.log(`Mock Firestore: set called for doc: ${docPath}`, data);
            return Promise.resolve();
          }
        }),
        where: (field, op, value) => {
          console.log(`Mock Firestore: where called with ${field} ${op} ${value}`);
          return {
            get: () => {
              console.log(`Mock Firestore: get called for query`);
              return Promise.resolve({ empty: true, docs: [] });
            }
          };
        }
      };
    }
  };
  
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      toast?.error?.(errorMessage);
    }, 2000);
  }
}

export { auth, db };
