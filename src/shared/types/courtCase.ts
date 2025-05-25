export interface Letter {
  id: string;
  number: string;
  date: string;
  content: string;
}

export interface Defect {
  id: string;
  name: string;
  location: string;
  description: string;
  cost: number;
  duration?: number | null;
}

export type CaseStatus = 'active' | 'won' | 'lost' | 'settled';

export interface CourtCase {
  id: string;
  number: string;
  date: string;
  projectObject: string;
  plaintiff: string;
  defendant: string;
  responsibleLawyer: string;
  court: string;
  status: CaseStatus;
  claimAmount: number;
  remediationStartDate?: string;
  remediationEndDate?: string;
  description: string;
  letters: Letter[];
  defects: Defect[];
}
