// Тип для выполнения работ по подрядчику
export interface ContractorCompletion {
  id: number;
  larix_number: string;
  contractor_id: number | null;
  project_id: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Тип для создания нового выполнения
export interface ContractorCompletionCreate {
  larix_number: string;
  contractor_id: number;
  project_id: number;
  created_by?: string | null;
}

// Тип для обновления выполнения
export interface ContractorCompletionUpdate {
  larix_number?: string;
  contractor_id?: number;
  project_id?: number;
}

// Расширенный тип с данными из связанных таблиц
export interface ContractorCompletionWithDetails extends ContractorCompletion {
  contractorName?: string;
  projectName?: string;
  createdByName?: string;
  defectsCount?: number;
}

// Связь между выполнением и дефектом
export interface CompletionDefect {
  id: number;
  completion_id: number;
  defect_id: number;
  created_at: string;
}

// Тип для создания связи
export interface CompletionDefectCreate {
  completion_id: number;
  defect_id: number;
}
