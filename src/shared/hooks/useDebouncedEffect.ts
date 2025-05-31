import { useEffect } from 'react';

/**
 * Вызывает эффект с задержкой, сбрасывая таймер при изменении зависимостей.
 * @param effect Функция-эффект
 * @param deps Массив зависимостей
 * @param delay Задержка в мс
 */
export const useDebouncedEffect = (
  effect: () => void,
  deps: React.DependencyList,
  delay: number,
) => {
  useEffect(() => {
    const id = setTimeout(effect, delay);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};
