import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface DefectType { id: number; name: string }

export const useDefectTypes: () => UseQueryResult<DefectType[]>;
export const useAddDefectType: () => UseMutationResult<DefectType, Error, string>;
export const useUpdateDefectType: () => UseMutationResult<DefectType, Error, { id: number; name: string }>;
export const useDeleteDefectType: () => UseMutationResult<void, Error, number>;
