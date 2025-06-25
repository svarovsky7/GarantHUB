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
