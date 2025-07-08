import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from '@/entities/status';
import type { LetterStatus } from '@/shared/types/letterStatus';
const ENTITY = 'letter';

export const useLetterStatuses = () => useStatuses<LetterStatus>(ENTITY);

export const useAddLetterStatus = () => useAddStatus<LetterStatus>(ENTITY);

export const useUpdateLetterStatus = () =>
  useUpdateStatus<LetterStatus>(ENTITY);

export const useDeleteLetterStatus = () => useDeleteStatus(ENTITY);
