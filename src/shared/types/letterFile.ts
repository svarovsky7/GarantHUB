/** Вложение письма, загруженное на сервер */
export interface RemoteLetterFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

/** Новый файл для вложения письма */
export interface NewLetterFile {
  file: File;
  type_id: number | null;
}
