export interface CaseClaimLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор судебного дела */
  case_id: number;
  /** Идентификатор претензии */
  claim_id: number;
}
