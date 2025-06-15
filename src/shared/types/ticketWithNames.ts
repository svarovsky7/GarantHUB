import type { Ticket } from '@/entities/ticket';

/** Замечание с дополнительными именами пользователей */
export interface TicketWithNames extends Ticket {
  /** Имя ответственного инженера */
  responsibleEngineerName: string | null;
  /** Имя автора замечания */
  createdByName: string | null;
  /** Все дефекты по данному замечанию устранены */
  allDefectsFixed?: boolean;
}
