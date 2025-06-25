export interface ClaimDefect {
  /** Идентификатор претензии */
  claim_id: number;
  /** Идентификатор дефекта */
  defect_id: number;
  /** Досудебная претензия */
  pre_trial_claim: boolean;
}
