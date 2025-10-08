import type { PostgrestSingleResponse } from '@supabase/supabase-js';

const CHUNK_SIZE = 1000;

/**
 * Запрашивает все строки супаБейза постранично, учитывая ограничение 1000 записей.
 * @param fn Функция, возвращающая промис запроса с указанием диапазона строк.
 */
export async function fetchPaged<T>(
  fn: (
    from: number,
    to: number,
  ) => PromiseLike<PostgrestSingleResponse<T[]>>,
): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += CHUNK_SIZE) {
    const { data, error } = await fn(from, from + CHUNK_SIZE - 1);
    if (error) throw error;
    const part = data ?? [];
    result.push(...part);
    if (part.length < CHUNK_SIZE) break;
  }
  return result;
}

/**
 * Делит набор значений на чанки и выполняет запрос с оператором `in`.
 * Используется для обхода ограничений на количество параметров.
 * @param values Массив идентификаторов
 * @param fn Функция, возвращающая запрос для части значений
 */
export async function fetchByChunks<T>(
  values: readonly number[],
  fn: (
    chunk: readonly number[],
  ) => PromiseLike<PostgrestSingleResponse<T[]>>,
): Promise<T[]> {
  console.log('[fetchByChunks] Starting with values count:', values.length);
  const result: T[] = [];
  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);
    console.log(`[fetchByChunks] Processing chunk ${i / CHUNK_SIZE + 1}, size:`, chunk.length);
    const { data, error } = await fn(chunk);
    if (error) {
      console.error('[fetchByChunks] Error:', error);
      throw error;
    }
    console.log(`[fetchByChunks] Chunk returned ${data?.length ?? 0} items`);
    result.push(...(data ?? []));
  }
  console.log('[fetchByChunks] Total items fetched:', result.length);
  return result;
}
