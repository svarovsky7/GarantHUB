import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Ticket } from '@/shared/types/ticket';

export function signedUrl(path: string, filename?: string): Promise<string>;

export function useTickets(): UseQueryResult<Ticket[]>;

export function useCreateTicket(): UseMutationResult<any, Error, any>;

export function useTicket(ticketId: number | string | undefined): {
  data: Ticket | null | undefined;
  updateAsync: (vars: any) => Promise<any>;
  updating: boolean;
};

export function useDeleteTicket(): UseMutationResult<void, Error, number>;

export function useAllTicketsSimple(): UseQueryResult<Array<{ id: number; status_id: number }>>;
export function useTicketsStats(): UseQueryResult<any[]>;
export function useUpdateTicketStatus(): UseMutationResult<any, Error, { id: number; statusId: number }>;
export function useUpdateTicketClosed(): UseMutationResult<any, Error, { id: number; isClosed: boolean }>;
