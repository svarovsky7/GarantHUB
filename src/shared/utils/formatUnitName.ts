/**
 * Формирует человеко-читаемое название объекта.
 * Возвращает строку вида "Корпус X, Этаж Y, <номер>".
 * Пустые части пропускаются.
 *
 * @param unit - данные объекта
 * @param includeBuilding - включать ли корпус в итоговую строку
 */
export default function formatUnitName(
  unit: {
    name: string;
    building?: string | null;
    floor?: number | null;
  },
  includeBuilding = true,
): string {
  const parts: string[] = [];

  if (includeBuilding && unit.building) {
    const b = unit.building.trim();
    parts.push(/^\s*корпус/i.test(b) ? b : `Корпус ${b}`);
  }

  if (unit.floor !== undefined && unit.floor !== null) {
    parts.push(`Этаж ${unit.floor}`);
  }


  parts.push(`Объект ${unit.name}`);
  return parts.join(', ');
}
