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

export function uploadLetterAttachment(file, projectId) {
    return upload(file, `letters/${projectId}`);
}

export function uploadCaseAttachment(file, projectId, unitId) {
    return upload(file, `Case/${projectId}/${unitId}`);
}

export { ATTACH_BUCKET };
