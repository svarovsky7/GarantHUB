/**
 * Формирует краткое название объекта без корпуса.
 * Возвращает строку вида "Этаж N, Объект <номер>".
 * Пустые части пропускаются.
 *
 * @param unit данные объекта
 */
export default function formatUnitShortName(
  unit: {
    name: string;
    floor?: number | null;
  },
): string {
  const parts: string[] = [];
  if (unit.floor !== undefined && unit.floor !== null) {
    parts.push(`Этаж ${unit.floor}`);
  }
  parts.push(`Объект ${unit.name}`);
  return parts.join(', ');
}
