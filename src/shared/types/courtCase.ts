export interface Letter {
  id: number;
  case_id: number;
  number: string;
  date: string;
  content: string;
}

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
  number: string;
  plaintiff_id: number;
  defendant_id: number;
  responsible_lawyer_id: string | null;
  court: string;
  status: number;
  fix_start_date?: string | null;
  fix_end_date?: string | null;
  description: string;
  claim_amount?: number | null;
  letters: Letter[];
  defects: Defect[];
}
