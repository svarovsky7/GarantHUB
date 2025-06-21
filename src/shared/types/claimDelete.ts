/** Параметры удаления претензии */
export interface ClaimDeleteParams {
  /** Идентификатор претензии */
  id: number;
  /** Идентификаторы связанных тикетов */
  ticketIds?: number[];
}
