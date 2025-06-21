/** Вложение судебного дела, загруженное на сервер */
export interface RemoteCaseFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  mime_type: string;
}

/** Новый файл для вложения судебного дела */
export interface NewCaseFile {
  file: File;
}
