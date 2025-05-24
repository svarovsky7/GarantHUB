// src/entities/role.js
// -----------------------------------------------------------------------------
// Справочник ролей (глобальный, чтение-только)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

const fetchRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*').order('id');
    if (error) throw error;
    return data ?? [];
};

export const useRoles = () =>
    useQuery({
        queryKey: ['roles'],
        queryFn : fetchRoles,
        staleTime: 10 * 60_000,
    });
