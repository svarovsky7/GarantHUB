/**
 * Естественное сравнение строк и чисел.
 * Позволяет корректно сортировать значения содержащие цифры.
 *
 * @param a первое значение
 * @param b второе значение
 */
export function naturalCompare(a: string | number, b: string | number): number {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Лексикографическое сравнение массивов чисел.
 * Используется для корректной сортировки колонок с несколькими ID.
 *
 * @param a первый массив
 * @param b второй массив
 */
export function naturalCompareArrays(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i];
    const bv = b[i];
    if (av === undefined && bv === undefined) return 0;
    if (av === undefined) return -1;
    if (bv === undefined) return 1;
    const diff = naturalCompare(av, bv);
    if (diff !== 0) return diff;
  }
  return 0;
}
