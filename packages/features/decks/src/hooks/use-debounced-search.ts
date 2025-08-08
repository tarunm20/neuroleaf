import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing search input
 * @param searchTerm - The search term to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced search term
 */
export function useDebouncedSearch(searchTerm: string, delay: number = 500): string {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    // Set up the timeout to update the debounced term
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    // Clean up the timeout if searchTerm changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
}