export type CasePartyRole = 'plaintiff' | 'defendant';

export interface CourtCaseParty {
  id: number;
  case_id: number;
  person_id?: number | null;
  contractor_id?: number | null;
  project_id: number;
  role: CasePartyRole;
  created_at?: string | null;
}
