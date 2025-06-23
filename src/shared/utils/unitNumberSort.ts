/**
 * Извлекает первое целое число из строки.
 * Если число не найдено, возвращается {@link Number.POSITIVE_INFINITY}.
 */
export function extractFirstNumber(value: string): number {
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

/**
 * Возвращает компаратор для сортировки объектов по числовой части их поля `name`.
 * @param direction Направление сортировки: 'asc' или 'desc'
 */
export function getUnitNameComparator<T extends { name: string }>(direction: 'asc' | 'desc') {
  return (a: T, b: T) => {
    const numA = extractFirstNumber(a.name);
    const numB = extractFirstNumber(b.name);
    if (numA === numB) return 0;
    return direction === 'asc' ? numA - numB : numB - numA;
  };
}
