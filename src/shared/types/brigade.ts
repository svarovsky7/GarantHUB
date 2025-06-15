export interface Brigade {
  id: number;
  /** Наименование бригады */
  name: string;
  /** Дополнительное описание */
  description?: string | null;
  /** Дата создания записи */
  created_at?: string | null;
}
