/** Вложение претензии, загруженное на сервер */
export interface RemoteClaimFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  mime_type: string;
}

/** Новый файл для вложения претензии */
export interface NewClaimFile {
  file: File;
}
