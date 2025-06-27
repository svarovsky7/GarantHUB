export interface UnitsMatrixData {
  /** Список квартир корпуса */
  units: import('./unit').Unit[];
  /** Список этажей */
  floors: Array<string | number>;
  /** Квартиры по этажам */
  unitsByFloor: Record<string | number, import('./unit').Unit[]>;
  /** Активные судебные дела по квартирам */
  casesByUnit: Record<string | number, Array<{ id: number }>>;
  /** Наличие писем по квартирам */
  lettersByUnit: Record<string | number, boolean>;
  /** Информация о претензиях по квартирам */
  claimsByUnit: Record<string | number, import('./unitClaimInfo').UnitClaimInfo>;
  /** Общее количество квартир в корпусе */
  total: number;
}
