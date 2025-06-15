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
  /** Дата получения */
  received_at: string | null;
  /** Дата устранения */
  fixed_at: string | null;
  /** Дата создания */
  created_at: string | null;
}

/** Дефект с дополнительной информацией для отображения */
export interface DefectWithInfo extends DefectRecord {
  /** ID замечаний, содержащих данный дефект */
  ticketIds: number[];
  /** Идентификаторы объектов, связанные с замечаниями */
  unitIds: number[];
  /** Названия объектов, объединённые в строку */
  unitNames?: string;
  /** Название типа дефекта */
  defectTypeName?: string;
  /** Название статуса дефекта */
  defectStatusName?: string;
  /** Название исполнителя */
  fixByName?: string;
  /** Идентификаторы проектов, связанные с замечаниями */
  projectIds?: number[];
  /** Названия проектов, объединённые в строку */
  projectNames?: string;
}
