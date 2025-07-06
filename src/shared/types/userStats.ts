export interface StatusCount {
  statusId: number | null;
  statusName: string | null;
  count: number;
}

export interface UserStats {
  claimCount: number;
  defectCount: number;
  claimResponsibleCount: number;
  defectResponsibleCount: number;
  courtCaseCount: number;
  courtCaseResponsibleCount: number;
  claimStatusCounts: StatusCount[];
  claimResponsibleStatusCounts: StatusCount[];
  defectStatusCounts: StatusCount[];
  defectResponsibleStatusCounts: StatusCount[];
  courtCaseStatusCounts: StatusCount[];
}
