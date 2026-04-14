import { useState, useRef, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch {
      return initialValue;
    }
  });

  // Keep a ref always in sync so the setter never reads a stale closure value
  const storedRef = useRef<T>(storedValue);
  storedRef.current = storedValue;

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Use the ref to get the truly latest value, not the closure snapshot
        const valueToStore =
          value instanceof Function ? value(storedRef.current) : value;
        storedRef.current = valueToStore;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error("useLocalStorage error:", error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
