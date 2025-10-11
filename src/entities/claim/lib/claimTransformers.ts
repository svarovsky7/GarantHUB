import { supabase } from '@/shared/api/supabaseClient';
import { ATTACH_BUCKET } from '@/entities/attachment';

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

export async function signedUrlForPreview(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
