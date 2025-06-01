/**
 * Форматирование телефонного номера.
 * Возвращает номер в виде "+7 (9xx) xxx-xx-xx".
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^7/, '');
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
  let res = '+7';
  if (parts[0]) res += ` (${parts[0]}`;
  if (digits.length >= 3) res += ')';
  if (parts[1]) res += ` ${parts[1]}`;
  if (parts[2]) res += `-${parts[2]}`;
  if (parts[3]) res += `-${parts[3]}`;
  return res;
}
