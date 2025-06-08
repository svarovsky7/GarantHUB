export interface Attachment {
  id: number;
  /** Путь к файлу в хранилище */
  storage_path: string;
  /** Публичная ссылка на файл */
  file_url: string;
  /** MIME‑тип файла */
  file_type: string;
  /** Тип вложения из справочника */
  attachment_type_id: number | null;
  /** Оригинальное имя файла */
  original_name: string | null;
}
