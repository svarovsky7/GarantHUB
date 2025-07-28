import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { RolePermission, RoleName } from '@/shared/types/rolePermission';
import { DEFAULT_ROLE_PERMISSIONS } from '@/shared/types/rolePermission';

const TABLE = 'role_permissions';
const FIELDS =
  'role_name, pages, edit_tables, delete_tables, only_assigned_project, can_lock_units, can_upload_documents';

/** Получить настройки ролей */
export const useRolePermissions = () =>
  useQuery<RolePermission[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLE).select(FIELDS);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });

/** Получить настройки конкретной роли */
export const useRolePermission = (role: RoleName | undefined) =>
  useQuery<RolePermission>({
    queryKey: [TABLE, role],
    queryFn: async () => {
      if (!role) throw new Error('no role');
      const { data, error } = await supabase
        .from(TABLE)
        .select(FIELDS)
        .eq('role_name', role)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? DEFAULT_ROLE_PERMISSIONS[role];
    },
    enabled: !!role,
    staleTime: 5 * 60_000,
  });

/** Обновить настройки роли */
export const useUpsertRolePermission = () => {
  const qc = useQueryClient();
  return useMutation<RolePermission, Error, RolePermission>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(payload, { onConflict: 'role_name' })
        .select(FIELDS)
        .single();
      if (error) throw error;
      return data as RolePermission;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
};
