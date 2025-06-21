/** Вложение дефекта, загруженное на сервер */
export interface RemoteDefectFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  type: string;
  attachment_type_id: number | null;
  attachment_type_name?: string;
}

/** Новый файл для вложения дефекта */
export interface NewDefectFile {
  file: File;
  type_id: number | null;
}
