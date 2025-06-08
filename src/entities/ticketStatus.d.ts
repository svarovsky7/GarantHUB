import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface TicketStatus { id: number; name: string; color: string | null }

export const useTicketStatuses: () => UseQueryResult<TicketStatus[]>;
export const useAddTicketStatus: () => UseMutationResult<TicketStatus, Error, any>;
export const useUpdateTicketStatus: () => UseMutationResult<TicketStatus, Error, { id: number; updates: any }>;
export const useDeleteTicketStatus: () => UseMutationResult<number, Error, number>;
