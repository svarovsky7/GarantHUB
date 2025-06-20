export const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

/**
 * Форматирует число в валюту рубли с разделением разрядов.
 */
export function formatRub(value: number | null | undefined): string {
  if (value == null) return '';
  return currencyFormatter.format(value);
}

/**
 * Парсит строку из поля ввода рублевой суммы.
 */
export function parseRub(value?: string | null): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value.replace(/[\s₽]/g, '').replace(',', '.'));
  return Number.isNaN(num) ? undefined : num;
}
