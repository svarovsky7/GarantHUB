// src/entities/role.ts
// -----------------------------------------------------------------------------
// Справочник ролей (глобальный, чтение-только)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import type { Role } from '@/shared/types/role';

const fetchRoles = async (): Promise<Role[]> => {
    const { data, error } = await supabase.from('roles').select('*').order('id');
    if (error) throw error;
    return data ?? [];
};

export const useRoles = () =>
    useQuery<Role[]>({
        queryKey: ['roles'],
        queryFn : fetchRoles,
        staleTime: 10 * 60_000,
    });