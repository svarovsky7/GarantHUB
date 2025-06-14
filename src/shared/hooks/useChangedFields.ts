import { useEffect, useRef, useState } from 'react';
import type { FormInstance } from 'antd';

/**
 * Простое глубокое сравнение значений формы
 * @param a Первое значение
 * @param b Второе значение
 */
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface ChangedFieldsResult {
  /** Карта изменённых полей */
  changedFields: Record<string, boolean>;
  /** Обработчик для события onValuesChange */
  handleValuesChange: () => void;
}

/**
 * Отслеживает изменения значений формы и возвращает карту изменённых полей.
 * @param form экземпляр Ant Design формы
 * @param deps зависимости для переинициализации начальных значений
 */
export function useChangedFields<T>(
  form: FormInstance<T>,
  deps: any[] = [],
): ChangedFieldsResult {
  const initialRef = useRef<Record<string, any>>({});
  const [changed, setChanged] = useState<Record<string, boolean>>({});

  useEffect(() => {
    initialRef.current = form.getFieldsValue(true);
    setChanged({});
  }, deps);

  const handleValuesChange = () => {
    const current = form.getFieldsValue(true);
    const diff: Record<string, boolean> = {};
    Object.keys(current).forEach((key) => {
      if (!deepEqual(current[key], initialRef.current[key])) diff[key] = true;
    });
    setChanged(diff);
  };

  return { changedFields: changed, handleValuesChange };
}
