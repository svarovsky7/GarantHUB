import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import type { AttachmentType } from '@/shared/types/attachmentType';

const TABLE = 'attachment_types';

/**
 * Загружает список типов вложений из таблицы `attachment_types`.
 */
export const useAttachmentTypes = () =>
  useQuery<AttachmentType[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, name')
        .order('id');
      if (error) throw error;
      return (data ?? []) as AttachmentType[];
    },
    staleTime: 5 * 60_000,
  });
