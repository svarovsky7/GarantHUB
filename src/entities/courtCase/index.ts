import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import type { CourtCase, Defect } from '@/shared/types/courtCase';

const CASES_TABLE = 'court_cases';
const DEFECTS_TABLE = 'defects';
const CASE_DEFECTS_TABLE = 'court_case_defects';

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

export function useDeleteCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(CASES_TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}


export function useCaseDefects(caseId: number) {
  return useQuery({
    queryKey: [CASE_DEFECTS_TABLE, caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .select(`defect_id, defects(*)`)
        .eq('case_id', caseId);
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((r) => ({ ...r.defects, case_id: caseId })) as Defect[];
    },
    enabled: !!caseId,
    staleTime: 5 * 60_000,
  });
}

export function useAddDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { case_id: number } & Omit<Defect, 'id' | 'case_id'>) => {
      const { data, error } = await supabase
        .from(DEFECTS_TABLE)
        .insert({
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
      return { ...payload, id: defId } as Defect;
    },
  });
}

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
