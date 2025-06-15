/**
 * Формирует человеко-читаемое название объекта.
 * Возвращает строку вида "Корпус X, Секция Y, Этаж Z, <номер>".
 * Пустые части пропускаются.
 *
 * @param unit - данные объекта
 */
export default function formatUnitName(
  unit: {
    name: string;
    building?: string | null;
    section?: string | null;
    floor?: number | null;
  },
): string {
  const parts: string[] = [];
  if (unit.building) parts.push(`Корпус ${unit.building}`);
  if (unit.section) parts.push(`Секция ${unit.section}`);
  if (unit.floor !== undefined && unit.floor !== null) {
    parts.push(`Этаж ${unit.floor}`);
  }
  parts.push(unit.name);
  return parts.join(', ');
}
