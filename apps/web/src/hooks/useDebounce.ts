import { useEffect } from 'react';

/**
 * Custom hook that debounces a value and calls a setState function
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @param setValue - The setState function to call with the debounced value
 */
export const useDebounce = <T>(
  value: T,
  delay: number,
  setValue: (value: T) => void
): void => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, setValue]);
};
