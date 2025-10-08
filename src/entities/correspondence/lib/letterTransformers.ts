import { supabase } from '@/shared/api/supabaseClient';
import type { CorrespondenceAttachment } from '@/shared/types/correspondence';

const ATTACH_BUCKET = import.meta.env.VITE_ATTACH_BUCKET || 'attachments';

/**
 * Извлекает имя файла из storage_path с декодированием.
 */
export function extractFileName(storagePath: string, originalName?: string | null): string {
  if (originalName) return originalName;
  try {
    return decodeURIComponent(
      storagePath.split('/').pop()?.replace(/^\d+_/, '') || storagePath
    );
  } catch {
    return storagePath;
  }
}

/**
 * Преобразует вложение из БД в формат CorrespondenceAttachment.
 */
export function transformAttachment(file: any): CorrespondenceAttachment {
  const name = extractFileName(file.storage_path, file.original_name);
  return {
    id: String(file.id),
    name,
    mime_type: file.file_type,
    storage_path: file.storage_path,
    path: file.file_url || file.path,
  } as CorrespondenceAttachment;
}

/**
 * Создает подписанный URL для скачивания файла.
 */
export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Создает подписанный URL для предпросмотра файла (без принудительного скачивания).
 */
export async function signedUrlForPreview(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
