/** Запись дефекта в базе данных */
export interface DefectRecord {
  /** Уникальный идентификатор */
  id: number;
  /** Описание дефекта */
  description: string;
  /** Тип дефекта */
  type_id: number | null;
  /** Статус дефекта */
  status_id: number | null;
  /** Проект */
  project_id: number;
  /** Основной объект */
  unit_id: number | null;
  /** Кто создал */
  created_by: string | null;
  /** Кто обновил */
  updated_by: string | null;
  /** Дата обновления */
  updated_at: string | null;
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
  /** УДАЛЕНО: Уникальный идентификатор судебного дела - поле удалено из БД */
  // case_uid_id?: number | null;
  /** Закрепленный инженер */
  engineer_id: string | null;
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
  /** Названия корпусов в виде массива */
  buildingNamesList?: string[];
  /** Корпуса, объединённые в строку */
  buildingNames?: string;
  /** Название типа дефекта */
  defectTypeName?: string;
  /** Название статуса дефекта */
  defectStatusName?: string;
  /** Цвет статуса */
  defectStatusColor?: string | null;
  /** Название исполнителя */
  fixByName?: string;
  /** Имя закрепленного инженера */
  engineerName?: string | null;
  /** Пользователь, подтвердивший устранение */
  fixedByUserName?: string | null;
  /** Идентификаторы проектов, связанные с замечаниями */
  projectIds?: number[];
  /** Названия проектов, объединённые в строку */
  projectNames?: string;
  /** Прошло дней с даты получения */
  days?: number | null;
  /** Есть ли среди связанных претензий досудебная */
  hasPretrialClaim?: boolean;
  /** Имя автора создания дефекта */
  createdByName?: string | null;
  /** Количество прикрепленных файлов */
  filesCount?: number;
}
