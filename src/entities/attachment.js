import { supabase } from '@/shared/api/supabaseClient';

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

export const slugify = (str) =>
    str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[А-ЯЁ]/gi, (c) => {
            const map = {
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

async function upload(file, pathPrefix) {
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
 * @param {File} file
 * @param {number} letterId
 */
export function uploadLetterAttachment(file, letterId) {
    return upload(file, `letters/${letterId}`);
}

// Загрузка вложений дела теперь привязана к идентификатору дела,
// чтобы все файлы хранились в `attachments/case/<caseId>`
export function uploadCaseAttachment(file, caseId) {
    return upload(file, `case/${caseId}`);
}

/**
 * Загружает файл замечания в хранилище Supabase.
 * @param {File} file
 * @param {number} projectId
 * @param {number} ticketId
 */
export function uploadTicketAttachment(file, projectId, ticketId) {
    // Файлы замечания храним в каталоге `tickets/<ticketId>` вне зависимости от проекта
    return upload(file, `tickets/${ticketId}`);
}

/**
 * Загружает файл претензии в хранилище Supabase.
 * @param {File} file
 * @param {number} claimId
 */
export function uploadClaimAttachment(file, claimId) {
    return upload(file, `claims/${claimId}`);
}

/**
 * Загружает файл дефекта в хранилище Supabase.
 * @param {File} file
 * @param {number} defectId
 */
export function uploadDefectAttachment(file, defectId) {
    return upload(file, `defects/${defectId}`);
}

/**
 * Загружает файлы дела и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 * @param {{file: File, type_id: number | null}[]} files
 * @param {number} caseId
 */
export async function addCaseAttachments(files, caseId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadCaseAttachment(file, caseId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы письма и создаёт записи в таблице attachments.
 * @param {{file: File, type_id: number | null}[]} files
 * @param {number} letterId
 */
export async function addLetterAttachments(files, letterId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadLetterAttachment(file, letterId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы замечания и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 * @param {{file: File, type_id: number | null}[]} files
 * @param {number} projectId
 * @param {number} ticketId
 */
export async function addTicketAttachments(files, projectId, ticketId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadTicketAttachment(file, projectId, ticketId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы претензии и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 * @param {{file: File, type_id: number | null}[]} files
 * @param {number} claimId
 */
export async function addClaimAttachments(files, claimId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadClaimAttachment(file, claimId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;
    return data ?? [];
}

/**
 * Загружает файлы дефекта и создаёт записи в таблице attachments
 * с возвратом созданных строк.
 * @param {{file: File, type_id: number | null}[]} files
 * @param {number} defectId
 */
export async function addDefectAttachments(files, defectId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => uploadDefectAttachment(file, defectId)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;
    return data ?? [];
}

/**
 * Возвращает вложения по указанным id
 * @param {number[]} ids
 */
export async function getAttachmentsByIds(ids) {
    if (!ids.length) return [];
    const { data, error } = await supabase
        .from('attachments')
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size')
        .in('id', ids);

    if (error) throw error;
    return data ?? [];
}

export async function addUnitAttachments(files, unitId) {
    const uploaded = await Promise.all(
        files.map(({ file }) => upload(file, `units/${unitId}`)),
    );

    const rows = uploaded.map((u, idx) => ({
        path: u.url,
        mime_type: u.type,
        original_name: files[idx].file.name,
        storage_path: u.path,
        description: files[idx].description ?? null,
        file_size: files[idx].file.size,
    }));

    const { data, error } = await supabase
        .from('attachments')
        .insert(rows)
        .select('id, storage_path, file_url:path, file_type:mime_type, original_name, description, file_size');

    if (error) throw error;

    const ids = (data ?? []).map((r) => r.id);
    if (ids.length) {
        const linkRows = ids.map((id) => ({ unit_id: unitId, attachment_id: id }));
        const { error: linkErr } = await supabase.from('unit_attachments').insert(linkRows);
        if (linkErr) throw linkErr;
    }
    return data ?? [];
}

export async function updateAttachmentDescription(id, description) {
    const { error } = await supabase
        .from('attachments')
        .update({ description })
        .eq('id', id);
    if (error) throw error;
}

export async function signedUrl(path, filename = '') {
    const { data, error } = await supabase.storage
        .from(ATTACH_BUCKET)
        .createSignedUrl(path, 60, { download: filename || undefined });
    if (error) throw error;
    return data.signedUrl;
}

export { ATTACH_BUCKET };
