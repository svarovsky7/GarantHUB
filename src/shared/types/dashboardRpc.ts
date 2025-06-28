export interface DashboardRpcParams {
  /** Идентификаторы проектов */
  projectIds: number[];
  /** Статус закрытой претензии */
  closedClaimStatusId: number | null;
  /** Статус закрытого дефекта */
  closedDefectStatusId: number | null;
}

