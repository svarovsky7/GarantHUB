/** Вложение замечания, загруженное на сервер */
export interface RemoteTicketFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  mime_type: string;
}

/** Новый файл для вложения замечания */
export interface NewTicketFile {
  file: File;
}
