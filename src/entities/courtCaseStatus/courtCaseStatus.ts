// src/entities/courtCaseStatus.ts
// -----------------------------------------------------------------------------
// Справочник стадий судебного дела (глобальный, без project_id)
// -----------------------------------------------------------------------------
import {
    useStatuses,
    useAddStatus,
    useUpdateStatus,
    useDeleteStatus,
} from '@/entities/status';
import type { CourtCaseStatus } from '@/shared/types/courtCaseStatus';

const ENTITY = 'court_case';

/** Получить список стадий судебного дела */
export const useCourtCaseStatuses = () =>
    useStatuses(ENTITY);

/** Добавить стадию судебного дела */
export const useAddCourtCaseStatus = () =>
    useAddStatus();

/** Обновить стадию судебного дела */
export const useUpdateCourtCaseStatus = () =>
    useUpdateStatus();

/** Удалить стадию судебного дела */
export const useDeleteCourtCaseStatus = () =>
    useDeleteStatus();
