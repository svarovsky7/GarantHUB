export interface CorrespondenceLetter {
  /** Идентификатор письма */
  id: string;
  /** Тип письма: входящее или исходящее */
  type: 'incoming' | 'outgoing';
  /** Идентификатор ответственного пользователя */
  responsible_user_id: string | null;
  /** Идентификатор категории письма */
  letter_type_id: number | null;
  /** Проект */
  project_id: number | null;
  /** Объект проекта */
  unit_id: number | null;

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
