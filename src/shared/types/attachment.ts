export interface Attachment {
  id: number;
  /** Путь к файлу в Storage */
  storage_path: string;
  /** Путь к файлу */
  path: string;
  /** MIME‑тип файла */
  mime_type: string;
  /** Исходное имя файла */
  original_name: string | null;
  /** Кто загрузил */
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  updated_at?: string | null;
}
