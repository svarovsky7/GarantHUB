import type { Attachment } from "./attachment";

// Используем существующую таблицу attachments
// Для документов используем специальный префикс в storage_path: "documents/"
// Заголовок документа храним в поле original_name
export type Document = Attachment & {
  title: string; // Будет храниться в original_name
};

export interface DocumentWithAuthor extends Document {
  authorName?: string;
  file_size?: number | null; // Размер файла получаем асинхронно
}

export interface DocumentFormData {
  title: string;
  description?: string;
  file: File;
}