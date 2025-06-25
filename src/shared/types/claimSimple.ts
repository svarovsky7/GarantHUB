export interface ClaimSimple {
  /** Уникальный идентификатор претензии */
  id: number;
  /** Проект, к которому относится претензия */
  project_id: number;
  /** Связанные объекты */
  unit_ids: number[];
  /** Идентификаторы связанных дефектов */
  defect_ids: number[];
  /** Связанные дефекты с признаком официальности */
  claim_defects: import('./claimDefect').ClaimDefect[];
}
