import type { Attachment } from "./attachment";
import type { DocumentFolder } from "./documentFolder";

// Используем существующую таблицу attachments
// Для документов используем специальный префикс в storage_path: "documents/"
// Заголовок документа храним в поле original_name
export type Document = Attachment & {
  title: string; // Будет храниться в original_name
  folder_id?: number; // ID папки документа
};

export interface DocumentWithAuthor extends Document {
  authorName?: string;
  file_size?: number | null; // Размер файла получаем асинхронно
  folders?: DocumentFolder[]; // Информация о папках (множественные)
}

export interface DocumentFormData {
  title: string;
  description?: string;
  file: File;
  folder_ids?: number[]; // ID папок для нового документа (множественные)
}