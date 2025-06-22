/** Связь претензий: parent_id - родительская претензия, child_id - дочерняя */
export interface ClaimLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор родительской претензии */
  parent_id: string;
  /** Идентификатор дочерней претензии */
  child_id: string;
}
