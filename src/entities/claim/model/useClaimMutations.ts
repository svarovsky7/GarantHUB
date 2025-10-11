import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import type { Claim } from '@/shared/types/claim';
import type { ClaimDeleteParams } from '@/shared/types/claimDelete';
import { addClaimAttachments, ATTACH_BUCKET } from '@/entities/attachment';
import { closeDefectsForClaim } from '../lib/claimHelpers';
import { TABLE, SUMMARY_TABLE } from './mappers';

/**
 * Хук создания новой претензии.
 */
export function useCreateClaim() {
  const projectId = useProjectId();
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<Claim, 'id' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'> & {
        attachments?: Array<File | { file: File; type_id?: number | null }>;
      },
    ) => {
      const { unit_ids = [], defect_ids = [], attachments = [], ...rest } = payload as any;

      if (unit_ids.length) {
        const { data: locked } = await supabase
          .from('units')
          .select('id')
          .in('id', unit_ids)
          .eq('locked', true);
        if (locked && locked.length) {
          throw new Error('Объект заблокирован. Обратитесь в юридический отдел');
        }
      }

      const insertData: any = {
        ...rest,
        project_id: rest.project_id ?? projectId,
        created_by: userId,
      };

      const { data: created, error } = await supabase
        .from(TABLE)
        .insert(insertData)
        .select('id, project_id')
        .single();
      if (error) throw error;

      if (unit_ids.length) {
        const rows = unit_ids.map((uid: number) => ({ claim_id: created.id, unit_id: uid }));
        await supabase.from('claim_units').insert(rows);
      }

      if (defect_ids.length) {
        const rows = defect_ids.map((did: number) => ({
          claim_id: created.id,
          defect_id: did,
          pre_trial_claim: insertData.pre_trial_claim ?? false,
        }));
        await supabase.from('claim_defects').insert(rows);
      }

      if (attachments.length) {
        const uploaded = await addClaimAttachments(
          attachments.map((f: any) =>
            'file' in f
              ? { file: f.file, type_id: f.type_id ?? null, description: f.description }
              : { file: f, type_id: null, description: undefined },
          ),
          created.id,
        );
        const ids = uploaded.map((u: any) => u.id);
        if (ids.length) {
          const rows = ids.map((aid) => ({ claim_id: created.id, attachment_id: aid }));
          await supabase.from('claim_attachments').insert(rows);
        }
      }

      await closeDefectsForClaim(created.id, insertData.claim_status_id ?? null);

      return {
        id: created.id,
        project_id: created.project_id,
      } as Claim;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
      qc.invalidateQueries({ queryKey: ['claims-simple'] });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['claims-optimized'] });
      qc.invalidateQueries({ queryKey: ['claims-stats'] });
      qc.invalidateQueries({ queryKey: ['claims-all-stats'] });
    },
  });
}

/**
 * Хук обновления данных претензии.
 */
export function useUpdateClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Claim>; }) => {
      const { unit_ids, ...rest } = updates as Partial<Claim> & { unit_ids?: number[] };

      const { data, error } = await supabase
        .from(TABLE)
        .update(rest)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;

      if (Array.isArray(unit_ids)) {
        await supabase.from('claim_units').delete().eq('claim_id', id);
        if (unit_ids.length) {
          const rows = unit_ids.map((uid) => ({ claim_id: id, unit_id: uid }));
          await supabase.from('claim_units').insert(rows);
        }
      }

      await closeDefectsForClaim(id, rest.claim_status_id ?? data.claim_status_id ?? null);

      return data as Claim;
    },
    onSuccess: (_, vars) => {
      // Инвалидируем все возможные варианты queryKey для претензий
      qc.invalidateQueries({ queryKey: [TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-simple'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
    },
  });
}

/**
 * Хук удаления претензии.
 */
export function useDeleteClaim() {
  const qc = useQueryClient();
  return useMutation<number, Error, ClaimDeleteParams>({
    /**
   * Удаляет претензию вместе с её файлами, всеми связанными дефектами
   * и записями из таблицы связей претензий. При удалении дефектов
   * учитываются права доступа к проектам.
   * @param payload объект с идентификатором претензии
   */
    mutationFn: async ({ id }) => {
      const { data: attachRows } = await supabase
        .from('claim_attachments')
        .select('attachment_id, attachments(storage_path)')
        .eq('claim_id', id);
      const claimFiles = (attachRows ?? []).map((r: any) => r.attachment_id);
      const paths = (attachRows ?? [])
        .map((r: any) => r.attachments?.storage_path)
        .filter(Boolean);


      if (paths.length) {
        await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        await supabase.from('attachments').delete().in('id', claimFiles);
      }
      if (claimFiles.length) {
        await supabase.from('claim_attachments').delete().eq('claim_id', id);
      }

      const { data: defectRows } = await supabase
        .from('claim_defects')
        .select('defect_id')
        .eq('claim_id', id);
      const defectIds = (defectRows ?? []).map((d: any) => d.defect_id);

      if (defectIds.length) {
        const { data: defAttachRows } = await supabase
          .from('defect_attachments')
          .select('attachment_id, attachments(storage_path)')
          .in('defect_id', defectIds);
        const defFiles = (defAttachRows ?? []).map((r: any) => r.attachment_id);
        const defPaths = (defAttachRows ?? [])
          .map((r: any) => r.attachments?.storage_path)
          .filter(Boolean);
        if (defPaths.length) {
          await supabase.storage.from(ATTACH_BUCKET).remove(defPaths);
          await supabase.from('attachments').delete().in('id', defFiles);
        }
        if (defFiles.length) {
          await supabase
            .from('defect_attachments')
            .delete()
            .in('attachment_id', defFiles);
        }
        const dq = await supabase.from('defects').delete().in('id', defectIds);
        if (dq.error) throw dq.error;
        await supabase.from('claim_defects').delete().eq('claim_id', id);
      }

      await supabase.from('claim_units').delete().eq('claim_id', id);

      await supabase
        .from('claim_links')
        .delete()
        .or(`child_id.eq.${id},parent_id.eq.${id}`);

      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'] });
      qc.invalidateQueries({ queryKey: ['defects'] });
      qc.invalidateQueries({ queryKey: ['claims-simple'] });
      qc.invalidateQueries({ queryKey: ['claims-simple-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all'] });
      qc.invalidateQueries({ queryKey: ['claims-all-legacy'] });
      qc.invalidateQueries({ queryKey: ['claims-optimized'] });
      qc.invalidateQueries({ queryKey: ['claims-stats'] });
      qc.invalidateQueries({ queryKey: ['claims-all-stats'] });
    },
  });
}
