import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '@/utils/eventBus';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get stored value on mount
  const getStoredValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      console.log(`[useLocalStorage] Initial load for ${key}:`, item || initialValue);
      if (!item) return initialValue;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error reading ${key} from localStorage:`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue());

  // Update localStorage and trigger event bus for other components
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function for consistency with useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      console.log(`[useLocalStorage] Setting ${key}:`, valueToStore);

      // Save to state
      setStoredValue(valueToStore);

      // Save to localStorage
      const valueToStoreString = typeof valueToStore === 'string'
        ? valueToStore
        : JSON.stringify(valueToStore);
      localStorage.setItem(key, valueToStoreString);

      // Emit event for other components using event bus
      console.log(`[useLocalStorage] Emitting event for ${key}:`, valueToStore);
      eventBus.emit(key, valueToStore);
    } catch (error) {
      console.error(`[useLocalStorage] Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in other components using event bus
  useEffect(() => {
    console.log(`[useLocalStorage] Setting up event listener for ${key}`);

    const handleUpdate = (newValue: T) => {
      console.log(`[useLocalStorage] Received update for ${key}:`, newValue);
      setStoredValue(newValue);
    };

    eventBus.on(key, handleUpdate);

    // Cleanup subscription
    return () => {
      console.log(`[useLocalStorage] Cleaning up event listener for ${key}`);
      eventBus.off(key, handleUpdate);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
