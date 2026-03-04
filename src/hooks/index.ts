// ============================================================================
// CUSTOM HOOKS
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { TEST_DURATION_SECONDS, EXTENDED_DURATION_SECONDS } from '../constants';
import { VitalReading } from '../types';

/**
 * Hook para gestionar el cronómetro de la prueba
 */
export const useTestTimer = (initialSeconds: number = 0) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const extend = useCallback((addSeconds: number) => {
    setSeconds((prev) => prev + addSeconds);
  }, []);

  return {
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
    extend,
  };
};

/**
 * Hook para validar datos con debounce
 */
export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateField = useCallback(
    (fieldName: string, value: any, validator: (val: any) => string | null) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const error = validator(value);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [fieldName]: error };
          } else {
            const { [fieldName]: _, ...rest } = prev;
            return rest;
          }
        });
      }, 300);
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateField,
    clearErrors,
    hasErrors,
  };
};

/**
 * Hook para manejar formas (formularios)
 */
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    },
    []
  );

  const handleBlur = useCallback((e: React.FocusEvent<any>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const setFieldValue = useCallback((name: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const resetTouched = useCallback(() => {
    setTouched({});
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    resetForm,
    resetTouched,
  };
};

/**
 * Hook para usar datos locales (localStorage)
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving to localStorage:`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

/**
 * Hook para debounce de valores
 */
export const useDebounce = <T,>(value: T, delayMs: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
};

/**
 * Hook para detectar click fuera de un elemento
 */
export const useClickOutside = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};

/**
 * Hook para manejar estado anterior
 */
export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Hook para solicitudes HTTP con caché
 */
export const useFetch = <T,>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, T>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      // Verificar caché
      if (cacheRef.current.has(url)) {
        setData(cacheRef.current.get(url) || null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const result = await response.json();
        cacheRef.current.set(url, result);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url, options]);

  const refetch = useCallback(() => {
    cacheRef.current.delete(url);
    setIsLoading(true);
  }, [url]);

  return { data, isLoading, error, refetch };
};
