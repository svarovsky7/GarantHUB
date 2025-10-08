import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';
import { uploadEngineerCallAttachment } from '@/entities/attachment/attachment';
import type { EngineerCall, EngineerCallWithNames, EngineerCallFormData } from '@/shared/types/engineerCall';
import type { Attachment } from '@/shared/types/attachment';
import dayjs from 'dayjs';

const TABLE = 'engineer_calls';

/**
 * Преобразует запись из БД в объект с именами
 */
function mapEngineerCall(call: any): EngineerCallWithNames {
  return {
    ...call,
    engineer_name: call.engineer?.name || call.engineer_name || null,
    unit_name: call.unit?.name || call.unit_name || null,
    claim_number: call.claim?.claim_number || call.claim_number || null,
    created_by_name: call.created_by_profile?.name || call.created_by_name || null,
    project_name: call.project?.name || call.project_name || null,
  };
}

/**
 * Получить все вызовы инженеров
 * Для администраторов показываются все вызовы из всех проектов
 * Для инженеров показываются вызовы из всех доступных им проектов
 */
export function useEngineerCalls(startDate?: Date, endDate?: Date, filterProjectId?: number | null) {
  const currentProjectId = useProjectId();
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = profile?.role === 'ADMIN';
  const isEngineer = profile?.role === 'ENGINEER';
  
  return useQuery({
    queryKey: ['engineer_calls', profile?.project_ids, isAdmin, isEngineer, startDate?.toISOString(), endDate?.toISOString(), filterProjectId],
    queryFn: async () => {
      // Если у пользователя нет профиля, возвращаем пустой массив
      if (!profile) return [];
      
      // Для обычных пользователей (не админов и не инженеров) требуем выбранный проект
      if (!isAdmin && !isEngineer && !currentProjectId) return [];
      
      let query = supabase
        .from(TABLE)
        .select('*')
        .order('start_datetime', { ascending: true });
      
      // Если передан фильтр по проекту, используем его независимо от роли
      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId);
      } else {
        // Фильтрация по проектам в зависимости от роли
        if (!isAdmin) {
          if (isEngineer && profile.project_ids && profile.project_ids.length > 0) {
            // Инженеры видят вызовы из всех доступных им проектов
            query = query.in('project_id', profile.project_ids);
          } else if (currentProjectId) {
            // Обычные пользователи видят только вызовы из текущего проекта
            query = query.eq('project_id', currentProjectId);
          } else {
            // Если нет доступных проектов, возвращаем пустой массив
            return [];
          }
        }
      }
      
      // Фильтрация по датам
      if (startDate) {
        query = query.gte('start_datetime', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('start_datetime', endDate.toISOString());
      }
      
      const { data: calls, error } = await query;
      
      if (error) {
        console.error('Error fetching engineer calls:', error);
        throw error;
      }
      
      if (!calls || calls.length === 0) return [];
      
      // Получаем проекты
      const projectIds = [...new Set(calls.map(c => c.project_id).filter(Boolean))];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
      
      // Получаем юниты
      const unitIds = [...new Set(calls.map(c => c.unit_id).filter(Boolean))];
      const { data: units } = unitIds.length > 0 
        ? await supabase
            .from('units')
            .select('id, name')
            .in('id', unitIds)
        : { data: [] };
      
      // Получаем инженеров
      const engineerIds = [...new Set(calls.map(c => c.engineer_id).filter(Boolean))];
      const { data: engineers } = engineerIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, name')
            .in('id', engineerIds)
        : { data: [] };
      
      // Мапим данные
      const projectsMap = new Map(projects?.map(p => [p.id, p.name] as [number, string]) || []);
      const unitsMap = new Map(units?.map(u => [u.id, u.name] as [number, string]) || []);
      const engineersMap = new Map(engineers?.map(e => [e.id, e.name] as [string, string]) || []);
      
      return calls.map(call => ({
        ...mapEngineerCall(call),
        project_name: projectsMap.get(call.project_id) || null,
        unit_name: call.unit_id ? (unitsMap.get(call.unit_id) || null) : null,
        engineer_name: call.engineer_id ? (engineersMap.get(call.engineer_id) || null) : null,
      }));
    },
    // Запрос включен для админов, инженеров с доступными проектами, или обычных пользователей с выбранным проектом, или если передан фильтр по проекту
    enabled: !!profile && (isAdmin || (isEngineer && !!profile?.project_ids?.length) || (!isAdmin && !isEngineer && !!currentProjectId) || !!filterProjectId),
  });
}

/**
 * Получить вызов по ID
 */
export function useEngineerCall(id: string) {
  return useQuery({
    queryKey: ['engineer_call', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(`
          *,
          engineer:profiles!engineer_calls_engineer_id_fkey(id, name),
          unit:units!engineer_calls_unit_id_fkey(id, name),
          claim:claims!engineer_calls_claim_id_fkey(id, claim_number),
          created_by_profile:profiles!engineer_calls_created_by_fkey(id, name),
          project:projects!engineer_calls_project_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching engineer call:', error);
        throw error;
      }
      
      return mapEngineerCall(data);
    },
    enabled: !!id,
  });
}

/**
 * Создать новый вызов
 */
export function useCreateEngineerCall() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const projectId = useProjectId();
  const profile = useAuthStore((s) => s.profile);
  
  return useMutation({
    mutationFn: async (formData: EngineerCallFormData) => {
      if (!profile?.id) {
        throw new Error('Пользователь не определен');
      }
      
      // Для инженеров и админов project_id берется из формы, для остальных - текущий проект
      const targetProjectId = formData.project_id || projectId;
      if (!targetProjectId) {
        throw new Error('Проект не определен');
      }
      
      const newCall = {
        project_id: targetProjectId,
        title: formData.title,
        start_datetime: typeof formData.start_datetime === 'string' ? formData.start_datetime : formData.start_datetime.toISOString(),
        end_datetime: typeof formData.end_datetime === 'string' ? formData.end_datetime : formData.end_datetime.toISOString(),
        engineer_id: formData.engineer_id || null,
        unit_id: formData.unit_id || null,
        claim_id: formData.claim_id || null,
        status: formData.status,
        notes: formData.notes || null,
        created_by: profile.id,
      };
      
      const { data, error } = await supabase
        .from(TABLE)
        .insert(newCall)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating engineer call:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineer_calls'] });
      notify.success('Вызов инженера успешно создан');
    },
    onError: (error) => {
      notify.error('Ошибка при создании вызова: ' + error.message);
    },
  });
}

/**
 * Обновить вызов
 */
export function useUpdateEngineerCall() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<EngineerCallFormData> }) => {
      const updateData: any = {};
      
      if (formData.title !== undefined) updateData.title = formData.title;
      if (formData.start_datetime !== undefined) {
        updateData.start_datetime = typeof formData.start_datetime === 'string' 
          ? formData.start_datetime 
          : formData.start_datetime.toISOString();
      }
      if (formData.end_datetime !== undefined) {
        updateData.end_datetime = typeof formData.end_datetime === 'string' 
          ? formData.end_datetime 
          : formData.end_datetime.toISOString();
      }
      if (formData.engineer_id !== undefined) updateData.engineer_id = formData.engineer_id || null;
      if (formData.unit_id !== undefined) updateData.unit_id = formData.unit_id || null;
      if (formData.claim_id !== undefined) updateData.claim_id = formData.claim_id || null;
      if (formData.status !== undefined) updateData.status = formData.status;
      if (formData.notes !== undefined) updateData.notes = formData.notes || null;
      
      const { data, error } = await supabase
        .from(TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating engineer call:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineer_calls'] });
      queryClient.invalidateQueries({ queryKey: ['engineer_call'] });
      notify.success('Вызов инженера успешно обновлен');
    },
    onError: (error) => {
      notify.error('Ошибка при обновлении вызова: ' + error.message);
    },
  });
}

/**
 * Удалить вызов
 */
export function useDeleteEngineerCall() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting engineer call:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineer_calls'] });
      notify.success('Вызов инженера успешно удален');
    },
    onError: (error) => {
      notify.error('Ошибка при удалении вызова: ' + error.message);
    },
  });
}

/**
 * Получить инженеров для выбора
 */
export function useEngineers() {
  return useQuery({
    queryKey: ['engineers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('role', ['ENGINEER', 'ADMIN'])
        .order('name');
      
      if (error) {
        console.error('Error fetching engineers:', error);
        throw error;
      }
      
      return data || [];
    },
  });
}

/**
 * Получить вложения для вызова инженера
 */
export function useEngineerCallAttachments(callId: string | null) {
  return useQuery({
    queryKey: ['engineer_call_attachments', callId],
    queryFn: async () => {
      if (!callId) return [];
      
      // First check if junction table exists
      const { data: junctionData, error: junctionError } = await supabase
        .from('engineer_call_attachments')
        .select(`
          attachment_id,
          attachments!inner (
            id,
            path,
            mime_type,
            original_name,
            description,
            created_at,
            created_by
          )
        `)
        .eq('engineer_call_id', callId)
        .order('attachments(created_at)', { ascending: false });
      
      if (!junctionError && junctionData) {
        // Junction table exists, use it
        return junctionData.map((item: any) => ({
          id: item.attachments.id,
          path: item.attachments.path,
          mime_type: item.attachments.mime_type,
          original_name: item.attachments.original_name || item.attachments.path.split('/').pop(),
          name: item.attachments.original_name || item.attachments.path.split('/').pop(),
          description: item.attachments.description,
          created_at: item.attachments.created_at,
          created_by: item.attachments.created_by,
        }));
      }
      
      // Fallback: junction table doesn't exist, return empty array
      console.log('Junction table not found, attachments feature not available');
      return [];
    },
    enabled: !!callId,
  });
}

/**
 * Добавить вложения к вызову инженера
 */
export async function addEngineerCallAttachments(
  callId: string,
  files: { file: File; description?: string }[],
  createdById: string
): Promise<void> {
  // First check if junction table exists
  const { error: checkError } = await supabase
    .from('engineer_call_attachments')
    .select('engineer_call_id')
    .limit(0);
  
  if (checkError && checkError.code === '42P01') {
    // Table doesn't exist, skip attachment functionality
    console.warn('engineer_call_attachments table does not exist, skipping attachment upload');
    return;
  }
  
  for (const { file, description } of files) {
    const { path, type } = await uploadEngineerCallAttachment(file, callId);
    
    // Insert into attachments table
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        path,
        storage_path: path,
        mime_type: type,
        original_name: file.name,
        description: description || null,
        created_by: createdById,
      })
      .select()
      .single();
    
    if (attachmentError) throw attachmentError;
    
    // Create junction record
    if (attachment) {
      const { error: junctionError } = await supabase
        .from('engineer_call_attachments')
        .insert({
          engineer_call_id: callId,
          attachment_id: attachment.id,
        });
      
      if (junctionError) throw junctionError;
    }
  }
}

/**
 * Удалить вложение вызова инженера
 */
export function useDeleteEngineerCallAttachment() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async ({ attachmentId, callId }: { attachmentId: string; callId: string }) => {
      // Получаем информацию о вложении
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('path, storage_path')
        .eq('id', attachmentId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Удаляем связь из junction table
      const { error: junctionError } = await supabase
        .from('engineer_call_attachments')
        .delete()
        .eq('engineer_call_id', callId)
        .eq('attachment_id', attachmentId);
      
      if (junctionError && junctionError.code !== '42P01') {
        // Ignore error if table doesn't exist
        throw junctionError;
      }
      
      // Удаляем файл из хранилища
      const pathToDelete = attachment?.storage_path || attachment?.path;
      if (pathToDelete) {
        const { error: storageError } = await supabase.storage
          .from('attachments')
          .remove([pathToDelete]);
        
        if (storageError) console.error('Error deleting file from storage:', storageError);
      }
      
      // Удаляем запись из БД attachments
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (deleteError) throw deleteError;
      
      return callId;
    },
    onSuccess: (callId) => {
      queryClient.invalidateQueries({ queryKey: ['engineer_call_attachments', callId] });
      notify.success('Файл успешно удален');
    },
    onError: (error) => {
      notify.error('Ошибка при удалении файла: ' + error.message);
    },
  });
}

/**
 * Обновить описание вложения
 */
export function useUpdateEngineerCallAttachment() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  
  return useMutation({
    mutationFn: async ({ id, description }: { id: string; description: string }) => {
      const { data, error } = await supabase
        .from('attachments')
        .update({ description })
        .eq('id', id)
        .select('entity_id')
        .single();
      
      if (error) throw error;
      return data?.entity_id;
    },
    onSuccess: (callId) => {
      queryClient.invalidateQueries({ queryKey: ['engineer_call_attachments', callId] });
    },
    onError: (error) => {
      notify.error('Ошибка при обновлении описания: ' + error.message);
    },
  });
}