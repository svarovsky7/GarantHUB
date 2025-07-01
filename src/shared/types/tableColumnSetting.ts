export interface TableColumnSetting {
  /** Уникальный ключ столбца */
  key: string;
  /** Отображаемое название столбца */
  title: string;
  /** Виден ли столбец */
  visible: boolean;
  /** Текущая ширина столбца в пикселях */
  width?: number;
}
