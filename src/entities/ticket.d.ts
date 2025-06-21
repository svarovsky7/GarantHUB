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
  statusId: number | null;
  projectName: string;
  unitNames: string;
  defectIds: number[];
  statusName: string;
  statusColor: string | null;
  title: string;
  description: string | null;
  customerRequestNo: string | null;
  customerRequestDate: Dayjs | null;
  responsibleEngineerId: string | null;
  createdBy: string | null;
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
export function useTicketsSimpleAll(): UseQueryResult<Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>>;
export function useTicketsSimple(): UseQueryResult<Array<{ id: number; project_id: number; unit_ids: number[]; defect_ids: number[] }>>;
export function useUpdateTicket(): UseMutationResult<any, Error, { id: number; updates: object }>;
export function useUpdateTicketStatus(): UseMutationResult<any, Error, { id: number; statusId: number; projectId?: number }>;

export function useTicketLinks(): UseQueryResult<TicketLink[]>;

export function useLinkTickets(): UseMutationResult<void, Error, { parentId: string; childIds: string[] }>;

export function useUnlinkTicket(): UseMutationResult<void, Error, string>;
