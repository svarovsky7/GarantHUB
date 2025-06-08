// src/entities/role.js
// -----------------------------------------------------------------------------
// Справочник ролей (глобальный, чтение-только)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

/** Получить все роли пользователей */
const fetchRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*').order('id');
    if (error) throw error;
    return data ?? [];
};

/** Хук загрузки ролей */
export const useRoles = () =>
    useQuery({
        queryKey: ['roles'],
        queryFn : fetchRoles,
        staleTime: 10 * 60_000,
    });

