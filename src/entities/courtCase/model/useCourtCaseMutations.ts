import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { useAuthStore } from '@/shared/store/authStore';
import type { CourtCase } from '@/shared/types/courtCase';
import type { NewCaseFile } from '@/shared/types/caseFile';
import { addCaseAttachments, ATTACH_BUCKET } from '@/entities/attachment';

const CASES_TABLE = 'court_cases';
const CASES_SUMMARY_TABLE = 'court_cases_summary';
const CASE_UNITS_TABLE = 'court_case_units';
const CASE_LINKS_TABLE = 'court_case_links';
const CASE_ATTACH_TABLE = 'court_case_attachments';

/**
 * Создать новое судебное дело и привязать его к выбранным объектам.
 */
export function useAddCourtCase() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  return useMutation({
    mutationFn: async (
      payload: Omit<CourtCase, 'id' | 'created_at' | 'updated_at'>,
    ) => {
      const {
        unit_ids = [],
        attachment_ids = [],
        ...rest
      } = payload as unknown as {
        unit_ids?: number[] | string[];
        attachment_ids?: number[] | string[];
        [k: string]: any;
      };

      const { data: inserted, error } = await supabase
        .from(CASES_TABLE)
        .insert({ ...rest, created_by: userId })
        .select('*')
        .single();
      if (error) throw error;

      const caseId = inserted.id as number;
      if (unit_ids.length) {
        const rows = unit_ids.map((uid) => ({
          court_case_id: caseId,
          unit_id: uid,
        }));
        const { error: unitsErr } = await supabase
          .from(CASE_UNITS_TABLE)
          .insert(rows);
        if (unitsErr) throw unitsErr;
      }

      if (attachment_ids.length) {
        const rows = attachment_ids.map((aid) => ({
          court_case_id: caseId,
          attachment_id: aid,
        }));
        const { error: attErr } = await supabase
          .from(CASE_ATTACH_TABLE)
          .insert(rows);
        if (attErr) throw attErr;
      }

      return { ...inserted, unit_ids, attachment_ids } as CourtCase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

/**
 * Обновить судебное дело.
 */
export function useUpdateCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCase> }) => {
      const {
        unit_ids,
        attachment_ids,
        ...rest
      } = updates as unknown as {
        unit_ids?: number[];
        attachment_ids?: number[];
        [k: string]: any;
      };

      if (Object.keys(rest).length) {
        const { error } = await supabase
          .from(CASES_TABLE)
          .update(rest)
          .eq('id', id);
        if (error) throw error;
      }

      if (Array.isArray(unit_ids)) {
        await supabase.from(CASE_UNITS_TABLE).delete().eq('court_case_id', id);
        if (unit_ids.length) {
          const rows = unit_ids.map((uid) => ({ court_case_id: id, unit_id: uid }));
          const { error: unitsErr } = await supabase
            .from(CASE_UNITS_TABLE)
            .insert(rows);
          if (unitsErr) throw unitsErr;
        }
      }

      if (Array.isArray(attachment_ids)) {
        await supabase.from(CASE_ATTACH_TABLE).delete().eq('court_case_id', id);
        if (attachment_ids.length) {
          const rows = attachment_ids.map((aid) => ({
            court_case_id: id,
            attachment_id: aid,
          }));
          const { error: attErr } = await supabase
            .from(CASE_ATTACH_TABLE)
            .insert(rows);
          if (attErr) throw attErr;
        }
      }

      const { data } = await supabase
        .from(CASES_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      return data as CourtCase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

/**
 * Удалить судебное дело.
 */
export function useDeleteCourtCase() {
  const { projectId } = useProjectFilter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: number; project_id?: number }) => {
      const { data: courtCase } = await supabase
        .from(CASES_TABLE)
        .select('project_id')
        .eq('id', id)
        .single();

      const { data: attachRows } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('court_case_id', id);
      const ids = (attachRows ?? []).map((r: any) => r.attachment_id);

      if (ids.length) {
        const paths = (attachRows ?? [])
          .map((r: any) => r.attachments?.storage_path)
          .filter(Boolean);
        if (paths.length) {
          await supabase.storage.from(ATTACH_BUCKET).remove(paths);
        }
        await supabase.from('attachments').delete().in('id', ids);
        await supabase.from(CASE_ATTACH_TABLE).delete().eq('court_case_id', id);
      }

      const projectIdToMatch = project_id ?? projectId ?? courtCase.project_id;
      const { error } = await supabase
        .from(CASES_TABLE)
        .delete()
        .eq('id', id)
        .eq('project_id', projectIdToMatch);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

/**
 * Получить связи между судебными делами (parent-child).
 */
export function useCaseLinks() {
  return useQuery({
    queryKey: [CASE_LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Связать дела (установить родителя для дочерних дел).
 */
export function useLinkCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;
      await supabase.from(CASE_LINKS_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(CASE_LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

/**
 * Отвязать дело от родителя.
 */
export function useUnlinkCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const childId = Number(id);
      await supabase.from(CASE_LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
    },
  });
}

/**
 * Полное обновление судебного дела с управлением вложениями.
 */
export function useUpdateCourtCaseFull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newAttachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
      updates = {},
    }: {
      id: number;
      newAttachments?: NewCaseFile[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
      updates?: Partial<CourtCase>;
    }) => {
      const { data: current } = await supabase
        .from(CASE_ATTACH_TABLE)
        .select('attachment_id, attachments(storage_path)')
        .eq('court_case_id', id);
      let ids: number[] = (current ?? []).map((r: any) => r.attachment_id);

      if (removedAttachmentIds.length) {
        const { data: atts } = await supabase
          .from('attachments')
          .select('storage_path')
          .in('id', removedAttachmentIds);
        if (atts?.length)
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(atts.map((a) => a.storage_path));
        await supabase.from('attachments').delete().in('id', removedAttachmentIds);
        await supabase
          .from(CASE_ATTACH_TABLE)
          .delete()
          .eq('court_case_id', id)
          .in('attachment_id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }

      if (Object.keys(updates).length) {
        const upd: any = { ...updates };
        if (Object.prototype.hasOwnProperty.call(updates, 'unit_ids')) {
          await supabase
            .from(CASE_UNITS_TABLE)
            .delete()
            .eq('court_case_id', id);
          const uids = updates.unit_ids as number[] | undefined;
          if (uids?.length) {
            const rows = uids.map((uid) => ({ court_case_id: id, unit_id: uid }));
            await supabase.from(CASE_UNITS_TABLE).insert(rows);
          }
          delete upd.unit_ids;
        }
        const { error } = await supabase
          .from(CASES_TABLE)
          .update(upd)
          .eq('id', id);
        if (error) throw error;
      }

      if (updatedAttachments.length) {
        // attachment type updates removed
      }

      let uploaded: any[] = [];
      if (newAttachments.length) {
        uploaded = await addCaseAttachments(
          newAttachments.map((f) => ({
            file: f.file,
            type_id: null,
            description: (f as any).description,
          })),
          id,
        );
        ids = ids.concat(uploaded.map((u) => u.id));
        if (uploaded.length) {
          const rows = uploaded.map((u: any) => ({
            court_case_id: id,
            attachment_id: u.id,
          }));
          await supabase.from(CASE_ATTACH_TABLE).insert(rows);
        }
      }

      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['court_case', vars.id] });
    },
  });
}
