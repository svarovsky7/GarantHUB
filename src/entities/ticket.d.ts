import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import type { TicketLink } from '@/shared/types/ticket';

export interface TicketAttachment {
  id: number | string;
  /** Путь к файлу в Supabase Storage */
  path: string;
  /** Отображаемое имя файла */
  name: string;
  /** Публичный URL */
  url: string;
  /** MIME‑тип */
  type: string;
  /** Тип вложения */
  attachment_type_id: number | null;
  /** Название типа вложения */
  attachment_type_name?: string;
}

export interface Ticket {
  id: number;
  /** Идентификатор родительского замечания */
  parentId: number | null;
  projectId: number;
  unitIds: number[];
  typeId: number | null;
  statusId: number | null;
  projectName: string;
  unitNames: string;
  typeName: string;
  statusName: string;
  statusColor: string | null;
  title: string;
  description: string | null;
  customerRequestNo: string | null;
  customerRequestDate: Dayjs | null;
  responsibleEngineerId: string | null;
  createdBy: string | null;
  isWarranty: boolean;
  isClosed: boolean;
  hasAttachments: boolean;
  attachments: TicketAttachment[];
  createdAt: Dayjs | null;
  receivedAt: Dayjs | null;
  fixedAt: Dayjs | null;
}

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
export function useUpdateTicket(): UseMutationResult<any, Error, { id: number; updates: object }>;
export function useUpdateTicketStatus(): UseMutationResult<any, Error, { id: number; statusId: number }>;
export function useUpdateTicketClosed(): UseMutationResult<any, Error, { id: number; isClosed: boolean }>;

export function useTicketLinks(): UseQueryResult<TicketLink[]>;

export function useLinkTickets(): UseMutationResult<void, Error, { parentId: string; childIds: string[] }>;

export function useUnlinkTicket(): UseMutationResult<void, Error, string>;
