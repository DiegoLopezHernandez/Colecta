import { useEffect, useState } from 'react';

/**
 * Devuelve un eco del valor que solo se actualiza después de `delayMs` ms
 * sin cambios. Útil para no disparar filtros caros en cada keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
