/**
 * Извлекает первое целое число из строки. Если число не найдено,
 * возвращается {@link Number.POSITIVE_INFINITY}.
 */
export function extractFirstNumber(value: string): number {
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

import type { SortDirection } from '@/shared/types/sortDirection';

/**
 * Создает компаратор для сортировки объектов по числовой части их имени.
 * Если числовые значения совпадают, используется лексикографическое сравнение
 * полей `name` в нижнем регистре.
 *
 * @param direction Направление сортировки
 */
export function getUnitNameComparator<T extends { name: string }>(
  direction: SortDirection,
) {
  return (a: T, b: T) => {
    const numA = extractFirstNumber(a.name);
    const numB = extractFirstNumber(b.name);
    if (numA !== numB) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA === nameB) return 0;
    return direction === 'asc'
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  };
}
