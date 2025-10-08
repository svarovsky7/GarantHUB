import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from '@/entities/status';
import type { DefectStatus } from '@/shared/types/defectStatus';

const ENTITY = 'defect';
export const useDefectStatuses = () => useStatuses(ENTITY);

export const useAddDefectStatus = () => useAddStatus();

export const useUpdateDefectStatus = () =>
  useUpdateStatus();

export const useDeleteDefectStatus = () => useDeleteStatus();
