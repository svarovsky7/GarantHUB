import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from '@/entities/status';
import type { ClaimStatus } from '@/shared/types/claimStatus';

const ENTITY = 'claim';

/**
 * Хук получения списка статусов претензии.
 */
export const useClaimStatuses = () => useStatuses(ENTITY);

/**
 * Хук обновления статуса претензии.
 */
export const useUpdateClaimStatus = () =>
  useUpdateStatus();

/**
 * Хук добавления статуса претензии.
 */
export const useAddClaimStatus = () => useAddStatus();

/**
 * Хук удаления статуса претензии.
 */
export const useDeleteClaimStatus = () => useDeleteStatus();
