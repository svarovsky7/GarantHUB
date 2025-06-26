export interface ProjectStats {
  /** ID проекта */
  projectId: number;
  /** Название проекта */
  projectName: string;
  /** Количество объектов */
  unitCount: number;
  /** Количество дефектов */
  defectTotal: number;
  /** Количество писем */
  letterCount: number;
}

export interface DashboardStats {
  /** Статистика по проектам */
  projects: ProjectStats[];
  /** Количество открытых претензий */
  claimsOpen: number;
  /** Количество закрытых претензий */
  claimsClosed: number;
  /** Количество открытых дефектов */
  defectsOpen: number;
  /** Количество закрытых дефектов */
  defectsClosed: number;
  /** Количество судебных дел */
  courtCases: number;
  /** Претензии по объектам */
  claimsByUnit: Array<{ unitName: string; count: number }>;
  /** Претензии по закрепленным инженерам */
  claimsByEngineer: Array<{ engineerName: string; count: number }>;
  /** Дефекты по закрепленным инженерам */
  defectsByEngineer: Array<{ engineerName: string; count: number }>;
}
