import {
  useStatuses,
  useAddStatus,
  useUpdateStatus,
  useDeleteStatus,
} from './status';
import type { ClaimStatus } from '@/shared/types/claimStatus';

const ENTITY = 'claim';

/**
 * Хук получения списка статусов претензии.
 */
export const useClaimStatuses = () => useStatuses<ClaimStatus>(ENTITY);

/**
 * Хук обновления статуса претензии.
 */
export const useUpdateClaimStatus = () =>
  useUpdateStatus<ClaimStatus>(ENTITY);

/**
 * Хук добавления статуса претензии.
 */
export const useAddClaimStatus = () => useAddStatus<ClaimStatus>(ENTITY);

/**
 * Хук удаления статуса претензии.
 */
export const useDeleteClaimStatus = () => useDeleteStatus(ENTITY);
