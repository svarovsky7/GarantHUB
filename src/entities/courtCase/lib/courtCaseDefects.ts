import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { Defect } from '@/shared/types/courtCase';

const DEFECTS_TABLE = 'defects';
const CASE_DEFECTS_TABLE = 'court_case_defects';

/**
 * Получить список дефектов, привязанных к судебному делу.
 */
export function useCaseDefects(caseId: number) {
  return useQuery({
    queryKey: [CASE_DEFECTS_TABLE, caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .select(
          'defect_id, defects(id, description, type_id, status_id, received_at, fixed_at)'
        )
        .eq('case_id', caseId);
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((r: any) => ({
        id: r.defects.id,
        description: r.defects.description,
        type_id: r.defects.type_id,
        status_id: r.defects.status_id,
        received_at: r.defects.received_at,
        fixed_at: r.defects.fixed_at,
        case_id: caseId,
      })) as Defect[];
    },
    enabled: !!caseId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Создать новый дефект и привязать его к судебному делу.
 */
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
          type_id: payload.type_id,
          status_id: payload.status_id,
          received_at: payload.received_at,
          fixed_at: payload.fixed_at,
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
      return {
        id: defId,
        description: payload.description,
        type_id: payload.type_id,
        status_id: payload.status_id,
        received_at: payload.received_at,
        fixed_at: payload.fixed_at,
      } as Defect;
    },
  });
}

/**
 * Удалить связь дефекта с судебным делом.
 */
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

/**
 * Обновить информацию о дефекте.
 */
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
      updates: Pick<
        Defect,
        'description' | 'type_id' | 'status_id' | 'received_at' | 'fixed_at'
      >;
    }) => {
      const { error } = await supabase
        .from(DEFECTS_TABLE)
        .update({
          description: updates.description,
          type_id: updates.type_id,
          status_id: updates.status_id,
          received_at: updates.received_at,
          fixed_at: updates.fixed_at,
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
