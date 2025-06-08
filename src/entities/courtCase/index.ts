import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import { getAttachmentsByIds, ATTACH_BUCKET } from '../attachment';

const CASES_TABLE = 'court_cases';
const DEFECTS_TABLE = 'defects';
const CASE_DEFECTS_TABLE = 'court_case_defects';

/** Список судебных дел текущего проекта */
export function useCourtCases() {
  const projectId = useProjectId();
  return useQuery({
    queryKey: [CASES_TABLE, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CourtCase[];
    },
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

/** Список всех судебных дел */
export function useAllCourtCases() {
  return useQuery({
    queryKey: [CASES_TABLE, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .select('id, project_id, status, defendant_id');
      if (error) throw error;
      return (data ?? []) as CourtCase[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Создать судебное дело */
export function useAddCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CourtCase, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return data as CourtCase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}

/** Обновить судебное дело */
export function useUpdateCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCase> }) => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as CourtCase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}

/** Удалить судебное дело вместе с вложениями */
export function useDeleteCourtCase() {
  const projectId = useProjectId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: courtCase } = await supabase
        .from(CASES_TABLE)
        .select('attachment_ids')
        .eq('id', id)
        .single();

      const ids = (courtCase?.attachment_ids ?? []) as number[];

      if (ids.length) {
        const files = await getAttachmentsByIds(ids);
        if (files?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(files.map((f) => f.storage_path));
        }
        await supabase.from('attachments').delete().in('id', ids);
      }

      const { error } = await supabase
        .from(CASES_TABLE)
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}


/** Получить недостатки, связанные с делом */
export function useCaseDefects(caseId: number) {
  return useQuery({
    queryKey: [CASE_DEFECTS_TABLE, caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .select('defect_id, defects(id, description, fix_cost)')
        .eq('case_id', caseId);
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((r) => ({
        id: r.defects.id,
        description: r.defects.description,
        cost: r.defects.fix_cost ?? 0,
        case_id: caseId,
      })) as Defect[];
    },
    enabled: !!caseId,
    staleTime: 5 * 60_000,
  });
}

/** Добавить недостаток к делу */
export function useAddDefect() {
  const qc = useQueryClient();
  return useMutation({
    /**
     * Creates a defect record and links it to a court case.
     * `project_id` is required by DB constraints, so it must be provided.
     */
    mutationFn: async (
      payload: { case_id: number; project_id: number } & Omit<Defect, 'id' | 'case_id'>,
    ) => {
      const { data, error } = await supabase
        .from(DEFECTS_TABLE)
        .insert({
          project_id: payload.project_id,
          description: payload.description,
          fix_cost: payload.cost,
        })
        .select('id')
        .single();
      if (error) throw error;
      const defId = data.id;
      const { error: linkErr } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .insert({ case_id: payload.case_id, defect_id: defId });
      if (linkErr) throw linkErr;
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, payload.case_id] });
      return { id: defId, description: payload.description, cost: payload.cost } as Defect;
    },
  });
}

/** Удалить недостаток из дела */
export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, case_id }: { id: number; case_id: number }) => {
      const { error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .delete()
        .eq('case_id', case_id)
        .eq('defect_id', id);
      if (error) throw error;
      return { id, case_id };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

/** Обновить информацию о недостатке */
export function useUpdateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      case_id,
      updates,
    }: {
      id: number;
      case_id: number;
      updates: Pick<Defect, 'description' | 'cost'>;
    }) => {
      const { error } = await supabase
        .from(DEFECTS_TABLE)
        .update({
          description: updates.description,
          fix_cost: updates.cost,
        })
        .eq('id', id);
      if (error) throw error;
      return { id, case_id, ...updates };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

