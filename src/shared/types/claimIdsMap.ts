/**
 * Соответствие ID дефекта и связанных ID претензий.
 * Ключ — `defect_id`, значение — массив `claim_id`.
 */
export type ClaimIdsMap = Record<number, number[]>;
