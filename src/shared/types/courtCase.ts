export interface Letter {
  id: number;
  case_id: number;
  number: string;
  letter_date: string;
  content: string;
}

export interface Defect {
  id: number;
  case_id: number;
  name: string;
  location: string | null;
  description: string;
  cost: number;
  duration?: number | null;
}

export type CaseStatus = 'active' | 'won' | 'lost' | 'settled';

export interface CourtCase {
  id: number;
  project_id: number;
  number: string;
  date: string;
  project_object: string;
  plaintiff: string;
  defendant: string;
  responsible_lawyer: string;
  court: string;
  status: CaseStatus;
  claim_amount: number;
  remediation_start_date?: string | null;
  remediation_end_date?: string | null;
  description: string;
}
