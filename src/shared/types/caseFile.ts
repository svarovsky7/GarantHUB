/** Вложение судебного дела, загруженное на сервер */
export interface RemoteCaseFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

/** Новый файл для вложения судебного дела */
export interface NewCaseFile {
  file: File;
  type_id: number | null;
}
