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

  if (unit.building) {
    const b = unit.building.trim();
    parts.push(/^\s*корпус/i.test(b) ? b : `Корпус ${b}`);
  }

  if (unit.floor !== undefined && unit.floor !== null) {
    parts.push(`Этаж ${unit.floor}`);
  }

  if (unit.section) {
    const s = unit.section.trim();
    parts.push(/^\s*секция/i.test(s) ? s : `Секция ${s}`);
  }

  parts.push(`Объект ${unit.name}`);
  return parts.join(', ');
}
