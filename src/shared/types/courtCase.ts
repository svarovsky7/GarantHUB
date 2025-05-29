
export interface Defect {
  id: number;
  name: string;
  location: string;
  description: string;
  cost: number;
  duration?: number | null;
}

export type CaseStatus = 'active' | 'won' | 'lost' | 'settled';

export interface CourtCase {
  id: number;
  project_id: number;
  unit_id: number | null;
  date: string;
  number: string;
  plaintiff_id: number;
  defendant_id: number;
  responsible_lawyer_id: string | null;
  status: number;
  fix_start_date?: string | null;
  fix_end_date?: string | null;
  description: string;
  claim_amount?: number | null;
  defects: Defect[];
}
