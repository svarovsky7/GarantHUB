import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface TicketType { id: number; name: string }

export const useTicketTypes: () => UseQueryResult<TicketType[]>;
export const useAddTicketType: () => UseMutationResult<TicketType, Error, string>;
export const useUpdateTicketType: () => UseMutationResult<TicketType, Error, { id: number; name: string }>;
export const useDeleteTicketType: () => UseMutationResult<void, Error, number>;
