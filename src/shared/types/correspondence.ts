export interface CorrespondenceLetter {
  /** Идентификатор письма */
  id: string;
  /** Тип письма: входящее или исходящее */
  type: 'incoming' | 'outgoing';

  /** Идентификатор родительского письма */
  parent_id: string | null;

  /** Идентификатор ответственного пользователя */
  responsible_user_id: string | null;
  /** Статус письма */
  status_id?: number | null;
  /** Идентификатор категории письма */
  letter_type_id: number | null;
  /** Проект */
  project_id: number | null;
  /** Объекты проекта */
  unit_ids: number[];
  /** Идентификаторы вложений */
  attachment_ids?: number[];


  /** Номер письма */
  number: string;
  /** Дата письма ISO */
  date: string;
  /** Отправитель письма */
  sender: string;
  /** Получатель письма */
  receiver: string;
  /** ID отправителя, если это физлицо */
  sender_person_id?: number | null;
  /** ID отправителя, если это контрагент */
  sender_contractor_id?: number | null;
  /** ID получателя, если это физлицо */
  receiver_person_id?: number | null;
  /** ID получателя, если это контрагент */
  receiver_contractor_id?: number | null;
  /** Тема письма */
  subject: string;
  /** Содержание письма */
  content: string;

  /** Пользователь, создавший письмо */
  created_by?: string | null;
  /** Дата создания письма */
  created_at?: string | null;

  /** Загруженные файлы */
  attachments: CorrespondenceAttachment[];
}

export interface CorrespondenceAttachment {
  /** Уникальный идентификатор вложения */
  id: string;
  /** Имя файла */
  name: string;
  /** MIME‑тип файла */
  mime_type: string;
  /** Путь к файлу в хранилище */
  storage_path: string;
  /** Публичная ссылка на файл */
  path: string;
}

/** Связь писем: parent_id - родительское письмо, child_id - дочернее */
export interface LetterLink {
  /** Уникальный идентификатор связи */
  id: string;
  /** Идентификатор родительского письма */
  parent_id: string;
  /** Идентификатор дочернего письма */
  child_id: string;
}
