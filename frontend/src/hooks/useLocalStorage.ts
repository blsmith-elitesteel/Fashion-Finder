import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state to localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for functional updates
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for managing recent searches
 */
export function useRecentSearches(maxItems: number = 5) {
  const [searches, setSearches] = useLocalStorage<string[]>('recentSearches', []);

  const addSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      
      setSearches((prev) => {
        const filtered = prev.filter(
          (s) => s.toLowerCase() !== query.toLowerCase()
        );
        return [query, ...filtered].slice(0, maxItems);
      });
    },
    [maxItems, setSearches]
  );

  const clearSearches = useCallback(() => {
    setSearches([]);
  }, [setSearches]);

  return { searches, addSearch, clearSearches };
}
