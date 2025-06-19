export interface CourtCaseClaim {
  id: number;
  /** Идентификатор судебного дела */
  case_id: number;
  /** Вид искового требования */
  claim_type_id: number;
  /** Сумма заявленного требования */
  claimed_amount: number | null;
  /** Сумма, подтверждённая судом */
  confirmed_amount: number | null;
  /** Сумма, оплаченная Застройщиком */
  paid_amount: number | null;
  /** Сумма, согласованная к оплате */
  agreed_amount: number | null;
}
