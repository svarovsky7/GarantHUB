import { useEffect } from 'react';

/**
 * Показывает системное предупреждение о несохранённых изменениях
 * при попытке закрыть или перезагрузить страницу.
 * @param active Активировать предупреждение
 */
export function useUnsavedChangesWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [active]);
}
