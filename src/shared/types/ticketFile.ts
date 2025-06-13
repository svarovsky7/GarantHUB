/** Вложение замечания, загруженное на сервер */
export interface RemoteTicketFile {
  id: string | number;
  name: string;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

/** Новый файл для вложения замечания */
export interface NewTicketFile {
  file: File;
  type_id: number | null;
}
