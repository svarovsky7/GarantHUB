import { useQuery } from '@tanstack/react-query';
import { supabase }     from '@shared/api/supabaseClient';

const getRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data || [];
};

export const useRoles = () =>
    useQuery({
        queryKey: ['roles'],
        queryFn:  getRoles,
    });
