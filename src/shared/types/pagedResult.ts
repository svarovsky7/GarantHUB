export interface PageParams {
  /** Количество элементов на странице */
  limit: number;
  /** Сдвиг от начала выборки */
  offset: number;
}

export interface PagedResult<T> {
  /** Всего строк в выборке */
  total: number;
  /** Данные текущей страницы */
  data: T[];
}
