/** Запись дефекта в базе данных */
export interface DefectRecord {
  /** Уникальный идентификатор */
  id: number;
  /** Проект, к которому относится дефект */
  project_id: number;
  /** Описание дефекта */
  description: string;
  /** Стоимость устранения */
  fix_cost: number | null;
  /** Дата создания */
  created_at: string | null;
}

/** Дефект с дополнительной информацией для отображения */
export interface DefectWithInfo extends DefectRecord {
  /** ID замечаний, содержащих данный дефект */
  ticketIds: number[];
  /** Идентификаторы объектов, связанные с замечаниями */
  unitIds: number[];
  /** Название проекта */
  projectName?: string;
  /** Названия объектов, объединённые в строку */
  unitNames?: string;
}
