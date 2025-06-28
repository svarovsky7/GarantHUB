import { useEffect, useState } from 'react';

/**
 * Возвращает значение, обновлённое с задержкой.
 * Используется для редкого вызова эффектов и запросов.
 *
 * @param value Значение для дебаунса
 * @param delay Задержка в миллисекундах
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
