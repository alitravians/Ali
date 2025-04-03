import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { toast } from 'react-toastify';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC4O4L7233xgo-ZuMEg9EeknMrFH1KY7II",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "ali-chat-app-1743651891.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "ali-chat-app-1743651891",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "ali-chat-app-1743651891.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "950176966430",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:950176966430:web:596018a702891cda9f4b0f"
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
            return Promise.resolve({ 
              exists: false, 
              data: () => ({}),
              id: `mock-${docPath}`
            });
          },
          set: (data) => {
            console.log(`Mock Firestore: set called for doc: ${docPath}`, data);
            return Promise.resolve();
          },
          update: (data) => {
            console.log(`Mock Firestore: update called for doc: ${docPath}`, data);
            return Promise.resolve();
          },
          delete: () => {
            console.log(`Mock Firestore: delete called for doc: ${docPath}`);
            return Promise.resolve();
          }
        }),
        where: (field, op, value) => {
          console.log(`Mock Firestore: where called with ${field} ${op} ${value}`);
          return {
            get: () => {
              console.log(`Mock Firestore: get called for query`);
              return Promise.resolve({ empty: true, docs: [] });
            },
            orderBy: () => ({
              limit: () => ({
                get: () => Promise.resolve({ empty: true, docs: [] }),
                onSnapshot: (callback, errorCallback) => {
                  callback({ empty: true, docs: [] });
                  return () => {};
                }
              })
            }),
            limit: () => ({
              get: () => Promise.resolve({ empty: true, docs: [] }),
              onSnapshot: (callback, errorCallback) => {
                callback({ empty: true, docs: [] });
                return () => {};
              }
            }),
            onSnapshot: (callback, errorCallback) => {
              callback({ empty: true, docs: [] });
              return () => {};
            }
          };
        },
        orderBy: () => ({
          limit: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] }),
            onSnapshot: (callback, errorCallback) => {
              callback({ empty: true, docs: [] });
              return () => {};
            }
          }),
          onSnapshot: (callback, errorCallback) => {
            callback({ empty: true, docs: [] });
            return () => {};
          }
        }),
        limit: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] }),
          onSnapshot: (callback, errorCallback) => {
            callback({ empty: true, docs: [] });
            return () => {};
          }
        }),
        onSnapshot: (callback, errorCallback) => {
          callback({ empty: true, docs: [] });
          return () => {};
        },
        add: (data) => {
          console.log(`Mock Firestore: add called for collection: ${collectionPath}`, data);
          return Promise.resolve({ id: 'mock-doc-id-' + Date.now() });
        }
      };
    },
    doc: (path) => {
      console.log(`Mock Firestore: doc called with path: ${path}`);
      return {
        get: () => {
          console.log(`Mock Firestore: get called for doc: ${path}`);
          return Promise.resolve({ 
            exists: false, 
            data: () => ({}),
            id: `mock-${path.split('/').pop()}`
          });
        },
        set: (data) => {
          console.log(`Mock Firestore: set called for doc: ${path}`, data);
          return Promise.resolve();
        },
        update: (data) => {
          console.log(`Mock Firestore: update called for doc: ${path}`, data);
          return Promise.resolve();
        },
        delete: () => {
          console.log(`Mock Firestore: delete called for doc: ${path}`);
          return Promise.resolve();
        }
      };
    },
    runTransaction: async (transactionHandler) => {
      console.log(`Mock Firestore: runTransaction called`);
      const mockTransaction = {
        get: async (docRef) => {
          console.log(`Mock Transaction: get called for doc`);
          return { exists: false, data: () => ({}), id: 'mock-id' };
        },
        set: (docRef, data) => {
          console.log(`Mock Transaction: set called`, data);
          return mockTransaction;
        },
        update: (docRef, data) => {
          console.log(`Mock Transaction: update called`, data);
          return mockTransaction;
        },
        delete: (docRef) => {
          console.log(`Mock Transaction: delete called`);
          return mockTransaction;
        }
      };
      
      try {
        return await transactionHandler(mockTransaction);
      } catch (error) {
        console.error(`Mock Transaction: error in transaction handler`, error);
        throw error;
      }
    },
    batch: () => {
      console.log(`Mock Firestore: batch called`);
      return {
        set: (docRef, data) => {
          console.log(`Mock Batch: set called`, data);
          return this;
        },
        update: (docRef, data) => {
          console.log(`Mock Batch: update called`, data);
          return this;
        },
        delete: (docRef) => {
          console.log(`Mock Batch: delete called`);
          return this;
        },
        commit: () => {
          console.log(`Mock Batch: commit called`);
          return Promise.resolve();
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

export const isFirestoreAvailable = () => {
  return !!db && typeof db.collection === 'function';
};

export const isAuthAvailable = () => {
  return !!auth && typeof auth.signInWithEmailAndPassword === 'function';
};

export const retryFirestoreOperation = async (operation, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Firestore operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

export { auth, db };
