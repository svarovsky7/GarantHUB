export interface CorrespondenceLetter {
  /** Идентификатор письма */
  id: string;
  /** Тип письма: входящее или исходящее */
  type: 'incoming' | 'outgoing';

  /** Идентификатор родительского письма */
  parent_id: string | null;

  /** Идентификатор ответственного пользователя */
  responsible_user_id: string | null;
  /** Идентификатор категории письма */
  letter_type_id: number | null;
  /** Проект */
  project_id: number | null;
  /** Объекты проекта */
  unit_ids: number[];


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

  /** Загруженные файлы */
  attachments: CorrespondenceAttachment[];
}

export interface CorrespondenceAttachment {
  /** Уникальный идентификатор вложения */
  id: string;
  /** Имя файла */
  name: string;
  /** MIME‑тип файла */
  file_type: string;
  /** Путь к файлу в хранилище */
  storage_path: string;
  /** Публичная ссылка на файл */
  file_url: string;
  /** Тип вложения */
  attachment_type_id: number | null;
}
