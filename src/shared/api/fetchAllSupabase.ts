import { PostgrestFilterBuilder } from '@supabase/supabase-js';

/**
 * Загружает все строки по переданному запросу, обходя лимит Supabase на 1000 записей.
 * @param baseQuery Базовый запрос без диапазона, например `supabase.from('table').select('*').order('id')`
 * @param chunkSize Размер порции выборки (по умолчанию 1000)
 */
export async function fetchAllRows<T>(
  baseQuery: PostgrestFilterBuilder<any, any, T>,
  chunkSize = 1000,
): Promise<T[]> {
  const result: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await baseQuery
      .range(from, from + chunkSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    result.push(...data);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return result;
}
