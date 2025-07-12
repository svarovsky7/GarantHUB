import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import type { Attachment } from '@/shared/types/attachment';

interface UploadResult {
  path: string;
  type: string;
  url: string;
}

interface FileToUpload {
  file: File;
  type_id?: number | null;
  description?: string | null;
}

let ATTACH_BUCKET =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATTACH_BUCKET) ||
    process.env.REACT_APP_ATTACH_BUCKET ||
    'attachments';

// На практике переменная может по ошибке содержать полный URL вроде
// "https://.../storage/v1/s3". В этом случае используем только название корзины
// (последний сегмент пути), чтобы избежать обращения к несуществующему bucket.
try {
    if (ATTACH_BUCKET.includes('://')) {
        const { pathname } = new URL(ATTACH_BUCKET);
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length) ATTACH_BUCKET = parts[parts.length - 1];
    }
} catch {
    /* ignore invalid URL */
}

// Если из переменной окружения получилось название «s3», это скорее всего
// базовый путь без указания корзины.  В таком случае переключаемся на
// используемую в проекте корзину «attachments».
if (ATTACH_BUCKET.toLowerCase() === 's3') {
    ATTACH_BUCKET = 'attachments';
}

export const slugify = (str: string): string =>
    str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[А-ЯЁ]/gi, (c) => {
            const map: Record<string, string> = {
                а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
                з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
                п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
                ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
                ю: 'yu', я: 'ya',
            };
            return map[c.toLowerCase()] ?? '';
        })
        .replace(/[^0-9a-z._/-]+/gi, '_')
        .replace(/_+/g, '_')
        .toLowerCase();

async function upload(file: File, pathPrefix: string): Promise<UploadResult> {
    const safe = slugify(file.name);
    const path = `${pathPrefix}/${Date.now()}_${safe}`;

    const { error } = await supabase
        .storage.from(ATTACH_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

    if (error?.message?.includes('Bucket not found')) {
        throw new Error(`Storage bucket «${ATTACH_BUCKET}» отсутствует.`);
    }
    if (error) throw error;

    const {
        data: { publicUrl },
    } = supabase.storage.from(ATTACH_BUCKET).getPublicUrl(path);

    return { path, type: file.type, url: publicUrl };
}

/**
 * Загружает файл письма в хранилище Supabase.
 */
export function uploadLetterAttachment(file: File, letterId: number): Promise<UploadResult> {
    return upload(file, `letters/${letterId}`);
}

// Загрузка вложений дела теперь привязана к идентификатору дела,
// чтобы все файлы хранились в `attachments/case/<caseId>`
export function uploadCaseAttachment(file: File, caseId: number): Promise<UploadResult> {
    return upload(file, `case/${caseId}`);
}

/**
 * Загружает файл замечания в хранилище Supabase.
 */
export function uploadTicketAttachment(file: File, projectId: number, ticketId: number): Promise<UploadResult> {
    // Файлы замечания храним в каталоге `tickets/<ticketId>` вне зависимости от проекта
    return upload(file, `tickets/${ticketId}`);
}

/**
 * Загружает файл претензии в хранилище Supabase.
 */
export function uploadClaimAttachment(file: File, claimId: number): Promise<UploadResult> {
    return upload(file, `claims/${claimId}`);
}

/**
 * Загружает файл дефекта в хранилище Supabase.
 */
export function uploadDefectAttachment(file: File, defectId: number): Promise<UploadResult> {
    return upload(file, `defects/${defectId}`);
}

/**
 * Загружает файлы дела и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 */
export async function addCaseAttachments(files: FileToUpload[], caseId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadCaseAttachment(file, caseId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы письма и создаёт записи в таблице attachments.
 */
export async function addLetterAttachments(files: FileToUpload[], letterId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadLetterAttachment(file, letterId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы замечания и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 */
export async function addTicketAttachments(files: FileToUpload[], projectId: number, ticketId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadTicketAttachment(file, projectId, ticketId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы претензии и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 */
export async function addClaimAttachments(files: FileToUpload[], claimId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadClaimAttachment(file, claimId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы дефекта и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 */
export async function addDefectAttachments(files: FileToUpload[], defectId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadDefectAttachment(file, defectId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;
    return data ?? [];
}

/**
 * Возвращает вложения по указанным id
 */
export async function getAttachmentsByIds(ids: number[]): Promise<Attachment[]> {
    if (!ids.length) return [];
    const { data, error } = await supabase
        .from('attachments')
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by')
        .in('id', ids);

    if (error) throw error;
    return data ?? [];
}

export async function addUnitAttachments(files: FileToUpload[], unitId: number): Promise<Attachment[]> {
    const userId = useAuthStore.getState().profile?.id ?? null;
    const uploaded = await Promise.all(
        files.map(({ file }) => upload(file, `units/${unitId}`)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        created_by: userId,
        uploaded_by: userId,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by');

    if (error) throw error;

    const ids = (data ?? []).map((r) => r.id);
    if (ids.length) {
        const linkRows = ids.map((id) => ({ unit_id: unitId, attachment_id: id }));
        const { error: linkErr } = await supabase.from('unit_attachments').insert(linkRows);
        if (linkErr) throw linkErr;
    }
    return data ?? [];
}

export async function updateAttachmentDescription(id: number, description: string): Promise<void> {
    const { error } = await supabase
        .from('attachments')
        .update({ description })
        .eq('id', id);
    if (error) throw error;
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
    const { data, error } = await supabase.storage
        .from(ATTACH_BUCKET)
        .createSignedUrl(path, 60, { download: filename || undefined });
    if (error) throw error;
    return data.signedUrl;
}

export async function getFileSize(path: string): Promise<number | null> {
    try {
        const { data, error } = await supabase.storage
            .from(ATTACH_BUCKET)
            .createSignedUrl(path, 60);
        if (error) throw error;
        const res = await fetch(data.signedUrl, { method: 'HEAD' });
        const len = res.headers.get('content-length');
        return len ? Number(len) : null;
    } catch {
        return null;
    }
}

export { ATTACH_BUCKET };