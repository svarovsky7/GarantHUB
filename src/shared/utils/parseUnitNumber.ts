/**
 * Возвращает числовую часть имени объекта. Если цифры не найдены, возвращает NaN.
 */
export function parseUnitNumber(name: string): number {
  const match = String(name).match(/\d+/);
  return match ? Number(match[0]) : NaN;
}
