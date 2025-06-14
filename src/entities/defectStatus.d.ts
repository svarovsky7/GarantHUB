import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface DefectStatus { id: number; name: string }

export const useDefectStatuses: () => UseQueryResult<DefectStatus[]>;
export const useAddDefectStatus: () => UseMutationResult<DefectStatus, Error, Omit<DefectStatus, 'id'>>;
export const useUpdateDefectStatus: () => UseMutationResult<DefectStatus, Error, { id: number; updates: Partial<DefectStatus> }>;
export const useDeleteDefectStatus: () => UseMutationResult<number, Error, number>;
