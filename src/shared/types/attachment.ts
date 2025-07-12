export interface Attachment {
  id: number;
  /** Путь к файлу в Storage */
  storage_path: string;
  /** Путь для скачивания */
  path?: string;
  /** URL для скачивания */
  file_url?: string;
  /** MIME‑тип файла */
  mime_type?: string;
  /** Тип файла */
  file_type?: string;
  /** Исходное имя файла */
  original_name: string | null;
  /** Описание файла */
  description: string | null;
  /** Кто добавил файл */
  created_by: string | null;
  /** Когда добавлен */
  created_at: string | null;
  /** УДАЛЕНО: Кто загрузил файл - поле удалено из БД для оптимизации */
  // uploaded_by?: string | null;
  /** Когда обновлён */
  updated_at?: string | null;
}
