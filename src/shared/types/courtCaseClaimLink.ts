export interface CourtCaseClaimLink {
  /** Уникальный идентификатор связи */
  id: number;
  /** Идентификатор судебного дела */
  case_id: number;
  /** Идентификатор претензии */
  claim_id: number;
  /** Дата создания связи */
  created_at?: string | null;
}
