/** Вложение судебного дела, загруженное на сервер */
export interface RemoteCaseFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  mime_type: string;
  /** Описание файла */
  description?: string | null;
}

/** Новый файл для вложения судебного дела */
export interface NewCaseFile {
  file: File;
  description?: string;
}
