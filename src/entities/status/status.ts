import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useNotify } from '@/shared/hooks/useNotify';

export interface Status {
  id: number;
  entity: string;
  name: string;
  color?: string | null;
  is_default?: boolean;
}

export interface StatusFormData {
  entity: string;
  name: string;
  color?: string | null;
  is_default?: boolean;
}

/**
 * Получить все статусы
 */
export function useStatuses(entity?: string) {
  return useQuery({
    queryKey: ['statuses', entity],
    queryFn: async () => {
      let query = supabase
        .from('statuses')
        .select('*')
        .order('is_default', { ascending: false })  // Сначала статусы по умолчанию
        .order('name');
      
      if (entity) {
        query = query.eq('entity', entity);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching statuses:', error);
        throw error;
      }
      
      return (data || []) as Status[];
    },
  });
}

/**
 * Получить статусы для вызовов инженеров
 */
export function useEngineerCallStatuses() {
  return useStatuses('engineer_call');
}

/**
 * Создать новый статус
 */
export function useCreateStatus() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async (formData: StatusFormData) => {
      const { data, error } = await supabase
        .from('statuses')
        .insert(formData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      notify.success('Статус успешно создан');
    },
    onError: (error) => {
      notify.error('Ошибка при создании статуса: ' + error.message);
    },
  });
}

/**
 * Обновить статус
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: Partial<StatusFormData> }) => {
      const { data, error } = await supabase
        .from('statuses')
        .update(formData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      notify.success('Статус успешно обновлен');
    },
    onError: (error) => {
      notify.error('Ошибка при обновлении статуса: ' + error.message);
    },
  });
}

/**
 * Удалить статус
 */
export function useDeleteStatus() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('statuses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      notify.success('Статус успешно удален');
    },
    onError: (error) => {
      notify.error('Ошибка при удалении статуса: ' + error.message);
    },
  });
}

/**
 * Получить статус по умолчанию для сущности
 */
export function useDefaultStatus(entity: string) {
  return useQuery({
    queryKey: ['default-status', entity],
    queryFn: async () => {
      console.log('[useDefaultStatus] Fetching default status for entity:', entity);
      const { data, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('entity', entity)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error) {
        console.error('[useDefaultStatus] Error fetching default status:', error);
        throw error;
      }
      
      console.log('[useDefaultStatus] Default status for', entity, ':', data);
      return data as Status | null;
    },
    enabled: !!entity,
  });
}

/**
 * Установить статус по умолчанию
 */
export function useSetDefaultStatus() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async ({ entity, statusId }: { entity: string; statusId: number | null }) => {
      // Сначала сбрасываем все default для этой сущности
      const { error: resetError } = await supabase
        .from('statuses')
        .update({ is_default: false })
        .eq('entity', entity);
      
      if (resetError) {
        console.error('Error resetting default statuses:', resetError);
        throw resetError;
      }
      
      // Если statusId указан, устанавливаем его как default
      if (statusId) {
        const { error: setError } = await supabase
          .from('statuses')
          .update({ is_default: true })
          .eq('id', statusId);
        
        if (setError) {
          console.error('Error setting default status:', setError);
          throw setError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      queryClient.invalidateQueries({ queryKey: ['default-status'] });
      notify.success('Статус по умолчанию обновлен');
    },
    onError: (error) => {
      notify.error('Ошибка при установке статуса по умолчанию: ' + error.message);
    },
  });
}