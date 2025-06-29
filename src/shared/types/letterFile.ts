/** Вложение письма, загруженное на сервер */
export interface RemoteLetterFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  mime_type: string;
  /** Описание файла */
  description?: string | null;
}

/** Новый файл для вложения письма */
export interface NewLetterFile {
  file: File;
  description?: string;
}
