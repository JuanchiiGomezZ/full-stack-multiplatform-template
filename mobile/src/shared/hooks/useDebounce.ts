// useDebounce Hook
// Debounce a value to optimize performance

import { useCallback, useEffect, useRef, useState } from "react";

// ==================== DEBOUNCE VALUE HOOK ====================

/**
 * Hook to debounce a value
 * Useful for search inputs and filters
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   searchClients(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==================== DEBOUNCE CALLBACK HOOK ====================

/**
 * Hook to debounce a callback function
 * Useful for expensive operations
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced callback function
 *
 * @example
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => {
 *     searchClients(query);
 *   },
 *   500
 * );
 *
 * <Input onChangeText={handleSearch} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

// ==================== THROTTLE HOOK ====================

/**
 * Hook to throttle a callback function
 * Ensures callback is called at most once per delay period
 *
 * @param callback - The callback to throttle
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Throttled callback function
 *
 * @example
 * const handleScroll = useThrottle(
 *   () => {
 *     console.log('Scrolling...');
 *   },
 *   200
 * );
 *
 * <ScrollView onScroll={handleScroll} />
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, execute immediately
        callbackRef.current(...args);
        lastRunRef.current = now;
      } else {
        // Not enough time, schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );
}

// ==================== DEBOUNCED STATE HOOK ====================

/**
 * Hook to create a debounced state
 * Returns both immediate and debounced values
 *
 * @param initialValue - Initial state value
 * @param delay - Delay in milliseconds (default: 500)
 * @returns [value, debouncedValue, setValue]
 *
 * @example
 * const [searchTerm, debouncedSearchTerm, setSearchTerm] = useDebouncedState('', 500);
 *
 * <Input value={searchTerm} onChangeText={setSearchTerm} />
 *
 * useEffect(() => {
 *   searchClients(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

// ==================== ASYNC DEBOUNCE HOOK ====================

/**
 * Hook to debounce an async callback
 * Only the last call within the delay period will be executed
 *
 * @param asyncCallback - The async callback to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced async callback function
 *
 * @example
 * const searchAPI = useDebouncedAsync(
 *   async (query: string) => {
 *     const results = await api.search(query);
 *     return results;
 *   },
 *   500
 * );
 */
export function useDebouncedAsync<T extends (...args: any[]) => Promise<any>>(
  asyncCallback: T,
  delay: number = 500
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(asyncCallback);
  const activeCallRef = useRef<number>(0);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = asyncCallback;
  }, [asyncCallback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      return new Promise((resolve) => {
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Increment active call counter
        const currentCall = ++activeCallRef.current;

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callbackRef.current(...args);

            // Only resolve if this is still the latest call
            if (currentCall === activeCallRef.current) {
              resolve(result);
            } else {
              resolve(null);
            }
          } catch (error) {
            // Only reject if this is still the latest call
            if (currentCall === activeCallRef.current) {
              console.error("Debounced async error:", error);
              resolve(null);
            }
          }
        }, delay);
      });
    },
    [delay]
  );
}

// Default export
export default useDebounce;
