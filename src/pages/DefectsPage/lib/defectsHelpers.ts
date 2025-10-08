import dayjs from 'dayjs';

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
export const formatDate = (v: string | null): string =>
  v ? dayjs(v).format('DD.MM.YYYY') : '—';

/**
 * Форматирует дату и время в формат DD.MM.YYYY HH:mm
 */
export const formatDateTime = (v: string | null): string =>
  v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—';

/**
 * Вычисляет количество дней между двумя датами
 */
export const calculateDays = (received: string | null, fixed: string | null): number | null => {
  if (!received) return null;
  const endDate = fixed ? dayjs(fixed) : dayjs();
  const startDate = dayjs(received);
  return endDate.diff(startDate, 'day');
};
