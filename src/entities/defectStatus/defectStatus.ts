import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from '@/entities/status';
import type { DefectStatus } from '@/shared/types/defectStatus';

const ENTITY = 'defect';
export const useDefectStatuses = () => useStatuses<DefectStatus>(ENTITY);

export const useAddDefectStatus = () => useAddStatus<DefectStatus>(ENTITY);

export const useUpdateDefectStatus = () =>
  useUpdateStatus<DefectStatus>(ENTITY);

export const useDeleteDefectStatus = () => useDeleteStatus(ENTITY);
