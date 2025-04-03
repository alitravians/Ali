import { t } from 'i18next';
import { toast } from 'react-toastify';

/**
 * Retries a Firestore operation with exponential backoff
 * @param {Function} operation - The Firestore operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise} - Result of the operation or throws the last error
 */
export const retryFirestoreOperation = async (operation, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Firestore operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  toast.error(t('admin.firestoreError'));
  throw lastError;
};

/**
 * Handles Firestore errors consistently
 * @param {Error} error - The Firestore error
 * @param {string} customMessage - Optional custom error message
 * @returns {null} - Always returns null to simplify error handling in components
 */
export const handleFirestoreError = (error, customMessage) => {
  console.error('Firestore error:', error);
  
  let errorMessage;
  
  if (error.code === 'permission-denied') {
    errorMessage = t('admin.permissionDenied');
  } else if (error.code === 'unavailable') {
    errorMessage = t('admin.serviceUnavailable');
  } else if (error.code === 'resource-exhausted') {
    errorMessage = t('admin.quotaExceeded');
  } else if (error.code === 'not-found') {
    errorMessage = t('admin.documentNotFound');
  } else if (error.code === 'cancelled') {
    errorMessage = t('admin.operationCancelled');
  } else if (error.code === 'deadline-exceeded') {
    errorMessage = t('admin.operationTimeout');
  } else if (error.code === 'unauthenticated') {
    errorMessage = t('admin.authError');
  } else {
    errorMessage = customMessage || t('admin.firestoreError');
  }
  
  toast.error(errorMessage);
  return null;
};

/**
 * Checks if an error is a network connectivity issue
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    error.code === 'unavailable' || 
    error.message?.includes('network') || 
    error.message?.includes('connection') ||
    error.message?.includes('offline')
  );
};

/**
 * Creates a safe Firestore document reference that handles errors
 * @param {Object} db - Firestore database instance
 * @param {string} collectionPath - Collection path
 * @param {string} docId - Document ID
 * @returns {Object} - Document reference
 */
export const safeDocRef = (db, collectionPath, docId) => {
  try {
    const { doc, collection } = require('firebase/firestore');
    return doc(db, collectionPath, docId);
  } catch (error) {
    console.error('Error creating document reference:', error);
    return null;
  }
};

/**
 * Creates a safe Firestore collection reference that handles errors
 * @param {Object} db - Firestore database instance
 * @param {string} collectionPath - Collection path
 * @returns {Object} - Collection reference
 */
export const safeCollectionRef = (db, collectionPath) => {
  try {
    const { collection } = require('firebase/firestore');
    return collection(db, collectionPath);
  } catch (error) {
    console.error('Error creating collection reference:', error);
    return null;
  }
};
