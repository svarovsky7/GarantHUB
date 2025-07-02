export interface StatusCount {
  statusId: number | null;
  statusName: string | null;
  count: number;
}

export interface UserStats {
  claimCount: number;
  defectCount: number;
  claimStatusCounts: StatusCount[];
  defectStatusCounts: StatusCount[];
}
