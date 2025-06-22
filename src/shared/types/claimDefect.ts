export interface ClaimDefect {
  /** Идентификатор претензии */
  claim_id: number;
  /** Идентификатор дефекта */
  defect_id: number;
  /** Дефект по официальной претензии */
  is_official?: boolean;
}
