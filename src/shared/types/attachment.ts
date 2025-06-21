export interface Attachment {
  id: number;
  /** Путь к файлу в Storage */
  storage_path: string;
  /** Публичная ссылка на файл */
  file_url: string;
  /** MIME‑тип файла */
  file_type: string;
  /** Тип вложения */
  attachment_type_id: number | null;
  /** Исходное имя файла */
  original_name: string | null;
}
