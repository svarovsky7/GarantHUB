import React from 'react';
import dayjs from 'dayjs';

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
export const formatDate = (d: dayjs.Dayjs | null | undefined): string =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY') : '—';

/**
 * Форматирует дату и время в формат DD.MM.YYYY HH:mm
 */
export const formatDateTime = (d: dayjs.Dayjs | null | undefined): string =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format('DD.MM.YYYY HH:mm') : '—';

/**
 * Извлекает текст из заголовка колонки (может быть React элементом)
 */
export const getTitleText = (title: React.ReactNode): string => {
  if (React.isValidElement(title)) {
    return getTitleText(title.props.children);
  }
  return String(title);
};
