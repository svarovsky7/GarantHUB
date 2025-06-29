export interface Attachment {
  id: number;
  /** Путь к файлу в Storage */
  storage_path: string;
  /** Путь для скачивания */
  path: string;
  /** MIME‑тип файла */
  mime_type: string;
  /** Исходное имя файла */
  original_name: string | null;
  /** Описание файла */
  description: string | null;
  /** Кто добавил файл */
  created_by: string | null;
  /** Когда добавлен */
  created_at: string | null;
  /** Кто загрузил файл */
  uploaded_by: string | null;
  /** Когда обновлён */
  updated_at: string | null;
}
