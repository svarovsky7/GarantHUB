import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { message } from 'antd';

export function useUpdateClaimStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ claimId, statusId }: { claimId: number; statusId: number }) => {
      console.log('[useUpdateClaimStatus] Updating claim status:', { claimId, statusId });
      const { error } = await supabase
        .from('claims')
        .update({ claim_status_id: statusId })
        .eq('id', claimId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус претензии обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-claims-with-defects'] });
      queryClient.invalidateQueries({ queryKey: ['user-claims'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('[useUpdateClaimStatus] Error updating claim status:', error);
      message.error('Ошибка при обновлении статуса претензии');
    },
  });
}

export function useUpdateDefectStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ defectId, statusId }: { defectId: number; statusId: number }) => {
      console.log('[useUpdateDefectStatus] Updating defect status:', { defectId, statusId });
      const { error } = await supabase
        .from('defects')
        .update({ status_id: statusId })
        .eq('id', defectId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус дефекта обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-claims-with-defects'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('[useUpdateDefectStatus] Error updating defect status:', error);
      message.error('Ошибка при обновлении статуса дефекта');
    },
  });
}

export function useUpdateEngineerCallStatus(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, status }: { callId: number; status: string }) => {
      console.log('[useUpdateEngineerCallStatus] Updating engineer call status:', { callId, status });
      const { error } = await supabase
        .from('engineer_calls')
        .update({ status })
        .eq('id', callId);
      if (error) throw error;
    },
    onSuccess: () => {
      message.success('Статус вызова обновлен');
      queryClient.invalidateQueries({ queryKey: ['user-engineer-calls'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('[useUpdateEngineerCallStatus] Error updating call status:', error);
      message.error('Ошибка при обновлении статуса вызова');
    },
  });
}
