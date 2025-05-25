export interface CorrespondenceLetter {
  /** Идентификатор письма */
  id: string;
  /** Тип письма: входящее или исходящее */
  type: 'incoming' | 'outgoing';
  /** Номер письма */
  number: string;
  /** Дата письма ISO */
  date: string;
  /** Корреспондент */
  correspondent: string;
  /** Тема письма */
  subject: string;
  /** Содержание письма */
  content: string;
}
