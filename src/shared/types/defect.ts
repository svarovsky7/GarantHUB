/** Запись дефекта в базе данных */
export interface DefectRecord {
  /** Уникальный идентификатор */
  id: number;
  /** Описание дефекта */
  description: string;
  /** Тип дефекта */
  defect_type_id: number | null;
  /** Статус дефекта */
  defect_status_id: number | null;
  /** Исполнитель - бригада */
  brigade_id: number | null;
  /** Исполнитель - подрядчик */
  contractor_id: number | null;
  /** Гарантийный дефект */
  is_warranty: boolean;
  /** Дата получения */
  received_at: string | null;
  /** Дата устранения */
  fixed_at: string | null;
  /** Пользователь, подтвердивший устранение */
  fixed_by: string | null;
  /** Дата создания */
  created_at: string | null;
}

/** Дефект с дополнительной информацией для отображения */
export interface DefectWithInfo extends DefectRecord {
  /** ID претензий, связанных с дефектом */
  claimIds: number[];
  /** Идентификаторы объектов, связанные с замечаниями */
  unitIds: number[];
  /** Названия объектов, объединённые в строку */
  unitNames?: string;
  /** Названия объектов в виде массива */
  unitNamesList?: string[];
  /** Название типа дефекта */
  defectTypeName?: string;
  /** Название статуса дефекта */
  defectStatusName?: string;
  /** Цвет статуса */
  defectStatusColor?: string | null;
  /** Название исполнителя */
  fixByName?: string;
  /** Пользователь, подтвердивший устранение */
  fixedByUserName?: string | null;
  /** Идентификаторы проектов, связанные с замечаниями */
  projectIds?: number[];
  /** Названия проектов, объединённые в строку */
  projectNames?: string;
  /** Прошло дней с даты получения */
  days?: number | null;
}
