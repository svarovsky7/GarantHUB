import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from '@/entities/status';
import type { LetterStatus } from '@/shared/types/letterStatus';
const ENTITY = 'letter';

export const useLetterStatuses = () => useStatuses(ENTITY);

export const useAddLetterStatus = () => useAddStatus();

export const useUpdateLetterStatus = () =>
  useUpdateStatus();

export const useDeleteLetterStatus = () => useDeleteStatus();
