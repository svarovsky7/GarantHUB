export interface HistoryEvent {
  /** Уникальный идентификатор записи */
  id: number;
  /** Проект, к которому относится объект */
  project_id: number;
  /** Идентификатор объекта */
  unit_id: number;
  /** Тип сущности: ticket, letter или court_case */
  entity_type: 'ticket' | 'letter' | 'court_case';
  /** Идентификатор сущности */
  entity_id: number;
  /** Тип изменения */
  action: 'created' | 'updated' | 'deleted';
  /** Пользователь, внесший изменение */
  changed_by: string | null;
  /** Дата изменения ISO */
  changed_at: string;
}

/** Запись истории с именем пользователя */
export interface HistoryEventWithUser extends HistoryEvent {
  /** Имя пользователя, инициировавшего изменение */
  user_name: string | null;
}
