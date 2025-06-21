/** Вложение претензии, загруженное на сервер */
export interface RemoteClaimFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

/** Новый файл для вложения претензии */
export interface NewClaimFile {
  file: File;
  type_id: number | null;
}
